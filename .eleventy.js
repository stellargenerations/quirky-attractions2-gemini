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
  
  // IMPORTANT: Direct method to manually create all attraction pages
  // This writes actual files to disk that Eleventy will process
  getAttractionsData().then(attractions => {
    if (!attractions || attractions.length === 0) {
      console.warn("No attractions found for direct file creation");
      return;
    }
    
    console.log(`Setting up direct template files for ${attractions.length} attractions`);
    
    try {
      // Create directory if it doesn't exist
      const dir = '_attraction_pages';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write a template file for each attraction
      attractions.forEach(attraction => {
        const filePath = path.join(dir, `${attraction.slug}.md`);
        const content = `---
layout: layout.njk
permalink: /${attraction.slug}/
title: ${attraction.name}
---

<article class="attraction-detail container">
  <h2>${attraction.name}</h2>
  <div class="attraction-meta">
    ${attraction.streetAddress ? `<span class="address">Address: ${attraction.streetAddress}</span>` : ''}
    <span class="location">Location: ${attraction.locationCity}, ${attraction.state} ${attraction.zipCode || ''}</span>
  </div>
  <figure class="attraction-image">
    <img src="${attraction.imageUrl}" alt="${attraction.imageAlt}" loading="lazy">
  </figure>
  <div class="attraction-description">
    <h3>About ${attraction.name}</h3>
    <p>${attraction.description}</p>
  </div>
  ${attraction.websiteLink ? `<div class="attraction-website">
    <a href="${attraction.websiteLink}" target="_blank" rel="noopener noreferrer">Visit Website</a>
  </div>` : ''}
</article>`;
        
        fs.writeFileSync(filePath, content);
        console.log(`Created attraction template: ${filePath}`);
      });
    } catch (error) {
      console.error("Error creating attraction template files:", error);
    }
  });
  
  // Development server configuration
  eleventyConfig.setServerOptions({
    port: 8080,
    watch: ['css/**/*.css', 'js/**/*.js', 'img/**/*', '*.njk', '_attraction_pages/**/*.md']
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