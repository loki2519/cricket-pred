import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'OTP sent to your email! Please verify.');
      setIsOtpSent(true);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup'
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', 'OTP is incorrect or expired');
    } else {
      Alert.alert('Success', 'Registration and Verification successful!');
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: 10 }}>
          Sign Up
        </Text>
        <Text style={{ fontSize: 16, color: colors.textLight, textAlign: 'center', marginBottom: 30 }}>
          {isOtpSent ? 'Verify your email with the OTP' : 'Create a new account'}
        </Text>
        
        {!isOtpSent ? (
          <View style={globalStyles.card}>
            <Text style={{ color: colors.text, marginBottom: 5 }}>Email Address</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.white, marginBottom: 16 }}>
              <MaterialCommunityIcons name="email" size={24} color={colors.primary} style={{ paddingLeft: 10 }} />
              <TextInput
                style={{ flex: 1, padding: 12, fontSize: 16, color: colors.text }}
                placeholder="example@gmail.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <Text style={{ color: colors.text, marginBottom: 5 }}>Password</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.white, marginBottom: 16 }}>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingLeft: 10 }}>
                <MaterialCommunityIcons name={showPassword ? "eye" : "eye-off"} size={24} color={colors.primary} />
              </TouchableOpacity>
              <TextInput
                style={{ flex: 1, padding: 12, fontSize: 16, color: colors.text }}
                placeholder="Secure Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
            </View>

            <TouchableOpacity style={globalStyles.button} onPress={handleRegister} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={globalStyles.buttonText}>Register & Send OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 15, alignItems: 'center' }}>
              <Text style={{ color: colors.blue }}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={globalStyles.card}>
            <Text style={{ color: colors.text, marginBottom: 5 }}>Enter 6-Digit OTP</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="123456"
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity style={globalStyles.button} onPress={handleVerifyOtp} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={globalStyles.buttonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
