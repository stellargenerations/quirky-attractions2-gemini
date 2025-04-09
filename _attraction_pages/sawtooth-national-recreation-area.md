---
layout: layout.njk
permalink: /sawtooth-national-recreation-area/
title: Sawtooth National Recreation Area
---

<article class="attraction-detail container">
  <h2>Sawtooth National Recreation Area</h2>
  <div class="attraction-meta">
    <span class="address">Address: 5 North Fork Canyon Road</span>
    <span class="location">Location: Ketchum, ID 83340</span>
  </div>
  <figure class="attraction-image">
    <img src="https://upload.wikimedia.org/wikipedia/commons/9/9d/Sawtooth_Valley_ID1.jpg?v=1743964413070" alt="Sawtooth Valley ID1.jpg" loading="lazy">
  </figure>
  <div class="attraction-description">
    <h3>About Sawtooth National Recreation Area</h3>
    <p>The Sawtooth National Recreation Area (SNRA) is a national recreation area in central Idaho, United States that is managed as part of Sawtooth Nati...</p>
  </div>
  
  {% set articleContent = collections.attractionArticles | getArticleForSlug('sawtooth-national-recreation-area') %}
  {% if articleContent %}
  <div class="attraction-article">
    <h3>{{ articleContent.data.title }}</h3>
    <div class="article-content">
      {{ articleContent.content | safe }}
    </div>
  </div>
  {% endif %}
  
  
</article>