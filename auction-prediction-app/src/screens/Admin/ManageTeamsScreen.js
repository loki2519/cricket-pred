import AppleSpinner from '../../components/AppleSpinner';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity,
  Alert, ScrollView, Modal, Image, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { globalStyles, colors } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ManageTeamsScreen() {
  const [teams, setTeams]           = useState([]);
  const [name, setName]             = useState('');
  const [budget, setBudget]         = useState('');
  const [loading, setLoading]       = useState(false);
  const [editModal, setEditModal]   = useState(false);
  const [editTeam, setEditTeam]     = useState(null);
  const [editName, setEditName]     = useState('');
  const [editBudget, setEditBudget] = useState('');

  useEffect(() => { fetchTeams(); }, []);

  const fetchTeams = async () => {
    // Fetch teams including logo_url so we can display the franchise logo
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, budget, logo_url')
      .order('name');
    if (!error) setTeams(data || []);
  };

  const addTeam = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Team name is required');
    setLoading(true);
    const { error } = await supabase.from('teams').insert([{
      name:   name.trim(),
      budget: parseInt(budget) || 100000000,
    }]);
    setTimeout(() => setLoading(false), 1000);
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
    setTimeout(() => setLoading(false), 1000);
    if (error) Alert.alert('Error', error.message);
    else { setEditModal(false); fetchTeams(); }
  };

  const handleDelete = (team) => {
    Alert.alert(
      'Delete Team',
      `Are you sure you want to delete "${team.name}"?\n\nThis permanently removes the team and all related data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error: pErr } = await supabase.from('purchases').delete().eq('team_id', team.id);
              if (pErr) throw pErr;
              const { error: uErr } = await supabase.from('user_teams').delete().eq('team_id', team.id);
              if (uErr) throw uErr;
              const { error } = await supabase.from('teams').delete().eq('id', team.id);
              if (error) throw error;
              fetchTeams();
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setTimeout(() => setLoading(false), 1000);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (v) => '₹' + (v || 0).toLocaleString('en-IN');

  return (
    <SafeAreaView style={globalStyles.container} edges={['right', 'bottom', 'left']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20 }}>
        <Text style={[globalStyles.title, { marginBottom: 20 }]}>Manage Teams</Text>

        {/* Add Team */}
        <View style={globalStyles.card}>
          <Text style={{ fontWeight: 'bold', color: colors.primary, marginBottom: 12, fontSize: 16 }}>
            Add New Team
          </Text>
          <Text style={{ color: colors.text, marginBottom: 4 }}>Team Name *</Text>
          <TextInput placeholderTextColor="#FFB380" style={globalStyles.input} placeholder="e.g. Mumbai Indians" value={name} onChangeText={setName} />
          <Text style={{ color: colors.text, marginBottom: 4 }}>Budget (₹)</Text>
          <TextInput placeholderTextColor="#FFB380" style={globalStyles.input} placeholder="Default: ₹10,00,00,000" keyboardType="numeric" value={budget} onChangeText={setBudget} />
          <TouchableOpacity style={globalStyles.button} onPress={addTeam} disabled={loading}>
            {loading ? <AppleSpinner color={colors.white} /> : <Text style={globalStyles.buttonText}>Add Team</Text>}
          </TouchableOpacity>
        </View>

        <Text style={{ fontWeight: 'bold', color: colors.primary, fontSize: 16, marginTop: 24, marginBottom: 12 }}>
          All Teams ({teams.length})
        </Text>

        {teams.map((item) => (
          <View key={item.id} style={[globalStyles.card, { marginBottom: 10 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Team Logo — shows uploaded image or fallback shield icon */}
              <View style={{
                width: 52, height: 52, borderRadius: 26,
                backgroundColor: colors.background,
                borderWidth: 1.5, borderColor: colors.border,
                justifyContent: 'center', alignItems: 'center',
                marginRight: 12, overflow: 'hidden',
              }}>
                {item.logo_url ? (
                  <Image
                    source={{ uri: item.logo_url }}
                    style={{ width: 52, height: 52, borderRadius: 26 }}
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialCommunityIcons name="shield" size={28} color={colors.primary} />
                )}
              </View>

              {/* Team info */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: colors.text, fontSize: 15 }} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={{ color: colors.textLight, fontSize: 13, marginTop: 2 }}>
                  Budget: {formatCurrency(item.budget)}
                </Text>
                {item.logo_url ? (
                  <Text style={{ color: colors.success, fontSize: 11, marginTop: 2 }}>✓ Logo set by manager</Text>
                ) : (
                  <Text style={{ color: colors.textLight, fontSize: 11, marginTop: 2 }}>No logo uploaded yet</Text>
                )}
              </View>

              {/* Edit / Delete buttons */}
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
            <TextInput placeholderTextColor="#FFB380" style={globalStyles.input} value={editName} onChangeText={setEditName} />
            <Text style={{ color: colors.text, marginBottom: 4 }}>Budget (₹)</Text>
            <TextInput placeholderTextColor="#FFB380" style={globalStyles.input} keyboardType="numeric" value={editBudget} onChangeText={setEditBudget} />
            <TouchableOpacity style={globalStyles.button} onPress={handleEdit} disabled={loading}>
              {loading ? <AppleSpinner color={colors.white} /> : <Text style={globalStyles.buttonText}>Save Changes</Text>}
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
