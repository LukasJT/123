# Batch workflow

1. Define a narrow audience or catalog gap and assign an immutable batch ID.
2. Search existing external identities and normalized title/year/type candidates before assigning IDs.
3. Record first-party or authorized sources, checked dates, and only verified facts.
4. Add records and a manifest under `data/batches/`. Rerunning the build must not add records.
5. Run `npm run build`, `npm test`, and `npm run check`.
6. Review generated title, collection, editorial, search, and 404 pages at narrow and desktop widths.
7. Report additions, corrections, duplicate candidates, unresolved facts, and generated URL counts in the PR.

Do not renumber IDs or remove old title URLs during deduplication. Choose a survivor, remove aliases from navigation and sitemap, and provide a real redirect where infrastructure permits. GitHub Pages cannot express arbitrary 301 rules through static HTML.
