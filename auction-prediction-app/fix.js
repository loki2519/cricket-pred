const fs = require('fs');

let text = fs.readFileSync('src/screens/Admin/ManageTeamsScreen.js', 'utf8');

text = text.replace(
  "Alert, ScrollView, Modal, Image, } from 'react-native';",
  "Alert, ScrollView, Modal, Image, Platform } from 'react-native';"
);

const handleDeleteRegex = /const handleDelete = \(team\) => \{[\s\S]*?\}\n    \);\n  \};/;

const newDeleteFn = `const executeDelete = async (team) => {
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
  };

  const handleDelete = (team) => {
    if (Platform.OS === 'web') {
      if (window.confirm(\`Are you sure you want to delete "\${team.name}"?\\n\\nThis permanently removes the team manager and all related data.\`)) {
        executeDelete(team);
      }
    } else {
      Alert.alert(
        'Delete Team',
        \`Are you sure you want to delete "\${team.name}"?\\n\\nThis permanently removes the team manager and all related data.\`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete', style: 'destructive',
            onPress: () => executeDelete(team),
          },
        ]
      );
    }
  };`;

text = text.replace(handleDeleteRegex, newDeleteFn);

fs.writeFileSync('src/screens/Admin/ManageTeamsScreen.js', text, 'utf8');
console.log('Fixed successfully');
