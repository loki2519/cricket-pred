import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, ActivityIndicator, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Budget({ navigation }) {
  const [budgetData, setBudgetData] = useState({ total: 0, spent: 0, remaining: 0 });
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchBudgetDetails();
    }, [])
  );

  const fetchBudgetDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch team
      const { data: teamsData, error: tError } = await supabase.from('teams').select('*').limit(1);
      if (tError) throw tError;
      
      const teamBudget = (teamsData && teamsData.length > 0) ? teamsData[0].budget : 100000000;
      const teamId = (teamsData && teamsData.length > 0) ? teamsData[0].id : null;
      // 2. Fetch purchases for spending calculation
      let query = supabase
        .from('purchases')
        .select(`price, players(name)`);
      if (teamId) {
        query = query.eq('team_id', teamId);
      }
      const { data: purchaseData, error: pError } = await query;
        
      if (pError) throw pError;
      
      const totalSpent = purchaseData ? purchaseData.reduce((acc, curr) => acc + curr.price, 0) : 0;
      
      setBudgetData({
        total: teamBudget,
        spent: totalSpent,
        remaining: teamBudget - totalSpent
      });

      setPurchases(purchaseData || []);

    } catch (err) {
      console.log('Error fetching budget:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => '₹' + amount.toLocaleString('en-IN');

  const renderPurchase = ({ item, index }) => {
    let p = item.players || {};
    if (Array.isArray(p)) p = p.length > 0 ? p[0] : {};
    
    return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ color: colors.text }}>{p.name || 'Unknown'}</Text>
      <Text style={{ color: colors.error, fontWeight: 'bold' }}>- {formatCurrency(item.price)}</Text>
    </View>
    );
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={{ padding: 20, flex: 1 }}>
        <Text style={[globalStyles.title, { marginBottom: 20 }]}>Team Budget</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <View style={{ flex: 1 }}>
            
            <View style={[globalStyles.card, { backgroundColor: colors.primary, marginBottom: 10 }]}>
               <Text style={{ color: colors.white, fontSize: 16 }}>Total Budget</Text>
               <Text style={{ color: colors.white, fontSize: 24, fontWeight: 'bold', marginTop: 5 }}>{formatCurrency(budgetData.total)}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 }}>
               <View style={[globalStyles.card, { flex: 1, marginRight: 5 }]}>
                 <Text style={{ color: colors.textLight, fontSize: 14 }}>Total Spent</Text>
                 <Text style={{ color: colors.error, fontSize: 18, fontWeight: 'bold', marginTop: 5 }}>{formatCurrency(budgetData.spent)}</Text>
               </View>
               <View style={[globalStyles.card, { flex: 1, marginLeft: 5 }]}>
                 <Text style={{ color: colors.textLight, fontSize: 14 }}>Remaining</Text>
                 <Text style={{ color: '#2ecc71', fontSize: 18, fontWeight: 'bold', marginTop: 5 }}>{formatCurrency(budgetData.remaining)}</Text>
               </View>
            </View>

            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: 15 }}>Recent Expenses</Text>
            
            <View style={[globalStyles.card, { flex: 1 }]}>
               <FlatList
                 data={purchases}
                 keyExtractor={(item, index) => index.toString()}
                 renderItem={renderPurchase}
                 showsVerticalScrollIndicator={false}
                 ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.textLight, marginTop: 20 }}>No expenses recorded.</Text>}
               />
            </View>
            
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
