// _data/attractions.js
require('dotenv').config(); // Load environment variables from .env file
const fetch = require('node-fetch');
const { parse } = require('csv-parse'); // Using csv-parse library

const SHEET_URL = process.env.GOOGLE_SHEET_PUBLISH_URL;

// Helper function to create a URL-friendly slug
const slugify = (str) => {
    if (!str) return "";
    return str.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
};

// Define the expected headers IN ORDER to match your Google Sheet columns
const EXPECTED_HEADERS = [
    'Name',
    'StreetAddress',  // Now in second position (Column B)
    'LocationCity',
    'State',
    'ZipCode',        // Wherever this is in your sheet
    'Latitude',
    'Longitude',
    'Description',
    'Categories',
    'ImageURL',
    'ImageAltText',
    'WebsiteLink'
];

// Fallback data in case the fetch fails during development or build
const FALLBACK_ATTRACTIONS = [
    {
        name: "Big Texan Steak Ranch",
        locationCity: "Amarillo",
        state: "Texas",
        lat: 35.1813,
        lon: -101.8252,
        description: "Home of the 72oz steak challenge, where if you can eat the entire meal in one hour, it's free.",
        categories: ["Food Related", "Unusual Buildings"],
        imageUrl: "https://via.placeholder.com/400x300?text=Big+Texan+Steak+Ranch",
        imageAlt: "Big Texan Steak Ranch with its distinctive cow sign",
        websiteLink: "https://bigtexan.com",
        slug: "big-texan-steak-ranch"
    },
    {
        name: "Cadillac Ranch",
        locationCity: "Amarillo",
        state: "Texas",
        lat: 35.1872,
        lon: -101.9871,
        description: "A public art installation featuring ten Cadillacs half-buried nose-first in the ground, covered in ever-changing graffiti.",
        categories: ["Art & Sculpture", "Unusual Buildings"],
        imageUrl: "https://via.placeholder.com/400x300?text=Cadillac+Ranch",
        imageAlt: "Colorfully painted Cadillacs buried nose-down in a field",
        websiteLink: null,
        slug: "cadillac-ranch"
    },
    {
        name: "Salvation Mountain",
        locationCity: "Niland",
        state: "California",
        lat: 33.2541,
        lon: -115.4727,
        description: "A colorful art installation made from local adobe clay and covered with biblical messages and quotes.",
        categories: ["Art & Sculpture", "Folk Art"],
        imageUrl: "https://via.placeholder.com/400x300?text=Salvation+Mountain",
        imageAlt: "Colorful painted mountain in the desert with 'God is Love' painted on it",
        websiteLink: null,
        slug: "salvation-mountain"
    }
];

module.exports = async function() {
    console.log("Fetching data from Google Sheet Published URL...");

    if (!SHEET_URL) {
        console.error("ERROR: GOOGLE_SHEET_PUBLISH_URL is missing in your .env file. Using fallback data.");
        return FALLBACK_ATTRACTIONS;
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
        console.log("Parsing data from sheet...");
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

        // Add debugging AFTER records is defined
        console.log(`Successfully parsed ${records.length} rows.`);

        // Debug data analysis
        if (records.length > 0) {
            console.log("First row headers:", Object.keys(records[0]).join(', '));
            console.log("Categories in first row:", records[0].Categories || records[0].categories || "NOT FOUND");

            // Check a few more rows if available
            if (records.length > 1) {
                console.log("Categories in second row:", records[1].Categories || records[1].categories || "NOT FOUND");
            }
        }

        if (records.length === 0) {
            console.warn("WARNING: No records found in the CSV. Using fallback data.");
            return FALLBACK_ATTRACTIONS;
        }

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
            if (!name || !state || isNaN(lat) || isNaN(lon)) {
                console.warn(`Skipping row ${index + 1} due to missing/invalid essential data: Name='${name || 'N/A'}', State='${state || 'N/A'}', Lat='${latStr}', Lon='${lonStr}'`);
                return null; // Mark for filtering out later
            }

            // Use a placeholder image if no image URL is provided
            if (!imageUrl) {
                console.warn(`Row ${index + 1} (${name}) is missing an image URL. Using placeholder image.`);
            }

            // Fix Google Drive image URLs or use placeholder
            let fixedImageUrl = imageUrl;

            if (!fixedImageUrl) {
                // Use a placeholder image if no image URL is provided
                fixedImageUrl = `https://via.placeholder.com/400x300?text=${encodeURIComponent(name)}`;
            } else if (fixedImageUrl.includes('drive.google.com/file/d/')) {
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

            // IMPROVED: Properly handle categories with better defensive coding
            const processedCategories = (() => {
                // Get the raw categories value, defaulting to empty string if not present
                const catsRaw = row.Categories || row.categories || '';

                // Handle different possible formats for categories
                let cats = [];

                if (typeof catsRaw === 'string') {
                    if (catsRaw.trim() !== '') {
                        // Try comma-separated format first
                        if (catsRaw.includes(',')) {
                            cats = catsRaw.split(',').map(cat => cat.trim()).filter(Boolean);
                        }
                        // Try semicolon-separated format
                        else if (catsRaw.includes(';')) {
                            cats = catsRaw.split(';').map(cat => cat.trim()).filter(Boolean);
                        }
                        // Try pipe-separated format
                        else if (catsRaw.includes('|')) {
                            cats = catsRaw.split('|').map(cat => cat.trim()).filter(Boolean);
                        }
                        // If no separators found but there's text, treat as a single category
                        else {
                            cats = [catsRaw.trim()];
                        }
                    }
                }

                console.log(`Categories for "${name}":`, cats);

                return cats; // Will be an empty array if no categories exist
            })();

            return {
                name: name,
                locationCity: row.LocationCity || row.locationCity || 'N/A',
                state: state,
                streetAddress: row.StreetAddress || row.streetAddress || '',
                zipCode: row.ZipCode || row.zipCode || '',
                lat: lat,
                lon: lon,
                description: row.Description || row.description || 'No description available.',
                categories: processedCategories, // Use our improved categories handling
                imageUrl: fixedImageUrl,
                imageAlt: row.ImageAltText || row.imageAltText || `Image of ${name}`, // Default alt text
                websiteLink: row.WebsiteLink || row.websiteLink || null,
                // Generate a unique slug for the URL
                slug: slugify(name)
            };
        }).filter(attraction => attraction !== null); // Filter out skipped rows

        console.log(`Successfully processed ${attractions.length} attractions.`);

        if (attractions.length === 0) {
            console.warn("WARNING: No valid attractions were processed from the sheet! Using fallback data.");
            return FALLBACK_ATTRACTIONS;
        }
         // Log all loaded attractions for debugging
             console.log("===== ATTRACTIONS LOADING SUMMARY =====");
             console.log(`Total attractions loaded: ${attractions.length}`);
             console.log("Slugs generated for all attractions:");
             attractions.forEach(attr => {
               console.log(`- [${attr.slug}] ${attr.name} (${attr.state})`);
             });
         console.log("======================================");

        return attractions;

    } catch (error) {
        console.error("Error fetching or processing Google Sheet published data:", error);
        console.warn("Using fallback attractions data instead.");
        return FALLBACK_ATTRACTIONS;
    }
};