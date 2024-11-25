import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as SQLite from 'expo-sqlite';
import { debounce } from 'lodash'; // For debouncing search

const HomeScreen = ({ navigation }) => {
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState('');
  const [menuData, setMenuData] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchText, setSearchText] = useState(''); // Track search input

  const categories = [
    { id: 1, name: 'Starters', key: 'starters' },
    { id: 2, name: 'Mains', key: 'mains' },
    { id: 3, name: 'Desserts', key: 'desserts' },
  ];

  const initializeDatabase = async () => {
    const db = await SQLite.openDatabaseAsync('little_lemon.db');
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS menu (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price REAL,
        image TEXT,
        category TEXT
      );
    `);
    return db;
  };

  const fetchMenuFromDatabase = async (db) => {
    const rows = await db.getAllAsync('SELECT * FROM menu;');
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      image: row.image,
      category: row.category,
    }));
  };

  const insertMenuIntoDatabase = async (db, menu) => {
    const bulkInsertQuery = `
      INSERT INTO menu (id, name, description, price, image, category) VALUES 
      ${menu.map(() => '(?, ?, ?, ?, ?, ?)').join(', ')}
    `;
    const params = menu.flatMap(item => [
      item.id,
      item.name,
      item.description,
      item.price,
      item.image,
      item.category,
    ]);
    await db.runAsync(bulkInsertQuery, ...params);
  };

  const fetchMenuFromServer = async () => {
    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/capstone.json'
      );
      const json = await response.json();

      return json.menu.map((item, index) => ({
        ...item,
        id: index + 1,
        image: item.image.replace(/\s+/g, ''),
      }));
    } catch (error) {
      console.error('Error fetching menu data:', error);
      return [];
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadProfileData = async () => {
        try {
          const storedProfileImage = await AsyncStorage.getItem('userImage');
          const storedName = await AsyncStorage.getItem('userName');
          setProfileImage(storedProfileImage || null);
          setUserName(storedName || '');
        } catch (error) {
          console.error('Error loading profile data:', error);
        }
      };
      loadProfileData();
    }, [])
  );

  useEffect(() => {
    const loadMenuData = async () => {
      const db = await initializeDatabase();

      let data = [];
      await db.withTransactionAsync(async () => {
        const rows = await fetchMenuFromDatabase(db);
        if (rows.length === 0) {
          console.log('No data in database. Fetching from server...');
          const menu = await fetchMenuFromServer();
          await insertMenuIntoDatabase(db, menu);
          data = menu;
        } else {
          console.log('Data found in database. Loading...');
          data = rows;
        }
      });
      setMenuData(data);
    };

    loadMenuData();
  }, []);

  const handleCategoryChoice = (category) => {
    setSelectedCategories((prevSelectedCategories) => {
      if (prevSelectedCategories.includes(category.key)) {
        return prevSelectedCategories.filter((key) => key !== category.key);
      } else {
        return [...prevSelectedCategories, category.key];
      }
    });
  };

  const renderCategoryItem = ({ item }) => {
    const isSelected = selectedCategories.includes(item.key);
    return (
      <TouchableOpacity
        onPress={() => handleCategoryChoice(item)}
        style={[
          styles.categoryItem,
          isSelected && styles.selectedCategoryItem,
        ]}
      >
        <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuItem}>
      <Image
        source={{
          uri: `https://github.com/Meta-Mobile-Developer-PC/Working-With-Data-API/blob/main/images/${item.image}?raw=true`,
        }}
        style={styles.menuImage}
      />
      <View style={styles.menuDetails}>
        <Text style={styles.menuName}>{item.name || 'Unnamed Item'}</Text>
        <Text style={styles.menuDescription}>
          {item.description || 'No description available.'}
        </Text>
        <Text style={styles.menuPrice}>${item.price?.toFixed(2) || '0.00'}</Text>
      </View>
    </View>
  );

  const getUserInitials = (name) => {
    const nameParts = name.split(' ');
    return nameParts.map(part => part.charAt(0)).join('').toUpperCase() || '?';
  };

  const filteredMenuData = menuData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category);
    return matchesSearch && matchesCategory;
  });

  const handleSearchChange = debounce((text) => {
    setSearchText(text);
  }, 500);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/Lemon-Logo.png')}
        style={styles.logo}
      />
      <Text style={styles.heroText}>Welcome! We are a family owned Mediterranean restaurant!</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.initials}>{getUserInitials(userName)}</Text>
          </View>
        )}
      </TouchableOpacity>
      <TextInput
        style={styles.searchBar}
        placeholder="Search for a dish..."
        onChangeText={handleSearchChange}
      />
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCategoryItem}
        contentContainerStyle={styles.categoryList}
        showsHorizontalScrollIndicator={false}
      />
      <FlatList
        data={filteredMenuData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMenuItem}
        contentContainerStyle={styles.menuList}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'absolute',
    top: -140,
    right: -160,
    borderWidth: 2,
    borderColor: '#fff',
  },
  categoryList: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 30,
    flexDirection: 'row',
  },
  categoryItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCategoryItem: {
    backgroundColor: '#ffcc00',
  },
  categoryText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
    textAlign: 'center',
  },
  heroText:{
 fontSize: 16,
    color: '#000',
    fontWeight: '300',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  menuList: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'column',
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    
  },
  menuImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
    alignSelf:'center'
  },
  menuDetails: {
    flex: 1,
    justifyContent: 'center'
  },
  menuName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  menuPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  
  // Search Bar Styling
  searchBar: {
    width: '90%',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    paddingLeft: 15,
    fontSize: 16,
    marginTop: 20,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -140,
    right: -160,
  },
  initials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
});

export default HomeScreen;
