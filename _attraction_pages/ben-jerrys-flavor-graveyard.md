---
layout: layout.njk
permalink: /ben-jerrys-flavor-graveyard/
title: Ben & Jerry's Flavor Graveyard
---

<article class="attraction-detail container">
  <h2>Ben & Jerry's Flavor Graveyard</h2>
  <div class="attraction-meta">
    <span class="address">Address: 1281 Waterbury-Stowe Rd</span>
    <span class="location">Location: Waterbury, VT 5676</span>
  </div>
  <figure class="attraction-image">
    <img src="https://upload.wikimedia.org/wikipedia/commons/1/1f/Ben_and_Jerry%27s_Flavor_Graveyard_Waterbury.jpg?v=1743964413068" alt="Ben and Jerry's Flavor Graveyard Waterbury.jpg" loading="lazy">
  </figure>
  <div class="attraction-description">
    <h3>About Ben & Jerry's Flavor Graveyard</h3>
    <p>A whimsical graveyard on the grounds of the Ben & Jerry's factory, memorializing discontinued ice cream flavors.</p>
  </div>
  
  {% set articleContent = collections.attractionArticles | getArticleForSlug('ben-jerrys-flavor-graveyard') %}
  {% if articleContent %}
  <div class="attraction-article">
    <h3>{{ articleContent.data.title }}</h3>
    <div class="article-content">
      {{ articleContent.content | safe }}
    </div>
  </div>
  {% endif %}
  
  
</article>