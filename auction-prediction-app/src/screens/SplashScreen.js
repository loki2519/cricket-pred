import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Easing, ActivityIndicator, TouchableOpacity } from 'react-native';
import { colors } from '../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Just fade in the logo on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleIconPress = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Left-to-right full rotation (rotateY) over 4 seconds
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 4000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      if (onFinish) onFinish();
    });
  };

  const rotateY = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });


  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <TouchableOpacity onPress={handleIconPress} activeOpacity={0.8}>
          <Animated.View style={[styles.logoContainer, { transform: [{ rotateY: rotateY }] }]}>
            <MaterialCommunityIcons name="cricket" size={80} color="#D4AF37" />
          </Animated.View>
        </TouchableOpacity>
        <Text style={styles.title}>AuctionOracle</Text>
        {isAnimating && (
          <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 40 }} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000033', // Deep Navy to match app headers
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 150, 
    height: 150, 
    borderRadius: 75, 
    borderWidth: 3, 
    borderColor: '#D4AF37', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#000033',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
});
