import React, { useState } from 'react';
import {
  View, Text, SafeAreaView, TouchableOpacity,
  TextInput, ScrollView,
} from 'react-native';
import { globalStyles, colors } from '../../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper Batsman'];

function computeScore(role, { runs, wickets, economy, strikeRate, stumps, catches, batAverage, bowlAverage }) {
  const r   = parseFloat(runs)       || 0;
  const w   = parseFloat(wickets)    || 0;
  const eco = parseFloat(economy)    || 0;
  const sr  = parseFloat(strikeRate) || 0;
  const st  = parseFloat(stumps)     || 0;
  const ct  = parseFloat(catches)    || 0;
  const batAvg = parseFloat(batAverage) || 0;
  const bowlAvg = parseFloat(bowlAverage) || 0;

  const getBattingScore = () => (r * 0.4) + (sr * 0.3) + (batAvg * 0.3);
  const getBowlingScore = () => (w * 0.5) + ((eco > 0 ? (1 / eco) : 0) * 30) + (bowlAvg * 0.2);
  const getKeepingScore = () => (st * 1.5) + (ct * 0.8);

  if (role === 'Batsman')              return getBattingScore();
  if (role === 'Bowler')               return getBowlingScore();
  if (role === 'All-Rounder')          return (getBattingScore() * 0.5) + (getBowlingScore() * 0.5);
  if (role === 'Wicketkeeper Batsman') return (getBattingScore() * 0.6) + (getKeepingScore() * 0.4);
  return 0;
}

function computePrice(score) {
  const seed   = (score * 73.19) % 100;
  const randNum = seed / 100;
  const calc   = (min, max) => Math.floor(min + randNum * (max - min + 1));
  if (score > 80) return calc(30000000, 40000000);
  if (score > 40) return calc(15000000, 30000000);
  return calc(8000000, 15000000);
}

export default function PredictPriceScreen() {
  const [selectedRole, setSelectedRole] = useState('');
  const [inputs, setInputs] = useState({
    matches: '', runs: '', wickets: '', economy: '',
    strikeRate: '', stumps: '', catches: '',
    batAverage: '', bowlAverage: ''
  });
  const [prediction, setPrediction] = useState(null);
  const [score, setScore] = useState(null);

  const set = (key, val) => setInputs(prev => ({ ...prev, [key]: val }));

  const handlePredict = () => {
    if (!selectedRole || !inputs.matches) return;
    const s = computeScore(selectedRole, inputs);
    setPrediction(computePrice(s));
    setScore(parseFloat(s.toFixed(2)));
  };

  const formatCurrency  = (val) => '₹' + val.toLocaleString('en-IN');
  const getPriceLabel   = (s) => s > 80 ? 'Premium Player' : s > 40 ? 'Mid-tier Player' : 'Budget Player';
  const getPriceColor   = (s) => s > 80 ? '#e74c3c' : s > 40 ? '#f39c12' : '#27ae60';

  const isBatType    = selectedRole === 'Batsman' || selectedRole === 'All-Rounder' || selectedRole === 'Wicketkeeper Batsman';
  const showRuns        = isBatType;
  const showStrikeRate  = isBatType;
  const showBatAvg      = isBatType;
  const showWickets     = selectedRole === 'Bowler' || selectedRole === 'All-Rounder';
  const showEconomy     = selectedRole === 'Bowler' || selectedRole === 'All-Rounder';
  const showBowlAvg     = selectedRole === 'Bowler' || selectedRole === 'All-Rounder';
  const showStumps      = selectedRole === 'Wicketkeeper Batsman';
  const showCatches     = selectedRole === 'Wicketkeeper Batsman';

  // 2×2 grid
  const roleRows = [ROLES.slice(0, 2), ROLES.slice(2)];

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={[globalStyles.title, { marginBottom: 5 }]}>Predict Player Price</Text>
        <Text style={{ color: colors.textLight, marginBottom: 20 }}>Enter stats to estimate auction value</Text>

        <View style={globalStyles.card}>
          {/* Role Selector — 2×2 */}
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

          {/* Matches — always shown */}
          <Text style={{ color: colors.text, marginBottom: 4, marginTop: 4 }}>Matches Played *</Text>
          <TextInput
            style={globalStyles.input} placeholder="e.g. 120" keyboardType="numeric"
            value={inputs.matches} onChangeText={v => set('matches', v)}
          />

          {/* Runs */}
          {showRuns && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Total Runs</Text>
            <TextInput
              style={globalStyles.input} placeholder="e.g. 3500" keyboardType="numeric"
              value={inputs.runs} onChangeText={v => set('runs', v)}
            />
          </>}

          {/* Strike Rate */}
          {showStrikeRate && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Strike Rate</Text>
            <TextInput
              style={globalStyles.input} placeholder="e.g. 140.5" keyboardType="numeric"
              value={inputs.strikeRate} onChangeText={v => set('strikeRate', v)}
            />
          </>}

          {/* Batting Average */}
          {showBatAvg && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Batting Average</Text>
            <TextInput
              style={globalStyles.input} placeholder="e.g. 35.5" keyboardType="numeric"
              value={inputs.batAverage} onChangeText={v => set('batAverage', v)}
            />
          </>}

          {/* Wickets */}
          {showWickets && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Wickets</Text>
            <TextInput
              style={globalStyles.input} placeholder="e.g. 80" keyboardType="numeric"
              value={inputs.wickets} onChangeText={v => set('wickets', v)}
            />
          </>}

          {/* Economy */}
          {showEconomy && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Economy Rate</Text>
            <TextInput
              style={globalStyles.input} placeholder="e.g. 7.5" keyboardType="numeric"
              value={inputs.economy} onChangeText={v => set('economy', v)}
            />
          </>}

          {/* Bowling Average */}
          {showBowlAvg && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Bowling Average</Text>
            <TextInput
              style={globalStyles.input} placeholder="e.g. 24.5" keyboardType="numeric"
              value={inputs.bowlAverage} onChangeText={v => set('bowlAverage', v)}
            />
          </>}

          {/* Stumpings — WK only */}
          {showStumps && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Stumpings 🧤</Text>
            <TextInput
              style={globalStyles.input} placeholder="e.g. 45" keyboardType="numeric"
              value={inputs.stumps} onChangeText={v => set('stumps', v)}
            />
          </>}

          {/* Catches — WK only */}
          {showCatches && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Catches 🧤</Text>
            <TextInput
              style={globalStyles.input} placeholder="e.g. 90" keyboardType="numeric"
              value={inputs.catches} onChangeText={v => set('catches', v)}
            />
          </>}

          <TouchableOpacity
            style={[globalStyles.button, { marginTop: 8, opacity: (selectedRole && inputs.matches) ? 1 : 0.5 }]}
            onPress={handlePredict}
            disabled={!selectedRole || !inputs.matches}
          >
            <Text style={globalStyles.buttonText}>Calculate Predicted Price</Text>
          </TouchableOpacity>
        </View>

        {/* Result Card */}
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
            <View style={{
              marginTop: 12, backgroundColor: colors.background,
              borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8,
            }}>
              <Text style={{ color: colors.textLight, fontSize: 12 }}>Performance Score: {score}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
