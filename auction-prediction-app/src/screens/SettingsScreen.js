import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors, globalStyles } from '../styles/theme';

export default function SettingsScreen({ navigation }) {
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdateEmail = async () => {
    if (!newEmail) return Alert.alert('Error', 'Please enter new email');
    setLoading(true);
    
    // Updates the email and triggers confirmation flow
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Verification OTP sent to your new email!');
      setIsOtpSent(true);
    }
  };

  const verifyEmailOtp = async () => {
    if (!otp) return Alert.alert('Error', 'Please enter OTP');
    setLoading(true);
    
    const { error } = await supabase.auth.verifyOtp({
      email: newEmail,
      token: otp,
      type: 'email_change'
    });
    
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Email successfully updated!');
      setIsOtpSent(false); // Reset
      setNewEmail('');
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={{ padding: 20 }}>
        <Text style={globalStyles.title}>Settings</Text>

        {!isOtpSent ? (
          <View style={globalStyles.card}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Change Email Address</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="new.email@example.com"
              value={newEmail}
              onChangeText={setNewEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity style={globalStyles.button} onPress={handleUpdateEmail} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.white} /> : <Text style={globalStyles.buttonText}>Change Email</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={globalStyles.card}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Verify New Email</Text>
            <Text style={{ marginBottom: 10, color: colors.textLight }}>Enter the OTP sent to {newEmail}</Text>
            <TextInput style={globalStyles.input} placeholder="123456" value={otp} onChangeText={setOtp} keyboardType="number-pad" />
            
            <TouchableOpacity style={globalStyles.button} onPress={verifyEmailOtp} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.white} /> : <Text style={globalStyles.buttonText}>Verify OTP</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
