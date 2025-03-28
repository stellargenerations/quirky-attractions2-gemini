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
        const response = await fetch(SHEET_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch sheet: ${response.status} ${response.statusText}`);
        }
        const dataText = await response.text();

        // --- Use csv-parse to process the TSV data ---
        const records = await new Promise((resolve, reject) => {
            // Configure the parser for TSV (Tab Separated Values)
            // If you chose CSV, change delimiter to ','
            parse(dataText, {
                delimiter: '\t', // Use '\t' for TSV, ',' for CSV
                columns: true,   // Treat the first row as headers
                skip_empty_lines: true,
                trim: true,       // Trim whitespace from values
                relax_quotes: true
            }, (err, parsedRecords) => {
                if (err) {
                    reject(err);
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
                if (JSON.stringify(actualHeaders) !== JSON.stringify(EXPECTED_HEADERS)) {
                     console.warn(`Warning: Headers in sheet [${actualHeaders.join(', ')}] do not exactly match expected headers [${EXPECTED_HEADERS.join(', ')}]. Data mapping might be incorrect.`);
                }
            }

            // Basic validation and parsing
            const lat = parseFloat(row.Latitude);
            const lon = parseFloat(row.Longitude);

            // Skip row if essential data is missing or invalid
             // Check using the EXACT header names from your sheet
            if (!row.Name || !row.State || isNaN(lat) || isNaN(lon) || !row.ImageURL) {
                console.warn(`Skipping row due to missing/invalid essential data: Name='${row.Name || 'N/A'}', State='${row.State || 'N/A'}', Lat='${row.Latitude}', Lon='${row.Longitude}', ImageURL='${row.ImageURL || 'N/A'}'`);
                return null; // Mark for filtering out later
            }

            return {
                name: row.Name, // Assumes header is 'Name'
                locationCity: row.LocationCity || 'N/A', // Use headers from sheet
                state: row.State,
                lat: lat,
                lon: lon,
                description: row.Description || 'No description available.',
                // Split categories by comma, trim whitespace, filter out empty strings
                categories: row.Categories ? row.Categories.split(',').map(cat => cat.trim()).filter(cat => cat) : [],
                imageUrl: row.ImageURL,
                imageAlt: row.ImageAltText || `Image of ${row.Name}`, // Default alt text
                websiteLink: row.WebsiteLink || null,
                // Generate a unique slug for the URL
                slug: slugify(row.Name)
            };
        }).filter(attraction => attraction !== null); // Filter out skipped rows

        console.log(`Successfully processed ${attractions.length} attractions.`);
        return attractions;

    } catch (error) {
        console.error("Error fetching or processing Google Sheet published data:", error);
        // Return empty array on error during build.
        return [];
    }
};