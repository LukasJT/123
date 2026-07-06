window.MZ_SEO = (function() {
  const BASE_URL = 'https://123videos.net';
  const SITE_NAME = '123Videos';
  const DEFAULT_IMAGE = BASE_URL + '/favicon.svg';

  function absoluteUrl(path) {
    return new URL(path, BASE_URL + '/').href;
  }

  function movieUrl(movie, includeServer) {
    const path = `watch.html?id=${encodeURIComponent(movie.id)}${includeServer ? '&server=' + encodeURIComponent(includeServer) : ''}`;
    return absoluteUrl(path);
  }

  function searchUrl(query) {
    return absoluteUrl('search.html?q=' + encodeURIComponent(query));
  }

  function ensureMeta(selector, createTag, attrs) {
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement(createTag);
      document.head.appendChild(el);
    }
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  }

  function setRobots(value) {
    ensureMeta('meta[name="robots"]', 'meta', { name: 'robots', content: value });
  }

  function setMeta(name, content) {
    ensureMeta(`meta[name="${name}"]`, 'meta', { name, content });
  }

  function setProperty(property, content) {
    ensureMeta(`meta[property="${property}"]`, 'meta', { property, content });
  }

  function setCanonical(url) {
    ensureMeta('link[rel="canonical"]', 'link', { rel: 'canonical', href: url });
  }

  function setJsonLd(id, data) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  }

  function setPage({ title, description, url, image, type = 'website', robots = 'index,follow' }) {
    document.title = title;
    setMeta('description', description);
    setRobots(robots);
    setCanonical(url);
    setProperty('og:site_name', SITE_NAME);
    setProperty('og:title', title);
    setProperty('og:description', description);
    setProperty('og:url', url);
    setProperty('og:type', type);
    setProperty('og:image', image || DEFAULT_IMAGE);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image || DEFAULT_IMAGE);
  }

  function movieDescription(movie) {
    const kind = movie.kind === 'tv' ? 'TV show' : 'movie';
    return `${movie.title} (${movie.year}) is a ${movie.genres.join(', ')} ${kind} rated ${movie.rating}. ${movie.desc}`;
  }

  function setMoviePage(movie, activeServer) {
    const title = `${movie.title} (${movie.year}) - Details on ${SITE_NAME}`;
    const description = movieDescription(movie).slice(0, 300);
    const url = movieUrl(movie, activeServer);
    const image = window.posterFor ? window.posterFor(movie) : DEFAULT_IMAGE;
    setPage({ title, description, url, image, type: 'website' });
    setJsonLd('movie-schema', {
      '@context': 'https://schema.org',
      '@type': movie.kind === 'tv' ? 'TVSeries' : 'Movie',
      name: movie.title,
      description: movie.desc,
      image,
      datePublished: String(movie.year),
      genre: movie.genres,
      duration: movie.duration,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: movie.rating,
        bestRating: '10',
        ratingCount: '1000'
      },
      url
    });
  }

  function setSearchPage(query, resultCount) {
    const clean = query.trim();
    if (!clean) {
      setPage({
        title: `Search Movies and TV Shows - ${SITE_NAME}`,
        description: `Search the ${SITE_NAME} catalog by title, genre, or year.`,
        url: absoluteUrl('search.html'),
        robots: 'noindex,follow'
      });
      return;
    }
    const title = `${clean} Movies and TV Shows - ${SITE_NAME}`;
    const description = resultCount > 0
      ? `Browse ${resultCount} ${clean} movie and TV show result${resultCount === 1 ? '' : 's'} on ${SITE_NAME}.`
      : `Search ${SITE_NAME} for ${clean} movies and TV shows.`;
    setPage({
      title,
      description,
      url: searchUrl(clean),
      robots: resultCount > 0 ? 'index,follow' : 'noindex,follow'
    });
  }

  function setNotFoundPage() {
    setPage({
      title: `Title Not Found - ${SITE_NAME}`,
      description: `The requested title could not be found in the ${SITE_NAME} catalog.`,
      url: absoluteUrl('watch.html'),
      robots: 'noindex,follow'
    });
  }

  return {
    BASE_URL,
    SITE_NAME,
    absoluteUrl,
    movieUrl,
    searchUrl,
    setPage,
    setMoviePage,
    setSearchPage,
    setNotFoundPage
  };
})();
