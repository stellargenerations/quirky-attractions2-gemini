---
layout: layout.njk
permalink: /unclaimed-baggage-center/
title: Unclaimed Baggage Center
---

<article class="attraction-detail container">
  <h2>Unclaimed Baggage Center</h2>
  <div class="attraction-meta">
    <span class="address">Address: 509 W Willow St</span>
    <span class="location">Location: Scottsboro, AL 35768</span>
  </div>
  <figure class="attraction-image">
    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b9/Unclaimed_Baggage_logo.png?v=1743964413066" alt="Unclaimed Baggage logo.png" loading="lazy">
  </figure>
  <div class="attraction-description">
    <h3>About Unclaimed Baggage Center</h3>
    <p>A unique retail store selling items recovered from lost or unclaimed airline luggage.</p>
  </div>
  
  {% set articleContent = collections.attractionArticles | getArticleForSlug('unclaimed-baggage-center') %}
  {% if articleContent %}
  <div class="attraction-article">
    <h3>{{ articleContent.data.title }}</h3>
    <div class="article-content">
      {{ articleContent.content | safe }}
    </div>
  </div>
  {% endif %}
  
  
</article>