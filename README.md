# 123Videos

A static movie and TV catalog site for GitHub Pages.

**Live demo:** https://123videos.net

## Features
- Dark theme with hero search bar
- Genre filter chips
- Search pages for titles, genres, sections, and years
- Detail pages with synopsis, rating, genre, and related titles
- SEO metadata, robots.txt, and sitemap.xml generation
- Automatic sitemap indexing and 45,000-URL segmentation for large imports
- Deterministic 5,000-record browser catalog chunks with a validated import manifest
- Static SEO landing pages for movies, TV shows, top IMDb, latest, trending, genres, and years
- Static title pages for every movie and TV show in the catalog
- Expanded landing pages for genre + type, year + type, and A-Z catalog browsing
- Ranked, decade, discovery, and HTML sitemap pages for crawlable catalog navigation
- RSS, JSON, and OpenSearch files for catalog discovery
- Breadcrumb navigation and BreadcrumbList structured data on generated pages
- ItemList structured data for related title recommendations
- Site identity, search, and search-results structured data on core pages
- About page with AboutPage structured data for site trust signals
- Advertising disclosure page for sponsored links and third-party ad transparency
- Cross-links from title pages into matching genre, year, type, and ranked catalog pages
- 4,293-title catalog across Movies + TV Shows
- Responsive grid layout

## Run locally
Just open `index.html` in a browser.

## SEO files
Install no dependencies. Run the complete deterministic build and checks after catalog changes:

```sh
npm run build
npm test
npm run check
```

New factual additions require a source-backed manifest under `data/batches/`. Editorial guide definitions live in `data/editorial/guides.json`. See `docs/batch-workflow.md` and `docs/content-policy.md` before publishing.

## Large catalog imports

The repository supports resumable TMDB daily-export batches without downloading posters. Obtain an authorized TMDB API Read Access Token, then run a bounded batch:

```sh
TMDB_BEARER_TOKEN=... npm run import:tmdb -- --kind=movie --date=2026-09-19 --offset=0 --limit=1000
TMDB_BEARER_TOKEN=... npm run import:tmdb -- --kind=tv --date=2026-09-19 --offset=0 --limit=1000
```

Advance `offset` by `limit` and commit each generated file under `data/imports/` after review. The build merges imports deterministically into `catalog-imports.js`. TMDB attribution and API terms apply. “Every title ever released” cannot be guaranteed by any single database; the practical target is every eligible record in the selected dated export, with future exports used for additions and corrections.

For a long-running import, use the checkpointed series command. Each run continues from the saved offset in `data/import-state/`; `max-batches` bounds the work so imports can be reviewed and committed in manageable groups:

```sh
TMDB_BEARER_TOKEN=... npm run import:tmdb:series -- --kind=movie --date=2026-09-19 --batch-size=1000 --max-batches=10
TMDB_BEARER_TOKEN=... npm run import:tmdb:series -- --kind=tv --date=2026-09-19 --batch-size=1000 --max-batches=10
```

The importer retries temporary rate-limit and server failures and skips title/year/type matches already present in the catalog, preventing overlapping batches from creating duplicate pages.

## Chronological film indexing

Wikidata year batches provide a no-key path for historical coverage beginning in 1900. Each record keeps its Wikidata QID and source URL, skips an existing title/year/type match, and leaves unavailable facts empty:

```sh
npm run import:wikidata:year -- --year=1900 --offset=0 --limit=500
npm run build && npm test && npm run check
```

Advance the offset when a year returns the full requested row limit. Because films can have multiple dates and genres, the importer consolidates repeated result rows by Wikidata identity before writing the batch.
