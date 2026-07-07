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

function absolute(path) {
  return new URL(path, BASE_URL + '/').href;
}

function posterFor(item) {
  return item.poster && item.poster.length ? item.poster : 'favicon.svg';
}

function titlePath(item) {
  if (sandbox.window.titlePath) return sandbox.window.titlePath(item);
  return 'watch.html?id=' + encodeURIComponent(item.id);
}

function card(item) {
  return `<a class="card" href="${titlePath(item)}">
    <span class="quality">${esc(item.quality)}</span>
    <img src="${attr(posterFor(item))}" alt="${attr(item.title)} poster" loading="lazy">
    <span class="card-body">
      <span class="card-title">${esc(item.title)}</span>
      <span class="meta"><span>${esc(item.year)}</span><span>★ ${esc(item.rating)}</span><span>${esc(item.kind === 'tv' ? 'TV' : 'Movie')}</span></span>
    </span>
  </a>`;
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
        <li><a href="catalog-a-z.html">A-Z</a></li>
      </ul>
    </nav>
  </header>`;
}

function footer() {
  return `<footer>
  <p>&copy; 2026 ${SITE_NAME}. All rights reserved.</p>
  <p>${SITE_NAME} is an informational catalog. We do not host, stream, or link to full video files.</p>
  <p><a href="privacy.html">Privacy Policy</a> · <a href="terms.html">Terms</a> · <a href="dmca.html">DMCA</a> · <a href="contact.html">Contact</a></p>
</footer>`;
}

function quickLinks() {
  return `<div class="quick-links" aria-label="Popular pages">
    <a href="genre-action.html">Action</a>
    <a href="genre-comedy.html">Comedy</a>
    <a href="genre-horror.html">Horror</a>
    <a href="genre-drama.html">Drama</a>
    <a href="genre-sci-fi.html">Sci-Fi</a>
    <a href="catalog-a-z.html">A-Z</a>
    <a href="year-2024.html">2024</a>
    <a href="trending.html">Trending</a>
  </div>`;
}

function pageSchema(page, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: page.title,
    description: page.description,
    url: absolute(page.file),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.slice(0, 50).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absolute(titlePath(item)),
        name: item.title
      }))
    }
  };
}

function faqSchema(page) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is on ${page.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: page.description
        }
      },
      {
        '@type': 'Question',
        name: 'How are titles organized?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${SITE_NAME} groups titles by genre, year, rating, and catalog section so visitors can browse related movies and TV shows quickly.`
        }
      }
    ]
  };
}

