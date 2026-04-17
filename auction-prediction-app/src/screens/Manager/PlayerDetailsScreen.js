import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { globalStyles, colors } from '../../styles/theme';

export default function PlayerDetailsScreen({ route, navigation }) {
  const { player } = route.params;
  const [loading, setLoading] = useState(false);
  const [managerTeam, setManagerTeam] = useState(null);

  useEffect(() => {
    // In a real app we would link user -> team mapping.
    // For now let's just fetch the first team to simulate.
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    const { data } = await supabase.from('teams').select('*').limit(1).single();
    setManagerTeam(data);
  };

  const buyPlayer = async () => {
    if (!managerTeam) return;
    setLoading(true);
    
    // Simulate prediction as "price" if exact price isn't set, or use fixed
    const price = Math.floor(Math.random() * 20000) + 10000;

    // Calculate spent
    const { data: prevPurchases } = await supabase.from('purchases').select('price').eq('team_id', managerTeam.id);
    const spent = (prevPurchases || []).reduce((a, b) => a + b.price, 0);
    const remaining = managerTeam.budget - spent;

    if (remaining < price) {
      Alert.alert('Insufficient Budget', 'Check your current bidding balance amount');
      setLoading(false);
      return;
    }

    // Insert purchase
    const { error } = await supabase.from('purchases').insert([{
      team_id: managerTeam.id,
      player_id: player.id,
      price: price
    }]);

    if(error){
      Alert.alert('Error', error.message);
      setLoading(false);
      return;
    }

    
    setLoading(false);
    Alert.alert('Success', `Bought ${player.name} for $${price}`);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={{ padding: 20 }}>
        <Text style={globalStyles.title}>{player.name}</Text>
        <View style={globalStyles.card}>
          <Text style={{ fontSize: 16, marginBottom: 5 }}>Role: {player.role}</Text>
          <Text style={{ fontSize: 16, marginBottom: 5 }}>Matches: {player.matches}</Text>
          <Text style={{ fontSize: 16, marginBottom: 5 }}>Runs: {player.runs}</Text>
          <Text style={{ fontSize: 16, marginBottom: 5 }}>Wickets: {player.wickets}</Text>
          <Text style={{ fontSize: 16, marginBottom: 5 }}>Economy: {player.economy}</Text>
          <Text style={{ fontSize: 16, marginBottom: 15 }}>Category: {player.category}</Text>
          
          <TouchableOpacity style={globalStyles.button} onPress={buyPlayer} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={globalStyles.buttonText}>Buy Player (Predicted Price)</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
