// HTML templates. They reproduce the markup/classes of the original hand-written pages
// so style.css keeps working unchanged.
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export { esc };

const SIZES = '(max-width: 770px) 85vw, 450px';

/** <img> with responsive webp, intrinsic size, alt and native lazy loading */
export function img(info, { prefix, alt, cls = '', eager = false, sizes = SIZES, id = '' }) {
  const srcset = info.variants.map(v => `${prefix}${v.src} ${v.w}w`).join(', ');
  const attrs = [
    cls && `class="${cls}"`,
    id && `id="${id}"`,
    `src="${prefix}${info.full}"`,
    info.variants.length > 1 && `srcset="${srcset}"`,
    info.variants.length > 1 && `sizes="${sizes}"`,
    `width="${info.w}"`, `height="${info.h}"`,
    `alt="${esc(alt)}"`,
    eager ? 'fetchpriority="high"' : 'loading="lazy"',
    'decoding="async"',
    `data-full="${prefix}${info.full}"`,
  ].filter(Boolean);
  return `<img ${attrs.join(' ')}>`;
}

export function head({ title, description, path, prefix, site, ogImage }) {
  const url = `${site.url}/${path}`.replace(/\/index\.html$/, '/');
  const og = ogImage ? `${site.url}/${ogImage}` : '';
  return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(site.name)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">${og ? `
  <meta property="og:image" content="${og}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${og}">` : ''}
  <link rel="stylesheet" href="${prefix}style.css">
  <link rel="shortcut icon" type="image/x-icon" href="${prefix}images/logos/default.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Saira&display=swap" rel="stylesheet">
</head>`;
}

const legalDesktop = (p, cur = '') => `        <div class="desktop-footer">
            <a${cur === 'imprint' ? ' class="currently-on"' : ''} href="${p}imprint.html">IMPRINT</a>
            <a${cur === 'data-protection' ? ' class="currently-on"' : ''} href="${p}data-protection.html">DATA PROTECTION</a>
        </div>`;

const mobileHeader = (p, sub) => sub
  ? `        <div class="mobile-header-subpage">
            <a href="${p}index.html"><img class="no-lightbox" id="bad-logo-mobile-subpage" src="${p}images/logos/bad-photography-logo.png" alt="BAD Photography logo"></a>
        </div>`
  : `        <div class="mobile-header">
            <img class="no-lightbox" id="bad-logo-mobile" src="${p}images/logos/bad-photography-logo.png" alt="BAD Photography logo">
        </div>`;

const mobileFooter = (p, sub) => `        <div class="${sub ? 'mobile-footer-subpage' : 'mobile-footer'}">
            <a href="${p}data-protection.html">${sub ? 'Data Protection' : 'DATA PROTECTION'}</a>
            <a href="${p}imprint.html">${sub ? 'Imprint' : 'IMPRINT'}</a>
        </div>`;

/** desktop sidebar. `current` is portfolio|work|about|contact */
function desktopNav(p, current) {
  const items = [['portfolio', 'index.html'], ['work', 'work.html'], ['about', 'about.html'], ['contact', 'contact.html']];
  const links = items.map(([name, href]) => {
    const isCur = name === current;
    // the current page is not linked, except on work sub-pages where "work" links back
    const link = (!isCur || p) && !(isCur && !p) ? ` href="${p}${href}"` : '';
    return `                <a class="desktop-navbar-item${isCur ? ' currently-on' : ''}"${link} id="desktop-navbar-item-${name}">${name}</a>`;
  }).join('\n');
  return `        <div class="desktop-navbar">
            <div class="desktop-badlogo">
                <a${p || current !== 'portfolio' ? ` href="${p}index.html"` : ''}><img class="no-lightbox" id="desktop-badlogo" src="${p}images/logos/bad-photography-logo-desktop.jpg" alt="BAD Photography logo"></a>
            </div>
            <div class="desktop-navbar-items">
${links}
            </div>
        </div>`;
}

