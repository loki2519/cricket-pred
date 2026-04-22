import AppleSpinner from '../../components/AppleSpinner';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../../styles/theme';

export default function TrainModelScreen() {
  const [loading, setLoading] = useState(false);

  const trainModel = async () => {
    setLoading(true);
    try {
      // Connect to Python Backend once available
      // const res = await fetch('http://localhost:8000/train');
      // const data = await res.json();
      setTimeout(() => {
        setTimeout(() => setLoading(false), 1000);
        Alert.alert('Success', 'Model trained successfully on Data.xlsx');
      }, 2000);
    } catch (error) {
      setTimeout(() => setLoading(false), 1000);
      Alert.alert('Error', 'Failed to train model');
    }
  };

  return (
    <SafeAreaView style={globalStyles.container} edges={['right', 'bottom', 'left']}>
      <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
        <Text style={[globalStyles.title, { textAlign: 'center' }]}>Train ML Model</Text>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>
          This will trigger the python backend to train on Data.xlsx.
        </Text>
        <TouchableOpacity style={globalStyles.button} onPress={trainModel} disabled={loading}>
          {loading ? <AppleSpinner color="white" /> : <Text style={globalStyles.buttonText}>Start Training</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
