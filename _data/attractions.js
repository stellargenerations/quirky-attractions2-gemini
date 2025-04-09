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
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Big_Texan_Steak_Ranch.jpg/1280px-Big_Texan_Steak_Ranch.jpg",
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
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Antone%27s_Austin_2019.jpg/1280px-Antone%27s_Austin_2019.jpg",
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
    },
    {
        name: "Prada Marfa",
        locationCity: "Valentine",
        state: "Texas",
        streetAddress: "US-90",
        zipCode: "79854",
        lat: 30.603611,
        lon: -104.516944,
        description: "A permanent art installation designed to look like a Prada store in the middle of the West Texas desert.",
        categories: ["Art & Sculpture", "Unusual Buildings"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Prada_Marfa_front.jpg/1280px-Prada_Marfa_front.jpg",
        imageAlt: "Prada Marfa art installation in the Texas desert",
        websiteLink: null,
        slug: "prada-marfa"
    },
    {
        name: "The Thing?",
        locationCity: "Dragoon",
        state: "Arizona",
        streetAddress: "2631 N Johnson Rd",
        zipCode: "85609",
        lat: 32.105278,
        lon: -110.0675,
        description: "A roadside attraction and tourist trap advertised by mysterious billboards along Interstate 10 in Arizona.",
        categories: ["Tourist Trap", "Roadside Oddities"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/The_Thing_Arizona.jpg/1280px-The_Thing_Arizona.jpg",
        imageAlt: "The Thing? roadside attraction in Arizona",
        websiteLink: null,
        slug: "the-thing"
    },
    {
        name: "Ave Maria Grotto",
        locationCity: "Cullman",
        state: "Alabama",
        streetAddress: "1600 St Bernard Dr SE",
        zipCode: "35055",
        lat: 34.168889,
        lon: -86.788889,
        description: "A landscaped park featuring 125 miniature reproductions of famous religious structures, built by a Benedictine monk.",
        categories: ["Religious Sites", "Folk Art"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Ave_Maria_Grotto_St_Peter%27s_Basilica.jpg/1280px-Ave_Maria_Grotto_St_Peter%27s_Basilica.jpg",
        imageAlt: "Miniature reproduction of St. Peter's Basilica at Ave Maria Grotto",
        websiteLink: "https://www.avemariagrotto.com",
        slug: "ave-maria-grotto"
    },
    {
        name: "Jolly Green Giant Statue",
        locationCity: "Blue Earth",
        state: "Minnesota",
        streetAddress: "1126 Green Giant Ln",
        zipCode: "56013",
        lat: 43.650278,
        lon: -94.098611,
        description: "A 55-foot tall fiberglass statue of the Jolly Green Giant mascot, standing alongside Interstate 90.",
        categories: ["Roadside Giants", "Advertising Icons"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Jolly_Green_Giant_Blue_Earth_MN.jpg/800px-Jolly_Green_Giant_Blue_Earth_MN.jpg",
        imageAlt: "Jolly Green Giant statue in Blue Earth, Minnesota",
        websiteLink: null,
        slug: "jolly-green-giant-statue"
    },
    {
        name: "Unclaimed Baggage Center",
        locationCity: "Scottsboro",
        state: "Alabama",
        streetAddress: "509 W Willow St",
        zipCode: "35768",
        lat: 34.672222,
        lon: -86.035,
        description: "The only store in America that buys and sells unclaimed baggage from airlines, featuring unique items from around the world.",
        categories: ["Shopping", "Unusual Businesses"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Unclaimed_Baggage_Center.jpg/1280px-Unclaimed_Baggage_Center.jpg",
        imageAlt: "Unclaimed Baggage Center in Scottsboro, Alabama",
        websiteLink: "https://www.unclaimedbaggage.com",
        slug: "unclaimed-baggage-center"
    },
    {
        name: "The Paper House",
        locationCity: "Rockport",
        state: "Massachusetts",
        streetAddress: "52 Pigeon Hill St",
        zipCode: "01966",
        lat: 42.675,
        lon: -70.619722,
        description: "A house built entirely out of newspaper in 1922, with furniture also made from paper.",
        categories: ["Unusual Buildings", "Folk Art"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Paper_House_Rockport_MA.jpg/1280px-Paper_House_Rockport_MA.jpg",
        imageAlt: "The Paper House in Rockport, Massachusetts",
        websiteLink: "http://www.paperhouserockport.com",
        slug: "the-paper-house"
    },
    {
        name: "House on the Rock",
        locationCity: "Spring Green",
        state: "Wisconsin",
        streetAddress: "5754 State Rd 23",
        zipCode: "53588",
        lat: 43.097222,
        lon: -90.134722,
        description: "An eccentric tourist attraction featuring bizarre collections, automated music machines, and the world's largest indoor carousel.",
        categories: ["Unusual Buildings", "Museums"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/House_on_the_Rock_Infinity_Room.jpg/1280px-House_on_the_Rock_Infinity_Room.jpg",
        imageAlt: "Infinity Room at House on the Rock in Wisconsin",
        websiteLink: "https://www.thehouseontherock.com",
        slug: "house-on-the-rock"
    },
    {
        name: "Lucy the Elephant",
        locationCity: "Margate City",
        state: "New Jersey",
        streetAddress: "9200 Atlantic Ave",
        zipCode: "08402",
        lat: 39.321944,
        lon: -74.511667,
        description: "A six-story elephant-shaped building built in 1881, the oldest surviving roadside tourist attraction in America.",
        categories: ["Unusual Buildings", "Historic Sites"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Lucy_the_Elephant_Margate_NJ_July_2016.jpg/1280px-Lucy_the_Elephant_Margate_NJ_July_2016.jpg",
        imageAlt: "Lucy the Elephant building in Margate City, New Jersey",
        websiteLink: "https://www.lucytheelephant.org",
        slug: "lucy-the-elephant"
    },
    {
        name: "Haines Shoe House",
        locationCity: "Hallam",
        state: "Pennsylvania",
        streetAddress: "197 Shoe House Rd",
        zipCode: "17406",
        lat: 40.023611,
        lon: -76.603889,
        description: "A shoe-shaped house built in 1948 by a shoe salesman as an advertising gimmick.",
        categories: ["Unusual Buildings", "Roadside Oddities"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Haines_Shoe_House_York_PA.jpg/1280px-Haines_Shoe_House_York_PA.jpg",
        imageAlt: "Haines Shoe House in York County, Pennsylvania",
        websiteLink: "https://www.hainesshoehouse.com",
        slug: "haines-shoe-house"
    },
    {
        name: "Ben & Jerry's Flavor Graveyard",
        locationCity: "Waterbury",
        state: "Vermont",
        streetAddress: "1281 Waterbury-Stowe Rd",
        zipCode: "05676",
        lat: 44.352778,
        lon: -72.740833,
        description: "A memorial to discontinued ice cream flavors, with humorous epitaphs on tombstone-shaped monuments.",
        categories: ["Food Related", "Unusual Monuments"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Ben_%26_Jerry%27s_Factory_Tour%2C_Waterbury_VT.jpg/1280px-Ben_%26_Jerry%27s_Factory_Tour%2C_Waterbury_VT.jpg",
        imageAlt: "Ben & Jerry's Factory with Flavor Graveyard in Vermont",
        websiteLink: "https://www.benjerry.com/about-us/factory-tours",
        slug: "ben-jerrys-flavor-graveyard"
    },
    {
        name: "Hole N\" The Rock",
        locationCity: "Moab",
        state: "Utah",
        streetAddress: "11037 US-191",
        zipCode: "84532",
        lat: 38.415,
        lon: -109.478056,
        description: "A 5,000-square-foot home carved into a massive rock, featuring eccentric collections and a small zoo.",
        categories: ["Unusual Buildings", "Roadside Oddities"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Hole_N%22_The_Rock%2C_Moab%2C_Utah.jpg/1280px-Hole_N%22_The_Rock%2C_Moab%2C_Utah.jpg",
        imageAlt: "Hole N\" The Rock carved home in Utah",
        websiteLink: "https://www.theholeintherock.com",
        slug: "hole-n-the-rock"
    },
    {
        name: "International UFO Museum and Research Center",
        locationCity: "Roswell",
        state: "New Mexico",
        streetAddress: "114 N Main St",
        zipCode: "88203",
        lat: 33.394444,
        lon: -104.523056,
        description: "A museum dedicated to the alleged 1947 UFO crash in Roswell and other UFO phenomena.",
        categories: ["Museums", "Paranormal"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/International_UFO_Museum_and_Research_Center.jpg/1280px-International_UFO_Museum_and_Research_Center.jpg",
        imageAlt: "International UFO Museum and Research Center in Roswell, New Mexico",
        websiteLink: "https://www.roswellufomuseum.com",
        slug: "international-ufo-museum-and-research-center"
    },
    {
        name: "Museum of Pop Culture (MoPOP)",
        locationCity: "Seattle",
        state: "Washington",
        streetAddress: "325 5th Ave N",
        zipCode: "98109",
        lat: 47.621667,
        lon: -122.348056,
        description: "A museum dedicated to contemporary popular culture, housed in a striking building designed by Frank Gehry.",
        categories: ["Museums", "Modern Architecture"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Museum_of_Pop_Culture.jpg/1280px-Museum_of_Pop_Culture.jpg",
        imageAlt: "Museum of Pop Culture (MoPOP) in Seattle, Washington",
        websiteLink: "https://www.mopop.org",
        slug: "museum-of-pop-culture-mopop"
    },
    {
        name: "Mackinac Bridge",
        locationCity: "Mackinaw City",
        state: "Michigan",
        streetAddress: "N/A",
        zipCode: "49701",
        lat: 45.817222,
        lon: -84.727778,
        description: "A 5-mile suspension bridge connecting Michigan's Upper and Lower Peninsulas, with stunning views of the Straits of Mackinac.",
        categories: ["Engineering Marvels", "Scenic Views"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Mackinac_Bridge_Sunset.jpg/1280px-Mackinac_Bridge_Sunset.jpg",
        imageAlt: "Mackinac Bridge connecting Michigan's peninsulas",
        websiteLink: "https://www.mackinacbridge.org",
        slug: "mackinac-bridge"
    },
    {
        name: "Republic of Molossia",
        locationCity: "Dayton",
        state: "Nevada",
        streetAddress: "226 Mary Ln",
        zipCode: "89403",
        lat: 39.323056,
        lon: -119.5675,
        description: "A micronation claiming independence from the United States, consisting of a private residence and surrounding property.",
        categories: ["Unusual Attractions", "Quirky Places"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Molossia_Customs_Shack.jpg/1280px-Molossia_Customs_Shack.jpg",
        imageAlt: "Republic of Molossia customs shack",
        websiteLink: "http://www.molossia.org",
        slug: "republic-of-molossia"
    },
    {
        name: "Craters of the Moon National Monument & Preserve",
        locationCity: "Arco",
        state: "Idaho",
        streetAddress: "1266 Craters Loop Rd",
        zipCode: "83213",
        lat: 43.416667,
        lon: -113.516667,
        description: "A vast landscape of solidified lava flows with cinder cones, spatter cones, and lava tubes, resembling the surface of the moon.",
        categories: ["National Parks", "Natural Wonders"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Craters_of_the_Moon_National_Monument_and_Preserve_20110716.jpg/1280px-Craters_of_the_Moon_National_Monument_and_Preserve_20110716.jpg",
        imageAlt: "Craters of the Moon National Monument and Preserve",
        websiteLink: "https://www.nps.gov/crmo",
        slug: "craters-of-the-moon-national-monument-preserve"
    },
    {
        name: "Shoshone Falls",
        locationCity: "Twin Falls",
        state: "Idaho",
        streetAddress: "4155 Shoshone Falls Grade",
        zipCode: "83301",
        lat: 42.5925,
        lon: -114.401111,
        description: "A waterfall on the Snake River that drops 212 feet, higher than Niagara Falls, earning it the nickname 'Niagara of the West.'",
        categories: ["Waterfalls", "Natural Wonders"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Shoshone_Falls%2C_Snake_River%2C_Twin_Falls%2C_ID1.jpg/1280px-Shoshone_Falls%2C_Snake_River%2C_Twin_Falls%2C_ID1.jpg",
        imageAlt: "Shoshone Falls on the Snake River",
        websiteLink: "https://www.tfid.org/309/Shoshone-Falls",
        slug: "shoshone-falls"
    },
    {
        name: "Sawtooth National Recreation Area",
        locationCity: "Stanley",
        state: "Idaho",
        streetAddress: "5 North Fork Canyon Rd",
        zipCode: "83278",
        lat: 44.166667,
        lon: -114.916667,
        description: "A wilderness area with jagged mountain peaks, alpine lakes, and over 700 miles of hiking trails in central Idaho.",
        categories: ["National Parks", "Outdoor Recreation"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Sawtooth_Range_Stanley_Idaho.jpg/1280px-Sawtooth_Range_Stanley_Idaho.jpg",
        imageAlt: "Sawtooth Range near Stanley, Idaho",
        websiteLink: "https://www.fs.usda.gov/sawtooth",
        slug: "sawtooth-national-recreation-area"
    },
    {
        name: "Hell's Canyon National Recreation Area",
        locationCity: "Riggins",
        state: "Oregon",
        streetAddress: "N/A",
        zipCode: "97850",
        lat: 45.25,
        lon: -116.833333,
        description: "North America's deepest river gorge, carved by the Snake River along the border of Oregon and Idaho, offering whitewater rafting and hiking.",
        categories: ["Canyons", "Outdoor Recreation"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Hells_Canyon_from_Hat_Point.jpg/1280px-Hells_Canyon_from_Hat_Point.jpg",
        imageAlt: "Hell's Canyon from Hat Point",
        websiteLink: "https://www.fs.usda.gov/detail/wallowa-whitman/recreation/?cid=stelprdb5238987",
        slug: "hells-canyon-national-recreation-area"
    },
    {
        name: "City of Rocks National Reserve",
        locationCity: "Almo",
        state: "Idaho",
        streetAddress: "3035 Elba-Almo Rd",
        zipCode: "83312",
        lat: 42.076111,
        lon: -113.723889,
        description: "A landscape of granite spires and monoliths that served as landmarks for emigrants on the California Trail and now attract rock climbers.",
        categories: ["National Parks", "Rock Formations"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/City_of_Rocks_National_Reserve_-_Idaho.jpg/1280px-City_of_Rocks_National_Reserve_-_Idaho.jpg",
        imageAlt: "City of Rocks National Reserve in Idaho",
        websiteLink: "https://www.nps.gov/ciro",
        slug: "city-of-rocks-national-reserve"
    },
    {
        name: "Lake Coeur d'Alene",
        locationCity: "Coeur d'Alene",
        state: "Idaho",
        streetAddress: "N/A",
        zipCode: "83814",
        lat: 47.666667,
        lon: -116.766667,
        description: "A scenic lake in northern Idaho with 109 miles of shoreline, known for its clear water, recreational activities, and bald eagle watching.",
        categories: ["Lakes", "Outdoor Recreation"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Lake_Coeur_d%27Alene_from_Mineral_Ridge.jpg/1280px-Lake_Coeur_d%27Alene_from_Mineral_Ridge.jpg",
        imageAlt: "Lake Coeur d'Alene from Mineral Ridge",
        websiteLink: null,
        slug: "lake-coeur-dalene"
    },
    {
        name: "Boise River Greenbelt",
        locationCity: "Boise",
        state: "Idaho",
        streetAddress: "N/A",
        zipCode: "83702",
        lat: 43.616667,
        lon: -116.2,
        description: "A 25-mile tree-lined pathway along the Boise River that connects parks, wildlife habitats, and the downtown area.",
        categories: ["Urban Parks", "Outdoor Recreation"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Boise_River_Greenbelt.jpg/1280px-Boise_River_Greenbelt.jpg",
        imageAlt: "Boise River Greenbelt pathway",
        websiteLink: "https://parks.cityofboise.org/parks-locations/parks/greenbelt",
        slug: "boise-river-greenbelt"
    },
    {
        name: "Bruneau Dunes State Park",
        locationCity: "Bruneau",
        state: "Idaho",
        streetAddress: "27608 Sand Dunes Rd",
        zipCode: "83604",
        lat: 42.896944,
        lon: -115.6925,
        description: "Home to the tallest single-structured sand dune in North America, rising 470 feet above the surrounding desert.",
        categories: ["State Parks", "Natural Wonders"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Bruneau_Dunes_State_Park_Observatory.jpg/1280px-Bruneau_Dunes_State_Park_Observatory.jpg",
        imageAlt: "Bruneau Dunes State Park Observatory",
        websiteLink: "https://parksandrecreation.idaho.gov/parks/bruneau-dunes",
        slug: "bruneau-dunes-state-park"
    },
    {
        name: "Sun Valley Resort",
        locationCity: "Sun Valley",
        state: "Idaho",
        streetAddress: "1 Sun Valley Rd",
        zipCode: "83353",
        lat: 43.683333,
        lon: -114.35,
        description: "America's first destination ski resort, opened in 1936, featuring world-class skiing, a historic lodge, and celebrity connections.",
        categories: ["Ski Resorts", "Historic Sites"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Sun_Valley_Lodge_2015.JPG/1280px-Sun_Valley_Lodge_2015.JPG",
        imageAlt: "Sun Valley Lodge in Idaho",
        websiteLink: "https://www.sunvalley.com",
        slug: "sun-valley-resort"
    },
    {
        name: "Lava Hot Springs",
        locationCity: "Lava Hot Springs",
        state: "Idaho",
        streetAddress: "430 E Main St",
        zipCode: "83246",
        lat: 42.619444,
        lon: -112.010833,
        description: "A small resort town known for its natural mineral hot springs and Olympic-sized swimming complex.",
        categories: ["Hot Springs", "Tourist Towns"],
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Lava_Hot_Springs%2C_Idaho.jpg/1280px-Lava_Hot_Springs%2C_Idaho.jpg",
        imageAlt: "Lava Hot Springs, Idaho",
        websiteLink: "https://lavahotsprings.org",
        slug: "lava-hot-springs"
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