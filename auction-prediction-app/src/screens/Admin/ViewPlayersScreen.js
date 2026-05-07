import AppleSpinner from '../../components/AppleSpinner';
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ScrollView, Platform , RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { globalStyles, colors } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORY_COLORS } from '../../lib/playerCategory';

const ROLE_COLOR = {
  'Batsman':              colors.accent,
  'Bowler':               colors.secondary,
  'All-Rounder':          colors.pitchBrown,
  'Wicketkeeper Batsman': colors.cricketGreen,
};

// Column widths — identical to User/Players.js (consistency)
const COL = {
  name:  120,
  cat:    44,
  role:   85,
  mat:    36,
  sr:     45,
  runs:   45,
  wkts:   40,
  eco:    40,
  stumps: 45,
  price:  90,
  del:    40,
};
const MIN_WIDTH = Object.values(COL).reduce((a, b) => a + b, 0);

export default function ViewPlayersScreen({ navigation }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchPlayers();
    }, [])
  );

  const fetchPlayers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name', { ascending: true });
    if (error) Alert.alert('Error', error.message);
    else setPlayers(data || []);
    setTimeout(() => setLoading(false), 500);
  };

  const executeDelete = async (id) => {
    const { error: pErr } = await supabase.from('purchases').delete().eq('player_id', id);
    if (pErr) {
      Alert.alert('Error deleting purchase record', pErr.message);
      return;
    }
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (!error) fetchPlayers();
    else Alert.alert('Error deleting player', error.message);
  };

  const handleDelete = (id, name) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove "${name}"?`)) {
        executeDelete(id);
      }
    } else {
      Alert.alert('Delete Player', `Remove "${name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => executeDelete(id),
        },
      ]);
    }
  };

  const formatPrice = (price) =>
    price ? '₹' + Number(price).toLocaleString('en-IN') : '—';

  const renderRow = ({ item, index }) => {
    const roleColor = ROLE_COLOR[item.role]      || colors.primary;
    const catColor  = CATEGORY_COLORS[item.category] || colors.textLight;
    const isEven    = index % 2 === 0;

    return (
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: isEven ? colors.white : colors.background,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        {/* Name */}
        <Text
          style={{ width: COL.name, color: colors.text, fontSize: 12, fontWeight: '600', paddingLeft: 6 }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {/* Category */}
        <View style={{ width: COL.cat, alignItems: 'center' }}>
          <View style={{
            width: 26, height: 26, borderRadius: 13,
            backgroundColor: catColor + '25',
            justifyContent: 'center', alignItems: 'center',
          }}>
            <Text style={{ color: catColor, fontSize: 11, fontWeight: 'bold' }}>
              {item.category || '?'}
            </Text>
          </View>
        </View>
        {/* Role */}
        <Text style={{ width: COL.role, color: roleColor, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
          {item.role || '—'}
        </Text>
        {/* Mat */}
        <Text style={{ width: COL.mat, textAlign: 'center', color: colors.text, fontSize: 12 }}>
          {item.matches ?? '—'}
        </Text>
        {/* SR */}
        <Text style={{ width: COL.sr, textAlign: 'center', color: colors.text, fontSize: 12 }}>
          {item.strike_rate ?? '—'}
        </Text>
        {/* Runs */}
        <Text style={{ width: COL.runs, textAlign: 'center', color: colors.text, fontSize: 12 }}>
          {item.runs ?? '—'}
        </Text>
        {/* Wkts */}
        <Text style={{ width: COL.wkts, textAlign: 'center', color: colors.text, fontSize: 12 }}>
          {item.wickets ?? '—'}
        </Text>
        {/* Eco */}
        <Text style={{ width: COL.eco, textAlign: 'center', color: colors.text, fontSize: 12 }}>
          {item.economy ?? '—'}
        </Text>
        {/* Stumps */}
        <Text style={{ width: COL.stumps, textAlign: 'center', color: colors.text, fontSize: 12 }}>
          {item.stumps ?? '—'}
        </Text>
        {/* Price */}
        <Text style={{ width: COL.price, textAlign: 'right', color: colors.secondary, fontSize: 12, fontWeight: 'bold' }}>
          {formatPrice(item.price)}
        </Text>
        {/* Delete */}
        <TouchableOpacity
          style={{ width: COL.del, alignItems: 'center', justifyContent: 'center', padding: 5 }}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          onPress={() => handleDelete(item.id, item.name)}
        >
          <MaterialCommunityIcons name="trash-can-outline" color={colors.error} size={22} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={globalStyles.container} edges={['right', 'bottom', 'left']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 4, flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={globalStyles.title}>All Players</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Add Player')}
            style={{ paddingHorizontal: 16, paddingVertical: 9, backgroundColor: colors.secondary, borderRadius: 8 }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <AppleSpinner size="large" color={colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <View style={[globalStyles.card, { flex: 1, padding: 0, overflow: 'hidden' }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
              <View style={{ minWidth: MIN_WIDTH, flex: 1 }}>

                {/* Table header */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: colors.primary,
                  paddingVertical: 10, paddingLeft: 6,
                }}>
                  <Text style={{ width: COL.name,  color: '#fff', fontSize: 11, fontWeight: 'bold' }}>Name</Text>
                  <Text style={{ width: COL.cat,   color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>Cat</Text>
                  <Text style={{ width: COL.role,  color: '#fff', fontSize: 11, fontWeight: 'bold' }}>Role</Text>
                  <Text style={{ width: COL.mat,   color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>Mat</Text>
                  <Text style={{ width: COL.sr,    color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>SR</Text>
                  <Text style={{ width: COL.runs,  color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>Runs</Text>
                  <Text style={{ width: COL.wkts,  color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>Wkts</Text>
                  <Text style={{ width: COL.eco,   color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>Eco</Text>
                  <Text style={{ width: COL.stumps,color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>Stmp</Text>
                  <Text style={{ width: COL.price, color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'right' }}>Price (₹)</Text>
                  <Text style={{ width: COL.del,   color: colors.error, fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>Del</Text>
                </View>

                {/* Rows */}
                <FlatList
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                  style={{ flex: 1 }}
                  data={players}
                  keyExtractor={item => item.id.toString()}
                  renderItem={renderRow}
                  showsVerticalScrollIndicator={true}
                  ListEmptyComponent={
                    <View style={{ alignItems: 'center', paddingVertical: 50, width: MIN_WIDTH }}>
                      <MaterialCommunityIcons name="account-off" size={48} color={colors.border} />
                      <Text style={{ color: colors.textLight, marginTop: 12 }}>No players found.</Text>
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