/** Hamburger button + full-screen menu for the mobile layout (styled like the desktop menu) */
function mobileMenu(p, current) {
  const items = [['portfolio', 'index.html'], ['work', 'work.html'], ['about', 'about.html'], ['contact', 'contact.html']];
  const links = items.map(([name, href]) =>
    `                <a class="mobile-menu-item${name === current ? ' currently-on' : ''}" href="${p}${href}"${name === current ? ' aria-current="page"' : ''}>${name}</a>`).join('\n');
  return `        <button class="menu-toggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mobile-menu"><span></span></button>
        <nav class="mobile-menu" id="mobile-menu" aria-label="Main menu">
            <div class="mobile-menu-items">
${links}
            </div>
            <div class="mobile-menu-legal">
                <a href="${p}imprint.html">IMPRINT</a>
                <a href="${p}data-protection.html">DATA PROTECTION</a>
            </div>
        </nav>`;
}

export function page({ headHtml, body, prefix, current = '' }) {
  body = body.replace('<div class="mobile">', `<div class="mobile">\n${mobileMenu(prefix, current)}`);
  return `<!DOCTYPE html>
<html lang="en">

${headHtml}

<body>
${body}

    <script src="${prefix}index.js"></script>
</body>

</html>
`;
}

export function homeBody({ portfolioImgs }) {
  return `    <div class="mobile">

${mobileHeader('', false)}

        <div class="mobile-body-home">
            <div class="mobile-home-images">
${portfolioImgs}
            </div>
        </div>

${mobileFooter('', false)}
    </div>

    <div class="desktop">
${desktopNav('', 'portfolio')}

        <div class="desktop-body-container">

            <div class="desktop-body">
                <div>
                    <div class="desktop-portfolio">
${portfolioImgs}
                    </div>
                </div>
            </div>

        </div>

${legalDesktop('')}
    </div>`;
}

export function portfolioBody({ imgs }) {
  return `    <div class="mobile">

${mobileHeader('', true)}

        <div class="mobile-body-subpage">

            <div class="mobile-portfolio">

                <div class="mobile-portfolio-portrait">

                    <div class="mobile-portrait-title">
                        <p id="mobile-portrait-title">PORTFOLIO</p>
                    </div>

                    <div class="mobile-portrait-images">
${imgs}
                    </div>
                </div>
            </div>
        </div>

${mobileFooter('', true)}
    </div>

    <div class="desktop">
${desktopNav('', 'portfolio')}

        <div class="desktop-body-container">

            <div class="desktop-body">
                <div>
                    <div class="desktop-portfolio">
${imgs}
                    </div>
                </div>
            </div>

        </div>

${legalDesktop('')}
    </div>`;
}

const ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/** Work overview: tile grid on mobile, list with hover-expand on desktop. items: {slug,title,category,coverHtml,thumbsHtml[]} */
export function workBody({ items }) {
  const tag = it => it.category ? `<span class="tag">${esc(it.category)}</span>` : '';
  const tiles = items.map(it => `                <a class="work-tile" href="work/${it.slug}.html">
                    <div class="work-tile-img">${it.coverTile}</div>
                    <div class="work-tile-meta"><span class="work-tile-title">${esc(it.title)}</span>${tag(it)}</div>
                </a>`).join('\n');
  const rows = items.map(it => `                <div class="work-row">
                    <a class="work-row-head" href="work/${it.slug}.html"><span class="work-row-title">${esc(it.title)}</span>${tag(it)}</a>
                    <div class="work-row-more">
                        <div class="work-row-more-inner">
                            <div class="work-thumbs">
${it.thumbs.map(t => `                                <a class="work-thumb" href="work/${it.slug}.html" tabindex="-1" aria-hidden="true">${t}</a>`).join('\n')}
                            </div>
                            <a class="work-btn" href="work/${it.slug}.html">explore the whole project ${ARROW}</a>
                        </div>
                    </div>
                </div>`).join('\n');
  return `    <div class="mobile">

${mobileHeader('', true)}

        <div class="mobile-body-subpage mobile-body-work">

            <div class="mobile-subpage-title">
                <p id="mobile-portfolio-title">WORK</p>
            </div>

            <div class="work-tiles">
${tiles}
            </div>
        </div>

${mobileFooter('', true)}
    </div>

    <div class="desktop">
${desktopNav('', 'work')}

        <div class="desktop-work-container">
            <div class="work-list">
${rows}
            </div>
        </div>

${legalDesktop('')}
    </div>`;
}

