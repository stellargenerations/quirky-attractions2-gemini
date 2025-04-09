// check-env.js
console.log('=== ENVIRONMENT VARIABLES CHECK ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NETLIFY:', process.env.NETLIFY);
console.log('GOOGLE_SHEET_PUBLISH_URL exists:', !!process.env.GOOGLE_SHEET_PUBLISH_URL);
console.log('=== END ENVIRONMENT CHECK ===');
