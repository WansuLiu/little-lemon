import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Onboarding from './screens/Onboarding'; // Ensure this path is correct
import Profile from './screens/Profile'; // Import the Profile screen
import SplashScreen from './screens/SplashScreen';

const Stack = createNativeStackNavigator();

function App() {
  // State to track if the onboarding process is completed
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Corrected capitalization of state setter

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('onboardingCompleted');
        if (value === "true") {
          setIsOnboardingCompleted(true);
        }
      } catch (error) {
        console.error('Failed to load onboarding status:', error);
      } finally {
        setIsLoading(false); // Ensure loading state is set to false
      }
    };
    checkOnboardingStatus();
  }, []);

  const handleOnboardingComplete = () => {
    setIsOnboardingCompleted(true);
  };

  // Show splash screen while loading
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isOnboardingCompleted ? "Profile" : "Onboarding"}
      >
        {/* Define both screens unconditionally */}
        <Stack.Screen 
          name="Profile" 
          component={Profile} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Onboarding" 
          component={(props) => <Onboarding {...props} onComplete={handleOnboardingComplete} />}
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
