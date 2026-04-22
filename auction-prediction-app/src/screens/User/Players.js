import AppleSpinner from '../../components/AppleSpinner';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORY_COLORS } from '../../lib/playerCategory';

// ── Column widths (must sum ≤ total minWidth below) ──────────
const COL = {
  name:  140,
  cat:    44,
  role:  100,
  mat:    38,
  sr:     50,
  runs:   50,
  wkts:   44,
  stumps: 50,
  price:  95,
  arrow:  32,
};
const MIN_WIDTH = Object.values(COL).reduce((a, b) => a + b, 0); // ~643

const ROLE_COLOR = {
  'Batsman':              colors.accent,
  'Bowler':               colors.secondary,
  'All-Rounder':          colors.pitchBrown,
  'Wicketkeeper Batsman': colors.cricketGreen,
};

export default function Players({ navigation, teamId }) {
  const [players, setPlayers]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [remainingBudget, setRemainingBudget] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchPlayers();
      if (teamId) fetchRemainingBudget();
    }, [teamId])
  );

  const fetchRemainingBudget = async () => {
    try {
      const { data: teamData } = await supabase
        .from('teams').select('budget').eq('id', teamId).single();
      const totalBudget = teamData?.budget ?? 100000000;
      const { data: purchases } = await supabase
        .from('purchases').select('price').eq('team_id', teamId);
      const spent = (purchases || []).reduce((acc, p) => acc + (p.price || 0), 0);
      setRemainingBudget(totalBudget - spent);
    } catch (err) {
      console.log('Budget error:', err.message);
    }
  };

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setPlayers(data || []);
    } catch (err) {
      console.log('Players fetch error:', err.message);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const isBlacklisted = (player) =>
    remainingBudget !== null && player.price && player.price > remainingBudget;

  const formatCurrency = (price) =>
    price ? '₹' + Number(price).toLocaleString('en-IN') : '—';

  // ── Table row ─────────────────────────────────────────────
  const renderRow = ({ item, index }) => {
    const blacklisted = isBlacklisted(item);
    const roleColor   = blacklisted ? '#aaa' : (ROLE_COLOR[item.role] || colors.primary);
    const catColor    = blacklisted ? '#aaa' : (CATEGORY_COLORS[item.category] || colors.textLight);
    const isEven      = index % 2 === 0;

    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row', alignItems: 'center',
          paddingVertical: 10,
          backgroundColor: isEven ? colors.white : colors.background,
          borderBottomWidth: 1, borderBottomColor: colors.border,
          opacity: blacklisted ? 0.5 : 1,
        }}
        onPress={() => !blacklisted && navigation.navigate('PlayerDetails', { player: item, teamId })}
        activeOpacity={blacklisted ? 1 : 0.7}
      >
        {/* Name */}
        <View style={{ width: COL.name, flexDirection: 'row', alignItems: 'center', paddingLeft: 6 }}>
          {blacklisted && <MaterialCommunityIcons name="lock" size={11} color="#aaa" style={{ marginRight: 3 }} />}
          <Text style={{ flex: 1, color:blacklisted?'#aaa':colors.text, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
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
        {/* Stumps */}
        <Text style={{ width: COL.stumps, textAlign: 'center', color: colors.text, fontSize: 12 }}>
          {item.stumps ?? '—'}
        </Text>
        {/* Price */}
        <Text style={{ width: COL.price, textAlign: 'right', color: colors.secondary, fontSize: 12, fontWeight: 'bold' }}>
          {formatCurrency(item.price)}
        </Text>
        {/* Arrow */}
        {!blacklisted && (
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textLight} style={{ width: COL.arrow, textAlign: 'center' }} />
        )}
        {blacklisted && <View style={{ width: COL.arrow }} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={globalStyles.container} edges={['right', 'bottom', 'left']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 4, flex: 1 }}>
        {/* Header */}
        <Text style={[globalStyles.title, { marginBottom: 4 }]}>Available Players</Text>
        {remainingBudget !== null && (
          <Text style={{ color: colors.textLight, fontSize: 12, marginBottom: 12 }}>
            Budget Remaining:{' '}
            <Text style={{ color: colors.budget, fontWeight: 'bold' }}>
              ₹{remainingBudget.toLocaleString('en-IN')}
            </Text>
            {'   '}
            <Text style={{ color: '#aaa' }}>🔒 = unaffordable</Text>
          </Text>
        )}

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
                  <Text style={{ width: COL.stumps,color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>Stmp</Text>
                  <Text style={{ width: COL.price, color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'right' }}>Price (₹)</Text>
                  <View style={{ width: COL.arrow }} />
                </View>

                {/* Rows */}
                <FlatList
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
