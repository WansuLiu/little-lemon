import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { debounce } from 'lodash'; // For debouncing search

const HomeScreen = ({ navigation }) => { // Add 'navigation' prop here
  const [profileImage, setProfileImage] = useState(null);
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

  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const storedProfileImage = await AsyncStorage.getItem('userImage');
        if (storedProfileImage) setProfileImage(storedProfileImage);
      } catch (error) {
        console.error('Error loading avatar image:', error);
      }
    };

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

    loadProfileImage();
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

  // Function to filter menu data based on search text and selected categories
  const filteredMenuData = menuData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category);
    return matchesSearch && matchesCategory;
  });

  // Debounced search handler
  const handleSearchChange = debounce((text) => {
    setSearchText(text);
  }, 500);
  
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/Lemon-Logo.png')}
        style={styles.logo}
      />
      {/* Make profile image tappable */}
      <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
        <Image source={{ uri: profileImage }} style={styles.profileImage} />
      </TouchableOpacity>
      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search for a dish..."
        placeholderTextColor="#aaa"
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
    top: 45,
    right: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  // Rest of the styles...
});

export default HomeScreen;
