import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({ totalPlayers: 0, totalTeams: 0, avgAuctionPrice: 0 });
  const [loading, setLoading] = useState(true);

  // Re-fetch whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 1. Total Players
      const { count: playerCount } = await supabase
        .from('players').select('*', { count: 'exact', head: true });

      // 2. Total Teams
      const { count: teamCount } = await supabase
        .from('teams').select('*', { count: 'exact', head: true });

      // 3. Average Auction Price from purchases
      const { data: purchasesData } = await supabase
        .from('purchases').select('price');

      let avgPrice = 0;
      if (purchasesData && purchasesData.length > 0) {
        const total = purchasesData.reduce((acc, row) => acc + (row.price || 0), 0);
        avgPrice = Math.round(total / purchasesData.length);
      }

      setStats({
        totalPlayers: playerCount || 0,
        totalTeams: teamCount || 0,
        avgAuctionPrice: avgPrice,
      });
    } catch (err) {
      console.log('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => '₹' + amount.toLocaleString('en-IN');

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={[globalStyles.title, { marginBottom: 5 }]}>Admin Dashboard</Text>
        <Text style={{ color: colors.textLight, marginBottom: 25 }}>Real-time statistics</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Stats Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <StatCard
                icon="account-group"
                title="Total Players"
                value={stats.totalPlayers.toString()}
              />
              <StatCard
                icon="shield-account"
                title="Total Teams"
                value={stats.totalTeams.toString()}
              />
            </View>

            <View style={[globalStyles.card, { backgroundColor: colors.primary, alignItems: 'center', paddingVertical: 24, marginBottom: 30 }]}>
              <MaterialCommunityIcons name="currency-inr" size={32} color={colors.white} />
              <Text style={{ color: colors.white, fontSize: 14, marginTop: 8 }}>Avg Auction Price</Text>
              <Text style={{ color: colors.white, fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>
                {stats.avgAuctionPrice === 0 ? '₹0' : formatCurrency(stats.avgAuctionPrice)}
              </Text>
            </View>

            {/* Quick Navigation Cards */}
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: 15 }}>Quick Actions</Text>
            <View style={{ flexDirection: 'column' }}>
              <DashboardCard icon="account-plus" title="Add Player" onPress={() => navigation.navigate('Add Player')} />
              <DashboardCard icon="eye" title="Manage Players" onPress={() => navigation.navigate('View Players')} />
              <DashboardCard icon="shield-plus" title="Manage Teams" onPress={() => navigation.navigate('Manage Teams')} />
              <DashboardCard icon="chart-line" title="Predict Price" onPress={() => navigation.navigate('Predict Price')} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <View style={[globalStyles.card, { flex: 1, marginHorizontal: 5, alignItems: 'center', paddingVertical: 20 }]}>
      <MaterialCommunityIcons name={icon} size={32} color={colors.primary} />
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.primary, marginTop: 8 }}>{value}</Text>
      <Text style={{ color: colors.textLight, textAlign: 'center', marginTop: 4, fontSize: 12 }}>{title}</Text>
    </View>
  );
}

function DashboardCard({ title, onPress, icon }) {
  return (
    <TouchableOpacity
      style={[globalStyles.card, { flexDirection: 'row', alignItems: 'center', height: 70, marginBottom: 12 }]}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={26} color={colors.primary} style={{ marginRight: 15 }} />
      <Text style={{ fontWeight: 'bold', fontSize: 16, color: colors.primary, flex: 1 }}>{title}</Text>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textLight} />
    </TouchableOpacity>
  );
}
