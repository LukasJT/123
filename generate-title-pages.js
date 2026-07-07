const fs = require('fs');
const vm = require('vm');

const BASE_URL = 'https://123videos.net';
const SITE_NAME = '123Videos';
const SPONSOR_URL = 'https://www.effectivecpmnetwork.com/juxu9sau?key=b98baa5570f162d9918462f7df0dd586';

const sandbox = {
  window: {},
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }
};

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('catalog.js', 'utf8'), sandbox);

const catalog = sandbox.window.catalog || [];

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function attr(value) {
  return esc(value).replace(/`/g, '&#96;');
}

function slug(value) {
  return String(value).toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titlePath(item) {
  return `title-${slug(`${item.title}-${item.year}-${item.id}`)}.html`;
}

function absolute(path) {
  return new URL(path, BASE_URL + '/').href;
}

function posterFor(item) {
  return item.poster && item.poster.length ? item.poster : 'favicon.svg';
}

function nav() {
  return `<header>
    <a class="logo" href="index.html">
      <svg class="logo-mark" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="22" fill="#f5b50a"/><polygon points="17,11 17,33 36,22" fill="#0f0f0f"/></svg>
      123<span>Videos</span>
    </a>
    <nav aria-label="Primary">
      <ul>
        <li><a href="movies.html">Movies</a></li>
        <li><a href="tv-shows.html">TV Shows</a></li>
        <li><a href="top-imdb.html">Top IMDb</a></li>
        <li><a href="latest.html">Latest</a></li>
        <li><a href="genres.html">Genres</a></li>
      </ul>
    </nav>
  </header>`;
}

function footer() {
  return `<footer>
    <p>&copy; 2026 ${SITE_NAME}. All rights reserved.</p>
    <p>${SITE_NAME} is an informational catalog. We do not host, stream, or link to full video files.</p>
    <p><a href="privacy.html">Privacy Policy</a> | <a href="terms.html">Terms</a> | <a href="dmca.html">DMCA</a> | <a href="contact.html">Contact</a> | <a href="sitemap.html">Sitemap</a></p>
  </footer>`;
}

function relatedCard(item) {
  return `<a class="card" href="${titlePath(item)}">
    <span class="quality">${esc(item.quality)}</span>
    <img src="${attr(posterFor(item))}" alt="${attr(item.title)} poster" loading="lazy">
    <span class="card-body">
      <span class="card-title">${esc(item.title)}</span>
      <span class="meta"><span>${esc(item.year)}</span><span>Rating ${esc(item.rating)}</span></span>
    </span>
  </a>`;
}

function collectionLinks(item) {
  const kindLabel = item.kind === 'tv' ? 'TV Shows' : 'Movies';
  const kindSlug = item.kind === 'tv' ? 'tv-shows' : 'movies';
  const links = [];
  const add = (href, label) => {
    if (fs.existsSync(href)) links.push({ href, label });
  };

  add(`${kindSlug}.html`, `All ${kindLabel}`);
  add(`year-${item.year}.html`, `${item.year} Movies and TV Shows`);
  add(`year-${item.year}-${kindSlug}.html`, `${item.year} ${kindLabel}`);
  add(item.kind === 'tv' ? 'best-tv-shows.html' : 'best-movies.html', `Best ${kindLabel}`);

  item.genres.slice(0, 4).forEach(genre => {
    add(`genre-${slug(genre)}.html`, `${genre} Movies and TV Shows`);
    add(`genre-${slug(genre)}-${kindSlug}.html`, `${genre} ${kindLabel}`);
  });

  const seen = new Set();
  return links
    .filter(link => {
      if (seen.has(link.href)) return false;
      seen.add(link.href);
      return true;
    })
    .map(link => `<a href="${attr(link.href)}">${esc(link.label)}</a>`)
    .join('');
}

function schema(item, file) {
  const type = item.kind === 'tv' ? 'TVSeries' : 'Movie';
  return {
    '@context': 'https://schema.org',
    '@type': type,
    name: item.title,
    description: item.desc,
    image: posterFor(item),
    datePublished: String(item.year),
    genre: item.genres,
    duration: item.duration,
    url: absolute(file),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: item.rating,
      bestRating: '10',
      ratingCount: '1000'
    }
  };
}

function breadcrumbSchema(item, file, kindLabel) {
  const sectionFile = item.kind === 'tv' ? 'tv-shows.html' : 'movies.html';
  const sectionName = item.kind === 'tv' ? 'TV Shows' : 'Movies';
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: SITE_NAME,
        item: BASE_URL + '/'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: sectionName,
        item: absolute(sectionFile)
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${item.title} ${kindLabel}`,
        item: absolute(file)
      }
    ]
  };
}

