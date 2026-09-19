# SEO audit

Updated 2026-09-19 from main revision `a781905`.

The starting catalog contained 838 records, 838 generated title pages, 201 landing-page definitions, 16 known normalized title/year/type duplicate groups, and a 1,127-URL live sitemap. Search Console, analytics, keyword-volume, revenue, and field performance data were unavailable.

Material defects found: invented `ratingCount: 1000` schema, arbitrary search results changing to indexable after JavaScript, random playback progress on an informational catalog, missing current releases, non-ISO structured durations, date ranges used as publication dates, collections silently capped at 120, and labels such as “trending” without a dated trend source.

This branch removes the invented rating counts, keeps search results noindex, removes random progress, adds source fields and three verified 2025 additions, emits ISO duration/date values for enriched records, adds six finite editorial guides, and validates new duplicates and local links. Legacy duplicate consolidation, pagination, complete data migration, and performance measurement remain follow-up work because preserving indexed URLs requires a deliberate alias/redirect plan.
