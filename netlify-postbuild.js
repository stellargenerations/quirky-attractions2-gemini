// netlify-postbuild.js
const fs = require('fs');
const path = require('path');

// Ensure _redirects file is in the output directory
if (fs.existsSync('_redirects')) {
  console.log('Copying _redirects to _site directory...');
  fs.copyFileSync('_redirects', path.join('_site', '_redirects'));
}

// Create a netlify.toml in the output directory
console.log('Creating netlify.toml in _site directory...');
const netlifyTomlContent = `
# This file is auto-generated during build
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;

fs.writeFileSync(path.join('_site', 'netlify.toml'), netlifyTomlContent);

console.log('Post-build tasks completed successfully.');
