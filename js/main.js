// js/main.js

// --- Global Variables ---
let map;
let attractionsLayer; // Layer group to hold markers for easy clearing/adding
const markers = {}; // Store markers by attraction slug for easy access
const initialCenter = [39.8283, -98.5795]; // Center of the US
const initialZoom = 4;
const usBounds = L.latLngBounds(
    L.latLng(24.396308, -125.000000), // Southwest
    L.latLng(49.384358, -66.934570)  // Northeast
);
const stateZoomLevels = {
    // Rough zoom levels for different state sizes (adjust as needed)
    default: 7,
    AK: 4, // Alaska is huge
    HI: 6, // Hawaii is spread out
    TX: 6, // Texas is large
    CA: 6, // California is large
    MT: 6, // Montana is large
    RI: 9, // Rhode Island is small
    DE: 9, // Delaware is small
    CT: 9, // Connecticut is small
    NJ: 8, // New Jersey is smallish
    // Add more specific state zooms if needed
};

// --- DOM Elements ---
const mapElement = document.getElementById('map');
const listViewContent = document.getElementById('list-view-content');
const categoryFilter = document.getElementById('category-filter');
const stateFilter = document.getElementById('state-filter');
const zoomOutButton = document.getElementById('zoom-out-btn');
const noResultsMessage = document.getElementById('no-results');
const listLoadingIndicator = document.querySelector('.list-loading');
const mapLoadingIndicator = document.querySelector('.map-loading');


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (mapElement && typeof L !== 'undefined' && typeof attractionsData !== 'undefined') {
        hideLoadingIndicators(); // Hide initial loading text
        initMap();
        populateMapAndList(attractionsData); // Initial population
        setupEventListeners();
    } else {
        console.error("Map element, Leaflet library, or attractions data not found!");
        showLoadingError();
    }
});

