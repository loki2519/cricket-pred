import React from 'react';
import { View, ImageBackground, TouchableOpacity, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';

export default function WelcomeTemplateScreen({ onProceed }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      <ImageBackground 
        source={require('../../assets/images/welcome_template.jpg')} 
        style={styles.imageBackground}
        resizeMode="contain"
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.button} onPress={onProceed} activeOpacity={0.8}>
            <Text style={styles.buttonText}>PROCEED</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071836', // Matches the deep blue background of the template
  },
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  button: {
    backgroundColor: '#ff9800', // Orange button to match the cricket ball/theme
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  }
});
