import AppleSpinner from '../../components/AppleSpinner';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, Alert, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ROLE_CONFIG = {
  'Batsman':             { color: '#FFD700', icon: 'cricket' },
  'Bowler':              { color: '#3498db', icon: 'tennis-ball' },
  'All-Rounder':         { color: '#9b59b6', icon: null },
  'Wicketkeeper Batsman':{ color: '#27ae60', icon: 'hand-wave' },
};

function SmallRoleIcon({ role }) {
  const cfg = ROLE_CONFIG[role] || { color: colors.primary, icon: 'account' };
  if (role === 'All-Rounder') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 4, marginTop: 1 }}>
        <MaterialCommunityIcons name="cricket" size={10} color={cfg.color} />
        <MaterialCommunityIcons name="tennis-ball" size={10} color={cfg.color} />
      </View>
    );
  }
  return (
    <MaterialCommunityIcons
      name={cfg.icon} size={14} color={cfg.color}
      style={{ marginRight: 4, marginTop: 1 }}
    />
  );
}

export default function Purchases({ teamId }) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => { fetchPurchases(); }, [teamId])
  );

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('purchases')
        .select('id, price, players(name, role, matches, strike_rate, runs, wickets)')
        .order('id', { ascending: false });
      if (teamId) query = query.eq('team_id', teamId);
      const { data, error } = await query;
      if (error) throw error;
      setPurchases(data || []);
    } catch (err) {
      console.log('Error fetching purchases:', err.message);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const formatCurrency = (amount) => '₹' + (amount || 0).toLocaleString('en-IN');

  const handleDelete = (item) => {
    let p = item.players || {};
    if (Array.isArray(p)) p = p.length > 0 ? p[0] : {};
    Alert.alert(
      'Confirm Release',
      `Release ${p.name || 'this player'}?\n\nThis restores ${formatCurrency(item.price)} to your budget.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release', style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const { error } = await supabase.from('purchases').delete().eq('id', item.id);
            if (error) { setTimeout(() => setLoading(false), 1000); Alert.alert('Error', error.message); }
            else { Alert.alert('Released', `${p.name || 'Player'} removed.`); fetchPurchases(); }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    let p = item.players || {};
    if (Array.isArray(p)) p = p.length > 0 ? p[0] : {};

    return (
      <View style={{
        flexDirection: 'row', borderBottomWidth: 1,
        borderBottomColor: colors.border, paddingVertical: 12, alignItems: 'center',
      }}>
        {/* Name + small icon */}
        <View style={{ width: 150, flexDirection: 'row', alignItems: 'center' }}>
          <SmallRoleIcon role={p.role} />
          <Text style={{ flex: 1, color: colors.text, fontSize: 13, fontWeight: '500' }} numberOfLines={1}>
            {p.name || '-'}
          </Text>
        </View>
        <Text style={{ width: 100, color: colors.textLight, fontSize: 12 }} numberOfLines={1}>{p.role || '-'}</Text>
        <Text style={{ width: 45, color: colors.text, fontSize: 12, textAlign: 'center' }}>{p.matches ?? '-'}</Text>
        <Text style={{ width: 50, color: colors.text, fontSize: 12, textAlign: 'center' }}>{p.strike_rate ?? '-'}</Text>
        <Text style={{ width: 50, color: colors.text, fontSize: 12, textAlign: 'center' }}>{p.runs ?? '-'}</Text>
        <Text style={{ width: 45, color: colors.text, fontSize: 12, textAlign: 'center' }}>{p.wickets ?? '-'}</Text>
        <Text style={{ width: 100, color: colors.primary, fontSize: 13, textAlign: 'right', fontWeight: 'bold' }}>
          {formatCurrency(item.price)}
        </Text>
        <TouchableOpacity style={{ width: 40, alignItems: 'center' }} onPress={() => handleDelete(item)}>
          <MaterialCommunityIcons name="delete-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={globalStyles.container} edges={['right', 'bottom', 'left']}>
      <View style={{ paddingHorizontal: 15, paddingTop: 4, paddingBottom: 15, flex: 1 }}>
        <Text style={[globalStyles.title, { marginBottom: 5 }]}>Purchase History</Text>
        <Text style={{ color: colors.textLight, marginBottom: 15 }}>
          {purchases.length} player{purchases.length !== 1 ? 's' : ''} bought
        </Text>

        {loading ? (
          <AppleSpinner size="large" color={colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <View style={[globalStyles.card, { flex: 1, padding: 10, elevation: 3 }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
              <View style={{ minWidth: 680, flex: 1 }}>
                {/* Header */}
                <View style={{
                  flexDirection: 'row', borderBottomWidth: 2,
                  borderBottomColor: colors.primary, paddingBottom: 10, marginBottom: 5,
                }}>
                  <Text style={{ width: 150, fontWeight: 'bold', color: colors.primary, fontSize: 12 }}>Name</Text>
                  <Text style={{ width: 100, fontWeight: 'bold', color: colors.primary, fontSize: 12 }}>Role</Text>
                  <Text style={{ width: 45, fontWeight: 'bold', color: colors.primary, fontSize: 12, textAlign: 'center' }}>Mat</Text>
                  <Text style={{ width: 50, fontWeight: 'bold', color: colors.primary, fontSize: 12, textAlign: 'center' }}>SR</Text>
                  <Text style={{ width: 50, fontWeight: 'bold', color: colors.primary, fontSize: 12, textAlign: 'center' }}>Runs</Text>
                  <Text style={{ width: 45, fontWeight: 'bold', color: colors.primary, fontSize: 12, textAlign: 'center' }}>Wkts</Text>
                  <Text style={{ width: 100, fontWeight: 'bold', color: colors.primary, fontSize: 12, textAlign: 'right' }}>Price (₹)</Text>
                  <Text style={{ width: 40, fontWeight: 'bold', color: colors.error, fontSize: 12, textAlign: 'center' }}>Del</Text>
                </View>

                <FlatList
                  style={{ flex: 1 }}
                  data={purchases}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderItem}
                  showsVerticalScrollIndicator={true}
                  ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 60, width: 660 }}>
                      <MaterialCommunityIcons name="cart-off" size={64} color={colors.border} />
                      <Text style={{ color: colors.textLight, marginTop: 16, fontSize: 16 }}>No purchases yet.</Text>
                      <Text style={{ color: colors.textLight, fontSize: 13, marginTop: 4 }}>Go to View Players and buy a player!</Text>
                    </View>
                  }
                />
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
