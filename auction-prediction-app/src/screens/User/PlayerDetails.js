import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Dynamic scoring with Strike Rate
function computePredictedPrice(player) {
  const m = parseInt(player.matches) || 0;
  const r = parseInt(player.runs) || 0;
  const w = parseInt(player.wickets) || 0;
  const eco = parseFloat(player.economy) || 0;
  const sr = parseFloat(player.strike_rate) || 0;
  const role = player.role || '';

  let score = 0;
  if (role === 'Batsman')     score = (r / 100) + (sr * 0.5) + (m * 0.5);
  else if (role === 'Bowler') score = (w * 2) - (eco * 5) + (m * 0.5);
  else                        score = (r / 150) + (w * 2) - (eco * 4) + (sr * 0.3) + (m * 0.5);

  // Deterministic calculation based on score instead of random
  const seed = (score * 73.19) % 100;
  const randNum = seed / 100;
  
  const calc = (min, max) => Math.floor(min + randNum * (max - min + 1));
  
  if (score > 80) return calc(30000000, 40000000);
  if (score > 40) return calc(15000000, 30000000);
  return calc(8000000, 15000000);
}

export default function PlayerDetails({ route, navigation }) {
  const { player, teamId } = route.params;
  const [loading, setLoading] = useState(false);

  // Compute once per screen open so same player always shows different predicted value
  const [predictedPrice] = useState(() => computePredictedPrice(player));
  const auctionPrice = player.price || predictedPrice;
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
        // Fallback: get team from user_teams table
        const { data: { user } } = await supabase.auth.getUser();
        const { data: ut } = await supabase.from('user_teams').select('team_id').eq('user_id', user.id).single();
        if (ut) {
          const { data } = await supabase.from('teams').select('*').eq('id', ut.team_id).single();
          team = data;
        }
      }

      if (!team) {
        Alert.alert('Error', 'No team found! Please select a team first.');
        return;
      }

      // 2. Check if player already bought by any team (or specifically this team)
      const { data: existing } = await supabase
        .from('purchases')
        .select('id')
        .eq('player_id', player.id);

      if (existing && existing.length > 0) {
        Alert.alert('Sold Out', `${player.name} has already been purchased.`);
        return;
      }

      // 3. Calculate remaining budget
      const { data: prevPurchases } = await supabase
        .from('purchases').select('price').eq('team_id', team.id);
      const spent = (prevPurchases || []).reduce((a, b) => a + b.price, 0);
      const remaining = team.budget - spent;

      if (remaining < auctionPrice) {
        Alert.alert(
          'Insufficient Budget',
          'Check your current bidding balance amount'
        );
        return;
      }

      // 4. Insert purchase (DB handles created_at automatically)
      const { error: insertErr } = await supabase.from('purchases').insert({
        team_id: team.id,
        player_id: player.id,
        price: auctionPrice,
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

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Back button — always goes back to View Players */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
          onPress={() => navigation.navigate('View Players')} 
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          <Text style={{ color: colors.primary, marginLeft: 6, fontWeight: 'bold', fontSize: 16 }}>
            View Players
          </Text>
        </TouchableOpacity>

        {/* Player Header Card */}
        <View style={[globalStyles.card, { alignItems: 'center', paddingVertical: 28, marginBottom: 20 }]}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
            <MaterialCommunityIcons name="account-cricket" size={48} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: colors.primary }}>{player.name}</Text>
          <Text style={{ fontSize: 15, color: colors.textLight, marginTop: 6 }}>
            {player.role || '—'} • Category {player.category || '—'}
          </Text>
        </View>

        {/* Stats */}
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 10 }}>Statistics</Text>
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          <View style={[globalStyles.card, { flex: 1, marginRight: 5, alignItems: 'center' }]}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>{player.matches || 0}</Text>
            <Text style={{ color: colors.textLight, fontSize: 12 }}>Matches</Text>
          </View>
          <View style={[globalStyles.card, { flex: 1, marginHorizontal: 5, alignItems: 'center' }]}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>{player.runs || 0}</Text>
            <Text style={{ color: colors.textLight, fontSize: 12 }}>Runs</Text>
          </View>
          <View style={[globalStyles.card, { flex: 1, marginLeft: 5, alignItems: 'center' }]}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>{player.wickets || 0}</Text>
            <Text style={{ color: colors.textLight, fontSize: 12 }}>Wickets</Text>
          </View>
        </View>

        {/* Pricing */}
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 10 }}>Pricing</Text>
        <View style={globalStyles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.textLight }}>AI Predicted Price</Text>
            <Text style={{ fontWeight: 'bold', color: '#27ae60' }}>{formatCurrency(predictedPrice)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
            <Text style={{ color: colors.textLight }}>Auction Price</Text>
            <Text style={{ fontWeight: 'bold', color: colors.primary, fontSize: 18 }}>{formatCurrency(auctionPrice)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[globalStyles.button, { marginTop: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
          onPress={handleBuyPlayer}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colors.white} />
            : <>
                <MaterialCommunityIcons name="cart-plus" size={20} color={colors.white} style={{ marginRight: 8 }} />
                <Text style={globalStyles.buttonText}>Buy Player</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
