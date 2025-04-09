---
layout: layout.njk
permalink: /haines-shoe-house/
title: Haines Shoe House
---

<article class="attraction-detail container">
  <h2>Haines Shoe House</h2>
  <div class="attraction-meta">
    <span class="address">Address: 197 Shoe House Rd</span>
    <span class="location">Location: Hallam, PA 17406</span>
  </div>
  <figure class="attraction-image">
    <img src="https://upload.wikimedia.org/wikipedia/commons/0/0f/Haines_Shoe_House%2C_York_Pa.jpg?v=1743964413068" alt="Haines Shoe House, York Pa.jpg" loading="lazy">
  </figure>
  <div class="attraction-description">
    <h3>About Haines Shoe House</h3>
    <p>A house built in the shape of a work boot in 1948 by shoe salesman Mahlon Haines.</p>
  </div>
  
  {% set articleContent = collections.attractionArticles | getArticleForSlug('haines-shoe-house') %}
  {% if articleContent %}
  <div class="attraction-article">
    <h3>{{ articleContent.data.title }}</h3>
    <div class="article-content">
      {{ articleContent.content | safe }}
    </div>
  </div>
  {% endif %}
  
  
</article>