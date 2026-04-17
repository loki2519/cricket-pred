import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Required: closes the browser tab and completes the auth session
WebBrowser.maybeCompleteAuthSession();

// Official Google G logo
const GOOGLE_LOGO = 'https://developers.google.com/identity/images/g-logo.png';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);

  // ─── Google Sign-In via Supabase OAuth (PKCE flow) ─────────────────────
  // Supabase v2 uses PKCE by default: Google redirects back with a `code`,
  // NOT tokens. We call exchangeCodeForSession(url) to swap the code for a
  // real session. onAuthStateChange in AppNavigator then handles navigation.
  const handleGoogleLogin = async () => {
    setGLoading(true);
    try {
      // Deep link the browser will redirect back to after auth
      const redirectTo = Linking.createURL('/auth-callback');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,  // we open the browser manually below
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No OAuth URL returned from Supabase.');

      // Open Google sign-in in an in-app browser
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        // Implicit flow: tokens are in the URL hash fragment as
        // exp://.../#access_token=XXX&refresh_token=YYY&...
        // Parse them out and set the Supabase session manually.
        const url = result.url;
        const hashPart = url.includes('#') ? url.split('#')[1] : url.split('?')[1] ?? '';
        const params = Object.fromEntries(new URLSearchParams(hashPart));
        const accessToken  = params.access_token;
        const refreshToken = params.refresh_token ?? '';

        if (accessToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token:  accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
          // onAuthStateChange in AppNavigator fires → navigates automatically
        } else {
          throw new Error('No access token received. Please try again.');
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        setGLoading(false);
      }
    } catch (err) {
      Alert.alert('Google Sign-In Failed', err.message);
      setGLoading(false);
    }
  };

  // ─── Email / Password Sign-In ────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password)
      return Alert.alert('Error', 'Please enter email and password');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Login Failed', error.message);
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>

        {/* App Logo */}
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <View style={{
            width: 70, height: 70, borderRadius: 35,
            borderWidth: 2, borderColor: '#FF6600',
            justifyContent: 'center', alignItems: 'center',
          }}>
            <MaterialCommunityIcons name="cricket" size={44} color="#FF6600" />
          </View>
        </View>

        <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: 10 }}>
          AuctionOracle
        </Text>
        <Text style={{ fontSize: 16, color: colors.textLight, textAlign: 'center', marginBottom: 30 }}>
          Sign in to your account
        </Text>

        <View style={globalStyles.card}>

          {/* Email */}
          <Text style={{ color: colors.text, marginBottom: 5 }}>Email Address</Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            borderWidth: 1, borderColor: colors.border,
            borderRadius: 8, backgroundColor: colors.white, marginBottom: 16,
          }}>
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

          {/* Password */}
          <Text style={{ color: colors.text, marginBottom: 5 }}>Password</Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            borderWidth: 1, borderColor: colors.border,
            borderRadius: 8, backgroundColor: colors.white, marginBottom: 20,
          }}>
            <TouchableOpacity onPress={() => setShowPwd(p => !p)} style={{ paddingLeft: 10 }}>
              <MaterialCommunityIcons name={showPwd ? 'eye' : 'eye-off'} size={22} color={colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={{ flex: 1, padding: 12, fontSize: 16, color: colors.text }}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
            />
          </View>

          {/* Sign In Button */}
          <TouchableOpacity style={globalStyles.button} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={globalStyles.buttonText}>Sign In</Text>}
          </TouchableOpacity>

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text style={{ marginHorizontal: 12, color: colors.textLight, fontSize: 13, fontWeight: '500' }}>OR</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

          {/* ── Google Sign-In Button (via Supabase OAuth) ── */}
          <TouchableOpacity
            onPress={handleGoogleLogin}
            disabled={gLoading}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              borderWidth: 1,
              borderColor: '#dadce0',
              borderRadius: 4,
              paddingVertical: 12,
              paddingHorizontal: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 2,
              elevation: 2,
              opacity: gLoading ? 0.6 : 1,
            }}
          >
            {gLoading ? (
              <ActivityIndicator color="#4285F4" style={{ marginRight: 12 }} />
            ) : (
              <Image
                source={{ uri: GOOGLE_LOGO }}
                style={{ width: 22, height: 22, marginRight: 12 }}
                resizeMode="contain"
              />
            )}
            <Text style={{
              color: '#3c4043',
              fontSize: 15,
              fontWeight: '600',
              letterSpacing: 0.25,
              fontFamily: 'System',
            }}>
              {gLoading ? 'Signing in...' : 'Sign in with Google'}
            </Text>
          </TouchableOpacity>

          {/* Navigation Links */}
          <View style={{ marginTop: 28, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginBottom: 15 }}>
              <Text style={{ color: colors.blue }}>Don't have an account? Register</Text>
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
