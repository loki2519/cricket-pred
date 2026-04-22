import AppleSpinner from '../../components/AppleSpinner';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── Password strength rules ──────────────────────────────────────────────────
const RULES = [
  { id: 'length',  label: 'At least 8 characters',           test: (p) => p.length >= 8 },
  { id: 'upper',   label: 'At least one uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'At least one lowercase letter (a–z)', test: (p) => /[a-z]/.test(p) },
  { id: 'number',  label: 'At least one number (0–9)',        test: (p) => /[0-9]/.test(p) },
  { id: 'symbol',  label: 'At least one symbol (!@#$%^&*)',   test: (p) => /[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]/.test(p) },
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

export default function RegisterScreen({ navigation }) {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp]                 = useState('');
  const [loading, setLoading]         = useState(false);
  const [isOtpSent, setIsOtpSent]     = useState(false);

  const rules      = getRulesPassed(password);
  const passedCount = rules.filter((r) => r.passed).length;
  const strength   = strengthLabel(passedCount);
  const allPassed  = passedCount === RULES.length;

  const handleRegister = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email address.');
    if (!password) return Alert.alert('Error', 'Please enter a password.');

    if (!allPassed) {
      const failed = rules.filter((r) => !r.passed).map((r) => `• ${r.label}`).join('\n');
      return Alert.alert('Weak Password', `Your password must meet ALL requirements:\n\n${failed}`);
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setTimeout(() => setLoading(false), 1000);

    if (error) {
      Alert.alert('Registration Error', error.message);
    } else {
      Alert.alert('Check Your Email', 'An OTP has been sent to your email address. Please verify.');
      setIsOtpSent(true);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return Alert.alert('Error', 'Please enter the OTP sent to your email.');
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' });
    setTimeout(() => setLoading(false), 1000);

    if (error) {
      Alert.alert('Error', 'OTP is incorrect or has expired. Please try again.');
    } else {
      Alert.alert('Success', 'Email verified! You can now sign in.');
    }
  };

  return (
    <SafeAreaView style={globalStyles.container} edges={['right', 'bottom', 'left']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 30 }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: 10 }}>
          Sign Up
        </Text>
        <Text style={{ fontSize: 16, color: colors.textLight, textAlign: 'center', marginBottom: 30 }}>
          {isOtpSent ? 'Verify your email with the OTP' : 'Create a strong account'}
        </Text>

        {!isOtpSent ? (
          <View style={globalStyles.card}>
            {/* Email */}
            <Text style={{ color: colors.text, marginBottom: 5 }}>Email Address</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.white, marginBottom: 16 }}>
              <MaterialCommunityIcons name="email" size={24} color={colors.primary} style={{ paddingLeft: 10 }} />
              <TextInput placeholderTextColor="#FFB380" style={{ flex: 1, padding: 12, fontSize: 16, color: colors.text }}
                placeholder="example@gmail.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password */}
            <Text style={{ color: colors.text, marginBottom: 5 }}>Password</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: allPassed ? colors.success : password.length > 0 ? colors.error : colors.border, borderRadius: 8, backgroundColor: colors.white, marginBottom: 10 }}>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingLeft: 10 }}>
                <MaterialCommunityIcons name={showPassword ? 'eye' : 'eye-off'} size={24} color={colors.primary} />
              </TouchableOpacity>
              <TextInput placeholderTextColor="#FFB380" style={{ flex: 1, padding: 12, fontSize: 16, color: colors.text }}
                placeholder="Create a strong password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              {password.length > 0 && (
                <MaterialCommunityIcons
                  name={allPassed ? 'check-circle' : 'close-circle'}
                  size={22}
                  color={allPassed ? colors.success : colors.error}
                  style={{ marginRight: 10 }}
                />
              )}
            </View>

            {/* Strength bar + label */}
            {password.length > 0 && (
              <View style={{ marginBottom: 14 }}>
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

                {/* Individual rules checklist */}
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
              onPress={handleRegister}
              disabled={loading}
            >
              {loading
                ? <AppleSpinner color={colors.white} />
                : <Text style={globalStyles.buttonText}>Register &amp; Send OTP</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 15, alignItems: 'center' }}>
              <Text style={{ color: colors.blue }}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={globalStyles.card}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <MaterialCommunityIcons name="email-check" size={56} color={colors.primary} />
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: colors.primary, marginTop: 10 }}>Check Your Email</Text>
              <Text style={{ color: colors.textLight, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
                We sent a 6-digit OTP to{'\n'}{email}
              </Text>
            </View>

            <Text style={{ color: colors.text, marginBottom: 5 }}>Enter 6-Digit OTP</Text>
            <TextInput placeholderTextColor="#FFB380" style={[globalStyles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 8 }]}
              placeholder="······"
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity style={globalStyles.button} onPress={handleVerifyOtp} disabled={loading}>
              {loading
                ? <AppleSpinner color={colors.white} />
                : <Text style={globalStyles.buttonText}>Verify OTP</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsOtpSent(false)} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: colors.textLight, fontSize: 13 }}>← Back to registration</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
