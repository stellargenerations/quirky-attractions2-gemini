---
layout: layout.njk
permalink: /lake-coeur-dalene/
title: Lake Coeur d'Alene
---

<article class="attraction-detail container">
  <h2>Lake Coeur d'Alene</h2>
  <div class="attraction-meta">
    
    <span class="location">Location: N/A, ID </span>
  </div>
  <figure class="attraction-image">
    <img src="https://upload.wikimedia.org/wikipedia/commons/1/1e/Coeur_d%27_Alene_ID_-_Beauty_Bay_of_Coeur_d%27_Alene_Lake_%28NBY_431855%29.jpg?v=1743964413071" alt="Coeur d' Alene ID - Beauty Bay of Coeur d' Alene Lake (NBY 431855).jpg" loading="lazy">
  </figure>
  <div class="attraction-description">
    <h3>About Lake Coeur d'Alene</h3>
    <p>Coeur d'Alene Lake, officially Coeur d'Alene Lake (  KOR də-LAYN), is a natural dam-controlled lake in North Idaho, located in the Pacific Northwes...</p>
  </div>
  
  {% set articleContent = collections.attractionArticles | getArticleForSlug('lake-coeur-dalene') %}
  {% if articleContent %}
  <div class="attraction-article">
    <h3>{{ articleContent.data.title }}</h3>
    <div class="article-content">
      {{ articleContent.content | safe }}
    </div>
  </div>
  {% endif %}
  
  
</article>