import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, SafeAreaView, ScrollView,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';

const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper Batsman'];

function calculateCategory(matches, runs, strikeRate) {
  const m = parseInt(matches) || 0;
  const r = parseInt(runs) || 0;
  const sr = parseFloat(strikeRate) || 0;
  if (m >= 120) return 'A';
  if ((r >= 4000 && sr >= 135) || (r >= 1800 && sr >= 125)) return 'B';
  return 'C';
}

function computeScore(role, { matches, runs, wickets, economy, strikeRate, stumps, catches }) {
  const m   = parseFloat(matches)    || 0;
  const r   = parseFloat(runs)       || 0;
  const w   = parseFloat(wickets)    || 0;
  const eco = parseFloat(economy)    || 0;
  const sr  = parseFloat(strikeRate) || 0;
  const st  = parseFloat(stumps)     || 0;
  const ct  = parseFloat(catches)    || 0;

  if (role === 'Batsman')              return (r / 100) + (sr * 0.5) + (m * 0.5);
  if (role === 'Bowler')               return (w * 2) - (eco * 5) + (m * 0.5);
  if (role === 'All-Rounder')          return (r / 150) + (w * 2) - (eco * 4) + (sr * 0.3) + (m * 0.5);
  if (role === 'Wicketkeeper Batsman') return (r / 100) + (sr * 0.5) + (m * 0.5) + (st * 1.5) + (ct * 0.8);
  return 0;
}

function getPredictedPrice(role, inputs) {
  const score = computeScore(role, inputs);
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  if (score > 80) return rand(30000000, 40000000);
  if (score > 40) return rand(15000000, 30000000);
  return rand(8000000, 15000000);
}

