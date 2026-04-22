import AppleSpinner from '../../components/AppleSpinner';
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// teamId is passed from UserDrawer so each franchise sees ONLY its own data
export default function Budget({ teamId }) {
  const [budgetData, setBudgetData] = useState({ total: 0, spent: 0, remaining: 0, teamName: '' });
  const [purchases, setPurchases]   = useState([]);
  const [loading, setLoading]       = useState(true);

  useFocusEffect(
    useCallback(() => { fetchBudgetDetails(); }, [teamId])
  );

  const fetchBudgetDetails = async () => {
    setLoading(true);
    try {
      if (!teamId) {
        // No team assigned yet
        setBudgetData({ total: 0, spent: 0, remaining: 0, teamName: '—' });
        setPurchases([]);
        return;
      }

      // 1. Fetch THIS team's budget by its exact ID
      const { data: teamData, error: tError } = await supabase
        .from('teams')
        .select('name, budget')
        .eq('id', teamId)
        .single();
      if (tError) throw tError;

      const teamBudget = teamData?.budget ?? 100000000;
      const teamName   = teamData?.name ?? '';

      // 2. Fetch ONLY this team's purchases
      const { data: purchaseData, error: pError } = await supabase
        .from('purchases')
        .select('id, price, players(name, role)')
        .eq('team_id', teamId)
        .order('id', { ascending: false });
      if (pError) throw pError;

      const totalSpent = (purchaseData || []).reduce((acc, curr) => acc + (curr.price || 0), 0);

      setBudgetData({
        total:     teamBudget,
        spent:     totalSpent,
        remaining: teamBudget - totalSpent,
        teamName,
      });
      setPurchases(purchaseData || []);
    } catch (err) {
      console.log('Error fetching budget:', err.message);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const formatCurrency = (amount) => '₹' + (amount || 0).toLocaleString('en-IN');

  const pct = budgetData.total > 0
    ? Math.min(100, Math.round((budgetData.spent / budgetData.total) * 100))
    : 0;

  const renderPurchase = ({ item, index }) => {
    let p = item.players || {};
    if (Array.isArray(p)) p = p.length > 0 ? p[0] : {};
    return (
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border,
        backgroundColor: index % 2 === 0 ? colors.white : colors.background,
        paddingHorizontal: 4,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '600' }}>{p.name || 'Unknown'}</Text>
          {p.role ? (
            <Text style={{ color: colors.textLight, fontSize: 12, marginTop: 2 }}>{p.role}</Text>
          ) : null}
        </View>
        <Text style={{ color: colors.error, fontWeight: 'bold', fontSize: 14 }}>
          − {formatCurrency(item.price)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={globalStyles.container} edges={['right', 'bottom', 'left']}>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20, flex: 1 }}>
        <Text style={[globalStyles.title, { marginBottom: 4 }]}>Team Budget</Text>
        {budgetData.teamName ? (
          <Text style={{ color: colors.textLight, fontSize: 13, marginBottom: 20 }}>
            {budgetData.teamName}
          </Text>
        ) : null}

        {loading ? (
          <AppleSpinner size="large" color={colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <View style={{ flex: 1 }}>
            {/* Total budget card */}
            <View style={[globalStyles.card, { backgroundColor: colors.primary, marginBottom: 10 }]}>
              <Text style={{ color: colors.white, fontSize: 13, opacity: 0.8 }}>Total Budget</Text>
              <Text style={{ color: colors.white, fontSize: 26, fontWeight: 'bold', marginTop: 4 }}>
                {formatCurrency(budgetData.total)}
              </Text>
            </View>

            {/* Spent / Remaining */}
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <View style={[globalStyles.card, { flex: 1, marginRight: 6, marginVertical: 0 }]}>
                <Text style={{ color: colors.textLight, fontSize: 12 }}>Total Spent</Text>
                <Text style={{ color: colors.error, fontSize: 18, fontWeight: 'bold', marginTop: 4 }}>
                  {formatCurrency(budgetData.spent)}
                </Text>
              </View>
              <View style={[globalStyles.card, { flex: 1, marginLeft: 6, marginVertical: 0 }]}>
                <Text style={{ color: colors.textLight, fontSize: 12 }}>Remaining</Text>
                <Text style={{ color: colors.success, fontSize: 18, fontWeight: 'bold', marginTop: 4 }}>
                  {formatCurrency(budgetData.remaining)}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={[globalStyles.card, { marginBottom: 20, paddingVertical: 12 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: colors.textLight, fontSize: 12 }}>Budget Used</Text>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>{pct}%</Text>
              </View>
              <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4 }}>
                <View style={{
                  height: 8, borderRadius: 4,
                  width: `${pct}%`,
                  backgroundColor: pct > 80 ? colors.error : pct > 50 ? colors.warning : colors.success,
                }} />
              </View>
            </View>

            {/* Recent expenses */}
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 10 }}>
              Recent Expenses ({purchases.length})
            </Text>
            <View style={[globalStyles.card, { flex: 1, padding: 4 }]}>
              <FlatList
                data={purchases}
                keyExtractor={(item) => item.id}
                renderItem={renderPurchase}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <MaterialCommunityIcons name="wallet-outline" size={48} color={colors.border} />
                    <Text style={{ color: colors.textLight, marginTop: 12 }}>No expenses recorded yet.</Text>
                  </View>
                }
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
