---
layout: layout.njk
permalink: /salvation-mountain/
title: Salvation Mountain
---

<article class="attraction-detail container">
  <h2>Salvation Mountain</h2>
  <div class="attraction-meta">
    <span class="address">Address: 603 Beal Road</span>
    <span class="location">Location: Niland, CA 92257</span>
  </div>
  <figure class="attraction-image">
    <img src="https://upload.wikimedia.org/wikipedia/commons/9/94/Salvation_Mountain%2C_Niland%2C_CA.jpg?v=1743964413062" alt="Salvation Mountain, Niland, CA.jpg" loading="lazy">
  </figure>
  <div class="attraction-description">
    <h3>About Salvation Mountain</h3>
    <p>A massive, colorful folk art installation made of adobe, straw, and thousands of gallons of paint.</p>
  </div>
  
  {% set articleContent = collections.attractionArticles | getArticleForSlug('salvation-mountain') %}
  {% if articleContent %}
  <div class="attraction-article">
    <h3>{{ articleContent.data.title }}</h3>
    <div class="article-content">
      {{ articleContent.content | safe }}
    </div>
  </div>
  {% endif %}
  
  
</article>