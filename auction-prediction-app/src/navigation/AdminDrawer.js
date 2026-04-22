import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { supabase } from '../lib/supabase';
import { Alert, View, Text } from 'react-native';
import DashboardScreen from '../screens/Admin/DashboardScreen';
import AddPlayerScreen from '../screens/Admin/AddPlayerScreen';
import ViewPlayersScreen from '../screens/Admin/ViewPlayersScreen';
import ManageTeamsScreen from '../screens/Admin/ManageTeamsScreen';
import PredictPriceScreen from '../screens/Admin/PredictPriceScreen';
import AdminProfileScreen from '../screens/Admin/AdminProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors } from '../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  return (
    <View style={{ flex: 1 }}>
      {/* AuctionOracle Header Bleeding to all Edges */}
      <View style={{ backgroundColor: colors.white, padding: 20, paddingTop: 60, paddingBottom: 25, alignItems: 'center' }}>
        <View style={{ 
          width: 58, height: 58, borderRadius: 29, 
          borderWidth: 2, borderColor: colors.primary, 
          justifyContent: 'center', alignItems: 'center',
        }}>
          <MaterialCommunityIcons name="cricket" size={36} color={colors.primary} />
        </View>
        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: 'bold', marginTop: 12 }}>AuctionOracle</Text>
        <Text style={{ color: colors.textLight, fontSize: 12 }}>Admin Panel</Text>
      </View>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 10 }}>
        <DrawerItemList {...props} />
        <DrawerItem
          label="Logout"
          icon={({ color, size }) => <MaterialCommunityIcons name="logout" color={colors.error} size={size} />}
          onPress={async () => {
            const { error } = await supabase.auth.signOut();
            if (error) Alert.alert("Error Signing Out", error.message);
          }}
          labelStyle={{ color: colors.error, fontWeight: 'bold' }}
        />
      </DrawerContentScrollView>
    </View>
  );
}

export default function AdminDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
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
        }
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen}
        options={{ drawerIcon: ({ color }) => <MaterialCommunityIcons name="view-dashboard" color={color} size={24} /> }} />
      <Drawer.Screen name="Profile" component={AdminProfileScreen}
        options={{ drawerIcon: ({ color }) => <MaterialCommunityIcons name="account-circle" color={color} size={24} /> }} />
      <Drawer.Screen name="Add Player" component={AddPlayerScreen}
        options={{ drawerIcon: ({ color }) => <MaterialCommunityIcons name="account-plus" color={color} size={24} /> }} />
      <Drawer.Screen name="View Players" component={ViewPlayersScreen}
        options={{ drawerIcon: ({ color }) => <MaterialCommunityIcons name="account-group" color={color} size={24} /> }} />
      <Drawer.Screen name="Manage Teams" component={ManageTeamsScreen}
        options={{ drawerIcon: ({ color }) => <MaterialCommunityIcons name="shield-account" color={color} size={24} /> }} />
      <Drawer.Screen name="Predict Price" component={PredictPriceScreen}
        options={{ drawerIcon: ({ color }) => <MaterialCommunityIcons name="chart-line" color={color} size={24} /> }} />
      <Drawer.Screen name="Settings" component={SettingsScreen}
        options={{ drawerIcon: ({ color }) => <MaterialCommunityIcons name="cog" color={color} size={24} /> }} />
    </Drawer.Navigator>
  );
}
