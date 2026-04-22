import AppleSpinner from '../components/AppleSpinner';
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors, globalStyles } from '../styles/theme';

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

export default function SettingsScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [sendLoading, setSendLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Keep a stable ref to the email used when OTP was sent
  const confirmedEmailRef = useRef('');

  // ── Password strength derived state ─────────────────────────────────────────
  const rules       = getRulesPassed(newPassword);
  const passedCount = rules.filter((r) => r.passed).length;
  const strength    = strengthLabel(passedCount);
  const allPassed   = passedCount === RULES.length;

  const handleSendOtp = async () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your current password.');
      return;
    }
    if (!newEmail) {
      Alert.alert('Error', 'Please enter the new email address.');
      return;
    }

    setSendLoading(true);
    try {
      // Fetch the actual stored password from DB
      const { data: config } = await supabase
        .from('admin_config')
        .select('admin_password')
        .eq('id', 1)
        .single();

      const storedPassword = config?.admin_password ?? '123456';

      if (currentPassword !== storedPassword) {
        Alert.alert('Error', 'Incorrect current password!');
        return;
      }

      // 1. Aggressively clean up any conflicting users or ghost identities
      const { error: rpcError } = await supabase.rpc('delete_conflicting_user', {
        target_email: newEmail.trim()
      });

      if (rpcError) {
        console.log('RPC error:', rpcError);
      }

      // 2. Trigger Supabase auth email change → sends OTP to new email
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) {
        throw new Error(error.message + '\n\nIf you see "already registered", please try using a completely fresh email address.');
      }

      confirmedEmailRef.current = newEmail.trim();
      setOtpSent(true);
      setOtpSuccess(true);
      Alert.alert('OTP Sent ✓', `A 6-digit OTP has been sent to ${newEmail.trim()}. Check your inbox.`);
    } catch (err) {
      Alert.alert('Failed to Send OTP', err.message);
    } finally {
      setSendLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP from your email.');
      return;
    }
    if (!newPassword) {
      Alert.alert('Error', 'Please enter your new password.');
      return;
    }

    // ── Strong password gate ──────────────────────────────────────────────────
    if (!allPassed) {
      const failed = rules.filter((r) => !r.passed).map((r) => `• ${r.label}`).join('\n');
      Alert.alert('Weak Password', `Your new password must meet ALL requirements:\n\n${failed}`);
      return;
    }

    if (!confirmedEmailRef.current) {
      Alert.alert('Error', 'Please complete Step 1 first and send the OTP.');
      return;
    }

    setUpdateLoading(true);
    try {
      // Step 1: Verify the OTP — this changes the Supabase Auth email
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: confirmedEmailRef.current,
        token: otp,
        type: 'email_change',
      });

      if (otpError) {
        throw new Error('OTP is incorrect or has expired. Please try again.');
      }

      // Step 2: Update the password in Supabase Auth
      const { error: pwdError } = await supabase.auth.updateUser({ password: newPassword });
      if (pwdError) throw pwdError;

      // Step 3: Save new credentials to admin_config so role check works on next login
      const { error: dbError } = await supabase
        .from('admin_config')
        .upsert({
          id: 1,
          admin_email: confirmedEmailRef.current,
          admin_password: newPassword,
        });

      if (dbError) {
        throw new Error('Credentials updated in Auth but failed to save to DB: ' + dbError.message);
      }

      setUpdateSuccess(true);
      Alert.alert(
        'Success ✓',
        `Admin credentials updated!\n\nNew email: ${confirmedEmailRef.current}\n\nLog out and sign in again with your new credentials.`
      );

      setTimeout(() => {
        setUpdateSuccess(false);
        setOtpSuccess(false);
        setOtpSent(false);
        setCurrentPassword('');
        setNewEmail('');
        setOtp('');
        setNewPassword('');
        confirmedEmailRef.current = '';
      }, 3000);
    } catch (err) {
      Alert.alert('Update Failed', err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.container} edges={['right', 'bottom', 'left']}>
      <View style={{ padding: 20, flex: 1 }}>
        <Text style={globalStyles.title}>Settings</Text>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── STEP 1 ── */}
          <View style={globalStyles.card}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 15, color: colors.text }}>
              Step 1: Request Email Change
            </Text>

            <Text style={{ fontSize: 13, color: colors.primary, marginBottom: 20, fontStyle: 'italic' }}>
              Note: If the new email is already registered by a user, that user account will be permanently deleted and replaced by this admin account.
            </Text>

            <Text style={{ color: colors.text, marginBottom: 5 }}>Current Password</Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              borderWidth: 1, borderColor: colors.border,
              borderRadius: 8, backgroundColor: colors.white, marginBottom: 16,
            }}>
              <MaterialCommunityIcons name="lock" size={20} color={colors.primary} style={{ paddingLeft: 10 }} />
              <TextInput
                style={{ flex: 1, padding: 12, fontSize: 16, color: colors.text }}
                placeholder="Current Admin Password"
                placeholderTextColor="#FFB380"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />
            </View>

            <Text style={{ color: colors.text, marginBottom: 5 }}>New Email</Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              borderWidth: 1, borderColor: colors.border,
              borderRadius: 8, backgroundColor: colors.white, marginBottom: 16,
            }}>
              <MaterialCommunityIcons name="email" size={20} color={colors.primary} style={{ paddingLeft: 10 }} />
              <TextInput
                style={{ flex: 1, padding: 12, fontSize: 16, color: colors.text }}
                placeholder="Enter new email address"
                placeholderTextColor="#FFB380"
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[
                globalStyles.button,
                sendLoading && { opacity: 0.7 },
                otpSuccess && { backgroundColor: '#16A34A' },
              ]}
              onPress={handleSendOtp}
              disabled={sendLoading}
            >
              {sendLoading ? (
                <AppleSpinner color={colors.white} />
              ) : otpSuccess ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={globalStyles.buttonText}>OTP Sent!</Text>
                </View>
              ) : (
                <Text style={globalStyles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Arrow hint shown after OTP sent ── */}
          {otpSent && (
            <View style={{ alignItems: 'center', marginVertical: 6 }}>
              <MaterialCommunityIcons name="arrow-down-circle" size={28} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600', marginTop: 4 }}>
                OTP sent! Now complete Step 2 below
              </Text>
            </View>
          )}

          {/* ── STEP 2 — only visible after OTP is sent ── */}
          {otpSent && (
          <View style={[globalStyles.card, { marginTop: 10, marginBottom: 30 }]}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 15, color: colors.text }}>
              Step 2: Confirm Change
            </Text>

            <Text style={{ color: colors.text, marginBottom: 5 }}>Enter 6-Digit OTP</Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              borderWidth: 1, borderColor: colors.border,
              borderRadius: 8, backgroundColor: colors.white, marginBottom: 16,
            }}>
              <MaterialCommunityIcons name="email-check" size={20} color={colors.primary} style={{ paddingLeft: 10 }} />
              <TextInput
                style={{ flex: 1, padding: 12, fontSize: 16, color: colors.text }}
                placeholder="6-digit code from new email"
                placeholderTextColor="#FFB380"
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            {/* ── New Password with strength indicator ── */}
            <Text style={{ color: colors.text, marginBottom: 5 }}>New Password</Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              borderWidth: 1,
              borderColor: allPassed ? colors.success : newPassword.length > 0 ? colors.error : colors.border,
              borderRadius: 8, backgroundColor: colors.white, marginBottom: 10,
            }}>
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={{ paddingLeft: 10 }}>
                <MaterialCommunityIcons name={showNewPassword ? 'eye' : 'eye-off'} size={22} color={colors.primary} />
              </TouchableOpacity>
              <TextInput
                style={{ flex: 1, padding: 12, fontSize: 16, color: colors.text }}
                placeholder="Create new strong password"
                placeholderTextColor="#FFB380"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
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
              <View style={{ marginBottom: 18 }}>
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
              style={[
                globalStyles.button,
                updateLoading && { opacity: 0.7 },
                updateSuccess && { backgroundColor: '#16A34A' },
                !allPassed && newPassword.length > 0 && { opacity: 0.6 },
              ]}
              onPress={handleUpdate}
              disabled={updateLoading}
            >
              {updateLoading ? (
                <AppleSpinner color={colors.white} />
              ) : updateSuccess ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={globalStyles.buttonText}>Updated!</Text>
                </View>
              ) : (
                <Text style={globalStyles.buttonText}>Confirm & Update</Text>
              )}
            </TouchableOpacity>
          </View>
          )}

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
