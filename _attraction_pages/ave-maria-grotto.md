---
layout: layout.njk
permalink: /ave-maria-grotto/
title: Ave Maria Grotto
---

<article class="attraction-detail container">
  <h2>Ave Maria Grotto</h2>
  <div class="attraction-meta">
    <span class="address">Address: 1600 St Bernard Dr SE</span>
    <span class="location">Location: Cullman, AL 35055</span>
  </div>
  <figure class="attraction-image">
    <img src="https://upload.wikimedia.org/wikipedia/commons/c/cc/St._Peters_Church_in_Rome%2C_Ave_Maria_Grotto%2C_Cullman_%28Cullman_County%2C_Alabama%29.jpg?v=1743964413066" alt="St. Peters Church in Rome, Ave Maria Grotto, Cullman (Cullman County, Alabama).jpg" loading="lazy">
  </figure>
  <div class="attraction-description">
    <h3>About Ave Maria Grotto</h3>
    <p>Features 125 miniature reproductions of famous religious structures and buildings, crafted over decades by a monk.</p>
  </div>
  
  {% set articleContent = collections.attractionArticles | getArticleForSlug('ave-maria-grotto') %}
  {% if articleContent %}
  <div class="attraction-article">
    <h3>{{ articleContent.data.title }}</h3>
    <div class="article-content">
      {{ articleContent.content | safe }}
    </div>
  </div>
  {% endif %}
  
  
</article>