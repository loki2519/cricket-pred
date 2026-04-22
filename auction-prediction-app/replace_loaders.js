const fs = require('fs');

function findFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = dir + '/' + file;
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath));
    } else if (filePath.endsWith('.js') && !filePath.includes('AppleSpinner') && !filePath.includes('replace_loaders.js')) {
      results.push(filePath);
    }
  }
  return results;
}

const files = findFiles('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('ActivityIndicator')) {
    
    // Attempt to extract ActivityIndicator safely
    content = content.replace(/import\s+{([^}]*?)ActivityIndicator([^}]*?)}\s+from\s+['"]react-native['"];/g, (match, p1, p2) => {
      let rest = (p1 + p2).replace(/,\s*,/g, ',').replace(/^,\s*|\s*,$/g, '').trim();
      if (rest.length > 0) {
        return "import { " + rest + " } from 'react-native';";
      }
      return "";
    });

    const depth = file.split('/').length - 2;
    let prefix = '';
    if (depth <= 0) prefix = './components/';
    else prefix = '../'.repeat(depth) + 'components/';

    content = "import AppleSpinner from '" + prefix + "AppleSpinner';\n" + content;

    content = content.replace(/<ActivityIndicator/g, '<AppleSpinner');
    content = content.replace(/<\/ActivityIndicator>/g, '</AppleSpinner>');

    fs.writeFileSync(file, content, 'utf8');
    console.log('Modified:', file);
  }
});
