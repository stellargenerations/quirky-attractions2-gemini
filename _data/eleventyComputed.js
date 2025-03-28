module.exports = {
  eleventyComputed: {
    categoryAttractions: data => {
      if (!data.attractions || !data.categoryData) return [];
      
      return data.attractions.filter(item => 
        item && 
        item.categories && 
        Array.isArray(item.categories) && 
        item.categories.includes(data.categoryData)
      );
    }
  }
};