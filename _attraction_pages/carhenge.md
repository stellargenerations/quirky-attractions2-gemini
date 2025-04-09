---
layout: layout.njk
permalink: /carhenge/
title: Carhenge
---

<article class="attraction-detail container">
  <h2>Carhenge</h2>
  <div class="attraction-meta">
    <span class="address">Address: 2151 Co Rd 59</span>
    <span class="location">Location: Alliance, NE 69301</span>
  </div>
  <figure class="attraction-image">
    <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Carhenge%2C_Alliance%2C_NE%2C_Yellow_Car.jpg?v=1743964413063" alt="Carhenge, Alliance, NE, Yellow Car.jpg" loading="lazy">
  </figure>
  <div class="attraction-description">
    <h3>About Carhenge</h3>
    <p>A replica of England's Stonehenge constructed entirely from vintage American automobiles painted gray.</p>
  </div>
  
  {% set articleContent = collections.attractionArticles | getArticleForSlug('carhenge') %}
  {% if articleContent %}
  <div class="attraction-article">
    <h3>{{ articleContent.data.title }}</h3>
    <div class="article-content">
      {{ articleContent.content | safe }}
    </div>
  </div>
  {% endif %}
  
  
</article>