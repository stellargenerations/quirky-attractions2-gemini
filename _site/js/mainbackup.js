// js/main.js

// --- Variables we need ---
let map;
let attractionsLayer; 
const markers = {}; 
const initialCenter = [39.8283, -98.5795]; // Middle of the US
const initialZoom = 5;
const usBounds = L.latLngBounds(
    L.latLng(24.396308, -125.000000), // Bottom left corner
    L.latLng(49.384358, -66.934570)  // Top right corner
);
const stateZoomLevels = {
    default: 7,
    AK: 4, // Alaska is big
    HI: 6, // Hawaii is spread out
    TX: 6, // Texas is big
    CA: 6, // California is big
    MT: 6, // Montana is big
    RI: 9, // Rhode Island is small
    DE: 9, // Delaware is small
    CT: 9, // Connecticut is small
    NJ: 8, // New Jersey is small
};

// --- Get elements from the page ---
const mapElement = document.getElementById('map');
const listViewContent = document.getElementById('list-view-content');
const categoryFilter = document.getElementById('category-filter');
const stateFilter = document.getElementById('state-filter');
const zoomOutButton = document.getElementById('zoom-out-btn');
const noResultsMessage = document.getElementById('no-results');
const listLoadingIndicator = document.querySelector('.list-loading');
const mapLoadingIndicator = document.querySelector('.map-loading');

// --- Start everything when the page loads ---
document.addEventListener('DOMContentLoaded', () => {
    if (mapElement && typeof L !== 'undefined' && typeof attractionsData !== 'undefined') {
        hideLoadingIndicators();
        initMap();
        
        // Fix all image URLs before showing anything
        attractionsData = fixImageUrls(attractionsData);
        
        populateMapAndList(attractionsData);
        setupEventListeners();
    } else {
        console.error("Map element, Leaflet library, or attractions data not found!");
        showLoadingError();
    }
});

