import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  computePerformanceScore,
  classifyCategory,
  CATEGORY_COLORS,
  CATEGORY_BASE_PRICE,
  computePredictedPrice,
} from '../../lib/playerCategory';

export default function PlayerDetails({ route, navigation }) {
  const { player, teamId } = route.params;
  const [loading, setLoading] = useState(false);

  // ── Re-compute category + price from live formulas ───────────
  const stats = {
    matches:    player.matches,
    runs:       player.runs,
    strikeRate: player.strike_rate,
    wickets:    player.wickets,
    economy:    player.economy,
    catches:    player.catches,
    stumps:     player.stumps,
  };
  const score     = computePerformanceScore(player.role, stats);
  const category  = player.category || classifyCategory(score);
  const catColor  = CATEGORY_COLORS[category]    || colors.textLight;
  const basePrice = CATEGORY_BASE_PRICE[category] || 0;
  const predicted = computePredictedPrice(score, category);
  const auctionPrice = player.price || predicted;

  const formatCurrency = (amount) => '₹' + (amount || 0).toLocaleString('en-IN');

  const handleBuyPlayer = async () => {
    setLoading(true);
    try {
      // 1. Get the user's team
      let team = null;
      if (teamId) {
        const { data, error } = await supabase.from('teams').select('*').eq('id', teamId).single();
        if (error) throw error;
        team = data;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: ut } = await supabase.from('user_teams').select('team_id').eq('user_id', user.id).single();
        if (ut) {
          const { data } = await supabase.from('teams').select('*').eq('id', ut.team_id).single();
          team = data;
        }
      }

      if (!team) { Alert.alert('Error', 'No team found! Please select a team first.'); return; }

      // 2. Check if player already purchased (by any team)
      const { data: existing } = await supabase
        .from('purchases').select('id').eq('player_id', player.id);
      if (existing && existing.length > 0) {
        Alert.alert('Already Sold', `${player.name} has already been purchased.`);
        return;
      }

      // 3. Check budget
      const { data: prevPurchases } = await supabase
        .from('purchases').select('price').eq('team_id', team.id);
      const spent = (prevPurchases || []).reduce((a, b) => a + b.price, 0);
      const remaining = team.budget - spent;

      if (remaining < auctionPrice) {
        Alert.alert('Insufficient Budget', 'You do not have enough budget to buy this player.');
        return;
      }

      // 4. Insert purchase
      const { error: insertErr } = await supabase.from('purchases').insert({
        team_id:   team.id,
        player_id: player.id,
        price:     auctionPrice,
      });
      if (insertErr) throw insertErr;

      Alert.alert(
        '✅ Purchase Successful!',
        `${player.name} bought for ${formatCurrency(auctionPrice)}\nRemaining Budget: ${formatCurrency(remaining - auctionPrice)}`,
        [{ text: 'OK', onPress: () => navigation.navigate('View Players') }]
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Stats grid — show only relevant fields
  const isWK       = player.role === 'Wicketkeeper Batsman';
  const isBowler   = player.role === 'Bowler' || player.role === 'All-Rounder';
  const isBatsman  = player.role !== 'Bowler';

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Back button */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
          onPress={() => navigation.navigate('View Players')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          <Text style={{ color: colors.primary, marginLeft: 6, fontWeight: 'bold', fontSize: 16 }}>
            View Players
          </Text>
        </TouchableOpacity>

        {/* Player Header */}
        <View style={[globalStyles.card, { alignItems: 'center', paddingVertical: 28, marginBottom: 16 }]}>
          {/* Category badge */}
          <View style={{
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: catColor + '20',
            borderWidth: 3, borderColor: catColor,
            justifyContent: 'center', alignItems: 'center',
            marginBottom: 12,
          }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: catColor }}>{category}</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.primary, textAlign: 'center' }}>
            {player.name}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textLight, marginTop: 6 }}>
            {player.role || '—'}
          </Text>
          {/* Category label */}
          <View style={{
            marginTop: 10, borderRadius: 20,
            paddingHorizontal: 18, paddingVertical: 6,
            backgroundColor: catColor,
          }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
              Category {category}
            </Text>
          </View>
          <Text style={{ color: colors.textLight, fontSize: 11, marginTop: 8 }}>
            Performance Score: {score.toFixed(1)}
          </Text>
        </View>

        {/* Stats Cards */}
        <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.primary, marginBottom: 10 }}>
          Statistics
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4, marginHorizontal: -4 }}>
          {[
            { label: 'Matches', value: player.matches ?? '—' },
            isBatsman && { label: 'Runs', value: player.runs ?? '—' },
            isBatsman && { label: 'Strike Rate', value: player.strike_rate ?? '—' },
            isBowler  && { label: 'Wickets', value: player.wickets ?? '—' },
            isBowler  && { label: 'Economy', value: player.economy ?? '—' },
            isWK      && { label: 'Stumpings', value: player.stumps ?? '—' },
            isWK      && { label: 'Catches', value: player.catches ?? '—' },
          ].filter(Boolean).map((stat, idx) => (
            <View key={idx} style={[globalStyles.card, {
              width: '30%', marginHorizontal: '1.5%', alignItems: 'center',
              paddingVertical: 12, marginVertical: 4,
            }]}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>
                {stat.value}
              </Text>
              <Text style={{ color: colors.textLight, fontSize: 11, textAlign: 'center', marginTop: 2 }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.primary, marginBottom: 10, marginTop: 8 }}>
          Pricing
        </Text>
        <View style={[globalStyles.card, { padding: 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.textLight }}>Category Base Price</Text>
            <Text style={{ fontWeight: '600', color: catColor }}>{formatCurrency(basePrice)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.textLight }}>Predicted Auction Price</Text>
            <Text style={{ fontWeight: '600', color: colors.success }}>{formatCurrency(predicted)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>Auction Price</Text>
            <Text style={{ fontWeight: 'bold', color: colors.primary, fontSize: 18 }}>{formatCurrency(auctionPrice)}</Text>
          </View>
        </View>

        {/* Buy Button */}
        <TouchableOpacity
          style={[globalStyles.button, {
            marginTop: 24,
            flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
            backgroundColor: catColor,
          }]}
          onPress={handleBuyPlayer}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colors.white} />
            : <>
                <MaterialCommunityIcons name="cart-plus" size={20} color={colors.white} style={{ marginRight: 8 }} />
                <Text style={globalStyles.buttonText}>Buy Player</Text>
              </>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
