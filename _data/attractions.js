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
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Cadillac_Ranch.jpg",
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
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/94/Salvation_Mountain%2C_Niland%2C_CA.jpg",
        imageAlt: "Colorful painted mountain in the desert with 'God is Love' painted on it",
        websiteLink: null,
        slug: "salvation-mountain"
    },
    {
        name: "Carhenge",
        locationCity: "Alliance",
        state: "Nebraska",
        streetAddress: "2151 Co Rd 59",
        zipCode: "69301",
        lat: 42.142493,
        lon: -102.857942,
        description: "A replica of England's Stonehenge constructed entirely from vintage American automobiles painted gray.",
        categories: ["Art & Sculpture", "Roadside Oddities"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/55/Carhenge%2C_Alliance%2C_NE%2C_Yellow_Car.jpg",
        imageAlt: "Carhenge, Alliance, NE, Yellow Car",
        websiteLink: null,
        slug: "carhenge"
    },
    {
        name: "World's Largest Ball of Twine",
        locationCity: "Cawker City",
        state: "Kansas",
        streetAddress: "719 Wisconsin St",
        zipCode: "67430",
        lat: 39.509167,
        lon: -98.434722,
        description: "A massive ball of sisal twine that has been growing since 1953, with visitors encouraged to add to it.",
        categories: ["World's Largest", "Roadside Oddities"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/da/World%27s_Largest_Ball_of_Twine%2C_Cawker_City%2C_KS.jpg",
        imageAlt: "World's Largest Ball of Twine in Cawker City, Kansas",
        websiteLink: null,
        slug: "worlds-largest-ball-of-twine"
    },
    {
        name: "Wall Drug Store",
        locationCity: "Wall",
        state: "South Dakota",
        streetAddress: "510 Main St",
        zipCode: "57790",
        lat: 43.992500,
        lon: -102.241944,
        description: "A sprawling roadside attraction known for its free ice water, 5-cent coffee, and eclectic collection of shops and displays.",
        categories: ["Tourist Trap", "Shopping"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Wall_Drug_Store_-_Wall%2C_South_Dakota.jpg",
        imageAlt: "Wall Drug Store in Wall, South Dakota",
        websiteLink: "https://www.walldrug.com",
        slug: "wall-drug-store"
    },
    {
        name: "The Fremont Troll",
        locationCity: "Seattle",
        state: "Washington",
        streetAddress: "N 36th St",
        zipCode: "98103",
        lat: 47.651039,
        lon: -122.347390,
        description: "A massive sculpture of a troll clutching a Volkswagen Beetle, lurking under the north end of the Aurora Bridge.",
        categories: ["Art & Sculpture", "Urban Oddities"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a8/Fremont_troll.jpg",
        imageAlt: "The Fremont Troll sculpture under a bridge in Seattle",
        websiteLink: null,
        slug: "the-fremont-troll"
    },
    {
        name: "Mystery Spot",
        locationCity: "Santa Cruz",
        state: "California",
        streetAddress: "465 Mystery Spot Rd",
        zipCode: "95065",
        lat: 37.017697,
        lon: -122.001054,
        description: "A tourist attraction claiming gravitational anomalies and optical illusions within its tilted environment.",
        categories: ["Optical Illusions", "Tourist Trap"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5b/The_Mystery_spot_entrance.jpg",
        imageAlt: "The Mystery spot entrance",
        websiteLink: "https://www.mysteryspot.com",
        slug: "mystery-spot"
    },
    {
        name: "Winchester Mystery House",
        locationCity: "San Jose",
        state: "California",
        streetAddress: "525 S Winchester Blvd",
        zipCode: "95128",
        lat: 37.318333,
        lon: -121.950833,
        description: "A bizarre mansion built by Sarah Winchester with staircases to nowhere, doors opening to walls, and other architectural oddities.",
        categories: ["Haunted Places", "Unusual Buildings"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Winchester_House_910px.jpg",
        imageAlt: "Winchester Mystery House in San Jose, California",
        websiteLink: "https://winchestermysteryhouse.com",
        slug: "winchester-mystery-house"
    },
    {
        name: "Cabazon Dinosaurs",
        locationCity: "Cabazon",
        state: "California",
        streetAddress: "50770 Seminole Dr",
        zipCode: "92230",
        lat: 33.924167,
        lon: -116.776944,
        description: "Giant concrete dinosaurs, Dinny the Brontosaurus and Mr. Rex the Tyrannosaurus Rex, featured in Pee-wee's Big Adventure.",
        categories: ["Roadside Giants", "Movie Locations"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Cabazon_Dinosaurs%2C_Ca_%285991906002%29.jpg",
        imageAlt: "Cabazon Dinosaurs, Ca",
        websiteLink: "https://www.cabazondinosaurs.com",
        slug: "cabazon-dinosaurs"
    },
    {
        name: "Antone's Nightclub",
        locationCity: "Austin",
        state: "Texas",
        streetAddress: "305 East 5th Street",
        zipCode: "78701",
        lat: 30.26605585,
        lon: -97.7403995,
        description: "Historic blues venue that has hosted legends like B.B. King, Muddy Waters, and Stevie Ray Vaughan since 1975.",
        categories: ["Music Venues", "Historic Sites"],
        imageUrl: "https://via.placeholder.com/400x300?text=Antones+Nightclub",
        imageAlt: "Antone's Nightclub in Austin, Texas",
        websiteLink: "https://antonesnightclub.com",
        slug: "antones-nightclub"
    },
    {
        name: "Red Rocks Amphitheatre",
        locationCity: "Morrison",
        state: "Colorado",
        streetAddress: "18300 W Alameda Pkwy",
        zipCode: "80465",
        lat: 39.665278,
        lon: -105.205278,
        description: "A spectacular natural amphitheater carved from massive red sandstone formations, known for its perfect acoustics and stunning views.",
        categories: ["Natural Wonders", "Music Venues"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Red_Rocks_Amphitheatre%2C_Colorado.jpg",
        imageAlt: "Red Rocks Amphitheatre in Colorado",
        websiteLink: "https://www.redrocksonline.com",
        slug: "red-rocks-amphitheatre"
    },
    {
        name: "Neon Museum",
        locationCity: "Las Vegas",
        state: "Nevada",
        streetAddress: "770 Las Vegas Blvd N",
        zipCode: "89101",
        lat: 36.176944,
        lon: -115.135556,
        description: "An outdoor museum dedicated to preserving and exhibiting iconic Las Vegas neon signs from the city's colorful past.",
        categories: ["Museums", "Art & Design"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d1/Neon_Museum_Las_Vegas.jpg",
        imageAlt: "Neon Museum Las Vegas",
        websiteLink: "https://www.neonmuseum.org",
        slug: "neon-museum"
    },
    {
        name: "Longwood Gardens",
        locationCity: "Kennett Square",
        state: "Pennsylvania",
        streetAddress: "1001 Longwood Rd",
        zipCode: "19348",
        lat: 39.871111,
        lon: -75.673889,
        description: "One of the world's premier horticultural display gardens, spanning 1,100 acres with 20 indoor gardens, 20 outdoor gardens, and 11,000 different types of plants.",
        categories: ["Gardens", "Historic Sites"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Longwood_Gardens_Conservatory.jpg",
        imageAlt: "Longwood Gardens Conservatory",
        websiteLink: "https://longwoodgardens.org",
        slug: "longwood-gardens"
    },
    {
        name: "Knoebels Amusement Resort",
        locationCity: "Elysburg",
        state: "Pennsylvania",
        streetAddress: "391 Knoebels Blvd",
        zipCode: "17824",
        lat: 40.881389,
        lon: -76.501389,
        description: "America's largest free-admission amusement park, featuring classic wooden roller coasters, a historic carousel, and traditional amusement park foods.",
        categories: ["Amusement Parks", "Family Attractions"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Knoebels_Amusement_Resort_-_panoramio.jpg",
        imageAlt: "Knoebels Amusement Resort",
        websiteLink: "https://www.knoebels.com",
        slug: "knoebels-amusement-resort"
    }
];

module.exports = async function() {
    console.log("Fetching data from Google Sheet Published URL...");

    // Check if we're in a Netlify environment or if the sheet URL is missing
    const isNetlify = process.env.NETLIFY === 'true';

    if (isNetlify || !SHEET_URL) {
        if (isNetlify) {
            console.log("Netlify environment detected. Using fallback attractions data for reliability.");
        } else {
            console.error("ERROR: GOOGLE_SHEET_PUBLISH_URL is missing in your .env file. Using fallback data.");
        }
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