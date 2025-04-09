// js/main.js

// Defensive check at the beginning
if (typeof attractionsData === 'undefined' || !Array.isArray(attractionsData)) {
    console.error('attractionsData is not defined or not an array! Using empty array instead.');
    var attractionsData = [];
}

// Log some information about the data we have
console.log('Main.js loaded with', attractionsData.length, 'attractions');
if (attractionsData.length > 0) {
    console.log('First attraction sample:', attractionsData[0]);
}

// --- Variables we need ---
// Make map globally accessible for state pages
window.map = null;
let attractionsLayer;
const markers = {};
const initialCenter = [38.0283, -98.5795]; // Center of the continental US
const initialZoom = 5; // Zoom level that shows most of the continental US

// --- Get elements from the page ---
const mapElement = document.getElementById('map');
const listViewContent = document.getElementById('list-view-content');
const categoryFilter = document.getElementById('category-filter');
const stateFilter = document.getElementById('state-filter');
const zoomOutButton = document.getElementById('zoom-out-btn');
const noResultsMessage = document.getElementById('no-results');
const listLoadingIndicator = document.querySelector('.list-loading');
const mapLoadingIndicator = document.querySelector('.map-loading');

// Wait for DOM to be ready and Leaflet to be loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content loaded in main.js");

    // Make sure Leaflet is loaded before trying to use it
    if (typeof L === 'undefined') {
        console.error("Leaflet (L) is not defined! Check if the library loaded correctly.");
        showLoadingError();
        return;
    }

    // Create a custom popup class that positions popups based on their location on the map
    const CustomPopup = L.Popup.extend({
        _updatePosition: function() {
            if (!this._map) { return; }

            var pos = this._map.latLngToLayerPoint(this._latlng),
                offset = L.point(this.options.offset),
                anchor = this._getAnchor();

            // Get map center and determine if we're in the top half
            var mapCenter = this._map.getCenter();
            var bounds = this._map.getBounds();
            var isTopHalf = false;

            if (bounds) {
                var northBound = bounds.getNorth();
                var southBound = bounds.getSouth();
                var midPoint = southBound + ((northBound - southBound) / 2);
                isTopHalf = this._latlng.lat > midPoint;

                // Debug
                console.log('Popup at:', this._latlng.lat, 'Map midpoint:', midPoint, 'Is top half:', isTopHalf);

                // Adjust offset based on position
                if (isTopHalf) {
                    // If in top half, position popup below the marker
                    offset.y = Math.abs(offset.y);
                    this._container.classList.add('popup-below');
                } else {
                    // If in bottom half, position popup above the marker
                    offset.y = -Math.abs(offset.y);
                    this._container.classList.remove('popup-below');
                }
            }

            // Position the popup
            if (this._zoomAnimated) {
                L.DomUtil.setPosition(this._container, pos.add(anchor).add(offset));
            } else {
                offset = offset.add(pos).add(anchor);
            }

            // Bottom position of popup when using standard offset
            var bottom = this._containerBottom = -offset.y;

            // Adjust if we're showing popup below
            if (isTopHalf) {
                bottom = -offset.y + this._container.offsetHeight;
            }

            // Set position
            var left = this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x;

            // Position the triangle
            if (this._container) {
                this._container.style.bottom = bottom + 'px';
                this._container.style.left = left + 'px';
            }
        }
    });

    // Replace the standard popup with our custom one
    L.customPopup = function(options, source) {
        return new CustomPopup(options, source);
    };

    // Now we can safely define Leaflet-dependent variables
    // Define US bounds but we won't enforce them strictly
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

    // Create a default icon for markers using CDN
    const defaultIcon = L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    if (mapElement && typeof attractionsData !== 'undefined') {
        hideLoadingIndicators();
        initMap();

        // Fix all image URLs before showing anything
        attractionsData = fixImageUrls(attractionsData);

        populateMapAndList(attractionsData);
        setupEventListeners();

        // Check if we're on a state page and zoom to that state
        // Wait for map to be fully initialized before attempting to zoom
        setTimeout(() => {
            console.log('Calling detectAndZoomToState after delay...');
            detectAndZoomToState();
        }, 1500);
    } else {
        console.error("Map element or attractions data not found!");
        if (!mapElement) console.error("Map element is missing");
        if (typeof attractionsData === 'undefined') console.error("Attractions data is missing");
        showLoadingError();
    }

    // --- Map Functions ---

    function initMap() {
        try {
            console.log('Initializing map...');

            // Define US bounds with some padding
            const usBounds = L.latLngBounds(
                L.latLng(24.396308, -125.000000), // Bottom left corner
                L.latLng(49.384358, -66.934570)  // Top right corner
            );

            // Assign to both local and global variables
            window.map = map = L.map('map', {
                center: initialCenter,
                zoom: initialZoom,
                minZoom: 4,
                maxZoom: 9,
                fadeAnimation: true,
                zoomAnimation: true
            });

            // Close popups when clicking on the map (but not on markers)
            map.on('click', function() {
                // Reset all markers' click state
                Object.values(markers).forEach(m => {
                    m.wasClickOpened = false;
                });
            });

            // Add map load complete event
            map.on('load', function() {
                console.log('Map fully loaded');
            });

            // Our custom popup class will handle positioning automatically
            console.log('Map initialized successfully');

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

        // Use the CDN-based defaultIcon
        const marker = L.marker([attraction.lat, attraction.lon], {
            icon: defaultIcon,
            categories: attraction.categories,
            state: attraction.state,
            slug: attraction.slug
        });

        // Create state slug for the link
        const stateSlug = slugify(attraction.state);

        // Determine content complexity to adjust popup options
        const hasCategories = attraction.categories &&
                              Array.isArray(attraction.categories) &&
                              attraction.categories.length > 0;

        const categoryCount = hasCategories ? attraction.categories.length : 0;

        // Create category badges HTML
        let categoryBadgesHTML = '';
        if (hasCategories) {
            categoryBadgesHTML = '<div class="card-categories">';
            attraction.categories.forEach(category => {
                const categorySlug = slugify(category);
                categoryBadgesHTML += `
                    <a href="/${categorySlug}-attractions/" class="category-badge">${category}</a>
                `;
            });
            categoryBadgesHTML += '</div>';
        }

        // Adapt description length based on content complexity
        let descriptionLength = 120; // Default

        // Reduce description length if we have many categories
        if (categoryCount > 3) {
            descriptionLength = 80;
        } else if (categoryCount > 0) {
            descriptionLength = 100;
        }

        // Create a short description (trimmed for popup)
        const shortDescription = attraction.description && attraction.description.length > descriptionLength
            ? attraction.description.substring(0, descriptionLength) + '...'
            : (attraction.description || 'No description available.');

            const popupContent = `
            <div class="popup-content ${categoryCount > 0 ? 'has-categories' : ''} ${categoryCount > 3 ? 'many-categories' : ''}">
                <div class="popup-image-container">
                    <img src="${attraction.imageUrl}" alt="${attraction.imageAlt || attraction.name}"
                         loading="lazy" class="popup-image"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="popup-image-error" style="display: none;">Image not available</div>
                </div>
                <h3>${attraction.name}</h3>
                ${attraction.streetAddress ? `<p class="address-info">${attraction.streetAddress}</p>` : ''}
                <p class="location-info"><a href="/${stateSlug}-attractions/" class="state-link">${attraction.locationCity}, ${attraction.state}${attraction.zipCode ? ' ' + attraction.zipCode : ''}</a></p>
                <p class="popup-description">${shortDescription}</p>
                <a href="/${attraction.slug}/" class="learn-more-link">Read Full Article</a>
                ${categoryBadgesHTML}
            </div>
        `;

        // Calculate a reasonable popup size based on content
        const baseHeight = 350; // Base popup height
        const perCategoryHeight = 25; // Additional height per category
        const adjustedMaxHeight = baseHeight + (categoryCount * perCategoryHeight);

        // Configure popup options for better visibility
        const popupOptions = {
            autoPan: true,
            autoPanPadding: [50, 50],
            keepInView: true,
            minWidth: 280,
            maxWidth: 320
            // We'll set the offset when binding the popup
        };

        // Don't set fixed maxHeight to allow natural sizing
        // Let CSS handle scrolling if needed

        // Create a custom popup that will position itself based on its location on the map
        const popup = L.customPopup(popupOptions)
            .setContent(popupContent);

        // Bind the popup to the marker
        marker.bindPopup(popup);

        // Track if popup was opened by click (for mouseover/mouseout behavior)
        marker.wasClickOpened = false;

        // Variable to store timeout for delayed popup closing
        let popupCloseTimeout;

        // Show popup on mouseover
        marker.on('mouseover', function() {
            // Clear any existing timeout to prevent popup from closing
            if (popupCloseTimeout) {
                clearTimeout(popupCloseTimeout);
                popupCloseTimeout = null;
            }
            this.openPopup();
        });

        // Hide popup on mouseout unless it was opened by click or mouse is over popup
        marker.on('mouseout', function(e) {
            // Don't close immediately - set a timeout
            if (!this.wasClickOpened) {
                popupCloseTimeout = setTimeout(() => {
                    // Only close if we're not hovering over the popup
                    if (!isMouseOverPopup()) {
                        this.closePopup();
                    }
                }, 300); // 300ms delay gives time to move mouse to popup
            }
        });

        // Function to check if mouse is over a popup
        function isMouseOverPopup() {
            const popups = document.querySelectorAll('.leaflet-popup');
            for (let i = 0; i < popups.length; i++) {
                if (popups[i].matches(':hover')) {
                    return true;
                }
            }
            return false;
        }

        // Add event listeners to the popup to keep it open when hovered
        marker.on('popupopen', function(e) {
            const popup = e.popup;
            const container = popup._container;

            if (container) {
                // When mouse enters popup, clear the close timeout
                container.addEventListener('mouseenter', function() {
                    if (popupCloseTimeout) {
                        clearTimeout(popupCloseTimeout);
                        popupCloseTimeout = null;
                    }
                });

                // When mouse leaves popup, close it if it wasn't clicked
                container.addEventListener('mouseleave', function() {
                    if (!marker.wasClickOpened) {
                        marker.closePopup();
                    }
                });
            }
        });

        // Track click state for popups
        marker.on('click', function() {
            this.wasClickOpened = true;

            // Reset all other markers' click state
            Object.values(markers).forEach(m => {
                if (m !== this) m.wasClickOpened = false;
            });
        });

        // Reset click state when popup is manually closed
        marker.on('popupclose', function() {
            this.wasClickOpened = false;
        });

        // After popup is opened, dynamically adjust height based on actual content
        marker.on('popupopen', function(popup) {
            const popupElement = popup.popup._container;
            if (popupElement) {
                const contentElement = popupElement.querySelector('.leaflet-popup-content');
                const contentHeight = contentElement.scrollHeight;

                // If content is not too big, remove scrollbar
                if (contentHeight <= window.innerHeight * 0.7) {
                    contentElement.style.overflow = 'visible';
                    contentElement.style.maxHeight = 'none';
                } else {
                    // If content is too big, add scrollbar and limit height
                    contentElement.style.overflow = 'auto';
                    contentElement.style.maxHeight = Math.min(adjustedMaxHeight, window.innerHeight * 0.7) + 'px';
                }
            }
        });

        markers[attraction.slug] = marker;
        return marker;
    }

    // Make zoomToState globally accessible for state pages
    window.zoomToState = function(stateName) {
        console.log(`zoomToState called with: ${stateName}`);

        if (!stateName) {
            console.warn('No state name provided to zoomToState');
            resetMapView();
            return;
        }

        if (!map) {
            console.warn('Map not initialized yet');
            return;
        }

        // Find attractions for this state
        const stateAttractions = attractionsData.filter(attr => {
            // Case-insensitive comparison
            return attr.state.toLowerCase() === stateName.toLowerCase();
        });

        console.log(`Found ${stateAttractions.length} attractions for state: ${stateName}`);

        if (stateAttractions.length === 0) {
            console.warn(`No attractions found for state: ${stateName}`);
            resetMapView();
            return;
        }

        // Close any open popups and reset click states
        map.closePopup();
        Object.values(markers).forEach(m => {
            if (m) m.wasClickOpened = false;
        });

        // Handle special edge cases
        const edgeStates = {
            'WA': true, 'OR': true, 'CA': true,  // West coast
            'ME': true, 'NH': true, 'VT': true, 'MA': true, 'RI': true, 'CT': true,  // Northeast
            'FL': true, 'TX': true,  // South edges
            'AK': true, 'HI': true   // Non-contiguous
        };

        // Check if this is an edge state (use first 2 letters for state code)
        const stateCode = stateName.substring(0, 2).toUpperCase();
        const isEdgeState = edgeStates[stateCode] || false;

        // Calculate the center point of the state attractions
        const lats = stateAttractions.map(attr => attr.lat);
        const lons = stateAttractions.map(attr => attr.lon);
        const centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
        const centerLon = lons.reduce((sum, lon) => sum + lon, 0) / lons.length;

        // Calculate the state bounds
        const stateBounds = L.latLngBounds(stateAttractions.map(attr => [attr.lat, attr.lon]));

        // Get appropriate zoom level
        const zoomLevel = stateZoomLevels[stateCode] || stateZoomLevels.default;

        if (map && stateBounds.isValid()) {
            if (isEdgeState && stateAttractions.length > 1) {
                // For edge states with multiple attractions, use setView with the calculated center
                // and calculate padding that fits all markers

                // Temporarily remove maxBounds constraint
                const originalMaxBounds = map.options.maxBounds;
                const originalMaxBoundsViscosity = map.options.maxBoundsViscosity;

                map.setMaxBounds(null);

                // Use flyTo for smoother animation to the center point
                map.flyTo([centerLat, centerLon], zoomLevel, {
                    animate: true,
                    duration: 0.5  // Reduced from 0.75 for faster animation
                });

                // Add a slight delay before restoring the bounds
                setTimeout(() => {
                    map.setMaxBounds(originalMaxBounds);
                    map.options.maxBoundsViscosity = originalMaxBoundsViscosity;
                }, 600);  // Reduced from 1000 for faster restoration
            } else {
                // For non-edge states, fitBounds works well
                map.fitBounds(stateBounds, {
                    padding: [100, 100],
                    maxZoom: zoomLevel,
                    animate: true,
                    duration: 0.5  // Reduced from 0.75 for faster animation
                });
            }
        } else if (stateAttractions.length === 1) {
            // For single attractions, especially in edge states
            // Temporarily remove maxBounds constraint
            const originalMaxBounds = map.options.maxBounds;
            const originalMaxBoundsViscosity = map.options.maxBoundsViscosity;

            map.setMaxBounds(null);

            // Use flyTo for a single point
            map.flyTo(
                [stateAttractions[0].lat, stateAttractions[0].lon],
                zoomLevel + 2,
                {
                    animate: true,
                    duration: 0.5  // Reduced from 0.75 for faster animation
                }
            );

            // Add a slight delay before restoring the bounds
            setTimeout(() => {
                map.setMaxBounds(originalMaxBounds);
                map.options.maxBoundsViscosity = originalMaxBoundsViscosity;
            }, 600);  // Reduced from 1000 for faster restoration
        } else {
            console.warn("Couldn't figure out where to zoom for state:", stateName);
            resetMapView();
        }
    }

    function resetMapView() {
        if (map) {
            // Close any open popups and reset click states
            map.closePopup();
            Object.values(markers).forEach(m => {
                if (m) m.wasClickOpened = false;
            });

            // Simply reset to initial center and zoom
            map.setView(initialCenter, initialZoom, {
                animate: true,
                duration: 0.5
            });
        }
    }

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

        // Close any open popups and reset click states
        map.closePopup();
        Object.values(markers).forEach(m => {
            if (m) m.wasClickOpened = false;
        });

        // Zoom to the right place based on filters
        if (selectedState) {
            zoomToState(selectedState);
        } else if (!selectedCategory) {
            resetMapView();
        } else {
            const categoryBounds = L.latLngBounds(filteredData.map(attr => [attr.lat, attr.lon]));
            if (map && categoryBounds.isValid()) {
                map.fitBounds(categoryBounds, {
                    padding: [100, 100],
                    animate: true,
                    duration: 0.75
                });
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
                // Don't do anything if they clicked the Learn More link, a category link, or a state link
                if (event.target.closest('.card-link') ||
                    event.target.closest('.category-badge') ||
                    event.target.closest('.state-link')) {
                    return;
                }

                const slug = card.dataset.slug;
                const marker = markers[slug];
                if (marker && map) {
                    // Scroll to the map first
                    mapElement.scrollIntoView({ behavior: 'smooth' });

                    // Small delay to ensure smooth transition
                    setTimeout(() => {
                        // Get the marker location
                        const targetLatLng = marker.getLatLng();

                        // Detect if we're near the edge of the map
                        const currentBounds = map.getBounds();
                        const northEdge = currentBounds.getNorth();
                        const southEdge = currentBounds.getSouth();
                        const eastEdge = currentBounds.getEast();
                        const westEdge = currentBounds.getWest();

                        // Check if marker is near an edge (within 10% of the view)
                        const latRange = northEdge - southEdge;
                        const lonRange = eastEdge - westEdge;
                        const isNearNorth = (targetLatLng.lat > northEdge - latRange * 0.1);
                        const isNearSouth = (targetLatLng.lat < southEdge + latRange * 0.1);
                        const isNearEast = (targetLatLng.lng > eastEdge - lonRange * 0.1);
                        const isNearWest = (targetLatLng.lng < westEdge + lonRange * 0.1);
                        const isNearEdge = isNearNorth || isNearSouth || isNearEast || isNearWest;

                        // First close any open popups
                        map.closePopup();

                        // Temporarily remove maxBounds constraint for edge markers
                        if (isNearEdge) {
                            const originalMaxBounds = map.options.maxBounds;
                            const originalMaxBoundsViscosity = map.options.maxBoundsViscosity;

                            map.setMaxBounds(null);

                            // Calculate where to center the map
                            let offsetLat = targetLatLng.lat;
                            let offsetLng = targetLatLng.lng;

                            // Apply offsets based on which edge we're near
                            if (isNearNorth) offsetLat -= 0.07; // Offset south for northern markers
                            if (isNearSouth) offsetLat += 0.03; // Offset north for southern markers
                            if (isNearEast) offsetLng -= 0.07;  // Offset west for eastern markers
                            if (isNearWest) offsetLng += 0.03;  // Offset east for western markers

                            // Pan to the offset position
                            map.flyTo([offsetLat, offsetLng], 13, {
                                animate: true,
                                duration: 0.75
                            });

                            // Open popup after animation completes
                            setTimeout(() => {
                                marker.openPopup();

                                // Restore bounds after a longer delay to ensure popup is visible
                                setTimeout(() => {
                                    map.setMaxBounds(originalMaxBounds);
                                    map.options.maxBoundsViscosity = originalMaxBoundsViscosity;
                                }, 2000);
                            }, 800);
                        } else {
                            // For markers not near the edge, use a simpler approach
                            // Calculate where to center the map - offset south for better popup visibility
                            const offsetLatLng = L.latLng(
                                targetLatLng.lat - 0.05, // Standard offset south
                                targetLatLng.lng
                            );

                            // Pan to the offset position
                            map.flyTo(offsetLatLng, 13, {
                                animate: true,
                                duration: 0.75
                            });

                            // Open popup after animation completes
                            setTimeout(() => {
                                marker.openPopup();
                            }, 800);
                        }
                    }, 300); // 300ms delay for smooth scroll before zooming
                }
            });
        });
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
            fixed.imageUrl = 'https://via.placeholder.com/300x200?text=No+Image';
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

