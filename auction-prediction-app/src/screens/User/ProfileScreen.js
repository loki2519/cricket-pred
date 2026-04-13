import React, { useState, useEffect } from 'react';
import {
  View, Text, SafeAreaView, TouchableOpacity,
  Alert, Image, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { setProfileImage, getProfileImage, initProfileImage } from '../../lib/profileImageStore';

export default function ProfileScreen({ teamName }) {
  const [userEmail, setUserEmail] = useState('');
  const [logoUri, setLogoUri] = useState(getProfileImage());

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email);
    });
    initProfileImage().then(() => {
      setLogoUri(getProfileImage());
    });
  }, []);

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to pick a logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      setLogoUri(uri);
      await setProfileImage(uri);   // saves to store + AsyncStorage
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={[globalStyles.title, { marginBottom: 24 }]}>My Profile</Text>

        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <TouchableOpacity onPress={pickLogo}>
            {logoUri ? (
              <Image
                source={{ uri: logoUri }}
                style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: colors.primary }}
              />
            ) : (
              <View style={{
                width: 120, height: 120, borderRadius: 60,
                backgroundColor: colors.background, borderWidth: 3,
                borderColor: colors.primary, justifyContent: 'center', alignItems: 'center',
              }}>
                <MaterialCommunityIcons name="shield-account" size={56} color={colors.primary} />
              </View>
            )}
            <View style={{
              position: 'absolute', bottom: 4, right: 4,
              backgroundColor: colors.primary, borderRadius: 14, padding: 4,
            }}>
              <MaterialCommunityIcons name="camera" size={16} color={colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={{ color: colors.textLight, fontSize: 12, marginTop: 10 }}>
            Tap to change logo • appears in the navbar
          </Text>
        </View>

        {/* Franchise name */}
        <View style={globalStyles.card}>
          <Text style={{ color: colors.textLight, fontSize: 12, marginBottom: 4 }}>FRANCHISE NAME</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="shield" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>
              {teamName || 'No team selected'}
            </Text>
            <MaterialCommunityIcons name="lock" size={16} color={colors.textLight} style={{ marginLeft: 8 }} />
          </View>
          <Text style={{ color: colors.textLight, fontSize: 11, marginTop: 6 }}>
            Franchise name cannot be changed
          </Text>
        </View>

        {/* Email */}
        <View style={[globalStyles.card, { marginTop: 12 }]}>
          <Text style={{ color: colors.textLight, fontSize: 12, marginBottom: 4 }}>EMAIL ADDRESS</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="email" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 15, color: colors.text }}>{userEmail}</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={[globalStyles.button, {
            marginTop: 32, backgroundColor: colors.error,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          }]}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.white} style={{ marginRight: 8 }} />
          <Text style={globalStyles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
