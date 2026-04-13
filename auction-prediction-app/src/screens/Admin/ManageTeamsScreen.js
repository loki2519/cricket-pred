import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TextInput, TouchableOpacity, Alert, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { globalStyles, colors } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ManageTeamsScreen() {
  const [teams, setTeams] = useState([]);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [editName, setEditName] = useState('');
  const [editBudget, setEditBudget] = useState('');

  useEffect(() => { fetchTeams(); }, []);

  const fetchTeams = async () => {
    const { data, error } = await supabase.from('teams').select('*').order('name');
    if (!error) setTeams(data || []);
  };

  const addTeam = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Team name is required');
    setLoading(true);
    const { error } = await supabase.from('teams').insert([{
      name: name.trim(),
      budget: parseInt(budget) || 100000000
    }]);
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else {
      Alert.alert('Success', `Team "${name}" added!`);
      setName(''); setBudget('');
      fetchTeams();
    }
  };

  const openEdit = (team) => {
    setEditTeam(team);
    setEditName(team.name);
    setEditBudget(team.budget?.toString() || '');
    setEditModal(true);
  };

  const handleEdit = async () => {
    if (!editName.trim()) return Alert.alert('Error', 'Team name is required');
    setLoading(true);
    const { error } = await supabase.from('teams')
      .update({ name: editName.trim(), budget: parseInt(editBudget) || 100000000 })
      .eq('id', editTeam.id);
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else {
      setEditModal(false);
      fetchTeams();
    }
  };

  const handleDelete = (team) => {
    Alert.alert(
      'Delete Team',
      `Are you sure you want to delete "${team.name}"?\n\nThis will permanently remove the team. (Purchases and assignments will be handled by DB cascade).`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Step 1: Delete from purchases for this team
              const { error: pErr } = await supabase.from('purchases').delete().eq('team_id', team.id);
              if (pErr) throw pErr;

              // Step 2: Delete from user_teams for this team
              const { error: uErr } = await supabase.from('user_teams').delete().eq('team_id', team.id);
              if (uErr) throw uErr;

              // Step 3: Delete the team itself
              const { error } = await supabase.from('teams').delete().eq('id', team.id);
              if (error) throw error;

              fetchTeams();
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const formatCurrency = (v) => '₹' + (v || 0).toLocaleString('en-IN');

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={[globalStyles.title, { marginBottom: 20 }]}>Manage Teams</Text>

        {/* Add Team */}
        <View style={globalStyles.card}>
          <Text style={{ fontWeight: 'bold', color: colors.primary, marginBottom: 12, fontSize: 16 }}>Add New Team</Text>
          <Text style={{ color: colors.text, marginBottom: 4 }}>Team Name *</Text>
          <TextInput style={globalStyles.input} placeholder="e.g. Mumbai Indians" value={name} onChangeText={setName} />
          <Text style={{ color: colors.text, marginBottom: 4 }}>Budget (₹)</Text>
          <TextInput style={globalStyles.input} placeholder="Default: ₹10,00,00,000" keyboardType="numeric" value={budget} onChangeText={setBudget} />
          <TouchableOpacity style={globalStyles.button} onPress={addTeam} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={globalStyles.buttonText}>Add Team</Text>}
          </TouchableOpacity>
        </View>

        <Text style={{ fontWeight: 'bold', color: colors.primary, fontSize: 16, marginTop: 24, marginBottom: 12 }}>
          All Teams ({teams.length})
        </Text>

        {teams.map((item) => (
          <View key={item.id} style={[globalStyles.card, { marginBottom: 10 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <MaterialCommunityIcons name="shield" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: colors.text, fontSize: 15 }} numberOfLines={1}>{item.name}</Text>
                <Text style={{ color: colors.textLight, fontSize: 13, marginTop: 2 }}>Budget: {formatCurrency(item.budget)}</Text>
              </View>
              <TouchableOpacity onPress={() => openEdit(item)} style={{ padding: 8, marginRight: 4 }}>
                <MaterialCommunityIcons name="pencil" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} style={{ padding: 8 }}>
                <MaterialCommunityIcons name="delete" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: 16 }}>Edit Team</Text>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Team Name</Text>
            <TextInput style={globalStyles.input} value={editName} onChangeText={setEditName} />
            <Text style={{ color: colors.text, marginBottom: 4 }}>Budget (₹)</Text>
            <TextInput style={globalStyles.input} keyboardType="numeric" value={editBudget} onChangeText={setBudget} />
            <TouchableOpacity style={globalStyles.button} onPress={handleEdit} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.white} /> : <Text style={globalStyles.buttonText}>Save Changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditModal(false)} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: colors.textLight }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
