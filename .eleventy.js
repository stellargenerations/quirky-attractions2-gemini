// .eleventy.js
const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // Add date filter
  eleventyConfig.addFilter("date", function(date, format) {
    console.log("Date filter called with:", date, format);
    
    // If no date is provided, use current date
    if (!date) {
      date = new Date();
    }
    
    // Handle different date formats
    if (format === "year" || format === "yyyy") {
      return DateTime.fromJSDate(new Date(date)).toFormat("yyyy");
    }
    
    // If a specific format is provided, use it
    if (format) {
      return DateTime.fromJSDate(new Date(date)).toFormat(format);
    }
    
    // Default format
    return DateTime.fromJSDate(new Date(date)).toFormat("dd LLL yyyy");
  });
  
  // Add JSON filter
  eleventyConfig.addFilter("json", function(value) {
    return JSON.stringify(value);
  });
  
  // String includes method for templates
  eleventyConfig.addFilter("includes", function(string, substring) {
    if (typeof string !== 'string') {
      return false;
    }
    return string.includes(substring);
  });
  
  // Filter for getting all states from attractions data
  eleventyConfig.addFilter("getAllStates", function(attractions) {
    const states = new Set();
    if (attractions && Array.isArray(attractions)) {
      attractions.forEach(attraction => {
        if (attraction.state) {
          states.add(attraction.state);
        }
      });
    }
    return Array.from(states).sort();
  });
  
  // Filter for getting all categories from attractions data
  eleventyConfig.addFilter("getAllCategories", function(attractions) {
    const categories = new Set();
    if (attractions && Array.isArray(attractions)) {
      attractions.forEach(attraction => {
        if (attraction.categories && Array.isArray(attraction.categories)) {
          attraction.categories.forEach(category => {
            if (category) {
              categories.add(category);
            }
          });
        }
      });
    }
    return Array.from(categories).sort();
  });
  
  // Add slugify filter for URL creation
  eleventyConfig.addFilter("slugify", function(text) {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  });

  // Create collections with flat permalinks
  // Modify attraction pages collection to use flat URLs
  eleventyConfig.addCollection("attractionPages", function(collectionApi) {
    // Get all pages with an attraction front matter
    return collectionApi.getAll()
      .filter(item => item.data.attraction)
      .map(item => {
        // Create a flat URL structure
        const slug = item.data.attraction.slug || 
                    eleventyConfig.getFilter("slugify")(item.data.attraction.name);
        
        // Override the permalink to be at root level
        item.data.permalink = `/${slug}/`;
        
        return item;
      });
  });

  // Create category pages collection with flat URLs
  eleventyConfig.addCollection("categoryPages", function(collectionApi) {
    const allAttractions = collectionApi.getAll()
      .find(item => item.data.attractions)?.data.attractions || [];
    
    // Get unique categories
    const categories = new Set();
    allAttractions.forEach(attraction => {
      if (attraction.categories && Array.isArray(attraction.categories)) {
        attraction.categories.forEach(cat => {
          if (cat) categories.add(cat);
        });
      }
    });
    
    // Create a collection item for each category
    return Array.from(categories).map(category => {
      const slug = eleventyConfig.getFilter("slugify")(category);
      return {
        category: category,
        slug: slug,
        // Flat URL for category page
        permalink: `/category-${slug}/`
      };
    });
  });
  
  // Make sure Eleventy can find your files
  return {
    dir: {
      input: ".",
      output: "_site"
      // You can uncomment and customize these if needed
      // includes: "_includes",
      // layouts: "_includes",
      // data: "_data"
    }
  };
};