---
layout: layout.njk
permalink: /winchester-mystery-house/
title: Winchester Mystery House
---

<article class="attraction-detail container">
  <h2>Winchester Mystery House</h2>
  <div class="attraction-meta">
    <span class="address">Address: 525 S Winchester Blvd</span>
    <span class="location">Location: San Jose, CA 95128</span>
  </div>
  <figure class="attraction-image">
    <img src="https://upload.wikimedia.org/wikipedia/commons/9/94/Winchester_Mystery_House.jpg?v=1743964413064" alt="Winchester Mystery House.jpg" loading="lazy">
  </figure>
  <div class="attraction-description">
    <h3>About Winchester Mystery House</h3>
    <p>A sprawling mansion known for its architectural curiosities, built continuously by Sarah Winchester.</p>
  </div>
  
  {% set articleContent = collections.attractionArticles | getArticleForSlug('winchester-mystery-house') %}
  {% if articleContent %}
  <div class="attraction-article">
    <h3>{{ articleContent.data.title }}</h3>
    <div class="article-content">
      {{ articleContent.content | safe }}
    </div>
  </div>
  {% endif %}
  
  
</article>