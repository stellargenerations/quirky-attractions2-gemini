// .eleventy.js - Full Configuration
const { DateTime } = require("luxon"); // For date formatting if needed later
const slugifyLib = require("slugify"); // Use different variable name for the library

module.exports = function(eleventyConfig) {

    // --- Passthrough Copies ---
    // Copy CSS, JS, and Images folders to the output directory
    eleventyConfig.addPassthroughCopy("css");
    eleventyConfig.addPassthroughCopy("js");
    eleventyConfig.addPassthroughCopy("img"); // If you add any static images in `/img`
    // Copy Leaflet's CSS and images from node_modules
    eleventyConfig.addPassthroughCopy({"node_modules/leaflet/dist/leaflet.css": "css/leaflet.css"});
    eleventyConfig.addPassthroughCopy({"node_modules/leaflet/dist/images": "img/leaflet"}); // Leaflet marker images

    // --- Custom Filters ---
    // Slugify filter
    eleventyConfig.addFilter("slugify", function(str) { // Keep the filter name "slugify"
        if (!str) return "";
        return slugifyLib(str, { // Use the library via slugifyLib
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g // Remove problematic characters
        });
    });

    // Filter to get unique categories from attractions data
    eleventyConfig.addFilter("getAllCategories", attractions => {
        if (!attractions || !Array.isArray(attractions)) return []; // Add robustness check
        let allCategories = new Set();
        attractions.forEach(item => {
            // Check if item exists and has categories array
            if (item && item.categories && Array.isArray(item.categories)) {
                item.categories.forEach(category => {
                    if (category) { // Ensure category is not empty/null
                        allCategories.add(category);
                    }
                });
            }
        });
        return [...allCategories].sort();
    });

    // Filter to get unique states from attractions data
     eleventyConfig.addFilter("getAllStates", attractions => {
         if (!attractions || !Array.isArray(attractions)) return []; // Add robustness check
        let allStates = new Set();
        attractions.forEach(item => {
            // Check if item exists and has a state property
            if (item && item.state) {
                allStates.add(item.state);
            }
        });
        return [...allStates].sort();
    });

    // Filter to dump data as JSON (useful for debugging or passing to JS)
    eleventyConfig.addFilter("jsonDump", function(value) {
        try {
            return JSON.stringify(value);
        } catch (e) {
            console.error("Error in jsonDump filter:", e);
            return "{}"; // Return empty object string on error
        }
    });

    // --- Shortcodes ---
    // Shortcode for current year (useful for footers)
    eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

    // --- Computed Data ---
    // Define computed data, specifically for category pages
    // Using addComputedData as addNunjucksComputed caused issues previously
    eleventyConfig.addComputedData("categoryPageData", (data) => {
        // This function runs for each page. Check if it's a category page.
        // data.categoryData comes from the pagination alias in categories/category.njk
        if (data.categoryData && data.attractions) {
            const currentCategory = data.categoryData;

            // Filter attractions for the current category
            const categoryAttractions = data.attractions.filter(item =>
                item && item.categories && Array.isArray(item.categories) && item.categories.includes(currentCategory)
            );

            // These values will be added to the page's data cascade
            return {
                title: `Category: ${currentCategory}`, // Sets page title
                breadcrumbCategory: currentCategory, // For breadcrumbs
                categoryAttractions: categoryAttractions, // Filtered list for the template
                description: `Explore quirky roadside attractions in the category: ${currentCategory}.` // Sets meta description
            };
        }
        // If not a category page or data is missing, return null or empty object
        return null;
    });

    // --- Base Config Return ---
    // Return the main configuration object for Eleventy
    return {
        dir: {
            input: ".",          // Root is source
            includes: "_includes", // Template partials
            data: "_data",         // Global data files
            output: "_site"        // Build output folder
        },
        passthroughFileCopy: true, // Enable passthrough copy
        templateFormats: ["njk", "md", "html"], // File types Eleventy will process
        htmlTemplateEngine: "njk", // Use Nunjucks for .html files
        markdownTemplateEngine: "njk" // Use Nunjucks within .md files
    };
};