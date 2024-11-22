import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Image, TouchableWithoutFeedback, Keyboard, ScrollView, KeyboardAvoidingView, Platform, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaskedTextInput } from 'react-native-mask-text';
import Icon from 'react-native-vector-icons/Ionicons'; 
import * as ImagePicker from 'expo-image-picker'; 
import CheckBox from 'react-native-checkbox';

const Profile = ({navigation}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isValidPhone, setIsValidPhone] = useState(true);
  const [imageUri, setImageUri] = useState(null);
  const [specialOffers, setSpecialOffers] = useState(false); // Track "Special Offers" checkbox
  const [newsletters, setNewsletters] = useState(false); // Track "Newsletters" checkbox

  const validatePhoneNumber = (number) => {
    const regex = /^\(\+46\)\s\d{9,10}$/; // Regex for Swedish phone numbers
    return regex.test(number);
  };

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const storedName = await AsyncStorage.getItem('userName');
        const storedEmail = await AsyncStorage.getItem('userEmail');
        const storedPhone = await AsyncStorage.getItem('userPhone');
        const storedImageUri = await AsyncStorage.getItem('userImage');
        const storedSpecialOffers = await AsyncStorage.getItem('specialOffers');
        const storedNewsletters = await AsyncStorage.getItem('newsletters');

        if (storedName) setName(storedName);
        if (storedEmail) setEmail(storedEmail);
        if (storedPhone) setPhone(storedPhone);
        if (storedImageUri) setImageUri(storedImageUri);
        if (storedSpecialOffers !== null) setSpecialOffers(JSON.parse(storedSpecialOffers));
        if (storedNewsletters !== null) setNewsletters(JSON.parse(storedNewsletters));
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };
    loadProfileData();
  }, []);

  const handlePhoneChange = (text) => {
    setPhone(text);
    setIsValidPhone(validatePhoneNumber(text));
  };

  const handleBackPress = () => {
    console.log("Back button pressed, but no previous screen.");
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync();
    if (!result.canceled) {
      setImageUri(result.assets[0].uri); // Update state with selected image URI
      await AsyncStorage.setItem('userImage', result.assets[0].uri); // Save image URI to AsyncStorage
    }
  };

  const saveChanges = async () => {
    try {
      // Store all changes in AsyncStorage
      await AsyncStorage.setItem('userName', name);
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('userPhone', phone);
      await AsyncStorage.setItem('specialOffers', JSON.stringify(specialOffers));
      await AsyncStorage.setItem('newsletters', JSON.stringify(newsletters));

      // If there's an image, store its URI as well
      if (imageUri) {
        await AsyncStorage.setItem('userImage', imageUri);
      }

      Alert.alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile data:', error);
      Alert.alert('Failed to save changes. Please try again.');
    }
  };

   const Logout=async()=>{
    try {
       await AsyncStorage.multiRemove([
      'userName', 
      'userEmail', 
      'userPhone', 
      'userImage', 
      'specialOffers', 
      'newsletters',
      'onboardingCompleted'
    ]);
       navigation.replace('Onboarding');
    }
    catch(error){
      console.error('Error clearing data:', error);
      Alert.alert('Error', 'Unable to logout. Please try again.');
    }
   }

  const getUserInitials = (name) => {
    const nameParts = name.split(' ');
    const initials = nameParts.map(part => part.charAt(0)).join('').toUpperCase();
    return initials || '?'; // Return initials or a placeholder if empty
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Adjust for iOS and Android
      >
        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          <Icon 
            name="arrow-back" 
            size={24}
            color="#000" 
            style={styles.backButton}
            onPress={handleBackPress}
          />
          <Text style={styles.title}>Profile Page</Text>  
          <Text style={styles.heading}>Personal Information</Text>  

          {/* Image Picker */}
          <TouchableOpacity onPress={handleImagePicker} style={styles.imageContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.initials}>{getUserInitials(name)}</Text> 
              </View>
            )}
          </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={Logout}>
            <Text style={styles.saveButtonText}>Log Out</Text>
          </TouchableOpacity>

          {/* Name Input */}
          <Text style={styles.inputLabel}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={name}
            onChangeText={setName}
          />

          {/* Email Input */}
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />

          {/* Phone Input */}
          <Text style={styles.inputLabel}>Phone Number</Text>
          <MaskedTextInput
            style={[styles.input, !isValidPhone && styles.invalidInput]}
            placeholder="Phone Number"
            value={phone}
            onChangeText={handlePhoneChange}
            mask="(+46) 9999999999"
          />
          {!isValidPhone && (
            <Text style={styles.errorMessage}>Invalid phone number!</Text>
          )}

          {/* Subscriptions Section */}
          <Text style={styles.heading}>Subscriptions</Text>
          <View style={styles.checkbox}>
            <CheckBox 
              label="Special Offers" 
              onChange={(checked) => setSpecialOffers(checked)} 
            />
            <CheckBox 
              label="Newsletters" 
              onChange={(checked) => setNewsletters(checked)} 
            /> 
          </View>

          {/* Save Changes Button */}
          <TouchableOpacity style={styles.saveButton} onPress={saveChanges}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', 
    paddingTop: 40,
  },
  scrollViewContainer: {
    flexGrow: 1, 
    justifyContent: 'flex-start', 
    alignItems: 'center', 
    paddingBottom: 20, // Adds some space below the content
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  input: {
    width: '80%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  inputLabel: {
    width: '80%',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    alignSelf: 'flex-start', 
    paddingHorizontal: 37,
    color:'grey'
  },
  invalidInput: {
    borderColor: 'red', 
  },
  errorMessage: {
    color: 'red', 
    marginTop: 5,
  },
  backButton: {
    position: 'absolute', 
    top: 25, 
    left: 20, 
    zIndex: 1, 
  },
  imageContainer: {
    marginBottom: 20,
    alignSelf: 'left',
    left: 37,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  checkbox: {
    width: '80%',
    alignItems: 'flex-start', 
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'left',
    marginVertical: 20, 
    paddingHorizontal: 37
  },
  saveButton: {
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 5,
    width: '80%',
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Profile;

