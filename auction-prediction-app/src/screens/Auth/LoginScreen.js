import AppleSpinner from '../../components/AppleSpinner';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_LOGO = 'https://developers.google.com/identity/images/g-logo.png';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [gLoading, setGLoading]       = useState(false);
  const [postSpinner, setPostSpinner] = useState(null);

  // --- Google Sign-In -------------------------------------------------------
  const handleGoogleLogin = async () => {
    setPostSpinner('google');
    // Simple wait to show spinner
    await new Promise(resolve => setTimeout(resolve, 1000));

    setGLoading(true);
    try {
      const redirectTo = Linking.createURL('/auth-callback', { scheme: 'auctionoracle' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No OAuth URL returned from Supabase.');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        const hashPart = result.url.includes('#') ? result.url.split('#')[1] : result.url.split('?')[1] ?? '';
        const params       = Object.fromEntries(new URLSearchParams(hashPart));
        const accessToken  = params.access_token;
        const refreshToken = params.refresh_token ?? '';

        if (accessToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token:  accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;

          // Note: Transition and sound are now handled globally by AppNavigator 
          // via the onAuthStateChange listener when the session confirms!
        } else {
          throw new Error('No access token received.');
        }
      } else {
        // Cancel/Dismiss
        setPostSpinner(null);
        setGLoading(false);
        Vibration.vibrate([0, 80, 60, 80, 60, 80]); // triple short
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      setPostSpinner(null);
      setGLoading(false);
      Vibration.vibrate([0, 80, 60, 80, 60, 80]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Google Sign-In Failed', err.message);
    }
  };

  // --- Email / Password Sign-In ---------------------------------------------
  const handleLogin = async () => {
    if (!email || !password)
      return Alert.alert('Error', 'Please enter email and password');

    setLoading(true);
    setPostSpinner('email');

    // Auth network request
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      setPostSpinner(null);
      Vibration.vibrate([0, 80, 60, 80, 60, 80]); // triple short
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Login Failed', error.message);
    } else {
      // Note: Transition and sound are now handled globally by AppNavigator 
      // via the onAuthStateChange listener when the session confirms!
    }
  };

  return (
    <SafeAreaView style={globalStyles.container} edges={['right', 'bottom', 'left']}>
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

          {/* Email field */}
          <Text style={{ color: colors.text, marginBottom: 5 }}>Email Address</Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            borderWidth: 1, borderColor: colors.border,
            borderRadius: 8, backgroundColor: colors.white, marginBottom: 16,
          }}>
            <MaterialCommunityIcons name="email" size={22} color={colors.primary} style={{ paddingLeft: 10 }} />
            <TextInput
              placeholderTextColor="#FFB380"
              style={{ flex: 1, padding: 12, fontSize: 16, color: colors.text }}
              placeholder="example@gmail.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password field */}
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
              placeholderTextColor="#FFB380"
              style={{ flex: 1, padding: 12, fontSize: 16, color: colors.text }}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
            />
          </View>

          {/* Sign In Button — spinner is on the button ONLY while submitting */}
          <TouchableOpacity style={globalStyles.button} onPress={handleLogin} disabled={loading}>
            {loading
              ? <AppleSpinner color={colors.white} />
              : <Text style={globalStyles.buttonText}>Sign In</Text>}
          </TouchableOpacity>

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text style={{ marginHorizontal: 12, color: colors.textLight, fontSize: 13, fontWeight: '500' }}>OR</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

          {/* Google Sign-In Button — NO spinner inside, just dimmed when loading */}
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
              opacity: gLoading ? 0.5 : 1,
            }}
          >
            <Image
              source={{ uri: GOOGLE_LOGO }}
              style={{ width: 22, height: 22, marginRight: 12 }}
              resizeMode="contain"
            />
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

          {/* Post-login spinner — always shown BELOW Google button */}
          {postSpinner ? (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <AppleSpinner color={colors.primary} />
              <Text style={{ color: colors.textLight, fontSize: 12, marginTop: 8 }}>
                {postSpinner === 'google' ? 'Signing you in…' : 'Logging in…'}
              </Text>
            </View>
          ) : null}

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
