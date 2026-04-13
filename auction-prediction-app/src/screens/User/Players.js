import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ROLE_CONFIG = {
  'Batsman':             { color: colors.accent,       icon: 'cricket' },
  'Bowler':              { color: colors.secondary,    icon: 'tennis-ball' },
  'All-Rounder':         { color: colors.pitchBrown,   icon: null },
  'Wicketkeeper Batsman':{ color: colors.cricketGreen, icon: 'baseball-glove' },
};

function RoleIcon({ role, size = 22, color }) {
  const cfg = ROLE_CONFIG[role] || { color: colors.primary, icon: 'account' };
  const c = color || cfg.color;
  if (role === 'All-Rounder') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MaterialCommunityIcons name="cricket"     size={size * 0.75} color={c} />
        <MaterialCommunityIcons name="tennis-ball" size={size * 0.75} color={c} />
      </View>
    );
  }
  return <MaterialCommunityIcons name={cfg.icon} size={size} color={c} />;
}

export default function Players({ navigation, teamId }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remainingBudget, setRemainingBudget] = useState(null);

  useEffect(() => {
    fetchPlayers();
    fetchRemainingBudget();
  }, []);

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
        .from('players').select('*').order('name', { ascending: true });
      if (error) throw error;
      setPlayers(data || []);
    } catch (err) {
      console.log('Error fetching players:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const isBlacklisted = (player) =>
    remainingBudget !== null && player.price && player.price > remainingBudget;

  const renderPlayer = ({ item }) => {
    const blacklisted = isBlacklisted(item);
    const cfg = ROLE_CONFIG[item.role] || { color: colors.primary };

    return (
      <TouchableOpacity
        style={[globalStyles.card, { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }]}
        onPress={() => !blacklisted && navigation.navigate('PlayerDetails', { player: item, teamId })}
        activeOpacity={blacklisted ? 1 : 0.7}
      >
        {/* Icon circle */}
        <View style={{
          width: 46, height: 46, borderRadius: 23,
          backgroundColor: blacklisted ? '#e0e0e0' : cfg.color + '25',
          justifyContent: 'center', alignItems: 'center',
          marginRight: 12, flexShrink: 0,
        }}>
          {blacklisted
            ? <MaterialCommunityIcons name="lock" size={22} color="#aaa" />
            : <RoleIcon role={item.role} size={24} />
          }
        </View>

        {/* Text block — fixed width so text doesn't overflow */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{ fontSize: 15, fontWeight: 'bold', color: blacklisted ? '#aaa' : colors.text, flexShrink: 1 }}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {blacklisted && (
              <MaterialCommunityIcons name="lock" size={13} color="#aaa" style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={{ color: blacklisted ? '#bbb' : cfg.color, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
            {item.role || 'Player'}  •  {item.category || 'Uncapped'}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 3 }}>
            <Text style={{ fontSize: 11, color: blacklisted ? '#bbb' : colors.textLight, marginRight: 10 }}>
              Runs: {item.runs || 0}
            </Text>
            <Text style={{ fontSize: 11, color: blacklisted ? '#bbb' : colors.textLight, marginRight: 10 }}>
              Wkts: {item.wickets || 0}
            </Text>
            {item.price ? (
              <Text style={{ fontSize: 11, color: blacklisted ? '#bbb' : colors.textLight, fontWeight: '600' }}>
                ₹{Number(item.price).toLocaleString('en-IN')}
              </Text>
            ) : null}
          </View>
        </View>

        {!blacklisted && (
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textLight} flexShrink={0} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={{ padding: 20, flex: 1 }}>
        <Text style={[globalStyles.title, { marginBottom: 4 }]}>Available Players</Text>
        {remainingBudget !== null && (
          <Text style={{ color: colors.textLight, fontSize: 12, marginBottom: 14 }}>
            Remaining Budget:{' '}
            <Text style={{ color: colors.budget, fontWeight: 'bold' }}>
              ₹{remainingBudget.toLocaleString('en-IN')}
            </Text>
            {'  '}
            <Text style={{ color: '#aaa' }}>🔒 = unaffordable</Text>
          </Text>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <FlatList
            data={players}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderPlayer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: colors.textLight, marginTop: 50 }}>
                No players found.
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
