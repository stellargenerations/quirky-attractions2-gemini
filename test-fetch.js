// test-fetch.js
const fetch = require('node-fetch');

async function testFetch() {
  console.log('=== TESTING GOOGLE SHEET FETCH ===');
  
  const url = process.env.GOOGLE_SHEET_PUBLISH_URL || 
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQcrExOdmNWQbpkckNmBd9--axnuoDa9KxDQB8vayVHJL_P3a36mNQZPfb1wrOL0Xiv0e-PkKg1wA-x/pub?gid=0&single=true&output=tsv";
  
  console.log('Fetching from URL:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/csv, text/plain, application/json',
        'User-Agent': 'RoadsideAttractionsMap/1.0'
      },
      timeout: 15000 // 15 second timeout
    });
    
    console.log('Response status:', response.status);
    console.log('Response OK:', response.ok);
    
    if (response.ok) {
      const text = await response.text();
      console.log('Response length:', text.length);
      console.log('First 100 characters:', text.substring(0, 100));
      
      // Check if it contains "Big Texan"
      console.log('Contains "Big Texan":', text.includes('Big Texan'));
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
  
  console.log('=== END FETCH TEST ===');
}

testFetch();
