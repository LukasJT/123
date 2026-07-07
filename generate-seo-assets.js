const fs = require('fs');
const vm = require('vm');

const BASE_URL = 'https://123videos.net';
const sandbox = {
  window: {},
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }
};

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('catalog.js', 'utf8'), sandbox);

const catalog = sandbox.window.catalog || [];
const landingPages = fs.existsSync('landing-pages.json')
  ? JSON.parse(fs.readFileSync('landing-pages.json', 'utf8'))
  : [];
const titlePages = fs.existsSync('title-pages.json')
  ? JSON.parse(fs.readFileSync('title-pages.json', 'utf8'))
  : [];
const genres = [...new Set(catalog.flatMap(item => item.genres))].sort();
const years = [...new Set(catalog.map(item => item.year))].sort((a, b) => b - a).slice(0, 12);
const sections = [...new Set(catalog.map(item => item.section))].sort();
const policyPages = ['privacy.html', 'terms.html', 'dmca.html', 'contact.html', 'faq.html'];

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function url(path, priority, changefreq = 'weekly') {
  return [
    '  <url>',
    `    <loc>${esc(new URL(path, BASE_URL + '/').href)}</loc>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>'
  ].join('\n');
}

function escHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pageTitle(file) {
  if (file === 'index.html') return 'Home';
  return file
    .replace(/\.html$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function linkList(items) {
  return items.map(item => {
    const file = typeof item === 'string' ? item : item.file;
    const title = typeof item === 'string' ? pageTitle(item) : item.title;
    return `<li><a href="${escHtml(file)}">${escHtml(title)}</a></li>`;
  }).join('\n');
}

function htmlShell(file, title, description, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(title)} - 123Videos</title>
<meta name="description" content="${escHtml(description)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${escHtml(new URL(file, BASE_URL + '/').href)}">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="stylesheet" href="landing.css">
</head>
<body>
<header>
  <a class="logo" href="index.html">
    <svg class="logo-mark" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="22" fill="#f5b50a"/><polygon points="17,11 17,33 36,22" fill="#0f0f0f"/></svg>
    123<span>Videos</span>
  </a>
  <nav aria-label="Primary">
    <ul>
      <li><a href="movies.html">Movies</a></li>
      <li><a href="tv-shows.html">TV Shows</a></li>
      <li><a href="best-movies.html">Best Movies</a></li>
      <li><a href="best-tv-shows.html">Best TV Shows</a></li>
      <li><a href="genres.html">Genres</a></li>
      <li><a href="sitemap.html">Sitemap</a></li>
    </ul>
  </nav>
</header>
<section class="hero">
  <div class="hero-inner">
    <div class="eyebrow">Site directory</div>
    <h1>${escHtml(title)}</h1>
    <p>${escHtml(description)}</p>
  </div>
</section>
<main class="content sitemap-content">
${body}
</main>
<footer>
  <p>&copy; 2026 123Videos. All rights reserved.</p>
  <p>123Videos is an informational catalog. We do not host, stream, or link to full video files.</p>
  <p><a href="privacy.html">Privacy Policy</a> | <a href="terms.html">Terms</a> | <a href="dmca.html">DMCA</a> | <a href="contact.html">Contact</a> | <a href="sitemap.html">Sitemap</a></p>
</footer>
</body>
</html>
`;
}

function renderHtmlSitemaps() {
  const corePages = ['index.html', 'movies.html', 'tv-shows.html', 'top-imdb.html', 'latest.html', 'trending.html', 'genres.html', 'catalog-a-z.html', ...policyPages];
  const titleGroups = new Map();
  for (const page of titlePages) {
    const first = page.title.trim().charAt(0).toUpperCase();
    const letter = /^[A-Z]$/.test(first) ? first : '0-9';
    if (!titleGroups.has(letter)) titleGroups.set(letter, []);
    titleGroups.get(letter).push(page);
  }

  const titleSitemapPages = [...titleGroups.keys()].sort().map(letter => ({
    file: `sitemap-titles-${letter.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`,
    title: `${letter} Title Sitemap`
  }));

  fs.writeFileSync('sitemap.html', htmlShell(
    'sitemap.html',
    'HTML Sitemap',
    'Browse the main 123Videos site directory, including catalog collections, title pages, genre pages, year pages, and policy pages.',
    `<section class="sitemap-section">
      <h2>Main Pages</h2>
      <ul class="sitemap-list">${linkList(corePages)}</ul>
    </section>
    <section class="sitemap-section">
      <h2>Catalog Directories</h2>
      <ul class="sitemap-list">
        <li><a href="sitemap-collections.html">All Collection Pages</a></li>
        ${titleSitemapPages.map(page => `<li><a href="${escHtml(page.file)}">${escHtml(page.title)}</a></li>`).join('\n')}
      </ul>
    </section>`
  ));

  fs.writeFileSync('sitemap-collections.html', htmlShell(
    'sitemap-collections.html',
    'Collection Sitemap',
    'Browse every static collection page in the 123Videos catalog, including genre, year, ranked, decade, discovery, and A-Z pages.',
    `<section class="sitemap-section">
      <h2>Collection Pages</h2>
      <ul class="sitemap-list">${linkList(landingPages)}</ul>
    </section>`
  ));

  for (const [letter, pages] of [...titleGroups.entries()].sort()) {
    const file = `sitemap-titles-${letter.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
    const sorted = pages.slice().sort((a, b) => a.title.localeCompare(b.title));
    fs.writeFileSync(file, htmlShell(
      file,
      `${letter} Title Sitemap`,
      `Browse ${sorted.length} 123Videos title detail pages starting with ${letter}.`,
      `<section class="sitemap-section">
        <h2>${escHtml(letter)} Titles</h2>
        <ul class="sitemap-list">${linkList(sorted)}</ul>
      </section>`
    ));
  }

  return ['sitemap.html', 'sitemap-collections.html', ...titleSitemapPages.map(page => page.file)];
}

const htmlSitemapPages = renderHtmlSitemaps();

const urls = [
  url('/', '1.0', 'daily'),
  url('/index.html', '0.9', 'daily'),
  ...[...policyPages, 'googledd325d3781eb4f8d.html'].map(page =>
    url('/' + page, page === 'googledd325d3781eb4f8d.html' ? '0.1' : '0.4', 'yearly')
  ),
  ...htmlSitemapPages.map(page => url('/' + page, page === 'sitemap.html' ? '0.8' : '0.7', 'weekly')),
  ...landingPages.map(page => url('/' + page.file, '0.9', 'weekly')),
  ...titlePages.map(page => url('/' + page.file, '0.8', 'monthly')),
  ...['action', 'comedy', 'horror', 'drama', 'sci-fi', 'trending', '2024'].map(q =>
    url('/search.html?q=' + encodeURIComponent(q), '0.8', 'daily')
  ),
  ...genres.map(genre => url('/search.html?q=' + encodeURIComponent(genre.toLowerCase()), '0.7')),
  ...years.map(year => url('/search.html?q=' + encodeURIComponent(year), '0.7')),
  ...sections.map(section => url('/search.html?q=' + encodeURIComponent(section), '0.6'))
];

const unique = [...new Map(urls.map(entry => [entry.match(/<loc>(.*?)<\/loc>/)[1], entry])).values()];
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...unique,
  '</urlset>',
  ''
].join('\n');

fs.writeFileSync('sitemap.xml', sitemap);
console.log(`Generated sitemap.xml with ${unique.length} URLs.`);
