import React, { useState, useEffect } from 'react';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';
import { supabase } from '../lib/supabase';
import { Alert, View, Text, Image } from 'react-native';
import { colors } from '../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeProfileImage, initProfileImage } from '../lib/profileImageStore';

import Dashboard from '../screens/User/Dashboard';
import Players from '../screens/User/Players';
import PlayerDetails from '../screens/User/PlayerDetails';
import Budget from '../screens/User/Budget';
import Purchases from '../screens/User/Purchases';
import PredictPrice from '../screens/User/PredictPrice';
import ProfileScreen from '../screens/User/ProfileScreen';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const teamName = props.teamName || 'My Team';
  const [profileUri, setProfileUri] = useState(null);

  useEffect(() => {
    initProfileImage();
    const unsub = subscribeProfileImage((uri) => setProfileUri(uri));
    return unsub;
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* Sidebar Header */}
      <View style={{
        backgroundColor: colors.white, padding: 20,
        paddingTop: 60, paddingBottom: 25, alignItems: 'center',
      }}>
        {/* Profile Image or default shield icon */}
        {profileUri ? (
          <Image
            source={{ uri: profileUri }}
            style={{
              width: 72, height: 72, borderRadius: 36,
              borderWidth: 2.5, borderColor: colors.primary,
              marginBottom: 10,
            }}
          />
        ) : (
          <MaterialCommunityIcons name="shield-account" size={56} color={colors.primary} style={{ marginBottom: 8 }} />
        )}
        <Text style={{ color: colors.primary, fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
          {teamName}
        </Text>
        <Text style={{ color: colors.textLight, fontSize: 12 }}>Team Manager</Text>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 10 }}>
        <DrawerItemList {...props} />
        <DrawerItem
          label="Logout"
          icon={({ size }) => <MaterialCommunityIcons name="logout" color={colors.error} size={size} />}
          onPress={async () => {
            const { error } = await supabase.auth.signOut();
            if (error) Alert.alert('Error Signing Out', error.message);
          }}
          labelStyle={{ color: colors.error, fontWeight: 'bold' }}
        />
      </DrawerContentScrollView>
    </View>
  );
}

export default function UserDrawer({ route }) {
  const teamId   = route?.params?.teamId;
  const teamName = route?.params?.teamName;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} teamName={teamName} />}
      screenOptions={{
        headerTintColor: colors.white,
        headerStyle: { backgroundColor: colors.primary },
        drawerActiveBackgroundColor: colors.secondary,
        drawerActiveTintColor: colors.white,
        drawerInactiveTintColor: colors.text,
        drawerItemStyle: {
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          borderRadius: 0,
          marginVertical: 0,
        },
      }}
    >
      <Drawer.Screen name="Dashboard"
        children={(props) => <Dashboard {...props} teamId={teamId} teamName={teamName} />}
        options={{ drawerIcon: ({ color }) => <MaterialCommunityIcons name="view-dashboard" color={color} size={24} /> }}
      />

      <Drawer.Screen name="View Players"
        children={(props) => <Players {...props} teamId={teamId} />}
        options={{ drawerIcon: ({ color }) => <MaterialCommunityIcons name="account-group" color={color} size={24} /> }}
      />

      <Drawer.Screen name="Budget"
        children={(props) => <Budget {...props} teamId={teamId} />}
        options={{ drawerIcon: ({ color }) => <MaterialCommunityIcons name="wallet" color={color} size={24} /> }}
      />

      <Drawer.Screen name="Purchases"
        children={(props) => <Purchases {...props} teamId={teamId} />}
        options={{ drawerIcon: ({ color }) => <MaterialCommunityIcons name="cart" color={color} size={24} /> }}
      />

      <Drawer.Screen name="Predict Price" component={PredictPrice}
        options={{ drawerIcon: ({ color }) => <MaterialCommunityIcons name="chart-line" color={color} size={24} /> }}
      />

      <Drawer.Screen name="Profile"
        children={(props) => <ProfileScreen {...props} teamName={teamName} teamId={teamId} />}
        options={{ drawerIcon: ({ color }) => <MaterialCommunityIcons name="account-circle" color={color} size={24} /> }}
      />

      {/* Hidden screen */}
      <Drawer.Screen name="PlayerDetails" component={PlayerDetails}
        options={{ drawerItemStyle: { display: 'none' }, title: 'Player Details' }}
      />
    </Drawer.Navigator>
  );
}
