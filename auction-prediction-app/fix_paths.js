const fs = require('fs');

function findFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = dir + '/' + file;
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath));
    } else if (filePath.endsWith('.js') && !filePath.includes('AppleSpinner') && !filePath.includes('fix_paths.js')) {
      results.push(filePath);
    }
  }
  return results;
}

const files = findFiles('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('import AppleSpinner from ')) {
    const depth = file.split('/').length - 3;
    let prefix = '';
    if (depth <= 0) prefix = './components/';
    else prefix = '../'.repeat(depth) + 'components/';
    
    content = content.replace(/import AppleSpinner from '.*?AppleSpinner';/, "import AppleSpinner from '" + prefix + "AppleSpinner';");

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed path in:', file, 'to', prefix);
  }
});
