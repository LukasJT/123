# 123Videos

A static movie and TV catalog site for GitHub Pages.

**Live demo:** https://123videos.net

## Features
- Dark theme with hero search bar
- Genre filter chips
- Search pages for titles, genres, sections, and years
- Detail pages with synopsis, rating, genre, and related titles
- SEO metadata, robots.txt, and sitemap.xml generation
- Static SEO landing pages for movies, TV shows, top IMDb, latest, trending, genres, and years
- 838-title catalog across Movies + TV Shows
- Responsive grid layout

## Run locally
Just open `index.html` in a browser.

## SEO files
Run these after catalog changes:

```sh
node generate-landing-pages.js
node generate-seo-assets.js
```
