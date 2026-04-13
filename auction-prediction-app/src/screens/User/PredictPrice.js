import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { globalStyles, colors } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper Batsman'];

function computeScore(role, { matches, runs, wickets, economy, strikeRate, stumps, catches }) {
  const m   = parseFloat(matches)    || 0;
  const r   = parseFloat(runs)       || 0;
  const w   = parseFloat(wickets)    || 0;
  const eco = parseFloat(economy)    || 0;
  const sr  = parseFloat(strikeRate) || 0;
  const st  = parseFloat(stumps)     || 0;
  const ct  = parseFloat(catches)    || 0;

  if (role === 'Batsman')     return (r / 100) + (sr * 0.5) + (m * 0.5);
  if (role === 'Bowler')      return (w * 2) - (eco * 5) + (m * 0.5);
  if (role === 'All-Rounder') return (r / 150) + (w * 2) - (eco * 4) + (sr * 0.3) + (m * 0.5);
  // Wicketkeeper Batsman — given formula
  // Score_wk = 0.3×(Runs/100) + 0.25×SR + 0.15×Matches + 0.15×Catches + 0.15×Stumpings
  if (role === 'Wicketkeeper Batsman')
    return 0.3 * (r / 100) + 0.25 * sr + 0.15 * m + 0.15 * ct + 0.15 * st;
  return 0;
}

function computePrice(score) {
  const seed    = (score * 73.19) % 100;
  const randNum = seed / 100;
  const calc    = (min, max) => Math.floor(min + randNum * (max - min + 1));
  if (score > 80) return calc(30000000, 40000000);
  if (score > 40) return calc(15000000, 30000000);
  return calc(8000000, 15000000);
}

export default function UserPredictPrice() {
  const [selectedRole, setSelectedRole] = useState('');
  const [inputs, setInputs] = useState({
    matches: '', runs: '', wickets: '', economy: '',
    strikeRate: '', stumps: '', catches: '',
  });
  const [prediction, setPrediction] = useState(null);
  const [score, setScore]           = useState(null);

  const set = (key, val) => setInputs(prev => ({ ...prev, [key]: val }));

  const handlePredict = () => {
    if (!selectedRole || !inputs.matches) return;
    const s = computeScore(selectedRole, inputs);
    setPrediction(computePrice(s));
    setScore(parseFloat(s.toFixed(2)));
  };

  const formatCurrency = (val) => '₹' + val.toLocaleString('en-IN');
  const getPriceLabel  = (s) => s > 80 ? 'Premium Player' : s > 40 ? 'Mid-tier Player' : 'Budget Player';
  const getPriceColor  = (s) => s > 80 ? '#e74c3c' : s > 40 ? '#f39c12' : '#27ae60';

  const isBatType      = selectedRole === 'Batsman' || selectedRole === 'All-Rounder' || selectedRole === 'Wicketkeeper Batsman';
  const showRuns       = isBatType;
  const showStrikeRate = isBatType;
  const showWickets    = selectedRole === 'Bowler' || selectedRole === 'All-Rounder';
  const showEconomy    = selectedRole === 'Bowler' || selectedRole === 'All-Rounder';
  const showStumps     = selectedRole === 'Wicketkeeper Batsman';
  const showCatches    = selectedRole === 'Wicketkeeper Batsman';

  const roleRows = [ROLES.slice(0, 2), ROLES.slice(2)];

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={[globalStyles.title, { marginBottom: 5 }]}>Predict Player Price</Text>
        <Text style={{ color: colors.textLight, marginBottom: 20 }}>Enter stats to estimate auction value</Text>

        <View style={globalStyles.card}>
          {/* Role — 2×2 grid */}
          <Text style={{ color: colors.text, fontWeight: 'bold', marginBottom: 8 }}>Select Role *</Text>
          {roleRows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              {row.map(role => (
                <TouchableOpacity
                  key={role}
                  onPress={() => { setSelectedRole(role); setPrediction(null); setScore(null); }}
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
          <Text style={{ color: colors.text, marginBottom: 4, marginTop: 4 }}>Matches Played *</Text>
          <TextInput style={globalStyles.input} placeholder="e.g. 120" keyboardType="numeric"
            value={inputs.matches} onChangeText={v => set('matches', v)} />

          {/* Runs */}
          {showRuns && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Total Runs</Text>
            <TextInput style={globalStyles.input} placeholder="e.g. 3500" keyboardType="numeric"
              value={inputs.runs} onChangeText={v => set('runs', v)} />
          </>}

          {/* Strike Rate */}
          {showStrikeRate && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Strike Rate</Text>
            <TextInput style={globalStyles.input} placeholder="e.g. 140.5" keyboardType="numeric"
              value={inputs.strikeRate} onChangeText={v => set('strikeRate', v)} />
          </>}

          {/* Wickets */}
          {showWickets && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Wickets</Text>
            <TextInput style={globalStyles.input} placeholder="e.g. 80" keyboardType="numeric"
              value={inputs.wickets} onChangeText={v => set('wickets', v)} />
          </>}

          {/* Economy */}
          {showEconomy && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Economy Rate</Text>
            <TextInput style={globalStyles.input} placeholder="e.g. 7.5" keyboardType="numeric"
              value={inputs.economy} onChangeText={v => set('economy', v)} />
          </>}

          {/* Stumpings — WK only */}
          {showStumps && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Stumpings 🧤</Text>
            <TextInput style={globalStyles.input} placeholder="e.g. 45" keyboardType="numeric"
              value={inputs.stumps} onChangeText={v => set('stumps', v)} />
          </>}

          {/* Catches — WK only */}
          {showCatches && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Catches 🧤</Text>
            <TextInput style={globalStyles.input} placeholder="e.g. 90" keyboardType="numeric"
              value={inputs.catches} onChangeText={v => set('catches', v)} />
          </>}



          <TouchableOpacity
            style={[globalStyles.button, { marginTop: 8, opacity: (selectedRole && inputs.matches) ? 1 : 0.5 }]}
            onPress={handlePredict}
            disabled={!selectedRole || !inputs.matches}
          >
            <Text style={globalStyles.buttonText}>Calculate Predicted Price</Text>
          </TouchableOpacity>
        </View>

        {/* Result card */}
        {prediction !== null && score !== null && (
          <View style={[globalStyles.card, {
            marginTop: 20, alignItems: 'center', paddingVertical: 30,
            borderWidth: 2, borderColor: getPriceColor(score),
          }]}>
            <MaterialCommunityIcons name="trophy" size={40} color={getPriceColor(score)} />
            <Text style={{ fontSize: 14, color: colors.textLight, marginTop: 10 }}>Player Classification</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: getPriceColor(score), marginTop: 4 }}>
              {getPriceLabel(score)}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textLight, marginTop: 14 }}>Predicted Auction Price</Text>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: getPriceColor(score), marginTop: 4 }}>
              {formatCurrency(prediction)}
            </Text>
            <View style={{ marginTop: 12, backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 }}>
              <Text style={{ color: colors.textLight, fontSize: 12 }}>Performance Score: {score}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
