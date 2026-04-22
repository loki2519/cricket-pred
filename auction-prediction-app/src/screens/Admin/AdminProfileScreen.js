import AppleSpinner from '../../components/AppleSpinner';
import React, { useState, useEffect } from 'react';
import { View, Text, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';

export default function AdminProfileScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch live config from the db
    supabase.from('admin_config').select('admin_email, admin_password').eq('id', 1).single()
      .then(({ data, error }) => {
        if (data) {
          setEmail(data.admin_email);
          setPassword(data.admin_password);
        } else {
          // Fallback
          setEmail('lokimaddi19@gmail.com');
          setPassword('123456');
        }
        setTimeout(() => setLoading(false), 1000);
      });
  }, []);

  return (
    <SafeAreaView style={globalStyles.container} edges={['right', 'bottom', 'left']}>
      <View style={{ padding: 20, flex: 1, alignItems: 'center' }}>
        
        {/* Profile Avatar */}
        <View style={{ 
          width: 100, height: 100, borderRadius: 50, 
          backgroundColor: colors.white,
          borderWidth: 3, borderColor: colors.primary,
          justifyContent: 'center', alignItems: 'center',
          marginTop: 20, marginBottom: 20,
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 4
        }}>
          <MaterialCommunityIcons name="shield-account" size={54} color={colors.primary} />
        </View>

        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 5 }}>
          Admin Account
        </Text>
        <Text style={{ fontSize: 14, color: colors.textLight, marginBottom: 30 }}>
          Super Administrator
        </Text>

        <View style={[{ width: '100%', padding: 20 }, globalStyles.card]}>
          {loading ? (
            <AppleSpinner color={colors.primary} size="large" />
          ) : (
            <>
              {/* Email View */}
              <Text style={{ color: colors.textLight, fontSize: 13, marginBottom: 5 }}>Registered Email</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: '#F5F7FA', padding: 15, borderRadius: 10,
                marginBottom: 20
              }}>
                <MaterialCommunityIcons name="email" size={24} color={colors.primary} style={{ marginRight: 15 }} />
                <Text style={{ flex: 1, fontSize: 16, color: colors.text, fontWeight: '500' }}>{email}</Text>
              </View>

              {/* Password View */}
              <Text style={{ color: colors.textLight, fontSize: 13, marginBottom: 5 }}>Current Password</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: '#F5F7FA', padding: 15, borderRadius: 10,
                marginBottom: 10
              }}>
                <MaterialCommunityIcons name="lock-open-outline" size={24} color={colors.primary} style={{ marginRight: 15 }} />
                <Text style={{ flex: 1, fontSize: 16, color: colors.text, fontWeight: '500', letterSpacing: 1 }}>
                  {password}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <MaterialCommunityIcons name="pencil-circle-outline" size={20} color={colors.primary} style={{ marginRight: 5 }} />
                <Text style={{ fontSize: 13, color: colors.textLight, flex: 1, lineHeight: 18 }}>
                  You can securely change these credentials anytime from the Settings page.
                </Text>
              </View>
            </>
          )}
        </View>

      </View>
    </SafeAreaView>
  );
}
