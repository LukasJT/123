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
- Static title pages for every movie and TV show in the catalog
- Expanded landing pages for genre + type, year + type, and A-Z catalog browsing
- Ranked, decade, discovery, and HTML sitemap pages for crawlable catalog navigation
- RSS, JSON, and OpenSearch files for catalog discovery
- Breadcrumb navigation and BreadcrumbList structured data on generated pages
- ItemList structured data for related title recommendations
- Cross-links from title pages into matching genre, year, type, and ranked catalog pages
- 838-title catalog across Movies + TV Shows
- Responsive grid layout

## Run locally
Just open `index.html` in a browser.

## SEO files
Run these after catalog changes:

```sh
node generate-title-pages.js
node generate-landing-pages.js
node generate-seo-assets.js
```
