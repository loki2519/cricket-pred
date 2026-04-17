import React, { useState, useCallback } from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { globalStyles, colors } from '../../styles/theme';

export default function BudgetScreen() {
  const [team, setTeam] = useState(null);
  const [purchases, setPurchases] = useState([]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    // Similarly, we fetch the first team for demonstration logic
    const { data: teamData } = await supabase.from('teams').select('*').limit(1).single();
    if (teamData) {
      setTeam(teamData);
      const { data: purchaseData } = await supabase
        .from('purchases')
        .select(`id, price, players(name)`)
        .eq('team_id', teamData.id);
      setPurchases(purchaseData || []);
    }
  };

  const spent = purchases.reduce((acc, curr) => acc + curr.price, 0);

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={{ padding: 20, flex: 1 }}>
        <Text style={globalStyles.title}>Budget Overview</Text>
        {team && (
          <View style={globalStyles.card}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>Team: {team.name}</Text>
            <Text style={{ fontSize: 16, color: colors.success }}>Remaining Budget: ${team.budget - spent}</Text>
            <Text style={{ fontSize: 16, color: colors.error }}>Total Spent: ${spent}</Text>
          </View>
        )}

        <Text style={[globalStyles.title, { marginTop: 20, fontSize: 20 }]}>Purchased Players</Text>
        <FlatList
          data={purchases}
          keyExtractor={item => item.id}
          renderItem={({item}) => {
            let p = item.players || {};
            if (Array.isArray(p)) p = p.length > 0 ? p[0] : {};
            return (
            <View style={[globalStyles.card, { flexDirection: 'row', justifyContent: 'space-between' }]}>
              <Text style={{ fontWeight: 'bold' }}>{p.name || 'Unknown'}</Text>
              <Text style={{ color: colors.textLight }}>${item.price}</Text>
            </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}
