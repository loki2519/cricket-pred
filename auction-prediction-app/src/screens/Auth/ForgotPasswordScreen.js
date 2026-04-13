import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, SafeAreaView, ActivityIndicator
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email');
    setLoading(true);

    // signInWithOtp sends a 6-digit OTP code to the email
    // NOTE: Supabase silently succeeds even if email doesn't exist (security)
    // so no "email not found" error — user just won't receive anything
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    });
    setLoading(false);

    if (error) {
      // Common errors:
      // "Email rate limit exceeded" = Supabase free tier 2 emails/hour limit
      // "over_email_send_rate_limit" = same
      if (error.message.toLowerCase().includes('rate')) {
        Alert.alert(
          'Too Many Requests ⚠️',
          'You\'ve requested too many OTPs. Please wait 1 hour before trying again.'
        );
      } else {
        Alert.alert('Error', error.message);
      }
    } else {
      Alert.alert(
        'OTP Sent ✅',
        'A 6-digit OTP has been sent to your email.\n\n• Check your inbox and spam folder\n• OTP is valid for 1 hour\n• Make sure this email is registered'
      );
      setIsOtpSent(true);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) return Alert.alert('Error', 'Please enter OTP and new password');
    if (newPassword.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');

    setLoading(true);

    // Step 1: Verify the 6-digit OTP (type must be 'email' to match signInWithOtp)
    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (otpError) {
      setLoading(false);
      return Alert.alert('Invalid OTP', 'The OTP is incorrect or expired. Please try again.');
    }

    // Step 2: Update Password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (updateError) {
      Alert.alert('Error', updateError.message);
    } else {
      Alert.alert('Success ✅', 'Password changed successfully! Please login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <View style={{ width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
            <MaterialCommunityIcons name="lock-reset" size={38} color={colors.primary} />
          </View>
        </View>

        <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: 8 }}>
          Reset Password
        </Text>
        <Text style={{ fontSize: 14, color: colors.textLight, textAlign: 'center', marginBottom: 28 }}>
          {isOtpSent
            ? 'Enter the 6-digit OTP from your email and set a new password.'
            : 'Enter your registered email to receive a reset OTP.'}
        </Text>

        {!isOtpSent ? (
          <View style={globalStyles.card}>
            <Text style={{ color: colors.text, marginBottom: 5 }}>Email Address</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.white, marginBottom: 16 }}>
              <MaterialCommunityIcons name="email" size={22} color={colors.primary} style={{ paddingLeft: 10 }} />
              <TextInput
                style={{ flex: 1, padding: 12, fontSize: 16, color: colors.text }}
                placeholder="example@gmail.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <TouchableOpacity style={globalStyles.button} onPress={handleSendOtp} disabled={loading}>
              {loading
                ? <ActivityIndicator color={colors.white} />
                : <Text style={globalStyles.buttonText}>Send Reset OTP</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 15, alignItems: 'center' }}>
              <Text style={{ color: colors.blue }}>← Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={globalStyles.card}>
            <Text style={{ color: colors.text, marginBottom: 5 }}>OTP Code</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.white, marginBottom: 16 }}>
              <MaterialCommunityIcons name="numeric" size={22} color={colors.primary} style={{ paddingLeft: 10 }} />
              <TextInput
                style={{ flex: 1, padding: 12, fontSize: 18, letterSpacing: 6, color: colors.text }}
                placeholder="123456"
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <Text style={{ color: colors.text, marginBottom: 5 }}>New Password</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.white, marginBottom: 16 }}>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingLeft: 10 }}>
                <MaterialCommunityIcons name={showPassword ? 'eye' : 'eye-off'} size={22} color={colors.primary} />
              </TouchableOpacity>
              <TextInput
                style={{ flex: 1, padding: 12, fontSize: 16, color: colors.text }}
                placeholder="New secure password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
              />
            </View>

            <TouchableOpacity style={globalStyles.button} onPress={handleResetPassword} disabled={loading}>
              {loading
                ? <ActivityIndicator color={colors.white} />
                : <Text style={globalStyles.buttonText}>Reset Password</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsOtpSent(false)} style={{ marginTop: 15, alignItems: 'center' }}>
              <Text style={{ color: colors.blue }}>← Resend OTP</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
