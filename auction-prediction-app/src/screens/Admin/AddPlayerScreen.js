import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { colors, globalStyles } from '../../styles/theme';
import {
  getAutoCategory,
  computePerformanceScore,
  classifyCategory,
  CATEGORY_COLORS,
  CATEGORY_BASE_PRICE,
  computePredictedPrice,
} from '../../lib/playerCategory';

const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper Batsman'];

export default function AddPlayerScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '', matches: '', runs: '', wickets: '',
    economy: '', strikeRate: '', auctionPrice: '',
    stumps: '', catches: '',
  });
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading]           = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // ── Derived values (live, no button needed) ──────────────────
  const statsForCalc = {
    matches:    form.matches,
    runs:       form.runs,
    strikeRate: form.strikeRate,
    wickets:    form.wickets,
    economy:    form.economy,
    catches:    form.catches,
    stumps:     form.stumps,
  };
  // Only compute category once the user has typed at least one stat
  const hasStats = !!(form.matches || form.runs || form.wickets ||
                      form.strikeRate || form.economy || form.stumps || form.catches);
  const score        = (selectedRole && hasStats) ? computePerformanceScore(selectedRole, statsForCalc) : null;
  const autoCategory = (selectedRole && hasStats) ? classifyCategory(score) : null;
  const catColor     = autoCategory ? (CATEGORY_COLORS[autoCategory] || colors.textLight) : colors.border;
  const basePrice    = autoCategory ? (CATEGORY_BASE_PRICE[autoCategory] || 0) : 0;

  // Role-specific field visibility
  const isBatType      = ['Batsman', 'All-Rounder', 'Wicketkeeper Batsman'].includes(selectedRole);
  const showRuns        = isBatType;
  const showStrikeRate  = isBatType;
  const showWickets     = ['Bowler', 'All-Rounder'].includes(selectedRole);
  const showEconomy     = ['Bowler', 'All-Rounder'].includes(selectedRole);
  const showStumps      = selectedRole === 'Wicketkeeper Batsman';
  const showCatches     = selectedRole === 'Wicketkeeper Batsman';

  const handleAdd = async () => {
    if (!form.name.trim()) return Alert.alert('Error', 'Player name is required');
    if (!selectedRole)     return Alert.alert('Error', 'Please select a role');
    if (!hasStats)         return Alert.alert('Error', 'Please enter at least one stat (matches, runs, wickets, etc.) so the category can be calculated from the formula.');

    const finalCategory = getAutoCategory(selectedRole, statsForCalc);
    const finalScore    = computePerformanceScore(selectedRole, statsForCalc);
    const auctionPrice  = form.auctionPrice
      ? parseInt(form.auctionPrice)
      : CATEGORY_BASE_PRICE[finalCategory];

    setLoading(true);
    const payload = {
      name:        form.name.trim(),
      role:        selectedRole,
      matches:     parseInt(form.matches)      || 0,
      runs:        parseInt(form.runs)         || 0,
      wickets:     parseInt(form.wickets)      || 0,
      economy:     parseFloat(form.economy)    || 0.0,
      strike_rate: parseFloat(form.strikeRate) || 0.0,
      category:    finalCategory,
      price:       auctionPrice,
    };
    if (showStumps)  payload.stumps  = parseInt(form.stumps)  || 0;
    if (showCatches) payload.catches = parseInt(form.catches) || 0;

    const { error } = await supabase.from('players').insert([payload]);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        '✅ Player Added!',
        `Category: ${finalCategory}\nScore: ${finalScore.toFixed(1)}\nBase Price: ₹${CATEGORY_BASE_PRICE[finalCategory].toLocaleString('en-IN')}`,
      );
      navigation.goBack();
    }
  };

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

          {/* Role Grid */}
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
          <TextInput style={globalStyles.input} placeholder="e.g. 150" keyboardType="numeric"
            value={form.matches} onChangeText={v => set('matches', v)} />

          {showRuns && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Runs</Text>
            <TextInput style={globalStyles.input} placeholder="e.g. 5000" keyboardType="numeric"
              value={form.runs} onChangeText={v => set('runs', v)} />
          </>}

          {showStrikeRate && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Strike Rate</Text>
            <TextInput style={globalStyles.input} placeholder="e.g. 140.5" keyboardType="numeric"
              value={form.strikeRate} onChangeText={v => set('strikeRate', v)} />
          </>}

          {showWickets && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Wickets</Text>
            <TextInput style={globalStyles.input} placeholder="e.g. 80" keyboardType="numeric"
              value={form.wickets} onChangeText={v => set('wickets', v)} />
          </>}

          {showEconomy && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Economy Rate</Text>
            <TextInput style={globalStyles.input} placeholder="e.g. 7.5" keyboardType="numeric"
              value={form.economy} onChangeText={v => set('economy', v)} />
          </>}

          {showStumps && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Stumpings 🧤</Text>
            <TextInput style={globalStyles.input} placeholder="e.g. 45" keyboardType="numeric"
              value={form.stumps} onChangeText={v => set('stumps', v)} />
          </>}

          {showCatches && <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Catches 🧤</Text>
            <TextInput style={globalStyles.input} placeholder="e.g. 90" keyboardType="numeric"
              value={form.catches} onChangeText={v => set('catches', v)} />
          </>}

          {/* ── Category — always shown, auto-selected by formula ── */}
          <Text style={{ color: colors.text, marginBottom: 8, marginTop: 4 }}>Category (auto-calculated)</Text>

          {/* Row 1: A and B */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            {['A', 'B'].map(cat => {
              const active = autoCategory === cat;
              const col = active
                ? (cat === 'A' ? '#16A34A' : '#F97316')
                : colors.border;
              return (
                <View key={cat} style={{
                  flex: 1, paddingVertical: 14, borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: active ? col : colors.background,
                  borderWidth: 2, borderColor: col,
                }}>
                  <Text style={{
                    fontWeight: 'bold', fontSize: 16,
                    color: active ? colors.white : colors.textLight,
                  }}>
                    Category {cat}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Row 2: C centered */}
          <View style={{ alignItems: 'center', marginBottom: 4 }}>
            {(() => {
              const active = autoCategory === 'C';
              const col = active ? '#DC2626' : colors.border;
              return (
                <View style={{
                  width: '50%', paddingVertical: 14, borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: active ? col : colors.background,
                  borderWidth: 2, borderColor: col,
                }}>
                  <Text style={{
                    fontWeight: 'bold', fontSize: 16,
                    color: active ? colors.white : colors.textLight,
                  }}>
                    Category C
                  </Text>
                </View>
              );
            })()}
          </View>

          {/* Score hint below blocks */}
          <Text style={{ color: colors.textLight, fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
            {hasStats && autoCategory
              ? `Score: ${score.toFixed(1)}  •  ${autoCategory === 'A' ? 'Score ≥ 100' : autoCategory === 'B' ? 'Score 60–99' : 'Score < 60'}  •  Base ₹${(CATEGORY_BASE_PRICE[autoCategory] || 0).toLocaleString('en-IN')}`
              : 'Enter stats above — category is calculated automatically'}
          </Text>

          {/* Auction Price (optional override) */}
          <Text style={{ color: colors.text, marginBottom: 4 }}>
            Auction Price (₹) <Text style={{ color: colors.textLight, fontSize: 11 }}>(leave blank to use base price)</Text>
          </Text>
          <TextInput
            style={globalStyles.input}
            placeholder={basePrice ? `Default: ₹${basePrice.toLocaleString('en-IN')}` : 'e.g. 15000000'}
            keyboardType="numeric"
            value={form.auctionPrice}
            onChangeText={v => set('auctionPrice', v)}
          />

          <TouchableOpacity
            style={[globalStyles.button, { marginTop: 6, opacity: (form.name && selectedRole) ? 1 : 0.5 }]}
            onPress={handleAdd}
            disabled={loading || !form.name || !selectedRole}
          >
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={globalStyles.buttonText}>Save Player</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
