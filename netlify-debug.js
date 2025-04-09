// netlify-debug.js
console.log('=== NETLIFY DEBUG INFO ===');
console.log('Node version:', process.version);
console.log('Environment variables:', Object.keys(process.env).filter(key => !key.includes('SECRET')));
console.log('Current directory:', process.cwd());
console.log('Files in current directory:');

const fs = require('fs');
const path = require('path');

// List files in the current directory
try {
  const files = fs.readdirSync('.');
  files.forEach(file => {
    const stats = fs.statSync(file);
    console.log(`- ${file} (${stats.isDirectory() ? 'directory' : 'file'})`);
  });
} catch (error) {
  console.error('Error listing files:', error);
}

// Check if _site directory exists and list its contents
if (fs.existsSync('_site')) {
  console.log('\nFiles in _site directory:');
  try {
    const siteFiles = fs.readdirSync('_site');
    siteFiles.forEach(file => {
      const stats = fs.statSync(path.join('_site', file));
      console.log(`- ${file} (${stats.isDirectory() ? 'directory' : 'file'})`);
    });
  } catch (error) {
    console.error('Error listing _site files:', error);
  }
}

// Check if specific attraction directories exist
const attractionsToCheck = [
  'antones-nightclub',
  'red-rocks-amphitheatre',
  'neon-museum',
  'longwood-gardens',
  'knoebels-amusement-resort'
];

console.log('\nChecking for specific attraction directories:');
attractionsToCheck.forEach(attraction => {
  const attractionPath = path.join('_site', attraction);
  if (fs.existsSync(attractionPath)) {
    console.log(`- ${attraction}: EXISTS`);
    if (fs.existsSync(path.join(attractionPath, 'index.html'))) {
      console.log(`  - index.html: EXISTS`);
    } else {
      console.log(`  - index.html: MISSING`);
    }
  } else {
    console.log(`- ${attraction}: MISSING`);
  }
});

console.log('=== END DEBUG INFO ===');
