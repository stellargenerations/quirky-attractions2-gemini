---
layout: layout.njk
permalink: /cadillac-ranch/
title: Cadillac Ranch
---

<article class="attraction-detail container">
  <h2>Cadillac Ranch</h2>
  <div class="attraction-meta">
    <span class="address">Address: 13651 I-40 Frontage Rd</span>
    <span class="location">Location: Amarillo, TX 79124</span>
  </div>
  <figure class="attraction-image">
    <img src="https://upload.wikimedia.org/wikipedia/commons/2/20/Cadillac_Ranch_Entrance.jpg?v=1743964413062" alt="Cadillac Ranch Entrance.jpg" loading="lazy">
  </figure>
  <div class="attraction-description">
    <h3>About Cadillac Ranch</h3>
    <p>An art installation featuring ten Cadillac cars half-buried nose-first in the ground, inviting graffiti.</p>
  </div>
  
  {% set articleContent = collections.attractionArticles | getArticleForSlug('cadillac-ranch') %}
  {% if articleContent %}
  <div class="attraction-article">
    <h3>{{ articleContent.data.title }}</h3>
    <div class="article-content">
      {{ articleContent.content | safe }}
    </div>
  </div>
  {% endif %}
  
  
</article>