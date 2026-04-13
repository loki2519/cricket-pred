import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  SafeAreaView, ActivityIndicator, Image, Platform
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Required: completes any pending auth session when screen is visible
WebBrowser.maybeCompleteAuthSession();

// ─── Helper: parse tokens from callback URL (handles both # and ? separators) ───
function parseTokensFromUrl(url) {
  if (!url) return null;
  const parts = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
  if (!parts) return null;
  return parts.split('&').reduce((acc, pair) => {
    const [k, v] = pair.split('=');
    acc[k] = decodeURIComponent(v || '');
    return acc;
  }, {});
}

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);

  // Warm up the browser on mount for faster OAuth on Android
  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => { WebBrowser.coolDownAsync(); };
  }, []);

  // ─── Email / Password Login ───────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter email and password');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Login Failed', error.message);
  };

  // ─── Generic OAuth Handler (Google / Facebook) ────────────────────────────
  const handleOAuthLogin = async (provider) => {
    setSocialLoading(provider);
    try {
      // On web: Supabase handles the redirect itself — just call signInWithOAuth
      // without skipBrowserRedirect so the browser navigates directly.
      // On native: use the auth.expo.io proxy to avoid exp:// deep link issues.
      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) Alert.alert(`${provider} Login Error`, error.message);
        // Browser will redirect automatically — no further action needed
        return;
      }

      // ── Native (iOS / Android via Expo Go) ──
      const redirectTo = AuthSession.makeRedirectUri({ useProxy: true });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        Alert.alert(`${provider} Login Error`, error.message);
        return;
      }

      if (!data?.url) {
        Alert.alert('Error', 'Could not get authentication URL');
        return;
      }

      // Open OAuth in a safe Chrome Custom Tab — browser intercepts the
      // https://auth.expo.io redirect without triggering Expo's bundle loader
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        const tokens = parseTokensFromUrl(result.url);
        if (tokens?.access_token && tokens?.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          });
          if (sessionError) Alert.alert('Session Error', sessionError.message);
        } else {
          Alert.alert('Login Failed', 'Could not retrieve session tokens. Please try again.');
        }
      } else if (result.type === 'cancel') {
        // User closed the browser — do nothing
      } else {
        Alert.alert('Login Failed', 'Authentication was not completed. Please try again.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <View style={{
            width: 70, height: 70, borderRadius: 35,
            borderWidth: 2, borderColor: '#D4AF37',
            justifyContent: 'center', alignItems: 'center'
          }}>
            <MaterialCommunityIcons name="cricket" size={44} color="#D4AF37" />
          </View>
        </View>

        <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: 10 }}>
          AuctionOracle
        </Text>
        <Text style={{ fontSize: 16, color: colors.textLight, textAlign: 'center', marginBottom: 30 }}>
          Sign in to your account
        </Text>

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
              <MaterialCommunityIcons name={showPassword ? 'eye' : 'eye-off'} size={24} color={colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={{ flex: 1, padding: 12, fontSize: 16, color: colors.text }}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          <TouchableOpacity style={globalStyles.button} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={globalStyles.buttonText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text style={{ marginHorizontal: 10, color: colors.textLight, fontSize: 13, fontWeight: '500' }}>OR</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            {/* Google — centred, solo */}
            <TouchableOpacity
              style={{ width: 60, height: 60, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 30, justifyContent: 'center', alignItems: 'center' }}
              onPress={() => handleOAuthLogin('google')}
              disabled={!!socialLoading}
            >
              {socialLoading === 'google'
                ? <ActivityIndicator color={colors.primary} />
                : <Image source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }} style={{ width: 30, height: 30 }} resizeMode="contain" />}
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 25, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginBottom: 15 }}>
              <Text style={{ color: colors.blue }}>Don't have an account?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={{ color: colors.error, fontWeight: 'bold' }}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
