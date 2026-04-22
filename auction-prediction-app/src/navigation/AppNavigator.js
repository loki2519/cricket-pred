import AppleSpinner from '../components/AppleSpinner';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from '../lib/supabase';
import { View } from 'react-native';
import { Audio } from 'expo-av';

async function triggerSyncSound() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false
    });
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/success.mp3')
    );
    await sound.playAsync();
  } catch (e) {
    console.log('Global sound error:', e.message);
  }
}

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import AdminDrawer from './AdminDrawer';
import UserDrawer from './UserDrawer';
import SelectTeamScreen from '../screens/User/SelectTeamScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [showSplash, setShowSplash] = useState(true);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [teamInfo, setTeamInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Force-remount dependency to clear out any stale Expo Fast Refresh listeners in memory
  const listenerVersion = "v2";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) handleSession(session, 'INITIAL_SESSION');
      else setTimeout(() => setLoading(false), 1000);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Defer setting session on SIGNED_IN so LoginScreen stays alive while we process sound/roles
      if (event === 'SIGNED_IN') {
        handleSession(session, event);
      } else {
        setSession(session);
        if (session) handleSession(session, event);
        else {
          setRole(null);
          setTeamInfo(null);
          setTimeout(() => setLoading(false), 1000);
        }
      }
    });

    return () => subscription?.unsubscribe();
  }, [listenerVersion]);

  const handleSession = async (session, event) => {
    const email = session.user.email;

    // Check if we need to show the full screen loader
    // We only need to show it on initial load or fresh login to prevent unmounting active forms.
    // (Removed 'role === null' because the useEffect closure captures the initial stale null state).
    // Only show global loading screen block on initial cold start
    const isNewLogin = event === 'INITIAL_SESSION' || event === 'SIGNED_IN';
    if (event === 'INITIAL_SESSION') {
      setLoading(true);
    }

    // Hardcoded admin email — primary source of truth
    const HARDCODED_ADMINS = ['karthuhemachandrika1@gmail.com'];
    let adminEmails = [...HARDCODED_ADMINS];

    try {
      const { data } = await supabase.from('admin_config').select('admin_email').eq('id', 1).single();
      if (data && data.admin_email && !adminEmails.includes(data.admin_email)) {
        adminEmails.push(data.admin_email);
      }
    } catch (err) {
      console.log('Could not fetch dynamic admin config, using hardcoded list');
    }

    if (adminEmails.includes(email)) {
      if (isNewLogin) await triggerSyncSound();

      // If logging in actively, keep LoginScreen spinner alive while sound plays
      if (event === 'SIGNED_IN') {
        await new Promise(r => setTimeout(r, 1300));
        setSession(session);
      }

      setRole('admin');

      // If cold booting the app, drop the global loader now
      if (event === 'INITIAL_SESSION') {
        setTimeout(() => setLoading(false), 1300);
      }
      return;
    }

    setRole('manager');
    try {
      const { data } = await supabase
        .from('user_teams')
        .select('team_id, teams(id, name)')
        .eq('user_id', session.user.id)
        .single();
      if (data?.teams) {
        setTeamInfo({ teamId: data.teams.id, teamName: data.teams.name });
      } else {
        setTeamInfo(null);
      }
    } catch {
      setTeamInfo(null);
    } finally {
      if (isNewLogin) await triggerSyncSound();

      if (event === 'SIGNED_IN') {
        await new Promise(r => setTimeout(r, 1300));
        setSession(session);
      }

      setRole('manager');

      if (event === 'INITIAL_SESSION') {
        setTimeout(() => setLoading(false), 1300);
      }
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <AppleSpinner size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : role === 'admin' ? (
          <Stack.Screen name="AdminFlow" component={AdminDrawer} />
        ) : teamInfo ? (
          <Stack.Screen name="MainDrawer">
            {(props) => <UserDrawer {...props} route={{ ...props.route, params: teamInfo }} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="SelectTeam" component={SelectTeamScreen} />
            <Stack.Screen name="MainDrawer" component={UserDrawer} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
