---
layout: layout.njk
permalink: /lava-hot-springs/
title: Lava Hot Springs
---

<article class="attraction-detail container">
  <h2>Lava Hot Springs</h2>
  <div class="attraction-meta">
    
    <span class="location">Location: Lava Hot Springs, ID 83246</span>
  </div>
  <figure class="attraction-image">
    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Lava_Hot_Springs%2C_Idaho.jpg?v=1743964413073" alt="Lava Hot Springs, Idaho.jpg" loading="lazy">
  </figure>
  <div class="attraction-description">
    <h3>About Lava Hot Springs</h3>
    <p>Lava Hot Springs is a city along the Portneuf River in eastern Bannock County, Idaho, United States.</p>
  </div>
  
  {% set articleContent = collections.attractionArticles | getArticleForSlug('lava-hot-springs') %}
  {% if articleContent %}
  <div class="attraction-article">
    <h3>{{ articleContent.data.title }}</h3>
    <div class="article-content">
      {{ articleContent.content | safe }}
    </div>
  </div>
  {% endif %}
  
  
</article>