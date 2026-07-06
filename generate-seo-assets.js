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
const genres = [...new Set(catalog.flatMap(item => item.genres))].sort();
const years = [...new Set(catalog.map(item => item.year))].sort((a, b) => b - a).slice(0, 12);
const sections = [...new Set(catalog.map(item => item.section))].sort();

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

const urls = [
  url('/', '1.0', 'daily'),
  url('/index.html', '0.9', 'daily'),
  ...landingPages.map(page => url('/' + page.file, '0.9', 'weekly')),
  ...['action', 'comedy', 'horror', 'drama', 'sci-fi', 'trending', '2024'].map(q =>
    url('/search.html?q=' + encodeURIComponent(q), '0.8', 'daily')
  ),
  ...genres.map(genre => url('/search.html?q=' + encodeURIComponent(genre.toLowerCase()), '0.7')),
  ...years.map(year => url('/search.html?q=' + encodeURIComponent(year), '0.7')),
  ...sections.map(section => url('/search.html?q=' + encodeURIComponent(section), '0.6')),
  ...catalog.map(item => url('/watch.html?id=' + encodeURIComponent(item.id), '0.8', 'monthly'))
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