export function aboutBody({ html }) {
  return `    <div class="mobile">

${mobileHeader('', true)}

        <div class="mobile-body-subpage mobile-body-subpage-about">

            <div class="mobile-subpage-title">
                <p id="mobile-portfolio-title">ABOUT</p>
            </div>

            <div class="mobile-about">
                <div class="mobile-about-content">
                    <p>${html}</p>
                </div>
            </div>
        </div>

${mobileFooter('', true)}
    </div>

    <div class="desktop">
${desktopNav('', 'about')}

        <div class="desktop-about-container">

            <div class="desktop-about-body">
                <p>${html}</p>
            </div>

        </div>

${legalDesktop('')}
    </div>`;
}

export function contactBody({ html }) {
  return `    <div class="mobile">

${mobileHeader('', true)}

        <div class="mobile-body-subpage mobile-body-subpage-about">

            <div class="mobile-subpage-title">
                <p id="mobile-portfolio-title">CONTACT ME</p>
            </div>

            <div class="mobile-contact">
                <div class="mobile-contact-content">
                    <p>${html}</p>
                </div>
            </div>
        </div>

${mobileFooter('', true)}
    </div>

    <div class="desktop">
${desktopNav('', 'contact')}

        <div class="desktop-contact-container">

            <div class="desktop-contact-body">
                <p>${html}</p>
            </div>

        </div>

${legalDesktop('')}
    </div>`;
}

export function projectBody({ title, mediaHtml }) {
  const p = '../';
  return `    <div class="mobile">

${mobileHeader(p, true)}

        <div class="mobile-body-subpage">

            <div class="mobile-subpage-title">
                <a href="../work.html"><p id="mobile-portfolio-title">WORK</p></a>
            </div>

            <div class="mobile-portfolio">

                <div class="mobile-portfolio-portrait">

                    <div class="mobile-portrait-title">
                        <p id="mobile-portrait-title">${esc(title)}</p>
                    </div>

                    <div class="mobile-portrait-images">
${mediaHtml}
                    </div>
                </div>
            </div>
        </div>

${mobileFooter(p, true)}
    </div>

    <div class="desktop">
${desktopNav(p, 'work')}

        <div class="desktop-body-container">

            <div class="desktop-body">
                <p class="desktop-title">${esc(title)}</p>
                <div class="desktop-portfolio">
${mediaHtml}
                </div>
            </div>

        </div>

${legalDesktop(p)}
    </div>`;
}

/** Imprint / data protection. `kind` is imprint | data-protection */
export function legalBody({ kind, title, html }) {
  const mob = kind === 'imprint' ? 'imprint' : 'data-protection';
  return `    <div class="mobile">

${mobileHeader('', true)}

        <div class="mobile-body-subpage mobile-body-subpage-about">

            <div class="mobile-subpage-title">
                <p id="mobile-portfolio-title">${title}</p>
            </div>

            <div class="mobile-${mob}">
                <div class="mobile-${mob}-content" lang="de">
${html}
                </div>
            </div>
        </div>

${mobileFooter('', true)}
    </div>

    <div class="desktop">
${desktopNav('', '')}

        <div class="desktop-about-container">

            <div class="desktop-about-body" lang="de">
${html}
            </div>

        </div>

${legalDesktop('', kind)}
    </div>`;
}
