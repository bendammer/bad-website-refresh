# BAD Photography – benaarondammer.studio

Static site, generated from data in `content/`. Hosted via GitHub Pages (see `CNAME`).

## Add a new project
1. Put the photos (and optional .mp4) of the project in one folder.
2. `node tools/new-project.mjs "Project Title" /path/to/photos` (optional: `--cover 3`, `--label "short name"`)
3. Check the result locally (`python3 -m http.server`, open http://localhost:8000), then commit and push.

Projects are listed newest-first on the Work page. Edit `content/projects/<slug>.json` to change the title, order,
cover photo, or to add a `description` (used for Google/social previews) or per-photo `alts` (alt text).

## Other content
- `content/site.json` – site name, page descriptions, image sizes, age shown on the About page
- `content/about.html`, `content/contact.html` – text of those pages
- `content/portfolio.json` – the portfolio photos in display order
- `style.css` – design; `tools/templates.mjs` – page markup

## Build
`node tools/build.mjs` regenerates all pages, the optimized WebP images (`images/optimized/`), `sitemap.xml` and `robots.txt`.
Full-resolution originals go in `source/work/<slug>/` (not committed); the build prefers them over the older web-size JPGs.
Requires Node 18+ and `npm install` (sharp).
