---
layout: layout.njk
permalink: /wall-drug-store/
title: Wall Drug Store
---

<article class="attraction-detail container">
  <h2>Wall Drug Store</h2>
  <div class="attraction-meta">
    <span class="address">Address: 510 Main St</span>
    <span class="location">Location: Wall, SD 57790</span>
  </div>
  <figure class="attraction-image">
    <img src="https://upload.wikimedia.org/wikipedia/commons/4/4d/Wall_Drug.JPG?v=1743964413063" alt="Wall Drug.JPG" loading="lazy">
  </figure>
  <div class="attraction-description">
    <h3>About Wall Drug Store</h3>
    <p>Famous for offering free ice water, now a sprawling tourist complex with shops, eateries, and quirky attractions.</p>
  </div>
  
  {% set articleContent = collections.attractionArticles | getArticleForSlug('wall-drug-store') %}
  {% if articleContent %}
  <div class="attraction-article">
    <h3>{{ articleContent.data.title }}</h3>
    <div class="article-content">
      {{ articleContent.content | safe }}
    </div>
  </div>
  {% endif %}
  
  
</article>