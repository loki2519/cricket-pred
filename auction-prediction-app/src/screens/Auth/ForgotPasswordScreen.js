import AppleSpinner from '../../components/AppleSpinner';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity,
  Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── Password strength rules (same as RegisterScreen) ────────────────────────
const RULES = [
  { id: 'length',  label: 'At least 8 characters',               test: (p) => p.length >= 8 },
  { id: 'upper',   label: 'At least one uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'At least one lowercase letter (a–z)', test: (p) => /[a-z]/.test(p) },
  { id: 'number',  label: 'At least one number (0–9)',           test: (p) => /[0-9]/.test(p) },
  { id: 'symbol',  label: 'At least one symbol (!@#$%^&*)',      test: (p) => /[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]/.test(p) },
];

function getRulesPassed(password) {
  return RULES.map((r) => ({ ...r, passed: r.test(password) }));
}

function strengthLabel(passed) {
  if (passed === 5) return { label: 'Strong',    color: '#16A34A' };
  if (passed >= 3)  return { label: 'Fair',      color: '#F97316' };
  if (passed >= 1)  return { label: 'Weak',      color: '#DC2626' };
  return               { label: 'Very Weak', color: '#B91C1C' };
}

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const rules        = getRulesPassed(newPassword);
  const passedCount  = rules.filter((r) => r.passed).length;
  const strength     = strengthLabel(passedCount);
  const allPassed    = passedCount === RULES.length;

  const handleSendOtp = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email');
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    });
    setTimeout(() => setLoading(false), 1000);

    if (error) {
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

    if (!allPassed) {
      const failed = rules.filter((r) => !r.passed).map((r) => `• ${r.label}`).join('\n');
      return Alert.alert('Weak Password', `Your password must meet ALL requirements:\n\n${failed}`);
    }

    setLoading(true);

    // Step 1: Verify the 6-digit OTP
    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (otpError) {
      setTimeout(() => setLoading(false), 1000);
      return Alert.alert('Invalid OTP', 'The OTP is incorrect or expired. Please try again.');
    }

    // Step 2: Update Password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setTimeout(() => setLoading(false), 1000);

    if (updateError) {
      Alert.alert('Error', updateError.message);
    } else {
      Alert.alert('Success ✅', 'Password changed successfully! Please login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    }
  };

  return (
    <SafeAreaView style={globalStyles.container} edges={['right', 'bottom', 'left']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 30 }}>
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
              <TextInput placeholderTextColor="#FFB380" style={{ flex: 1, padding: 12, fontSize: 16, color: colors.text }}
                placeholder="example@gmail.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <TouchableOpacity style={globalStyles.button} onPress={handleSendOtp} disabled={loading}>
              {loading
                ? <AppleSpinner color={colors.white} />
                : <Text style={globalStyles.buttonText}>Send Reset OTP</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 15, alignItems: 'center' }}>
              <Text style={{ color: colors.blue }}>← Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={globalStyles.card}>
            {/* OTP field */}
            <Text style={{ color: colors.text, marginBottom: 5 }}>OTP Code</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.white, marginBottom: 16 }}>
              <MaterialCommunityIcons name="numeric" size={22} color={colors.primary} style={{ paddingLeft: 10 }} />
              <TextInput placeholderTextColor="#FFB380" style={{ flex: 1, padding: 12, fontSize: 18, letterSpacing: 6, color: colors.text }}
                placeholder="123456"
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            {/* New Password with strength indicator */}
            <Text style={{ color: colors.text, marginBottom: 5 }}>New Password</Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              borderWidth: 1,
              borderColor: allPassed ? colors.success : newPassword.length > 0 ? colors.error : colors.border,
              borderRadius: 8, backgroundColor: colors.white, marginBottom: 10,
            }}>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingLeft: 10 }}>
                <MaterialCommunityIcons name={showPassword ? 'eye' : 'eye-off'} size={22} color={colors.primary} />
              </TouchableOpacity>
              <TextInput placeholderTextColor="#FFB380" style={{ flex: 1, padding: 12, fontSize: 16, color: colors.text }}
                placeholder="Create a strong password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
              />
              {newPassword.length > 0 && (
                <MaterialCommunityIcons
                  name={allPassed ? 'check-circle' : 'close-circle'}
                  size={22}
                  color={allPassed ? colors.success : colors.error}
                  style={{ marginRight: 10 }}
                />
              )}
            </View>

            {/* Strength bar + checklist */}
            {newPassword.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ flex: 1, height: 5, backgroundColor: colors.border, borderRadius: 3, marginRight: 8 }}>
                    <View style={{
                      height: 5, borderRadius: 3,
                      width: `${(passedCount / RULES.length) * 100}%`,
                      backgroundColor: strength.color,
                    }} />
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: strength.color }}>{strength.label}</Text>
                </View>

                {rules.map((rule) => (
                  <View key={rule.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                    <MaterialCommunityIcons
                      name={rule.passed ? 'check-circle' : 'circle-outline'}
                      size={14}
                      color={rule.passed ? colors.success : colors.textLight}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={{ fontSize: 12, color: rule.passed ? colors.success : colors.textLight }}>
                      {rule.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[globalStyles.button, { opacity: allPassed ? 1 : 0.6 }]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading
                ? <AppleSpinner color={colors.white} />
                : <Text style={globalStyles.buttonText}>Reset Password</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsOtpSent(false)} style={{ marginTop: 15, alignItems: 'center' }}>
              <Text style={{ color: colors.blue }}>← Resend OTP</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
