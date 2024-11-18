import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Onboarding = ({ navigation, onComplete }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isValidName, setIsValidName] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(false);

  const handleNextPress = async () => {
    try {
      // Store user data in AsyncStorage
      await AsyncStorage.multiSet([
        ['userName', name],
        ['userEmail', email],
        ['onboardingCompleted', 'true']
      ]);
      console.log('Onboarding status saved as completed.');
      onComplete(); // Call the onComplete callback
      navigation.navigate('Profile')
      // Navigate to the Profile screen
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with logo and text */}
      <View style={styles.header}>
        <Image
          source={require('../assets/images/Lemon-Logo.png')}
          style={styles.logo}
        />
      </View>
      <Text style={styles.title}>Let us get to know you!</Text>

      {/* Text input for name */}
      <TextInput
        style={styles.input}
        placeholder="Enter your first name"
        value={name}
        onChangeText={(input) => {
          setName(input);
          setIsValidName(/^[a-zA-Z\s]*$/.test(input) && input.length > 0);
        }}
      />
      {/* Text input for email */}
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        keyboardType="email-address"
        autoCapitalize="none" // Disable auto-capitalization for email input
        onChangeText={(input) => {
          setEmail(input);
          setIsValidEmail(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input));
        }}
      />

      {/* Next button */}
      <Button
        title="Next"
        disabled={!isValidName || !isValidEmail}
        onPress={handleNextPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 32, // Combine top and bottom margins for cleaner layout
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20, // Adjusted for better spacing
    marginBottom: 40,
  },
  input: {
    height: 40,
    width: '80%', // Use percentage for responsive design
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 8,
    marginBottom: 16,
    borderRadius: 8,
  },
  logo: {
    width: 150, // Set the width of the logo
    height: 100, // Set the height of the logo
    resizeMode: 'contain', // Maintain aspect ratio
  },
});

export default Onboarding;
