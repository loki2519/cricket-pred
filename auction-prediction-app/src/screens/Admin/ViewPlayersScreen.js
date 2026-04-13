import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { globalStyles, colors } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ROLE_CONFIG = {
  'Batsman':             { color: '#FFD700', icon: 'cricket' },          // yellow
  'Bowler':              { color: '#3498db', icon: 'tennis-ball' },
  'All-Rounder':         { color: '#9b59b6', icon: null },
  'Wicketkeeper Batsman':{ color: '#27ae60', icon: 'account-multiple' },
};

function RoleIcon({ role, size = 22 }) {
  const cfg = ROLE_CONFIG[role] || { color: colors.primary, icon: 'account' };
  if (role === 'All-Rounder') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MaterialCommunityIcons name="cricket"     size={size * 0.75} color={cfg.color} />
        <MaterialCommunityIcons name="tennis-ball" size={size * 0.75} color={cfg.color} />
      </View>
    );
  }
  return <MaterialCommunityIcons name={cfg.icon} size={size} color={cfg.color} />;
}

export default function ViewPlayersScreen({ navigation }) {
  const [players, setPlayers] = useState([]);

  useEffect(() => { fetchPlayers(); }, []);

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from('players').select('*').order('name', { ascending: true });
    if (error) Alert.alert('Error', error.message);
    else setPlayers(data || []);
  };

  const handleDelete = async (id) => {
    Alert.alert('Delete Player', 'Are you sure you want to remove this player?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('players').delete().eq('id', id);
          if (!error) fetchPlayers();
        },
      },
    ]);
  };

  const formatPrice = (price) =>
    price ? '₹' + Number(price).toLocaleString('en-IN') : '—';

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={{ padding: 20, flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={globalStyles.title}>All Players</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Add Player')}
            style={{ paddingHorizontal: 16, paddingVertical: 9, backgroundColor: colors.primary, borderRadius: 8 }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={players}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: colors.textLight, marginTop: 50 }}>
              No players found.
            </Text>
          }
          renderItem={({ item }) => {
            const cfg = ROLE_CONFIG[item.role] || { color: colors.primary };
            return (
              <View style={[globalStyles.card, { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }]}>
                {/* Role avatar */}
                <View style={{
                  width: 46, height: 46, borderRadius: 23,
                  backgroundColor: cfg.color + '25',
                  justifyContent: 'center', alignItems: 'center', marginRight: 12,
                }}>
                  <RoleIcon role={item.role} size={24} />
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', color: colors.text, fontSize: 15 }}>{item.name}</Text>
                  {/* Role text in yellow for batsman, role-color for others */}
                  <Text style={{ color: cfg.color, fontSize: 12, fontWeight: '600', marginTop: 1 }}>{item.role}</Text>
                  <Text style={{ color: colors.textLight, fontSize: 12, marginTop: 2 }}>
                    {formatPrice(item.price)}  •  Category {item.category || '—'}
                  </Text>
                </View>

                {/* Delete */}
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 8 }}>
                  <MaterialCommunityIcons name="trash-can-outline" color={colors.error} size={22} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}