// --- Function to check and fix image URLs ---
function fixImageUrls(data) {
    if (!data) return [];
    
    return data.map(attraction => {
        // Make a copy
        const fixed = {...attraction};
        
        // Check if there's an image URL
        if (!fixed.imageUrl || typeof fixed.imageUrl !== 'string') {
            console.log(`No image for ${fixed.name}, using placeholder`);
            fixed.imageUrl = '/img/placeholder.jpg';
            return fixed;
        }
        
        // Remove any extra v= parameters
        fixed.imageUrl = fixed.imageUrl.replace(/[?&]v=\d+/g, '');
        
        // Fix Google Drive URLs to work better
        if (fixed.imageUrl.includes('drive.google.com/file/d/')) {
            const fileIdMatch = fixed.imageUrl.match(/\/d\/([^\/]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
                const fileId = fileIdMatch[1];
                fixed.imageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
                console.log(`Fixed Google Drive URL for ${fixed.name}`);
            }
        }
        
        // Add a fresh version number
        if (!fixed.imageUrl.includes('?')) {
            fixed.imageUrl += '?v=1';
        } else {
            fixed.imageUrl += '&v=1';
        }
        
        return fixed;
    });
}

// --- Map Functions ---
function initMap() {
    try {
        // Set marker icon path
        L.Icon.Default.imagePath = '/img/leaflet/';
        
        map = L.map('map', {
            center: initialCenter,
            zoom: initialZoom,
            minZoom: 5,
            maxBounds: usBounds,
            maxBoundsViscosity: 0.9
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        attractionsLayer = L.layerGroup().addTo(map);

    } catch (error) {
        console.error("Error initializing Leaflet map:", error);
        mapElement.innerHTML = '<p class="map-error">Error loading map. Please try refreshing the page.</p>';
    }
}

function createMarker(attraction) {
    if (!attraction || typeof attraction.lat !== 'number' || typeof attraction.lon !== 'number') {
        console.warn("Can't make marker - missing location data:", attraction);
        return null;
    }

    // Use default markers (pins) instead of custom icons
    const marker = L.marker([attraction.lat, attraction.lon], {
        categories: attraction.categories,
        state: attraction.state,
        slug: attraction.slug
    });

    // Create Popup Content
    const popupContent = `
        <div class="popup-content">
            <div class="popup-image-container">
                <img src="${attraction.imageUrl}" alt="${attraction.imageAlt || attraction.name}" 
                     loading="lazy" class="popup-image"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div class="popup-image-error" style="display: none;">Image not available</div>
            </div>
            <h3>${attraction.name}</h3>
            <p>${attraction.locationCity}, ${attraction.state}</p>
            <a href="/attractions/${attraction.slug}/" class="learn-more-link" target="_blank">Learn More</a>
        </div>
    `;

    marker.bindPopup(popupContent);
    markers[attraction.slug] = marker;
    return marker;

    
}

function zoomToState(stateName) {
    if (!stateName) {
        resetMapView();
        return;
    }

    const stateAttractions = attractionsData.filter(attr => attr.state === stateName);
    if (stateAttractions.length === 0) {
        console.warn(`No attractions found for state: ${stateName}`);
        resetMapView();
        return;
    }

    const stateBounds = L.latLngBounds(stateAttractions.map(attr => [attr.lat, attr.lon]));

    if (map && stateBounds.isValid()) {
        map.flyToBounds(stateBounds, { 
            padding: [50, 50], 
            maxZoom: stateZoomLevels[stateName.substring(0,2).toUpperCase()] || stateZoomLevels.default 
        });
    } else if (stateAttractions.length === 1) {
        map.flyTo(
            [stateAttractions[0].lat, stateAttractions[0].lon], 
            stateZoomLevels[stateName.substring(0,2).toUpperCase()] || stateZoomLevels.default + 2
        );
    } else {
        console.warn("Couldn't figure out where to zoom for state:", stateName);
        resetMapView();
    }
}

function resetMapView() {
    if (map) {
        map.flyTo(initialCenter, initialZoom);
    }
}

// --- List View Functions ---
function createListCard(attraction) {
    if (!attraction) return '';

    // Make description shorter for cards
    const shortDescription = attraction.description.length > 100
        ? attraction.description.substring(0, 100) + '...'
        : attraction.description;

    return `
        <div class="list-card" id="list-item-${attraction.slug}" data-slug="${attraction.slug}">
            <div class="card-image">
                <img src="${attraction.imageUrl}" alt="${attraction.imageAlt || attraction.name}" 
                     loading="lazy" class="card-img"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div class="image-error" style="display: none;">Image not available</div>
            </div>
            <div class="card-content">
                <h3 class="card-title">${attraction.name}</h3>
                <p class="card-location">${attraction.locationCity}, ${attraction.state}</p>
                <p class="card-description">${shortDescription}</p>
                <a href="/attractions/${attraction.slug}/" class="card-link">Learn More</a>
            </div>
        </div>
    `;
}

// --- Data Population & Filtering ---
function populateMapAndList(data) {
    if (!map || !attractionsLayer || !listViewContent) {
        console.error("Can't show attractions: Missing parts of the page.");
        return;
    }

    // Clear everything first
    attractionsLayer.clearLayers();
    listViewContent.innerHTML = '';
    Object.keys(markers).forEach(key => delete markers[key]);

    hideLoadingIndicators();

    if (!data || data.length === 0) {
        noResultsMessage.style.display = 'block';
        return;
    }

    noResultsMessage.style.display = 'none';

    let listHTML = '';
    const bounds = L.latLngBounds();

    data.forEach(attraction => {
        // Add marker to map
        const marker = createMarker(attraction);
        if (marker) {
            attractionsLayer.addLayer(marker);
            bounds.extend(marker.getLatLng());
        }

        // Add card to list
        listHTML += createListCard(attraction);
    });

    // Update list view
    listViewContent.innerHTML = listHTML;

    // Add click listeners to the cards
    addListCardListeners();
}

function filterAttractions() {
    const selectedCategory = categoryFilter ? categoryFilter.value : '';
    const selectedState = stateFilter ? stateFilter.value : '';

    const filteredData = attractionsData.filter(attraction => {
        const categoryMatch = !selectedCategory || 
            (attraction.categories && attraction.categories.includes(selectedCategory));
        const stateMatch = !selectedState || attraction.state === selectedState;
        return categoryMatch && stateMatch;
    });

    populateMapAndList(filteredData);

    // Zoom to the right place based on filters
    if (selectedState) {
        zoomToState(selectedState);
    } else if (!selectedCategory) {
        resetMapView();
    } else {
        const categoryBounds = L.latLngBounds(filteredData.map(attr => [attr.lat, attr.lon]));
        if (map && categoryBounds.isValid()) {
            map.flyToBounds(categoryBounds, { padding: [50, 50] });
        }
    }
}

// --- Event Listeners ---
function setupEventListeners() {
    // Filter dropdowns
    if (categoryFilter && categoryFilter.tagName === 'SELECT') {
        categoryFilter.addEventListener('change', filterAttractions);
    }
    if (stateFilter) {
        stateFilter.addEventListener('change', filterAttractions);
    }

    // Zoom out button
    if (zoomOutButton) {
        zoomOutButton.addEventListener('click', resetMapView);
    }
}

function addListCardListeners() {
    const cards = listViewContent.querySelectorAll('.list-card');
    cards.forEach(card => {
        card.addEventListener('click', (event) => {
            // Don't do anything if they clicked the Learn More link
            if (event.target.closest('.card-link')) {
                return;
            }

            const slug = card.dataset.slug;
            const marker = markers[slug];
            if (marker && map) {
                map.flyTo(marker.getLatLng(), 13);
                marker.openPopup();
            }
        });
    });
}

// --- Helper Functions ---
function hideLoadingIndicators() {
    if (listLoadingIndicator) listLoadingIndicator.style.display = 'none';
    if (mapLoadingIndicator) mapLoadingIndicator.style.display = 'none';
}

function showLoadingError() {
    if (mapElement) mapElement.innerHTML = '<p class="map-error">Could not load the map. Please try again later.</p>';
    if (listViewContent) listViewContent.innerHTML = '<p class="list-error">Could not load the attractions list.</p>';
    hideLoadingIndicators();
}

// This will help us see what's happening with image loading
window.addEventListener('DOMContentLoaded', () => {
    console.log("🔍 Debugging image loading issues...");
    
    // Check if we have data
    if (typeof attractionsData !== 'undefined') {
        console.log(`📊 Found ${attractionsData.length} attractions`);
        
        // Show the first 3 image URLs
        const sampleUrls = attractionsData.slice(0, 3).map(a => a.imageUrl);
        console.log("🖼️ Sample image URLs:", sampleUrls);
    } else {
        console.error("❌ No attractions data found!");
    }
});