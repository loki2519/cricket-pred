import AppleSpinner from '../../components/AppleSpinner';
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, Modal, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ROLE_CONFIG = {
  'Batsman':             { color: colors.accent,       icon: 'cricket',         label: 'Batsmen' },
  'Bowler':              { color: colors.secondary,    icon: 'tennis-ball',     label: 'Bowlers' },
  'All-Rounder':         { color: colors.pitchBrown,   icon: null,              label: 'All-Rounders' },
  'Wicketkeeper Batsman':{ color: colors.cricketGreen, icon: 'hand-wave',        label: 'Keepers' },
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

export default function Dashboard({ navigation, teamId, teamName }) {
  const [stats, setStats]                   = useState({ totalPlayers: 0, playersBought: 0, remainingBudget: 0 });
  const [roleCounts, setRoleCounts]         = useState({ Batsman: 0, Bowler: 0, 'All-Rounder': 0, 'Wicketkeeper Batsman': 0 });
  const [loading, setLoading]               = useState(true);
  const [showPlayersModal, setShowPlayersModal]   = useState(false);
  const [showPurchasesModal, setShowPurchasesModal] = useState(false);
  const [showRoleModal, setShowRoleModal]   = useState(false);
  const [roleModalData, setRoleModalData]   = useState({ role: '', players: [] });
  const [allPlayers, setAllPlayers]         = useState([]);
  const [purchases, setPurchases]           = useState([]);
  const [modalLoading, setModalLoading]     = useState(false);

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, [teamId]));

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { count: playerCount } = await supabase
        .from('players').select('*', { count: 'exact', head: true });

      let purchasesCount = 0, spent = 0, budget = 100000000;
      let boughtPlayers = [];

      if (teamId) {
        const { count } = await supabase
          .from('purchases').select('*', { count: 'exact', head: true }).eq('team_id', teamId);
        purchasesCount = count || 0;

        const { data: teamData } = await supabase.from('teams').select('budget').eq('id', teamId).single();
        budget = teamData?.budget ?? 100000000;

        // Fetch purchases with player role for breakdown
        const { data: purData } = await supabase
          .from('purchases')
          .select('price, players(name, role)')
          .eq('team_id', teamId);

        spent = (purData || []).reduce((a, b) => a + b.price, 0);

        // Count by role
        const counts = { Batsman: 0, Bowler: 0, 'All-Rounder': 0, 'Wicketkeeper Batsman': 0 };
        boughtPlayers = purData || [];
        boughtPlayers.forEach(pur => {
          let p = pur.players || {};
          if (Array.isArray(p)) p = p[0] || {};
          const role = p.role;
          if (role && counts[role] !== undefined) counts[role]++;
        });
        setRoleCounts(counts);
        setPurchases(boughtPlayers);
      }

      setStats({ totalPlayers: playerCount || 0, playersBought: purchasesCount, remainingBudget: budget - spent });
    } catch (err) {
      console.log('Dashboard error:', err.message);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const openPlayersModal = async () => {
    setShowPlayersModal(true);
    setModalLoading(true);
    const { data } = await supabase.from('players').select('name, role, category, price').order('name');
    setAllPlayers(data || []);
    setModalLoading(false);
  };

  const openPurchasesModal = () => setShowPurchasesModal(true);

  const openRoleModal = (role) => {
    const rolePlayers = purchases
      .map(pur => {
        let p = pur.players || {};
        if (Array.isArray(p)) p = p[0] || {};
        return p;
      })
      .filter(p => p.role === role);
    setRoleModalData({ role, players: rolePlayers });
    setShowRoleModal(true);
  };

  const formatCurrency = (amount) => '₹' + (amount || 0).toLocaleString('en-IN');

  const roleKeys = ['Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper Batsman'];

  return (
    <SafeAreaView style={globalStyles.container} edges={['right', 'bottom', 'left']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20 }}>
        <Text style={[globalStyles.title, { marginBottom: 5 }]}>Overview</Text>
        {teamName ? <Text style={{ color: colors.textLight, marginBottom: 16 }}>{teamName}</Text> : null}

        {loading ? (
          <AppleSpinner size="large" color={colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <View>
            {/* Top stats */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
              <TouchableOpacity
                style={[globalStyles.card, { flex: 1, marginRight: 10, alignItems: 'center' }]}
                onPress={openPlayersModal}
              >
                <MaterialCommunityIcons name="account-group" size={32} color={colors.primary} />
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.primary, marginTop: 8 }}>
                  {stats.totalPlayers}
                </Text>
                <Text style={{ color: colors.textLight, textAlign: 'center', fontSize: 12 }}>Total Players</Text>
                <Text style={{ color: colors.primary, fontSize: 10, marginTop: 5 }}>Tap to view</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[globalStyles.card, { flex: 1, marginLeft: 10, alignItems: 'center' }]}
                onPress={openPurchasesModal}
              >
                <MaterialCommunityIcons name="shopping" size={32} color={colors.primary} />
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.primary, marginTop: 8 }}>
                  {stats.playersBought}
                </Text>
                <Text style={{ color: colors.textLight, textAlign: 'center', fontSize: 12 }}>Players Bought</Text>
                <Text style={{ color: colors.primary, fontSize: 10, marginTop: 5 }}>Tap to view</Text>
              </TouchableOpacity>
            </View>

            {/* Budget */}
            <View style={[globalStyles.card, { alignItems: 'center', marginBottom: 20, backgroundColor: colors.budget }]}>
              <Text style={{ color: colors.white, fontSize: 16 }}>Remaining Budget</Text>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.white, marginTop: 5 }}>
                {formatCurrency(stats.remainingBudget)}
              </Text>
            </View>

            {/* ── Role Breakdown ── */}
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 12 }}>
              My Squad Breakdown
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              {roleKeys.map(role => {
                const cfg = ROLE_CONFIG[role];
                const count = roleCounts[role] || 0;
                return (
                  <TouchableOpacity
                    key={role}
                    onPress={() => openRoleModal(role)}
                    style={{
                      flex: 1,
                      marginHorizontal: 4,
                      backgroundColor: colors.white,
                      borderRadius: 8,
                      paddingVertical: 10,
                      alignItems: 'center',
                      borderTopWidth: 3,
                      borderTopColor: cfg.color,
                      elevation: 2,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                    }}
                  >
                    <RoleIcon role={role} size={22} color={cfg.color} />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: cfg.color, marginTop: 4 }}>
                      {count}
                    </Text>
                    <Text style={{ fontSize: 9, color: colors.textLight, marginTop: 2, textAlign: 'center' }} numberOfLines={1}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick action */}
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 12 }}>
              Quick Actions
            </Text>
            <TouchableOpacity
              style={[globalStyles.button, { marginBottom: 15 }]}
              onPress={() => navigation.navigate('View Players')}
            >
              <Text style={globalStyles.buttonText}>View All Players</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* All Players Modal */}
      <Modal visible={showPlayersModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary }}>All Registered Players</Text>
              <TouchableOpacity onPress={() => setShowPlayersModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {modalLoading ? <AppleSpinner color={colors.primary} /> : (
              <FlatList
                data={allPlayers}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ marginRight: 8 }}>
                      <RoleIcon role={item.role} size={16} />
                    </View>
                    <View>
                      <Text style={{ fontWeight: 'bold', color: colors.text }}>{item.name}</Text>
                      <Text style={{ color: colors.textLight, fontSize: 12 }}>{item.role} • Category {item.category}</Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={<Text style={{ textAlign: 'center', padding: 20 }}>No players registered</Text>}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Purchases Modal */}
      <Modal visible={showPurchasesModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary }}>Players Bought</Text>
              <TouchableOpacity onPress={() => setShowPurchasesModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={purchases}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => {
                let p = item.players || {};
                if (Array.isArray(p)) p = p[0] || {};
                return (
                  <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ marginRight: 8 }}>
                        <RoleIcon role={p.role} size={16} />
                      </View>
                      <View>
                        <Text style={{ fontWeight: 'bold', color: colors.text }}>{p.name || 'Unknown'}</Text>
                        <Text style={{ color: colors.textLight, fontSize: 12 }}>{p.role}</Text>
                      </View>
                    </View>
                    <Text style={{ fontWeight: 'bold', color: colors.primary }}>{formatCurrency(item.price)}</Text>
                  </View>
                );
              }}
              ListEmptyComponent={<Text style={{ textAlign: 'center', padding: 20 }}>No purchases yet</Text>}
            />
          </View>
        </View>
      </Modal>

      {/* Role Modal */}
      <Modal visible={showRoleModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ marginRight: 8 }}>
                  <RoleIcon role={roleModalData.role} size={22} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary }}>
                  {ROLE_CONFIG[roleModalData.role]?.label || roleModalData.role}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {roleModalData.players.length === 0 ? (
              <Text style={{ textAlign: 'center', color: colors.textLight, padding: 30 }}>
                No {ROLE_CONFIG[roleModalData.role]?.label || 'players'} bought yet
              </Text>
            ) : (
              <FlatList
                data={roleModalData.players}
                keyExtractor={(item, i) => i.toString()}
                renderItem={({ item }) => (
                  <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Text style={{ fontWeight: 'bold', color: colors.text }}>{item.name}</Text>
                    <Text style={{ color: colors.textLight, fontSize: 12 }}>{item.role}</Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
