module.exports = function(attractions) {
    if (!attractions || !Array.isArray(attractions)) return [];
    
    let categories = new Set();
    attractions.forEach(item => {
        // Added checks for robustness
        if (item && item.categories && Array.isArray(item.categories)) {
            item.categories.forEach(cat => {
                if (cat) { // Ensure category isn't empty
                    categories.add(cat);
                }
            });
        }
    });
    
    return [...categories].sort();
};