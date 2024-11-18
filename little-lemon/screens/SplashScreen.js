import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/Lemon-Logo.png')}
        style={styles.logo}
      />
      <Text style={styles.welcomeText}>Welcome!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Background color
  },
  logo: {
    width: 150, // Width of the logo
    height: 150, // Height of the logo
    resizeMode: 'contain', // Maintain aspect ratio
    marginBottom: 20, // Space between logo and text
  },
  welcomeText: {
    fontSize: 24, // Font size for the welcome text
    fontWeight: 'bold', // Bold font
    textAlign: 'center', // Center align the text
  },
});

export default SplashScreen; // Exporting the component for use in other files