function breadcrumbNav(item, kindLabel) {
  const sectionFile = item.kind === 'tv' ? 'tv-shows.html' : 'movies.html';
  const sectionName = item.kind === 'tv' ? 'TV Shows' : 'Movies';
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">
    <a href="index.html">${SITE_NAME}</a>
    <span>/</span>
    <a href="${sectionFile}">${sectionName}</a>
    <span>/</span>
    <span>${esc(item.title)} ${esc(kindLabel)}</span>
  </nav>`;
}

function relatedListSchema(item, file, related) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Titles related to ${item.title}`,
    description: `Related movie and TV catalog recommendations for ${item.title} on ${SITE_NAME}.`,
    url: absolute(file),
    itemListElement: related.map((relatedItem, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absolute(titlePath(relatedItem)),
      name: relatedItem.title
    }))
  };
}

function renderTitlePage(item) {
  const file = titlePath(item);
  const kindLabel = item.kind === 'tv' ? 'TV Show' : 'Movie';
  const related = catalog
    .filter(candidate => candidate.id !== item.id && candidate.genres.some(genre => item.genres.includes(genre)))
    .sort((a, b) => Number.parseFloat(b.rating) - Number.parseFloat(a.rating))
    .slice(0, 12);
  const title = `${item.title} (${item.year}) ${kindLabel} Details - ${SITE_NAME}`;
  const description = `${item.title} (${item.year}) is a ${item.genres.join(', ')} ${kindLabel.toLowerCase()} rated ${item.rating}. Browse synopsis, poster, duration, genres, and related recommendations on ${SITE_NAME}.`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${attr(description.slice(0, 300))}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${attr(absolute(file))}">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(description.slice(0, 300))}">
<meta property="og:type" content="website">
<meta property="og:url" content="${attr(absolute(file))}">
<meta property="og:image" content="${attr(posterFor(item))}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(title)}">
<meta name="twitter:description" content="${attr(description.slice(0, 300))}">
<meta name="twitter:image" content="${attr(posterFor(item))}">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="manifest" href="manifest.json">
<link rel="alternate" type="application/rss+xml" title="${SITE_NAME} Catalog Updates" href="feed.xml">
<link rel="search" type="application/opensearchdescription+xml" title="${SITE_NAME}" href="opensearch.xml">
<link rel="stylesheet" href="landing.css">
<script type="application/ld+json">${JSON.stringify(schema(item, file))}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbSchema(item, file, kindLabel))}</script>
${related.length ? `<script type="application/ld+json">${JSON.stringify(relatedListSchema(item, file, related))}</script>` : ''}
</head>
<body>
${nav()}
${breadcrumbNav(item, kindLabel)}
<section class="hero title-hero">
  <div class="hero-inner">
    <div class="eyebrow">${esc(kindLabel)} Details</div>
    <h1>${esc(item.title)} (${esc(item.year)})</h1>
    <p>${esc(item.desc)}</p>
  </div>
</section>
<main class="content">
  <section class="detail-layout">
    <img class="detail-poster" src="${attr(posterFor(item))}" alt="${attr(item.title)} poster">
    <div class="detail-body">
      <h2>Catalog Information</h2>
      <div class="detail-meta">
        <span>${esc(kindLabel)}</span>
        <span>${esc(item.year)}</span>
        <span>Rating ${esc(item.rating)}/10</span>
        <span>${esc(item.duration)}</span>
        <span>${esc(item.quality)}</span>
      </div>
      <div class="detail-genres">${item.genres.map(genre => `<a href="genre-${slug(genre)}.html">${esc(genre)}</a>`).join('')}</div>
      <p>${esc(item.desc)}</p>
      <p class="catalog-note">${SITE_NAME} is an informational catalog only. This page does not provide playback, hosting, downloads, or links to full video files.</p>
    </div>
  </section>
  <section class="collection-section">
    <div class="section-heading">
      <h2>Browse Similar Catalog Pages</h2>
      <p>Genre and year collections</p>
    </div>
    <div class="collection-links">${collectionLinks(item)}</div>
  </section>
  ${related.length ? `<section class="related-section">
    <div class="section-heading">
      <h2>Related Titles</h2>
      <p>${related.length} recommendations</p>
    </div>
    <div class="grid">${related.map(relatedCard).join('\n')}</div>
  </section>` : ''}
  <div class="ad-row">
    <div class="ad-box"><div><div>Advertisement</div><a href="${attr(SPONSOR_URL)}" target="_blank" rel="nofollow sponsored noopener">Sponsored Link</a></div></div>
  </div>
</main>
${footer()}
</body>
</html>
`;
  fs.writeFileSync(file, html);
  return { file, title: item.title, kind: item.kind, year: item.year };
}

const titlePages = catalog.map(renderTitlePage);
fs.writeFileSync('title-pages.json', JSON.stringify(titlePages, null, 2) + '\n');
console.log(`Generated ${titlePages.length} title pages.`);