// --- List View Functions ---
function createListCard(attraction) {
    if (!attraction) return '';

    // Make description shorter for cards
    const shortDescription = attraction.description.length > 100
        ? attraction.description.substring(0, 100) + '...'
        : attraction.description;

    // Create the category badges HTML
    let categoryBadgesHTML = '';
    if (attraction.categories && Array.isArray(attraction.categories) && attraction.categories.length > 0) {
        categoryBadgesHTML = '<span class="card-categories">';
        attraction.categories.forEach((category, index) => {
            const categorySlug = slugify(category);
            categoryBadgesHTML += `
                <a href="/${categorySlug}-attractions/" class="category-badge">${category}</a>
            `;
        });
        categoryBadgesHTML += '</span>';
    }

    // Create a slug for the state link
    const stateSlug = slugify(attraction.state);

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
                <p class="card-location">
                    <a href="/${stateSlug}-attractions/" class="state-link">${attraction.locationCity}, ${attraction.state}</a>
                </p>
                <p class="card-description">${shortDescription}</p>
                <div class="card-links">
                    <a href="/${attraction.slug}/" class="card-link">Read Article</a>
                    ${categoryBadgesHTML}
                </div>
            </div>
        </div>
    `;
}

// Helper function to create URL-friendly slugs (same as in your data file)
function slugify(str) {
    if (!str) return "";
    return str.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
}

// --- Helper Functions ---
function detectAndZoomToState() {
    // Method 1: Check for data-state attribute on the map element (most reliable)
    if (mapElement && mapElement.dataset.state) {
        const stateName = mapElement.dataset.state.trim();
        console.log(`Detected state from data attribute: ${stateName}`);

        // Add a slight delay to ensure the map is fully loaded
        setTimeout(() => {
            console.log(`Zooming to state: ${stateName}`);
            zoomToState(stateName);
        }, 1000); // Increased delay for reliability
        return;
    }

    // Method 2: Check if there's a state filter with a pre-selected value
    if (document.getElementById('filter-heading')) {
        const filterHeading = document.getElementById('filter-heading').textContent;
        const stateMatch = filterHeading.match(/Filter\s+([\w\s]+)\s+Attractions/);

        if (stateMatch && stateMatch[1]) {
            const stateName = stateMatch[1].trim();
            console.log(`Detected state page for: ${stateName}`);

            // Add a slight delay to ensure the map is fully loaded
            setTimeout(() => {
                console.log(`Zooming to state: ${stateName}`);
                zoomToState(stateName);
            }, 1000);
            return;
        }
    }

    // Method 3: Check the URL for state pattern
    const urlPath = window.location.pathname;
    const stateUrlMatch = urlPath.match(/\/(\w+)-attractions\//i);

    if (stateUrlMatch && stateUrlMatch[1]) {
        // Convert slug back to state name
        const stateSlug = stateUrlMatch[1];
        console.log(`Detected state slug from URL: ${stateSlug}`);

        // Find the state by comparing slugs
        const matchingState = attractionsData.find(attr => {
            const attrStateSlug = attr.state.toLowerCase().replace(/\s+/g, '-');
            return attrStateSlug === stateSlug;
        });

        if (matchingState) {
            console.log(`Resolved state from URL: ${matchingState.state}`);

            // Add a slight delay to ensure the map is fully loaded
            setTimeout(() => {
                console.log(`Zooming to state: ${matchingState.state}`);
                zoomToState(matchingState.state);
            }, 1000);
            return;
        }
    }
}

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