export default function AddPlayerScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '', matches: '', runs: '', wickets: '',
    economy: '', strikeRate: '', auctionPrice: '',
    stumps: '', catches: '',
  });
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const isBatType = selectedRole === 'Batsman' || selectedRole === 'All-Rounder' || selectedRole === 'Wicketkeeper Batsman';
  const showRuns        = isBatType;
  const showStrikeRate  = isBatType;
  const showWickets     = selectedRole === 'Bowler' || selectedRole === 'All-Rounder';
  const showEconomy     = selectedRole === 'Bowler' || selectedRole === 'All-Rounder';
  const showStumps      = selectedRole === 'Wicketkeeper Batsman';
  const showCatches     = selectedRole === 'Wicketkeeper Batsman';

  const autoCategory = calculateCategory(form.matches, form.runs, form.strikeRate);

  const handleAdd = async () => {
    if (!form.name.trim())        return Alert.alert('Error', 'Player name is required');
    if (!selectedRole)            return Alert.alert('Error', 'Please select a role');
    if (!form.auctionPrice.trim()) return Alert.alert('Auction Price Required', 'Please enter the Auction Price in ₹');

    setLoading(true);
    const predictedPrice = getPredictedPrice(selectedRole, form);
    const auctionPrice   = parseInt(form.auctionPrice);

    const payload = {
      name:         form.name.trim(),
      role:         selectedRole,
      matches:      parseInt(form.matches)      || 0,
      runs:         parseInt(form.runs)         || 0,
      wickets:      parseInt(form.wickets)      || 0,
      economy:      parseFloat(form.economy)    || 0.0,
      strike_rate:  parseFloat(form.strikeRate) || 0.0,
      category:     autoCategory,
      price:        auctionPrice,
    };

    if (selectedRole === 'Wicketkeeper Batsman') {
      payload.stumps  = parseInt(form.stumps)  || 0;
      payload.catches = parseInt(form.catches) || 0;
    }

    const { error } = await supabase.from('players').insert([payload]);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Player Added!',
        `Category: ${autoCategory}\nAuction Price: ₹${auctionPrice.toLocaleString('en-IN')}\nPredicted Price: ₹${predictedPrice.toLocaleString('en-IN')}`,
      );
      navigation.goBack();
    }
  };

  // Role button grid (2 per row)
  const roleRows = [ROLES.slice(0, 2), ROLES.slice(2)];

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={[globalStyles.title, { marginBottom: 20 }]}>Add Player</Text>
        <View style={globalStyles.card}>

          {/* Player Name */}
          <Text style={{ color: colors.text, marginBottom: 4 }}>Player Name *</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="e.g. Virat Kohli"
            value={form.name}
            onChangeText={v => set('name', v)}
          />

          {/* Role — 2×2 grid */}
          <Text style={{ color: colors.text, marginBottom: 6 }}>Role *</Text>
          {roleRows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', marginBottom: 8, gap: 8 }}>
              {row.map(role => (
                <TouchableOpacity
                  key={role}
                  onPress={() => setSelectedRole(role)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                    backgroundColor: selectedRole === role ? colors.primary : colors.background,
                    borderWidth: 1.5, borderColor: colors.primary,
                  }}
                >
                  <Text style={{
                    color: selectedRole === role ? colors.white : colors.primary,
                    fontWeight: 'bold', fontSize: 11, textAlign: 'center',
                  }}>
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Matches */}
          <Text style={{ color: colors.text, marginBottom: 4, marginTop: 4 }}>Matches</Text>
          <TextInput
            style={globalStyles.input} placeholder="e.g. 150" keyboardType="numeric"
            value={form.matches} onChangeText={v => set('matches', v)}
          />

          {/* Runs (Batsman / All-Rounder / WK) */}
          {showRuns && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Runs</Text>
            <TextInput
              style={globalStyles.input} placeholder="e.g. 5000" keyboardType="numeric"
              value={form.runs} onChangeText={v => set('runs', v)}
            />
          </>}

          {/* Strike Rate */}
          {showStrikeRate && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Strike Rate</Text>
            <TextInput
              style={globalStyles.input} placeholder="e.g. 140.5" keyboardType="numeric"
              value={form.strikeRate} onChangeText={v => set('strikeRate', v)}
            />
          </>}

          {/* Wickets (Bowler / All-Rounder) */}
          {showWickets && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Wickets</Text>
            <TextInput
              style={globalStyles.input} placeholder="e.g. 30" keyboardType="numeric"
              value={form.wickets} onChangeText={v => set('wickets', v)}
            />
          </>}

          {/* Economy (Bowler / All-Rounder) */}
          {showEconomy && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Economy</Text>
            <TextInput
              style={globalStyles.input} placeholder="e.g. 7.8" keyboardType="numeric"
              value={form.economy} onChangeText={v => set('economy', v)}
            />
          </>}

          {/* Stumps — WK only */}
          {showStumps && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Stumpings 🧤</Text>
            <TextInput
              style={globalStyles.input} placeholder="e.g. 45" keyboardType="numeric"
              value={form.stumps} onChangeText={v => set('stumps', v)}
            />
          </>}

          {/* Catches — WK only */}
          {showCatches && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Catches 🧤</Text>
            <TextInput
              style={globalStyles.input} placeholder="e.g. 90" keyboardType="numeric"
              value={form.catches} onChangeText={v => set('catches', v)}
            />
          </>}

          {/* Category — auto */}
          <Text style={{ color: colors.text, marginBottom: 8, marginTop: 4 }}>Category (auto-calculated)</Text>
          <View style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              {['A', 'B'].map(cat => (
                <View key={cat} style={{
                  flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: 'center',
                  backgroundColor: autoCategory === cat ? colors.primary : colors.background,
                  borderWidth: 1, borderColor: colors.primary,
                }}>
                  <Text style={{ color: autoCategory === cat ? colors.white : colors.primary, fontWeight: 'bold' }}>
                    Category {cat}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={{
                width: '48%', paddingVertical: 8, borderRadius: 20, alignItems: 'center',
                backgroundColor: autoCategory === 'C' ? colors.primary : colors.background,
                borderWidth: 1, borderColor: colors.primary,
              }}>
                <Text style={{ color: autoCategory === 'C' ? colors.white : colors.primary, fontWeight: 'bold' }}>
                  Category C
                </Text>
              </View>
            </View>
          </View>
          <Text style={{ color: colors.textLight, fontSize: 12, marginBottom: 16 }}>
            {parseInt(form.matches) >= 120 ? '✅ Matches ≥ 120 → A' : autoCategory === 'B' ? '✅ Runs + SR → B' : '📌 Default → C'}
          </Text>

          {/* Auction Price */}
          <Text style={{ color: colors.text, marginBottom: 4 }}>
            Auction Price (₹) <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            style={[globalStyles.input, { borderColor: form.auctionPrice ? colors.border : colors.error }]}
            placeholder="Required — e.g. 15000000"
            keyboardType="numeric"
            value={form.auctionPrice}
            onChangeText={v => set('auctionPrice', v)}
          />
          {!form.auctionPrice && (
            <Text style={{ color: colors.error, fontSize: 12, marginBottom: 8 }}>⚠ Auction Price is required</Text>
          )}

          <TouchableOpacity
            style={[globalStyles.button, { marginTop: 10 }]}
            onPress={handleAdd}
            disabled={loading}
          >
            <Text style={globalStyles.buttonText}>{loading ? 'Saving...' : 'Save Player'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
