---
layout: layout.njk
permalink: /bruneau-dunes-state-park/
title: Bruneau Dunes State Park
---

<article class="attraction-detail container">
  <h2>Bruneau Dunes State Park</h2>
  <div class="attraction-meta">
    <span class="address">Address: 27608 Bruneau Sand Dunes Road</span>
    <span class="location">Location: Bruneau, ID 83604</span>
  </div>
  <figure class="attraction-image">
    <img src="https://upload.wikimedia.org/wikipedia/commons/8/86/Bruneau_Dunes_State_Park.jpg?v=1743964413072" alt="Bruneau Dunes State Park.jpg" loading="lazy">
  </figure>
  <div class="attraction-description">
    <h3>About Bruneau Dunes State Park</h3>
    <p>Bruneau Dunes State Park is a public recreation and geologic preservation area in the western United States, located in Owyhee County in southweste...</p>
  </div>
  
  {% set articleContent = collections.attractionArticles | getArticleForSlug('bruneau-dunes-state-park') %}
  {% if articleContent %}
  <div class="attraction-article">
    <h3>{{ articleContent.data.title }}</h3>
    <div class="article-content">
      {{ articleContent.content | safe }}
    </div>
  </div>
  {% endif %}
  
  
</article>