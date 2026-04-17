import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { globalStyles, colors } from '../../styles/theme';

export default function ManagerDashboardScreen({ navigation }) {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    const { data, error } = await supabase.from('players').select('*');
    if (!error) setPlayers(data);
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={{ padding: 20, flex: 1 }}>
        <Text style={globalStyles.title}>Available Players</Text>
        <FlatList
          data={players}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <TouchableOpacity 
              style={globalStyles.card} 
              onPress={() => navigation.navigate('Player Details', { player: item })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
                  <Text style={globalStyles.subtitle}>{item.role}</Text>
                </View>
                <Text style={{ color: colors.blue }}>View Details</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