function renderPage(page) {
  const items = page.items.slice().sort((a, b) => {
    if (page.sort === 'title') return a.title.localeCompare(b.title);
    return Number.parseFloat(b.rating) - Number.parseFloat(a.rating);
  });
  const visible = items.slice(0, 120);
  const title = `${page.title} - ${SITE_NAME}`;
  const description = page.description;
  const intro = page.intro || `${page.title} brings together ${items.length} catalog title${items.length === 1 ? '' : 's'} with ratings, release years, genres, posters, and related detail pages.`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${attr(description)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${attr(absolute(page.file))}">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${attr(absolute(page.file))}">
<meta property="og:image" content="${BASE_URL}/favicon.svg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(title)}">
<meta name="twitter:description" content="${attr(description)}">
<meta name="twitter:image" content="${BASE_URL}/favicon.svg">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="manifest" href="manifest.json">
<link rel="stylesheet" href="landing.css">
<script type="application/ld+json">${JSON.stringify(pageSchema(page, items))}</script>
<script type="application/ld+json">${JSON.stringify(faqSchema(page))}</script>
</head>
<body>
${nav()}
<section class="hero">
  <div class="hero-inner">
    <div class="eyebrow">${esc(page.eyebrow || 'Browse catalog')}</div>
    <h1>${esc(page.title)}</h1>
    <p>${esc(intro)}</p>
  </div>
</section>
${quickLinks()}
<div class="ad-row">
  <div class="ad-box"><div><div>Advertisement</div><a href="${attr(SPONSOR_URL)}" target="_blank" rel="nofollow sponsored noopener">Sponsored Link</a></div></div>
</div>
<main class="content">
  <div class="section-heading">
    <h2>${esc(page.heading || 'Top picks')}</h2>
    <p>${items.length} title${items.length === 1 ? '' : 's'} found</p>
  </div>
  <div class="grid">
    ${visible.map(card).join('\n    ')}
  </div>
  <section class="copy-block">
    <h2>Browse ${esc(page.title)} on ${SITE_NAME}</h2>
    <p>${esc(description)}</p>
    <p>Use this page as a starting point, then open any title for its synopsis, genres, year, rating, poster, and related recommendations. These landing pages are built as static HTML so search engines and visitors can reach important catalog areas quickly.</p>
    <p>${SITE_NAME} is an informational catalog only. We do not host, stream, or link to full video files.</p>
  </section>
</main>
${footer()}
</body>
</html>
`;
  fs.writeFileSync(page.file, html);
}

const genres = [...new Set(catalog.flatMap(item => item.genres))].sort();
const numericYears = [...new Set(catalog.map(item => String(item.year).match(/\d{4}/)?.[0]).filter(Boolean))]
  .sort((a, b) => Number(b) - Number(a))
  .slice(0, 12);

const pages = [
  {
    file: 'catalog-a-z.html',
    title: 'A-Z Movie and TV Show Catalog',
    eyebrow: 'Browse A-Z',
    description: `Browse the full ${SITE_NAME} catalog alphabetically, including movies and TV shows with ratings, years, genres, and detail pages.`,
    items: catalog,
    sort: 'title'
  },
  {
    file: 'movies.html',
    title: 'Movies',
    eyebrow: 'Movie catalog',
    description: `Browse ${catalog.filter(item => item.kind === 'movie').length} movies by rating, genre, year, and popularity on ${SITE_NAME}.`,
    items: catalog.filter(item => item.kind === 'movie')
  },
  {
    file: 'tv-shows.html',
    title: 'TV Shows',
    eyebrow: 'Series catalog',
    description: `Browse ${catalog.filter(item => item.kind === 'tv').length} TV shows by rating, genre, year, and popularity on ${SITE_NAME}.`,
    items: catalog.filter(item => item.kind === 'tv')
  },
  {
    file: 'top-imdb.html',
    title: 'Top IMDb Movies and TV Shows',
    eyebrow: 'Highest rated',
    description: `Explore the highest-rated movies and TV shows in the ${SITE_NAME} catalog.`,
    items: catalog.filter(item => item.section === 'top')
  },
  {
    file: 'latest.html',
    title: 'Latest Movies and TV Shows',
    eyebrow: 'New releases',
    description: `Find recent and newly added movies and TV shows in the ${SITE_NAME} catalog.`,
    items: catalog.filter(item => item.section === 'recent' || item.badge === 'NEW')
  },
  {
    file: 'trending.html',
    title: 'Trending Movies and TV Shows',
    eyebrow: 'Popular now',
    description: `Browse trending movies and TV shows with ratings, years, and genre details on ${SITE_NAME}.`,
    items: catalog.filter(item => item.section === 'trending' || item.badge === 'HOT')
  },
  {
    file: 'genres.html',
    title: 'Movie and TV Show Genres',
    eyebrow: 'Browse by genre',
    description: `Browse ${genres.length} movie and TV show genres on ${SITE_NAME}, from action and comedy to horror, drama, sci-fi, and documentaries.`,
    items: catalog
  }
];

for (const genre of genres) {
  const items = catalog.filter(item => item.genres.includes(genre));
  pages.push({
    file: `genre-${slug(genre)}.html`,
    title: `${genre} Movies and TV Shows`,
    eyebrow: `${genre} catalog`,
    description: `Browse ${items.length} ${genre.toLowerCase()} movies and TV shows with ratings, years, posters, and related catalog pages on ${SITE_NAME}.`,
    items
  });

  const movies = items.filter(item => item.kind === 'movie');
  if (movies.length) {
    pages.push({
      file: `genre-${slug(genre)}-movies.html`,
      title: `${genre} Movies`,
      eyebrow: `${genre} movies`,
      description: `Browse ${movies.length} ${genre.toLowerCase()} movies with ratings, years, posters, and related catalog pages on ${SITE_NAME}.`,
      items: movies
    });
  }

  const shows = items.filter(item => item.kind === 'tv');
  if (shows.length) {
    pages.push({
      file: `genre-${slug(genre)}-tv-shows.html`,
      title: `${genre} TV Shows`,
      eyebrow: `${genre} series`,
      description: `Browse ${shows.length} ${genre.toLowerCase()} TV shows with ratings, years, posters, and related catalog pages on ${SITE_NAME}.`,
      items: shows
    });
  }
}

for (const year of numericYears) {
  const items = catalog.filter(item => String(item.year).includes(year));
  pages.push({
    file: `year-${year}.html`,
    title: `${year} Movies and TV Shows`,
    eyebrow: `${year} catalog`,
    description: `Browse ${items.length} movies and TV shows from ${year} in the ${SITE_NAME} catalog.`,
    items
  });

  const movies = items.filter(item => item.kind === 'movie');
  if (movies.length) {
    pages.push({
      file: `year-${year}-movies.html`,
      title: `${year} Movies`,
      eyebrow: `${year} movies`,
      description: `Browse ${movies.length} movies from ${year} in the ${SITE_NAME} catalog, including ratings, genres, posters, and detail pages.`,
      items: movies
    });
  }

  const shows = items.filter(item => item.kind === 'tv');
  if (shows.length) {
    pages.push({
      file: `year-${year}-tv-shows.html`,
      title: `${year} TV Shows`,
      eyebrow: `${year} series`,
      description: `Browse ${shows.length} TV shows from ${year} in the ${SITE_NAME} catalog, including ratings, genres, posters, and detail pages.`,
      items: shows
    });
  }
}

const alphaGroups = new Map();
for (const item of catalog) {
  const first = item.title.trim().charAt(0).toUpperCase();
  const key = /^[A-Z]$/.test(first) ? first : '0-9';
  if (!alphaGroups.has(key)) alphaGroups.set(key, []);
  alphaGroups.get(key).push(item);
}

for (const [letter, items] of [...alphaGroups.entries()].sort()) {
  pages.push({
    file: `catalog-${letter.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`,
    title: `${letter} Movies and TV Shows`,
    eyebrow: `A-Z: ${letter}`,
    description: `Browse ${items.length} ${SITE_NAME} catalog title${items.length === 1 ? '' : 's'} starting with ${letter}.`,
    items,
    sort: 'title'
  });
}

for (const page of pages) renderPage(page);

fs.writeFileSync('landing-pages.json', JSON.stringify(pages.map(({ file, title, description }) => ({ file, title, description })), null, 2) + '\n');
console.log(`Generated ${pages.length} landing pages.`);
