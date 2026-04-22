import AppleSpinner from '../../components/AppleSpinner';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SelectTeamScreen({ navigation }) {
  const [teams, setTeams] = useState([]);
  const [takenTeamIds, setTakenTeamIds] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      // All teams
      const { data: allTeams, error: tErr } = await supabase.from('teams').select('*');
      if (tErr) throw tErr;

      // Teams already picked by other users (stored in user_teams table)
      const { data: userTeams, error: utErr } = await supabase.from('user_teams').select('team_id');
      if (utErr && utErr.code !== '42P01') throw utErr; // ignore "table does not exist" error

      const taken = userTeams ? userTeams.map(ut => ut.team_id) : [];
      setTakenTeamIds(taken);
      setTeams(allTeams || []);
    } catch (err) {
      console.log('Error fetching teams:', err.message);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const handleConfirm = async () => {
    if (!selectedTeam) return Alert.alert('Error', 'Please select a team first');
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Check if team was just taken by another user
      const { data: existing } = await supabase
        .from('user_teams').select('*').eq('team_id', selectedTeam.id);

      if (existing && existing.length > 0) {
        Alert.alert('Team Taken', 'This team has already been selected by another user. Please choose another team.');
        setSaving(false);
        return;
      }

      // Save the user → team mapping
      const { error } = await supabase.from('user_teams').insert({
        user_id: user.id,
        team_id: selectedTeam.id,
      });

      if (error) throw error;

      // Navigate to main drawer, passing selected team
      navigation.replace('MainDrawer', { teamId: selectedTeam.id, teamName: selectedTeam.name });
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[globalStyles.container, { backgroundColor: colors.primary }]}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.white, textAlign: 'center', marginBottom: 8 }}>AuctionOracle</Text>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 30 }}>
          Select your team to continue
        </Text>

        <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 16 }}>Available Teams</Text>

          {loading ? (
            <AppleSpinner size="large" color={colors.primary} style={{ marginVertical: 30 }} />
          ) : teams.length === 0 ? (
            <Text style={{ textAlign: 'center', color: colors.textLight, marginVertical: 30 }}>
              No teams available. Ask your admin to create teams first.
            </Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {teams.map(team => {
                const isTaken = takenTeamIds.includes(team.id);
                const isSelected = selectedTeam?.id === team.id;
                return (
                  <TouchableOpacity
                    key={team.id}
                    disabled={isTaken}
                    onPress={() => setSelectedTeam(team)}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      padding: 14, borderRadius: 12, marginBottom: 10,
                      borderWidth: 2,
                      borderColor: isSelected ? colors.primary : (isTaken ? '#ddd' : '#eee'),
                      backgroundColor: isSelected ? '#FFF5EB' : (isTaken ? '#f9f9f9' : colors.white),
                    }}
                  >
                    <MaterialCommunityIcons
                      name="shield"
                      size={28}
                      color={isTaken ? '#ccc' : colors.primary}
                      style={{ marginRight: 14 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: isTaken ? '#aaa' : colors.text }}>{team.name}</Text>
                      <Text style={{ color: colors.textLight, fontSize: 13, marginTop: 2 }}>
                        Budget: ₹{(team.budget || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    {isTaken && <Text style={{ color: colors.error, fontSize: 12, fontWeight: 'bold' }}>Taken</Text>}
                    {isSelected && !isTaken && <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[globalStyles.button, { marginTop: 16, opacity: selectedTeam ? 1 : 0.5 }]}
            onPress={handleConfirm}
            disabled={!selectedTeam || saving}
          >
            {saving ? <AppleSpinner color={colors.white} /> : <Text style={globalStyles.buttonText}>Confirm Team</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => { await supabase.auth.signOut(); }}
            style={{ marginTop: 14, alignItems: 'center' }}
          >
            <Text style={{ color: colors.error, fontWeight: 'bold' }}>← Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
