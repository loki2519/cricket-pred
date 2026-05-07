const fs = require('fs');
const path = require('path');

function addRefreshControl(filePath, isFlatList = false) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add RefreshControl to imports
  if (!content.includes('RefreshControl')) {
    content = content.replace(/import \{([^}]+)\} from 'react-native';/, "import {$1, RefreshControl } from 'react-native';");
  }

  // 2. Add refreshing state and onRefresh
  if (!content.includes('const [refreshing,')) {
    const fetchFunc = filePath.includes('ManageTeams') ? 'fetchTeams' : 'fetchPlayers';
    const refreshLogic = `
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await ${fetchFunc}();
    setRefreshing(false);
  }, []);
`;
    content = content.replace(/const \[loading, setLoading\]\s*=\s*useState\(false\);/, `const [loading, setLoading] = useState(false);\n${refreshLogic}`);
  }

  // 3. Add refreshControl to ScrollView or FlatList
  if (isFlatList) {
    if (!content.includes('refreshControl={')) {
      content = content.replace(
        /<FlatList/,
        `<FlatList\n                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}`
      );
    }
  } else {
    if (!content.includes('refreshControl={')) {
      content = content.replace(
        /<ScrollView([^>]*)>/,
        `<ScrollView$1 refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>`
      );
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${path.basename(filePath)}`);
}

addRefreshControl('src/screens/Admin/ViewPlayersScreen.js', true);
addRefreshControl('src/screens/User/Players.js', true);
addRefreshControl('src/screens/Admin/ManageTeamsScreen.js', false);