// --- Map Functions ---
function initMap() {
    try {
        map = L.map('map', {
            center: initialCenter,
            zoom: initialZoom,
            minZoom: 4, // Prevent zooming out too far
            maxBounds: usBounds, // Restrict panning outside US roughly
            maxBoundsViscosity: 0.9 // Make it 'bouncy' at the edges
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        attractionsLayer = L.layerGroup().addTo(map); // Initialize the layer group

         // Add Leaflet's zoom control explicitly if needed (usually added by default)
        // L.control.zoom({ position: 'topleft' }).addTo(map);

    } catch (error) {
        console.error("Error initializing Leaflet map:", error);
        mapElement.innerHTML = '<p class="map-error">Error loading map. Please try refreshing the page.</p>';
    }
}

function createMarker(attraction) {
    if (!attraction || typeof attraction.lat !== 'number' || typeof attraction.lon !== 'number') {
        console.warn("Skipping marker creation due to invalid data:", attraction);
        return null;
    }

    const marker = L.marker([attraction.lat, attraction.lon], {
        // Add custom options if needed, e.g., category for styling
        categories: attraction.categories,
        state: attraction.state,
        slug: attraction.slug // Store slug for linking list to marker
    });

    // Create Popup Content (HTML)
    const popupContent = `
        <div class="popup-content">
            <img src="${attraction.imageUrl}" alt="${attraction.imageAlt}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <p class="popup-error" style="display: none;">Image failed to load.</p>
            <h3>${attraction.name}</h3>
            <p>${attraction.locationCity}, ${attraction.state}</p>
            <a href="/attractions/${attraction.slug}/" class="learn-more-link" target="_blank">Learn More</a>
        </div>
    `;

    marker.bindPopup(popupContent);

    // Store marker reference using its slug
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
        resetMapView(); // Or show a message?
        return;
    }

    // Create LatLng objects for bounding box calculation
    const stateBounds = L.latLngBounds(stateAttractions.map(attr => [attr.lat, attr.lon]));

    if (map && stateBounds.isValid()) {
         // Add padding to the bounds fit
        map.flyToBounds(stateBounds, { padding: [50, 50], maxZoom: stateZoomLevels[stateName.substring(0,2).toUpperCase()] || stateZoomLevels.default });
    } else if (stateAttractions.length === 1) {
         // If only one point, fly to it with a reasonable zoom
        map.flyTo([stateAttractions[0].lat, stateAttractions[0].lon], stateZoomLevels[stateName.substring(0,2).toUpperCase()] || stateZoomLevels.default + 2 );
    } else {
        console.warn("Could not determine bounds or map not ready for state:", stateName);
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
    if (!attraction) return ''; // Return empty string if attraction is null/undefined

    // Truncate description for the card view
    const shortDescription = attraction.description.length > 100
        ? attraction.description.substring(0, 100) + '...'
        : attraction.description;

    return `
        <div class="list-card" id="list-item-${attraction.slug}" data-slug="${attraction.slug}">
            <div class="card-image">
                <img src="${attraction.imageUrl}" alt="${attraction.imageAlt}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
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
        console.error("Cannot populate map/list: Missing components.");
        return;
    }

    // Clear previous markers and list items
    attractionsLayer.clearLayers();
    listViewContent.innerHTML = ''; // Clear list
    Object.keys(markers).forEach(key => delete markers[key]); // Clear marker references

    hideLoadingIndicators(); // Ensure loading indicators are hidden

    if (!data || data.length === 0) {
        noResultsMessage.style.display = 'block'; // Show no results message
        return; // Exit if no data
    }

    noResultsMessage.style.display = 'none'; // Hide no results message

    let listHTML = '';
    const bounds = L.latLngBounds(); // To potentially fit map to results

    data.forEach(attraction => {
        // Add marker to map
        const marker = createMarker(attraction);
        if (marker) {
            attractionsLayer.addLayer(marker);
            bounds.extend(marker.getLatLng()); // Extend bounds for fitting view later
        }

        // Add card to list HTML
        listHTML += createListCard(attraction);
    });

    // Update list view content
    listViewContent.innerHTML = listHTML;

    // Add click listeners to the new list items
    addListCardListeners();

    // Optional: Fit map to the bounds of the currently displayed markers
    // Be careful with this on initial load or with few points - might zoom too far
    // if (map && bounds.isValid() && data.length > 1) {
    //    map.fitBounds(bounds, { padding: [30, 30] });
    // } else if (map && data.length === 1) {
    //    map.setView(bounds.getCenter(), 10); // Zoom to single point
    // }
}


function filterAttractions() {
    const selectedCategory = categoryFilter ? categoryFilter.value : ''; // Handle category page case
    const selectedState = stateFilter ? stateFilter.value : '';

    const filteredData = attractionsData.filter(attraction => {
        const categoryMatch = !selectedCategory || (attraction.categories && attraction.categories.includes(selectedCategory));
        const stateMatch = !selectedState || attraction.state === selectedState;
        return categoryMatch && stateMatch;
    });

    populateMapAndList(filteredData);

    // Zoom to state if a state is selected, otherwise reset view
    if (selectedState) {
        zoomToState(selectedState);
    } else if (!selectedCategory) { // Only reset fully if no category is selected either (relevant for home page)
         resetMapView();
    } else {
        // If only category selected, maybe fit bounds to those results?
         const categoryBounds = L.latLngBounds(filteredData.map(attr => [attr.lat, attr.lon]));
         if (map && categoryBounds.isValid()) {
             map.flyToBounds(categoryBounds, { padding: [50, 50]});
         }
    }
}

// --- Event Listeners ---
function setupEventListeners() {
    // Filter listeners
    if (categoryFilter && categoryFilter.tagName === 'SELECT') { // Only add if it's a dropdown (not hidden input on category page)
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
            // Prevent click on "Learn More" link from triggering map focus
            if (event.target.closest('.card-link')) {
                return;
            }

            const slug = card.dataset.slug;
            const marker = markers[slug];
            if (marker && map) {
                map.flyTo(marker.getLatLng(), 13); // Adjust zoom level as desired
                marker.openPopup();
            }
        });
    });
}

// --- Utility Functions ---
function hideLoadingIndicators() {
    if (listLoadingIndicator) listLoadingIndicator.style.display = 'none';
    if (mapLoadingIndicator) mapLoadingIndicator.style.display = 'none';
}
function showLoadingError() {
     if (mapElement) mapElement.innerHTML = '<p class="map-error">Failed to load map data or components. Please check console for errors.</p>';
     if (listViewContent) listViewContent.innerHTML = '<p class="list-error">Failed to load attractions list.</p>';
     hideLoadingIndicators();
}

// --- Make sure data is available globally ---
// 'attractionsData' should be populated by the inline script in the Nunjucks templates
// console.log("Attractions data loaded:", attractionsData ? attractionsData.length : 0);