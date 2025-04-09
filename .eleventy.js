// .eleventy.js - Compatible configuration
require('dotenv').config();
const { DateTime } = require("luxon");
const fs = require("fs");
const path = require("path");

module.exports = function(eleventyConfig) {
  // PassthroughCopy - Copy static assets to the output folder
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("favicon.ico");

  // Add .htaccess for fallback routing if the file exists
  if (fs.existsSync(".htaccess")) {
    eleventyConfig.addPassthroughCopy(".htaccess");
  }

  // Add _redirects file for Netlify
  if (fs.existsSync("_redirects")) {
    eleventyConfig.addPassthroughCopy("_redirects");
  }

  eleventyConfig.addGlobalData("currentYear", new Date().getFullYear());

  // Debug the build process
  console.log("Starting Eleventy build process...");

  // Add JSON filter for outputting data to JavaScript
  eleventyConfig.addFilter("json", function(value) {
    return JSON.stringify(value);
  });

  // Date formatting filters
  eleventyConfig.addFilter("readableDate", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("LLL dd, yyyy");
  });

  eleventyConfig.addFilter("isoDate", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("yyyy-LL-dd");
  });

  eleventyConfig.addFilter("yearDashMonth", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("yyyy-LL");
  });

  // Add "year" shortcode
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  // Enhanced slugify filter with special character handling
  eleventyConfig.addFilter("slugify", function(str) {
    if (!str) return "";

    // Replace common special characters before slugifying
    let result = str.toString()
      .replace(/&/g, "-and-")        // Replace & with "and"
      .replace(/\+/g, "-plus-")      // Replace + with "plus"
      .replace(/@/g, "-at-")         // Replace @ with "at"
      .toLowerCase()                 // Convert to lowercase
      .replace(/[^\w\-]+/g, '-')     // Replace spaces and non-word chars with hyphens
      .replace(/--+/g, '-')          // Replace multiple hyphens with single hyphen
      .replace(/^-+/, '')            // Trim hyphens from start
      .replace(/-+$/, '');           // Trim hyphens from end

    console.log(`Slugifying "${str}" to "${result}"`);
    return result;
  });

  // Custom filters for attractions data
  eleventyConfig.addFilter("getAllCategories", function(attractions) {
    if (!attractions || !Array.isArray(attractions)) {
      console.warn("Warning: getAllCategories called with non-array:", attractions);
      return [];
    }

    const categoriesSet = new Set();
    attractions.forEach(attraction => {
      if (attraction.categories && Array.isArray(attraction.categories)) {
        attraction.categories.forEach(cat => {
          if (cat) categoriesSet.add(cat);
        });
      }
    });
    return Array.from(categoriesSet).sort();
  });

  eleventyConfig.addFilter("getAllStates", function(attractions) {
    if (!attractions || !Array.isArray(attractions)) {
      console.warn("Warning: getAllStates called with non-array:", attractions);
      return [];
    }

    const statesSet = new Set();
    attractions.forEach(attraction => {
      if (attraction.state) statesSet.add(attraction.state);
    });
    return Array.from(statesSet).sort();
  });

  eleventyConfig.addFilter("filterByCategory", function(attractions, categoryName) {
    if (!attractions || !Array.isArray(attractions)) {
      console.warn(`Warning: filterByCategory called with non-array:`, attractions);
      return [];
    }

    console.log(`Filtering ${attractions.length} attractions by category: ${categoryName}`);
    return attractions.filter(attr =>
      attr.categories && attr.categories.includes(categoryName)
    );
  });

  eleventyConfig.addFilter("filterByState", function(attractions, stateName) {
    if (!attractions || !Array.isArray(attractions)) {
      console.warn(`Warning: filterByState called with non-array:`, attractions);
      return [];
    }

    console.log(`Filtering ${attractions.length} attractions by state: ${stateName}`);
    return attractions.filter(attr => attr.state === stateName);
  });

  // Debug filter to help diagnose data issues
  eleventyConfig.addFilter("debugData", function(data) {
    console.log("DEBUG DATA:", JSON.stringify(data).substring(0, 100) + "...");
    return data;
  });

  // Add collection for attraction articles
  eleventyConfig.addCollection("attractionArticles", function(collectionApi) {
    return collectionApi.getFilteredByGlob("_attraction_articles/*.{md,html}");
  });

  // Add filter to get the article for a specific attraction by slug
  eleventyConfig.addFilter("getArticleForSlug", function(articles, slug) {
    if (!articles || !Array.isArray(articles)) {
      return null;
    }
    return articles.find(article => article.data.attraction_slug === slug);
  });

  // Helper function to get attractions data asynchronously
  async function getAttractionsData() {
    try {
      const attractionsModule = require('./_data/attractions.js');

      if (typeof attractionsModule === 'function') {
        console.log("Loading attractions from function...");
        return await attractionsModule();
      } else if (Array.isArray(attractionsModule)) {
        console.log("Loading attractions from array...");
        return attractionsModule;
      } else {
        console.warn("Attractions module doesn't return an array or function");
        return [];
      }
    } catch (error) {
      console.error("Error loading attractions data:", error);
      return [];
    }
  }

  // Generate categories data for pagination
  eleventyConfig.addCollection("categoryData", async function() {
    const attractions = await getAttractionsData();
    console.log(`Found ${attractions.length} attractions for category pages`);

    if (!attractions || !Array.isArray(attractions) || attractions.length === 0) {
      console.warn("No attractions data found for category pages");
      return [];
    }

    // Get unique categories from all attractions
    const categoriesSet = new Set();
    attractions.forEach(attraction => {
      if (attraction.categories && Array.isArray(attraction.categories)) {
        attraction.categories.forEach(cat => {
          if (cat) categoriesSet.add(cat);
        });
      }
    });

    const categories = Array.from(categoriesSet).sort();
    console.log(`Found ${categories.length} categories:`, categories);

    // Return category data for pagination with custom slug handling
    return categories.map(category => {
      // Create safe slugs for categories with special characters
      let slug = category.toString()
        .replace(/&/g, "-and-")       // Replace & with "and"
        .replace(/\+/g, "-plus-")     // Replace + with "plus"
        .toLowerCase()                // Convert to lowercase
        .replace(/[^\w\-]+/g, '-')    // Replace spaces and non-word chars with hyphens
        .replace(/--+/g, '-')         // Replace multiple hyphens with single hyphen
        .replace(/^-+/, '')           // Trim hyphens from start
        .replace(/-+$/, '');          // Trim hyphens from end

      console.log(`Custom slugify: "${category}" -> "${slug}"`);

      return {
        category: category,
        slug: slug
      };
    });
  });

  // Generate states data for pagination
  eleventyConfig.addCollection("stateData", async function() {
    const attractions = await getAttractionsData();
    console.log(`Found ${attractions.length} attractions for state pages`);

    if (!attractions || !Array.isArray(attractions) || attractions.length === 0) {
      console.warn("No attractions data found for state pages");
      return [];
    }

    // Get unique states from all attractions
    const statesSet = new Set();
    attractions.forEach(attraction => {
      if (attraction.state) statesSet.add(attraction.state);
    });

    const states = Array.from(statesSet).sort();
    console.log(`Found ${states.length} states:`, states);

    // Return state data for pagination
    return states.map(state => {
      return {
        state: state,
        slug: eleventyConfig.getFilter("slugify")(state)
      };
    });
  });


  // Return the 11ty configuration object
  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data"
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};