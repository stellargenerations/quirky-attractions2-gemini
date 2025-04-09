---
layout: layout.njk
permalink: /hole-n-the-rock/
title: Hole N" The Rock
---

<article class="attraction-detail container">
  <h2>Hole N" The Rock</h2>
  <div class="attraction-meta">
    <span class="address">Address: 11037 US-191</span>
    <span class="location">Location: Moab, UT 84532</span>
  </div>
  <figure class="attraction-image">
    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5a/Hole_N_The_Rock.jpg?v=1743964413068" alt="Hole N The Rock.jpg" loading="lazy">
  </figure>
  <div class="attraction-description">
    <h3>About Hole N" The Rock</h3>
    <p>A 5,000 square foot home carved out of a massive sandstone rock formation.</p>
  </div>
  
  {% set articleContent = collections.attractionArticles | getArticleForSlug('hole-n-the-rock') %}
  {% if articleContent %}
  <div class="attraction-article">
    <h3>{{ articleContent.data.title }}</h3>
    <div class="article-content">
      {{ articleContent.content | safe }}
    </div>
  </div>
  {% endif %}
  
  
</article>