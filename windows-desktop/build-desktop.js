const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('--- STARTING DESKTOP BUILD PROCESS ---');

const expoAppDir = path.join(__dirname, '..', 'auction-prediction-app');
const desktopAppDir = path.join(__dirname, 'app');

// 1. Build the Expo Web Export
console.log('\n[1/5] Building Expo Web project...');
try {
  execSync('npx expo export -p web', { cwd: expoAppDir, stdio: 'inherit' });
} catch (e) {
  console.error('Failed to export Expo project:', e.message);
  process.exit(1);
}

// 2. Clear old desktop app files and copy new ones
console.log('\n[2/5] Copying web build to Electron folder...');
if (fs.existsSync(desktopAppDir)) {
  fs.rmSync(desktopAppDir, { recursive: true, force: true });
}
const sourceDist = path.join(expoAppDir, 'dist');
// Copy recursive function since fs.cpSync is available in modern Node
fs.cpSync(sourceDist, desktopAppDir, { recursive: true });

// 3. Fix the font loading bug (Rename node_modules to npm_modules)
console.log('\n[3/5] Applying font packaging fix...');
const targetNodeModules = path.join(desktopAppDir, 'assets', 'node_modules');
const targetNpmModules = path.join(desktopAppDir, 'assets', 'npm_modules');

if (fs.existsSync(targetNodeModules)) {
  fs.renameSync(targetNodeModules, targetNpmModules);
  console.log(' -> Renamed assets/node_modules to assets/npm_modules');
}

// 4. Rewrite JS bundle paths to match the renamed folder
console.log('\n[4/5] Rewriting JS bundle paths...');
const jsDir = path.join(desktopAppDir, '_expo', 'static', 'js', 'web');
if (fs.existsSync(jsDir)) {
  const files = fs.readdirSync(jsDir);
  for (const file of files) {
    if (file.endsWith('.js')) {
      const filePath = path.join(jsDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('/node_modules/')) {
        content = content.replace(/\/node_modules\//g, '/npm_modules/');
        fs.writeFileSync(filePath, content);
        console.log(` -> Updated paths in ${file}`);
      }
    }
  }
}

// 5. Build the Electron executable (Unpacked directory only to avoid NSIS errors)
console.log('\n[5/5] Compiling standalone executable...');
try {
  // Using --dir prevents the NSIS installer step which causes the symlink/privilege crash on Windows
  execSync('npx electron-builder --win --dir', { cwd: __dirname, stdio: 'inherit' });
  console.log('\n✅ BUILD SUCCESSFUL!');
  console.log('Your standalone app folder is located at:');
  console.log(path.join(__dirname, 'dist', 'win-unpacked'));
} catch (e) {
  console.error('Failed to compile Electron app:', e.message);
  process.exit(1);
}
