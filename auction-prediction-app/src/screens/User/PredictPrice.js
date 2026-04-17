import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles, colors } from '../../styles/theme';
import {
  computePerformanceScore,
  classifyCategory,
  CATEGORY_COLORS,
  CATEGORY_BASE_PRICE,
  computePredictedPrice,
} from '../../lib/playerCategory';

const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper Batsman'];

export default function UserPredictPrice() {
  const [selectedRole, setSelectedRole] = useState('');
  const [inputs, setInputs] = useState({
    matches: '', runs: '', wickets: '', economy: '',
    strikeRate: '', stumps: '', catches: '',
  });
  const [result, setResult] = useState(null);

  const set = (key, val) => setInputs(prev => ({ ...prev, [key]: val }));

  const handlePredict = () => {
    if (!selectedRole || !inputs.matches) return;
    const score    = computePerformanceScore(selectedRole, inputs);
    const category = classifyCategory(score);
    const price    = computePredictedPrice(score, category);
    setResult({ score: parseFloat(score.toFixed(2)), category, price });
  };

  const formatCurrency = (val) => '₹' + val.toLocaleString('en-IN');

  const isBatType   = ['Batsman', 'All-Rounder', 'Wicketkeeper Batsman'].includes(selectedRole);
  const showRuns       = isBatType;
  const showStrikeRate = isBatType;
  const showWickets    = ['Bowler', 'All-Rounder'].includes(selectedRole);
  const showEconomy    = ['Bowler', 'All-Rounder'].includes(selectedRole);
  const showStumps     = selectedRole === 'Wicketkeeper Batsman';
  const showCatches    = selectedRole === 'Wicketkeeper Batsman';

  const roleRows = [ROLES.slice(0, 2), ROLES.slice(2)];

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={[globalStyles.title, { marginBottom: 5 }]}>Predict Player Price</Text>
        <Text style={{ color: colors.textLight, marginBottom: 20 }}>
          Enter stats to estimate auction value
        </Text>

        <View style={globalStyles.card}>
          {/* Role selector */}
          <Text style={{ color: colors.text, fontWeight: 'bold', marginBottom: 8 }}>Select Role *</Text>
          {roleRows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              {row.map(role => (
                <TouchableOpacity
                  key={role}
                  onPress={() => { setSelectedRole(role); setResult(null); }}
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

          {showRuns && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Total Runs</Text>
            <TextInput style={globalStyles.input} placeholder="e.g. 3500" keyboardType="numeric"
              value={inputs.runs} onChangeText={v => set('runs', v)} />
          </>}

          {showStrikeRate && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Strike Rate</Text>
            <TextInput style={globalStyles.input} placeholder="e.g. 140.5" keyboardType="numeric"
              value={inputs.strikeRate} onChangeText={v => set('strikeRate', v)} />
          </>}

          {showWickets && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Wickets</Text>
            <TextInput style={globalStyles.input} placeholder="e.g. 80" keyboardType="numeric"
              value={inputs.wickets} onChangeText={v => set('wickets', v)} />
          </>}

          {showEconomy && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Economy Rate</Text>
            <TextInput style={globalStyles.input} placeholder="e.g. 7.5" keyboardType="numeric"
              value={inputs.economy} onChangeText={v => set('economy', v)} />
          </>}

          {showStumps && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Stumpings 🧤</Text>
            <TextInput style={globalStyles.input} placeholder="e.g. 45" keyboardType="numeric"
              value={inputs.stumps} onChangeText={v => set('stumps', v)} />
          </>}

          {showCatches && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Catches 🧤</Text>
            <TextInput style={globalStyles.input} placeholder="e.g. 90" keyboardType="numeric"
              value={inputs.catches} onChangeText={v => set('catches', v)} />
          </>}

          <TouchableOpacity
            style={[globalStyles.button, {
              marginTop: 8,
              opacity: (selectedRole && inputs.matches) ? 1 : 0.5,
            }]}
            onPress={handlePredict}
            disabled={!selectedRole || !inputs.matches}
          >
            <Text style={globalStyles.buttonText}>Calculate Predicted Price</Text>
          </TouchableOpacity>
        </View>

        {/* ── Result Card ── */}
        {result && (() => {
          const catColor  = CATEGORY_COLORS[result.category];
          const basePrice = CATEGORY_BASE_PRICE[result.category];
          return (
            <View style={[globalStyles.card, {
              marginTop: 20, borderWidth: 2, borderColor: catColor,
            }]}>
              {/* Category badge */}
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 80, height: 80, borderRadius: 40,
                  backgroundColor: catColor + '20',
                  justifyContent: 'center', alignItems: 'center',
                  borderWidth: 3, borderColor: catColor,
                }}>
                  <Text style={{ fontSize: 36, fontWeight: 'bold', color: catColor }}>
                    {result.category}
                  </Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: catColor, marginTop: 10 }}>
                  Category {result.category}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textLight, marginTop: 4 }}>
                  Performance Score: {result.score}
                </Text>
              </View>

              {/* Price breakdown */}
              <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: colors.textLight, fontSize: 13 }}>
                    Base Price (Category {result.category})
                  </Text>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>
                    {formatCurrency(basePrice)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textLight, fontSize: 13 }}>Predicted Auction Price</Text>
                  <Text style={{ color: catColor, fontWeight: 'bold', fontSize: 18 }}>
                    {formatCurrency(result.price)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })()}
      </ScrollView>
    </SafeAreaView>
  );
}
