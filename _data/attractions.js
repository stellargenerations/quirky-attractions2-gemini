// _data/attractions.js
require('dotenv').config(); // Load environment variables from .env file
const fetch = require('node-fetch');
const { parse } = require('csv-parse'); // Using csv-parse library

const SHEET_URL = process.env.GOOGLE_SHEET_PUBLISH_URL;

// Helper function to create a URL-friendly slug (same as before)
const slugify = (str) => {
    if (!str) return "";
    return str.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
};

// Define the expected headers IN ORDER (must match your Google Sheet columns A, B, C...)
// This is crucial for mapping the data correctly after parsing.
const EXPECTED_HEADERS = [
    'Name',
    'LocationCity',
    'State',
    'Latitude',
    'Longitude',
    'Description',
    'Categories',
    'ImageURL',
    'ImageAltText',
    'WebsiteLink'
];

module.exports = async function() {
    console.log("Fetching data from Google Sheet Published URL...");

    if (!SHEET_URL) {
        console.error("ERROR: GOOGLE_SHEET_PUBLISH_URL is missing in your .env file.");
        return []; // Return empty array on critical error
    }

    try {
        // Add cache-busting parameter to URL to avoid potential caching issues
        const fetchUrl = SHEET_URL.includes('?') 
            ? `${SHEET_URL}&_cb=${Date.now()}` 
            : `${SHEET_URL}?_cb=${Date.now()}`;
            
        const response = await fetch(fetchUrl, {
            headers: {
                'Accept': 'text/csv, text/plain, application/json',
                'User-Agent': 'RoadsideAttractionsMap/1.0'
            },
            timeout: 15000 // 15 second timeout
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch sheet: ${response.status} ${response.statusText}`);
        }
        
        const dataText = await response.text();
        
        // Check if the response is empty or obviously not CSV/TSV data
        if (!dataText || dataText.trim().length < 10) {
            throw new Error("Empty or invalid response from Google Sheets");
        }

        // Detect if we got HTML instead of CSV/TSV (common error with Google Sheets)
        if (dataText.includes('<!DOCTYPE html>') || dataText.includes('<html>')) {
            throw new Error("Received HTML instead of CSV/TSV data. Check your publish URL.");
        }

        // --- Use csv-parse to process the TSV data ---
        const records = await new Promise((resolve, reject) => {
            // Try to auto-detect delimiter
            const firstLine = dataText.split('\n')[0];
            let delimiter = '\t'; // Default to tab
            
            if (firstLine.includes(',') && !firstLine.includes('\t')) {
                delimiter = ','; // Switch to comma if that seems more likely
                console.log("Auto-detected CSV format (comma-separated)");
            } else {
                console.log("Using TSV format (tab-separated)");
            }
            
            // Configure the parser
            parse(dataText, {
                delimiter: delimiter,
                columns: true,   // Treat the first row as headers
                skip_empty_lines: true,
                trim: true,       // Trim whitespace from values
                relax_quotes: true,
                relax_column_count: true // Allow rows with inconsistent column counts
            }, (err, parsedRecords) => {
                if (err) {
                    reject(new Error(`CSV parsing error: ${err.message}`));
                } else {
                    resolve(parsedRecords);
                }
            });
        });
        // --- End parsing ---

        console.log(`Successfully parsed ${records.length} rows.`);

        const attractions = records.map((row, index) => {
            // Check if headers match expected (only check once for warning)
            if (index === 0) {
                const actualHeaders = Object.keys(row);
                console.log("Actual headers found:", actualHeaders.join(', '));
                
                // Less strict header check - just make sure we have the essential ones
                const essentialHeaders = ['Name', 'State', 'Latitude', 'Longitude', 'ImageURL'];
                const missingHeaders = essentialHeaders.filter(header => 
                    !actualHeaders.includes(header) && !actualHeaders.includes(header.toLowerCase())
                );
                
                if (missingHeaders.length > 0) {
                    console.warn(`Warning: Missing essential headers: ${missingHeaders.join(', ')}`);
                }
            }

            // Basic validation and parsing
            // More flexible header matching - try both forms
            const name = row.Name || row.name || '';
            const state = row.State || row.state || '';
            const latStr = row.Latitude || row.latitude || '';
            const lonStr = row.Longitude || row.longitude || '';
            const imageUrl = row.ImageURL || row.imageUrl || row.imageURL || '';
            
            const lat = parseFloat(latStr);
            const lon = parseFloat(lonStr);

            // Skip row if essential data is missing or invalid
            if (!name || !state || isNaN(lat) || isNaN(lon) || !imageUrl) {
                console.warn(`Skipping row ${index + 1} due to missing/invalid essential data: Name='${name || 'N/A'}', State='${state || 'N/A'}', Lat='${latStr}', Lon='${lonStr}', ImageURL='${imageUrl || 'N/A'}'`);
                return null; // Mark for filtering out later
            }

            // Fix Google Drive image URLs
            let fixedImageUrl = imageUrl;
            if (fixedImageUrl.includes('drive.google.com/file/d/')) {
                const fileIdMatch = fixedImageUrl.match(/\/d\/([^\/]+)/);
                if (fileIdMatch && fileIdMatch[1]) {
                    const fileId = fileIdMatch[1];
                    fixedImageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
                    console.log(`Fixed Google Drive URL for "${name}"`);
                }
            }
            
            // Add cache-busting to image URL
            if (!fixedImageUrl.includes('?')) {
                fixedImageUrl += '?v=' + Date.now();
            } else {
                fixedImageUrl += '&v=' + Date.now();
            }

            return {
                name: name,
                locationCity: row.LocationCity || row.locationCity || 'N/A',
                state: state,
                lat: lat,
                lon: lon,
                description: row.Description || row.description || 'No description available.',
                // Split categories by comma, trim whitespace, filter out empty strings
                categories: (row.Categories || row.categories || '').split(',')
                    .map(cat => cat.trim())
                    .filter(cat => cat),
                imageUrl: fixedImageUrl,
                imageAlt: row.ImageAltText || row.imageAltText || `Image of ${name}`, // Default alt text
                websiteLink: row.WebsiteLink || row.websiteLink || null,
                // Generate a unique slug for the URL
                slug: slugify(name)
            };
        }).filter(attraction => attraction !== null); // Filter out skipped rows

        console.log(`Successfully processed ${attractions.length} attractions.`);
        
        if (attractions.length === 0) {
            console.warn("WARNING: No valid attractions were processed from the sheet!");
        }
        
        return attractions;

    } catch (error) {
        console.error("Error fetching or processing Google Sheet published data:", error);
        // Return empty array on error during build.
        return [];
    }
};