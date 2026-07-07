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
      <span class="meta"><span>${esc(item.year)}</span><span>Rating ${esc(item.rating)}</span><span>${esc(item.kind === 'tv' ? 'TV' : 'Movie')}</span></span>
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
  <p><a href="about.html">About</a> | <a href="advertising.html">Advertising</a> | <a href="privacy.html">Privacy Policy</a> | <a href="terms.html">Terms</a> | <a href="dmca.html">DMCA</a> | <a href="contact.html">Contact</a> | <a href="sitemap.html">Sitemap</a></p>
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
    <a href="best-movies.html">Best Movies</a>
    <a href="best-tv-shows.html">Best TV Shows</a>
    <a href="2020s-movies-and-tv-shows.html">2020s</a>
    <a href="classic-movies-and-tv-shows.html">Classics</a>
    <a href="action-thrillers.html">Action Thrillers</a>
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

function breadcrumbSchema(page) {
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
        name: 'Catalog',
        item: absolute('sitemap.html')
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: page.title,
        item: absolute(page.file)
      }
    ]
  };
}

function breadcrumbNav(page) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">
    <a href="index.html">${SITE_NAME}</a>
    <span>/</span>
    <a href="sitemap.html">Catalog</a>
    <span>/</span>
    <span>${esc(page.title)}</span>
  </nav>`;
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
<link rel="alternate" type="application/rss+xml" title="${SITE_NAME} Catalog Updates" href="feed.xml">
<link rel="search" type="application/opensearchdescription+xml" title="${SITE_NAME}" href="opensearch.xml">
<link rel="stylesheet" href="landing.css">
<script type="application/ld+json">${JSON.stringify(pageSchema(page, items))}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbSchema(page))}</script>
<script type="application/ld+json">${JSON.stringify(faqSchema(page))}</script>
</head>
<body>
${nav()}
${breadcrumbNav(page)}
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
const commercialGenres = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller'];
const decadeRanges = [
  { file: '2020s', title: '2020s', start: 2020, end: 2029 },
  { file: '2010s', title: '2010s', start: 2010, end: 2019 },
  { file: '2000s', title: '2000s', start: 2000, end: 2009 },
  { file: '1990s', title: '1990s', start: 1990, end: 1999 },
  { file: 'classic', title: 'Classic', start: 1900, end: 1989 }
];
const genreCombos = [
  { file: 'action-thrillers', title: 'Action Thrillers', genres: ['Action', 'Thriller'] },
  { file: 'sci-fi-adventures', title: 'Sci-Fi Adventures', genres: ['Sci-Fi', 'Adventure'] },
  { file: 'crime-dramas', title: 'Crime Dramas', genres: ['Crime', 'Drama'] },
  { file: 'romantic-comedies', title: 'Romantic Comedies', genres: ['Romance', 'Comedy'] },
  { file: 'animated-family-titles', title: 'Animated Family Titles', genres: ['Animation', 'Family'] },
  { file: 'horror-thrillers', title: 'Horror Thrillers', genres: ['Horror', 'Thriller'] },
  { file: 'mystery-thrillers', title: 'Mystery Thrillers', genres: ['Mystery', 'Thriller'] },
  { file: 'documentary-biography', title: 'Documentary Biography Titles', genres: ['Documentary', 'Biography'] }
];

function topRated(items, limit = 120) {
  return items
    .slice()
    .sort((a, b) => Number.parseFloat(b.rating) - Number.parseFloat(a.rating))
    .slice(0, limit);
}

function releaseYear(item) {
  const match = String(item.year).match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function inRange(item, start, end) {
  const year = releaseYear(item);
  return year !== null && year >= start && year <= end;
}

function hasAllGenres(item, requiredGenres) {
  return requiredGenres.every(genre => item.genres.includes(genre));
}

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

pages.push({
  file: 'best-movies.html',
  title: 'Best Movies by Rating',
  eyebrow: 'Top movie picks',
  description: `Browse the highest-rated movies in the ${SITE_NAME} catalog, organized with posters, years, genres, ratings, and detail pages.`,
  intro: `Start with the highest-rated movies in the ${SITE_NAME} catalog, then jump into individual title pages for synopsis, genre, poster, year, duration, and related recommendations.`,
  heading: 'Highest-rated movies',
  items: topRated(catalog.filter(item => item.kind === 'movie'))
});

pages.push({
  file: 'best-tv-shows.html',
  title: 'Best TV Shows by Rating',
  eyebrow: 'Top series picks',
  description: `Browse the highest-rated TV shows in the ${SITE_NAME} catalog, including popular series, mini-series, anime, dramas, comedies, and thrillers.`,
  intro: `Find the highest-rated TV shows in the ${SITE_NAME} catalog and compare series by rating, release year, genre, poster, and related recommendations.`,
  heading: 'Highest-rated TV shows',
  items: topRated(catalog.filter(item => item.kind === 'tv'))
});

for (const genre of commercialGenres) {
  const genreItems = catalog.filter(item => item.genres.includes(genre));
  const movies = topRated(genreItems.filter(item => item.kind === 'movie'));
  const shows = topRated(genreItems.filter(item => item.kind === 'tv'));

  if (movies.length >= 6) {
    pages.push({
      file: `best-${slug(genre)}-movies.html`,
      title: `Best ${genre} Movies`,
      eyebrow: `Top ${genre.toLowerCase()} movies`,
      description: `Browse the best-rated ${genre.toLowerCase()} movies in the ${SITE_NAME} catalog with years, ratings, posters, genres, and title detail pages.`,
      intro: `This ranked ${genre.toLowerCase()} movie collection highlights strong catalog picks by rating, with quick paths into synopsis pages and related recommendations.`,
      heading: `Top-rated ${genre.toLowerCase()} movies`,
      items: movies
    });
  }

  if (shows.length >= 4) {
    pages.push({
      file: `best-${slug(genre)}-tv-shows.html`,
      title: `Best ${genre} TV Shows`,
      eyebrow: `Top ${genre.toLowerCase()} series`,
      description: `Browse the best-rated ${genre.toLowerCase()} TV shows in the ${SITE_NAME} catalog with years, ratings, posters, genres, and title detail pages.`,
      intro: `This ranked ${genre.toLowerCase()} TV collection helps visitors compare popular series by rating, year, genre, and related recommendations.`,
      heading: `Top-rated ${genre.toLowerCase()} TV shows`,
      items: shows
    });
  }
}

for (const year of numericYears.slice(0, 5)) {
  const yearItems = catalog.filter(item => String(item.year).includes(year));
  const movies = topRated(yearItems.filter(item => item.kind === 'movie'));
  const shows = topRated(yearItems.filter(item => item.kind === 'tv'));

  if (movies.length >= 4) {
    pages.push({
      file: `best-${year}-movies.html`,
      title: `Best ${year} Movies`,
      eyebrow: `${year} movie rankings`,
      description: `Browse the best-rated ${year} movies in the ${SITE_NAME} catalog with ratings, genres, posters, and title detail pages.`,
      intro: `Use this ${year} movie list to compare the strongest catalog titles from the year by rating, genre, poster, duration, and related recommendations.`,
      heading: `Top-rated ${year} movies`,
      items: movies
    });
  }

  if (shows.length >= 2) {
    pages.push({
      file: `best-${year}-tv-shows.html`,
      title: `Best ${year} TV Shows`,
      eyebrow: `${year} series rankings`,
      description: `Browse the best-rated ${year} TV shows in the ${SITE_NAME} catalog with ratings, genres, posters, and title detail pages.`,
      intro: `Use this ${year} TV show list to compare strong catalog series by rating, genre, poster, duration, and related recommendations.`,
      heading: `Top-rated ${year} TV shows`,
      items: shows
    });
  }
}

for (const decade of decadeRanges) {
  const items = topRated(catalog.filter(item => inRange(item, decade.start, decade.end)));
  if (items.length) {
    pages.push({
      file: `${decade.file}-movies-and-tv-shows.html`,
      title: `${decade.title} Movies and TV Shows`,
      eyebrow: `${decade.title} catalog`,
      description: `Browse ${items.length} ${decade.title.toLowerCase()} movies and TV shows in the ${SITE_NAME} catalog with ratings, years, genres, posters, and title detail pages.`,
      intro: `Explore ${decade.title.toLowerCase()} movies and TV shows by rating, year, genre, poster, and related recommendations across the ${SITE_NAME} catalog.`,
      heading: `Top-rated ${decade.title.toLowerCase()} titles`,
      items
    });
  }

  const movies = topRated(items.filter(item => item.kind === 'movie'));
  if (movies.length >= 4) {
    pages.push({
      file: `${decade.file}-movies.html`,
      title: `${decade.title} Movies`,
      eyebrow: `${decade.title} movies`,
      description: `Browse ${movies.length} ${decade.title.toLowerCase()} movies in the ${SITE_NAME} catalog with ratings, years, genres, posters, and title detail pages.`,
      intro: `Compare ${decade.title.toLowerCase()} movies by rating, genre, poster, year, duration, and related recommendations.`,
      heading: `Top-rated ${decade.title.toLowerCase()} movies`,
      items: movies
    });
  }

  const shows = topRated(items.filter(item => item.kind === 'tv'));
  if (shows.length >= 2) {
    pages.push({
      file: `${decade.file}-tv-shows.html`,
      title: `${decade.title} TV Shows`,
      eyebrow: `${decade.title} series`,
      description: `Browse ${shows.length} ${decade.title.toLowerCase()} TV shows in the ${SITE_NAME} catalog with ratings, years, genres, posters, and title detail pages.`,
      intro: `Compare ${decade.title.toLowerCase()} TV shows by rating, genre, poster, year, duration, and related recommendations.`,
      heading: `Top-rated ${decade.title.toLowerCase()} TV shows`,
      items: shows
    });
  }
}

for (const combo of genreCombos) {
  const items = topRated(catalog.filter(item => hasAllGenres(item, combo.genres)));
  if (items.length >= 4) {
    pages.push({
      file: `${combo.file}.html`,
      title: combo.title,
      eyebrow: 'Curated discovery',
      description: `Browse ${items.length} ${combo.title.toLowerCase()} in the ${SITE_NAME} catalog with ratings, years, genres, posters, and title detail pages.`,
      intro: `${combo.title} brings together titles that share ${combo.genres.join(' and ').toLowerCase()} catalog signals, making it easier to compare related movies and TV shows by rating, year, genre, and recommendations.`,
      heading: `Top-rated ${combo.title.toLowerCase()}`,
      items
    });
  }

  const movies = topRated(items.filter(item => item.kind === 'movie'));
  if (movies.length >= 4) {
    pages.push({
      file: `${combo.file}-movies.html`,
      title: `${combo.title} Movies`,
      eyebrow: 'Curated movies',
      description: `Browse ${movies.length} ${combo.title.toLowerCase()} movies in the ${SITE_NAME} catalog with ratings, years, genres, posters, and detail pages.`,
      intro: `This movie-focused ${combo.title.toLowerCase()} page helps visitors compare related titles by rating, genre, year, poster, and recommendations.`,
      heading: `Top-rated ${combo.title.toLowerCase()} movies`,
      items: movies
    });
  }

  const shows = topRated(items.filter(item => item.kind === 'tv'));
  if (shows.length >= 3) {
    pages.push({
      file: `${combo.file}-tv-shows.html`,
      title: `${combo.title} TV Shows`,
      eyebrow: 'Curated series',
      description: `Browse ${shows.length} ${combo.title.toLowerCase()} TV shows in the ${SITE_NAME} catalog with ratings, years, genres, posters, and detail pages.`,
      intro: `This series-focused ${combo.title.toLowerCase()} page helps visitors compare related TV titles by rating, genre, year, poster, and recommendations.`,
      heading: `Top-rated ${combo.title.toLowerCase()} TV shows`,
      items: shows
    });
  }
}

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
