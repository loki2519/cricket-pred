import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { LogBox } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

LogBox.ignoreAllLogs(true); // Ignore all log notifications for a clean UI

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
