import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from '../lib/supabase';
import { ActivityIndicator, View } from 'react-native';

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
  const [session, setSession]       = useState(null);
  const [role, setRole]             = useState(null);
  const [teamInfo, setTeamInfo]     = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) handleSession(session);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) handleSession(session);
      else {
        setRole(null);
        setTeamInfo(null);
        setLoading(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleSession = async (session) => {
    const email = session.user.email;
    if (email === 'maddilokeshreddy19@gmail.com') {
      setRole('admin');
      setLoading(false);
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
      setLoading(false);
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            <Stack.Screen name="Login"          component={LoginScreen} />
            <Stack.Screen name="Register"       component={RegisterScreen} />
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
            <Stack.Screen name="MainDrawer"  component={UserDrawer} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
