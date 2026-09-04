#!/usr/bin/env node
/**
 * Edgio — générateur du blog statique.
 *
 * Entrée  : content/posts/*.json  (un fichier = un article, écrit à la main
 *           ou déposé par le scénario Make « EDGIO | 05 - Blog Publisher »)
 * Sortie  : blog/posts/<slug>.html, blog/index.html, blog/feed.xml, sitemap.xml
 *
 * Aucune dépendance : Node >= 18 suffit. Le rendu vit ici, pas dans Make :
 * l'automatisation n'a qu'un JSON à produire, ce qui la rend beaucoup moins
 * fragile et permet de changer le design du blog sans retoucher le scénario.
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'content/posts');
const OUT = path.join(ROOT, 'blog/posts');
const SITE = 'https://edgio.fr';
const APP = 'https://app.edgio.fr';
const GA = 'G-376LSJY2CH';
const ADS = 'ca-pub-2762415539425860';

const AUTHORS = {
  'Leon Banner': {
    role: "Fondateur d'Edgio, day trader sur futures",
    bio: "Leon Banner trade les futures indices et l'or en intraday depuis 2020. Il a créé Edgio après avoir compris que ses pertes ne venaient pas de ses setups mais de ce qu'il faisait entre deux trades. Il écrit ici à partir de son propre journal, pas de théorie.",
    url: `${SITE}/blog/a-propos.html`,
    avatar: '/logo.png',
  },
};

const CATEGORIES = ['Psychologie', 'Discipline', 'Journal de trading', 'Prop firm', 'Méthode'];

/* ------------------------------------------------------------------ utils */

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const slugify = (s = '') =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

const frDate = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/** Markdown minimal : ## ### , listes - et 1. , **gras**, [lien](url), > citation. */
function md(src = '') {
  const inline = (t) =>
    esc(t)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');

  const out = [];
  let list = null; // 'ul' | 'ol'
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };

  const lines = String(src).split('\n');
  const cells = (l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) { closeList(); continue; }

    // Tableau : ligne d'en-tête suivie d'un séparateur |---|---|
    if (line.startsWith('|') && /^\|[\s:|-]+\|$/.test((lines[i + 1] || '').trim())) {
      closeList();
      const head = cells(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(cells(lines[i++].trim()));
      i--;
      out.push('<table><thead><tr>' + head.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
        rows.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table>');
      continue;
    }

    const h = /^(#{2,3})\s+(.*)$/.exec(line);
    if (h) {
      closeList();
      const lvl = h[1].length;
      const text = inline(h[2]);
      out.push(lvl === 2 ? `<h2 id="${slugify(h[2])}">${text}</h2>` : `<h3>${text}</h3>`);
      continue;
    }
    if (line.startsWith('> ')) { closeList(); out.push(`<blockquote><p>${inline(line.slice(2))}</p></blockquote>`); continue; }

    const ul = /^[-*]\s+(.*)$/.exec(line);
    const ol = /^\d+[.)]\s+(.*)$/.exec(line);
    if (ul || ol) {
      const want = ul ? 'ul' : 'ol';
      if (list !== want) { closeList(); out.push(`<${want}>`); list = want; }
      out.push(`<li>${inline((ul || ol)[1])}</li>`);
      continue;
    }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join('\n');
}

const headings = (src = '') =>
  String(src).split('\n')
    .map((l) => /^##\s+(.*)$/.exec(l.trim()))
    .filter(Boolean)
    .map((m) => ({ id: slugify(m[1]), text: m[1] }));

const readingTime = (src = '') => Math.max(2, Math.round(String(src).split(/\s+/).length / 220));

/* --------------------------------------------------------------- fragments */

const head = ({ title, description, canonical, image, extra = '' }) => `<!DOCTYPE html>
<html lang="fr">
<head>
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA}');
</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#08090d">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Edgio">
<meta property="og:locale" content="fr_FR">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${image}">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/icon-192.png">
<link rel="alternate" type="application/rss+xml" title="Blog Edgio" href="${SITE}/blog/feed.xml">
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/sora-latin-800-normal.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/manrope-latin-500-normal.woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/fonts.css">
<link rel="stylesheet" href="/assets/css/style.css">
<link rel="stylesheet" href="/assets/css/blog.css">
${extra}
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS}"
     crossorigin="anonymous"></script>
</head>
<body>
<div class="aurora" aria-hidden="true"><span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span></div>
<div class="grid-overlay" aria-hidden="true"></div>

<header class="nav scrolled" id="nav">
  <div class="wrap nav-inner">
    <a href="/" class="brand"><img src="/logo.png" alt="Logo Edgio" width="34" height="34"> Edgio</a>
    <nav class="nav-links">
      <a href="/#psychologie">Le principe</a>
      <a href="/#analyse">Analyse</a>
      <a href="/#fonctionnalites">Fonctionnalités</a>
      <a href="/blog/">Blog</a>
      <a href="/#faq">FAQ</a>
    </nav>
    <div class="nav-cta">
      <a href="${APP}" class="btn btn-ghost">Se connecter</a>
      <a href="${APP}" class="btn btn-primary">Commencer</a>
      <button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>

<nav class="mobile-menu" id="mobileMenu">
  <a href="/#psychologie">Le principe</a>
  <a href="/#analyse">Analyse</a>
  <a href="/#fonctionnalites">Fonctionnalités</a>
  <a href="/blog/">Blog</a>
  <a href="/#faq">FAQ</a>
  <a href="${APP}" class="btn btn-primary">Commencer gratuitement</a>
</nav>
<script>
/* Menu mobile autonome : les pages blog ne chargent pas main.js (animations
   de la home qui n'ont pas de cible ici). */
(function(){
  var b = document.getElementById('burger'), m = document.getElementById('mobileMenu');
  if(!b || !m) return;
  b.addEventListener('click', function(){
    var open = !m.classList.contains('open');
    m.classList.toggle('open', open);
    b.classList.toggle('open', open);
    b.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  m.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      m.classList.remove('open'); b.classList.remove('open');
      b.setAttribute('aria-expanded','false'); document.body.style.overflow='';
    });
  });
})();
</script>
`;

const footer = () => `
<footer class="footer">
  <div class="wrap">
    <div class="foot-top">
      <div class="foot-brand">
        <a href="/" class="brand"><img src="/logo.png" alt="Logo Edgio" width="34" height="34"> Edgio</a>
        <p>Le journal de trading centré sur la psychologie et l'émotion du trader. On ne collectionne pas des statistiques — on note l'humain, puis on croise.</p>
        <div class="foot-social">
          <a href="https://www.instagram.com/edgio_app/" target="_blank" rel="noopener noreferrer" aria-label="Edgio sur Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></svg></a>
          <a href="https://www.tiktok.com/@edgio_app" target="_blank" rel="noopener noreferrer" aria-label="Edgio sur TikTok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82a4.28 4.28 0 0 1-3.14-1.4V15.4a5.1 5.1 0 1 1-4.4-5.06v2.62a2.5 2.5 0 1 0 1.76 2.39V2h2.53a4.28 4.28 0 0 0 3.25 4.14z"/></svg></a>
          <a href="https://x.com/EdgioApp" target="_blank" rel="noopener noreferrer" aria-label="Edgio sur X"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.6 10.6 20.4 3h-1.7l-5.9 6.6L8 3H3l7.1 10L3 20.9h1.7l6.2-7 5 7h5zM11.4 12.9l-.7-1L5 4.3h2.2l4.6 6.5.7 1 5.9 8.4h-2.2z"/></svg></a>
        </div>
      </div>
      <div class="foot-col">
        <h4>Produit</h4>
        <a href="/#psychologie">Le principe</a>
        <a href="/#analyse">Analyse comportementale</a>
        <a href="/#fonctionnalites">Fonctionnalités</a>
        <a href="/blog/">Blog</a>
        <a href="${APP}">Ouvrir l'app</a>
      </div>
      <div class="foot-col">
        <h4>Légal</h4>
        <a href="/mentions-legales.html">Mentions légales</a>
        <a href="/confidentialite.html">Confidentialité</a>
        <a href="mailto:contact@edgio.fr">contact@edgio.fr</a>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© ${new Date().getFullYear()} Edgio · édité par EROS (SASU).</span>
      <span class="risk">Le trading comporte un risque de perte en capital. Edgio est un outil de suivi et ne fournit aucun conseil en investissement.</span>
    </div>
  </div>
</footer>
</body>
</html>
`;

/* ------------------------------------------------------------------ article */

function renderPost(p, all) {
  const url = `${SITE}/blog/posts/${p.slug}.html`;
  const author = AUTHORS[p.auteur] || AUTHORS['Leon Banner'];
  const toc = headings(p.corps);
  const image = p.image ? `${SITE}${p.image}` : `${SITE}/og-image.png`;

  const related = (p.articles_lies || [])
    .map((s) => all.find((a) => a.slug === s))
    .filter(Boolean)
    .slice(0, 3);

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: p.titre,
      description: p.meta_description,
      inLanguage: 'fr-FR',
      datePublished: p.date_publication,
      dateModified: p.date_maj || p.date_publication,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      url,
      image,
      wordCount: String(p.corps).split(/\s+/).length,
      articleSection: p.categorie,
      keywords: [p.mot_cle_principal, ...(p.mots_cles_secondaires || [])].filter(Boolean).join(', '),
      author: { '@type': 'Person', name: p.auteur, description: author.role, url: author.url },
      publisher: {
        '@type': 'Organization',
        name: 'Edgio',
        url: `${SITE}/`,
        logo: { '@type': 'ImageObject', url: `${SITE}/icon-512.png` },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog/` },
        { '@type': 'ListItem', position: 3, name: p.titre, item: url },
      ],
    },
  ];
  if (p.faq?.length) {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: p.faq.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.reponse },
      })),
    });
  }

  const extra = ld.map((o) => `<script type="application/ld+json">\n${JSON.stringify(o, null, 1)}\n</script>`).join('\n');

  return `${head({
    title: p.meta_title || `${p.titre} — Edgio`,
    description: p.meta_description,
    canonical: url,
    image,
    extra,
  })}
<article class="article">
  <div class="wrap">
    <div class="article-head">
      <nav class="breadcrumb" aria-label="Fil d'Ariane">
        <a href="/">Accueil</a> › <a href="/blog/">Blog</a> › <span>${esc(p.categorie)}</span>
      </nav>
      <span class="eyebrow">${esc(p.categorie)}</span>
      <h1>${esc(p.titre)}</h1>
      <p class="chapeau">${esc(p.chapeau)}</p>
      <div class="byline">
        <span>Par <a class="author" href="${author.url}">${esc(p.auteur)}</a> — ${esc(author.role)}</span>
        <span class="dot"></span>
        <span>Publié le <time datetime="${p.date_publication}">${frDate(p.date_publication)}</time></span>
        ${p.date_maj && p.date_maj !== p.date_publication
          ? `<span class="dot"></span><span>Mis à jour le <time datetime="${p.date_maj}">${frDate(p.date_maj)}</time></span>`
          : ''}
        <span class="dot"></span>
        <span>${p.temps_lecture || readingTime(p.corps)} min de lecture</span>
      </div>
    </div>

    ${toc.length >= 3 ? `<nav class="toc" aria-label="Sommaire">
      <h2>Sommaire</h2>
      <ol>${toc.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join('')}</ol>
    </nav>` : ''}

    <div class="article-body">
${md(p.corps)}
    </div>

    ${p.faq?.length ? `<section class="article-faq">
      <h2>Questions fréquentes</h2>
      ${p.faq.map((f) => `<div class="qa"><h3>${esc(f.question)}</h3><p>${esc(f.reponse)}</p></div>`).join('\n      ')}
    </section>` : ''}

    <section class="article-cta">
      <h2>${esc(p.cta?.titre || 'Note le trader, pas seulement ses chiffres')}</h2>
      <p>${esc(p.cta?.texte || "Edgio croise ta discipline, ton respect du plan et ton humeur avec tes résultats, séance après séance. Gratuit, sans carte bancaire.")}</p>
      <a href="${p.cta?.url || `${APP}/?utm_source=blog&utm_medium=article&utm_campaign=${p.slug}`}" class="btn btn-primary btn-lg">Ouvrir Edgio gratuitement</a>
    </section>

    <aside class="author-box">
      <img src="${author.avatar}" alt="" width="54" height="54" loading="lazy">
      <div>
        <h3>${esc(p.auteur)}</h3>
        <p>${esc(author.bio)}</p>
      </div>
    </aside>

    ${related.length ? `<section class="related">
      <h2>À lire ensuite</h2>
      <div class="related-grid">
        ${related.map(card).join('\n        ')}
      </div>
    </section>` : ''}

    <p class="risk-note"><strong>Avertissement.</strong> Cet article est une ressource pédagogique sur la méthode et la psychologie de trading. Il ne constitue ni un conseil en investissement, ni une recommandation personnalisée, ni une incitation à prendre position. Le trading sur instruments à effet de levier comporte un risque élevé de perte rapide du capital. Les performances passées ne préjugent pas des performances futures.</p>
  </div>
</article>
${footer()}`;
}

const card = (p, featured = false) => `<a class="post-card${featured ? ' featured' : ''}" href="/blog/posts/${p.slug}.html">
  <div class="txt">
    <div class="meta"><span class="cat">${esc(p.categorie)}</span><span>${frDate(p.date_publication)}</span><span>${p.temps_lecture || readingTime(p.corps)} min</span></div>
    <h2>${esc(p.titre)}</h2>
    <p>${esc(p.chapeau)}</p>
    <span class="more">Lire l'article →</span>
  </div>
</a>`;

/* --------------------------------------------------------------------- hub */

function renderIndex(posts) {
  const cats = CATEGORIES.filter((c) => posts.some((p) => p.categorie === c));
  const [first, ...rest] = posts;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog Edgio — psychologie et discipline de trading',
    description:
      "Articles de fond sur la psychologie du trader, la discipline d'exécution, le journal de trading et les challenges prop firm.",
    url: `${SITE}/blog/`,
    inLanguage: 'fr-FR',
    publisher: { '@type': 'Organization', name: 'Edgio', url: `${SITE}/` },
    blogPost: posts.slice(0, 20).map((p) => ({
      '@type': 'BlogPosting',
      headline: p.titre,
      url: `${SITE}/blog/posts/${p.slug}.html`,
      datePublished: p.date_publication,
      author: { '@type': 'Person', name: p.auteur },
    })),
  };

  return `${head({
    title: 'Blog Edgio — psychologie, discipline et journal de trading',
    description:
      "Comprendre pourquoi tu perds quand tu sais quoi faire. Articles de fond sur la psychologie du trader, la discipline d'exécution, la tenue d'un journal de trading et les challenges prop firm.",
    canonical: `${SITE}/blog/`,
    image: `${SITE}/og-image.png`,
    extra: `<script type="application/ld+json">\n${JSON.stringify(ld, null, 1)}\n</script>`,
  })}
<section class="blog-hero">
  <div class="wrap">
    <span class="eyebrow center">Le blog Edgio</span>
    <h1>Ce qui se passe <span class="grad-text">entre deux trades</span></h1>
    <p>La plupart des traders perdants connaissent leur setup. Ce qu'ils ne voient pas, c'est ce que leur tête fait après une perte, avant une séance, ou à la troisième position de la journée. On écrit sur ça.</p>
    <nav class="blog-filters" aria-label="Catégories">
      <a href="/blog/" aria-current="true">Tout</a>
      ${cats.map((c) => `<a href="/blog/?cat=${encodeURIComponent(c)}" data-cat="${esc(c)}">${esc(c)}</a>`).join('\n      ')}
    </nav>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="blog-grid" id="posts">
      ${first ? card(first, true) : '<p>Les premiers articles arrivent très bientôt.</p>'}
      ${rest.map((p) => card(p)).join('\n      ')}
    </div>
  </div>
</section>
<script>
/* Filtre de catégorie : l'URL reste crawlable, le filtrage est un confort de lecture. */
(function(){
  var cat = new URLSearchParams(location.search).get('cat');
  document.querySelectorAll('.blog-filters a').forEach(function(a){
    a.setAttribute('aria-current', String((a.dataset.cat || null) === cat));
  });
  if(!cat) return;
  document.querySelectorAll('#posts .post-card').forEach(function(c){
    var on = c.querySelector('.cat').textContent.trim() === cat;
    c.hidden = !on;
    c.classList.remove('featured');
  });
})();
</script>
${footer()}`;
}

/* ------------------------------------------------------------------ auteur */

function renderAuthor(posts) {
  const a = AUTHORS['Leon Banner'];
  const url = `${SITE}/blog/a-propos.html`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: 'Leon Banner',
      url,
      jobTitle: a.role,
      description: a.bio,
      worksFor: { '@type': 'Organization', name: 'Edgio', url: `${SITE}/` },
      knowsAbout: ['psychologie du trading', 'discipline de trading', 'journal de trading', 'day trading futures'],
    },
  };
  return `${head({
    title: "Qui écrit sur ce blog — Leon Banner, fondateur d'Edgio",
    description:
      "Leon Banner, fondateur d'Edgio et day trader sur futures, écrit les articles de ce blog. Expérience, méthode d'écriture et politique éditoriale.",
    canonical: url,
    image: `${SITE}/og-image.png`,
    extra: `<script type="application/ld+json">\n${JSON.stringify(ld, null, 1)}\n</script>`,
  })}
<article class="article">
  <div class="wrap">
    <div class="article-head">
      <nav class="breadcrumb" aria-label="Fil d'Ariane"><a href="/">Accueil</a> › <a href="/blog/">Blog</a> › <span>À propos</span></nav>
      <span class="eyebrow">À propos</span>
      <h1>Qui écrit sur ce blog</h1>
      <p class="chapeau">Un seul auteur, une seule source : mon propre journal de trading. Pas de contenu acheté, pas d'article signé par un pseudonyme.</p>
    </div>
    <div class="article-body">
      <h2 id="noa-blenner">Leon Banner</h2>
      <p>${esc(a.bio)}</p>
      <p>Je trade en intraday sur les futures indices et l'or, avec un risque fixe par trade et un stop de séance chiffré. Je suis passé par les mêmes étapes que la plupart des lecteurs de ce blog : des stratégies qui fonctionnaient en backtest et pas en réel, des journées à −6R après un stop à −1R, des mois passés à chercher un meilleur setup alors que le problème était ailleurs.</p>
      <p>Edgio est né de ce constat : mes pertes ne venaient pas de mes setups mais de ce que je faisais entre deux trades. J'ai commencé à noter le trader avant de noter les trades, et les croisements que j'ai obtenus sont devenus le produit.</p>

      <h2 id="ligne-editoriale">Ce que ce blog publie, et ce qu'il ne publiera jamais</h2>
      <p>Chaque article part d'une difficulté réelle, remontée par des traders — commentaires, forums, échanges avec les utilisateurs d'Edgio — et non d'un mot-clé choisi pour son volume de recherche. Le sujet vient du terrain, le mot-clé vient ensuite.</p>
      <ul>
        <li><strong>Pas de signaux, pas de recommandations d'achat ou de vente.</strong> Edgio est un outil de journal et d'analyse comportementale, pas un conseiller en investissement.</li>
        <li><strong>Pas de promesse de gain</strong>, pas de capture de compte, pas de « méthode qui fonctionne à 90 % ».</li>
        <li><strong>Pas de contenu publié sans relecture humaine.</strong> Des outils d'aide à la rédaction interviennent en amont dans la préparation des sujets et des plans ; aucun article n'est mis en ligne sans être relu, corrigé et validé ligne à ligne par moi.</li>
        <li><strong>Pas d'article laissé à l'abandon.</strong> Les articles sont relus et mis à jour ; la date de dernière mise à jour est affichée en haut de chaque page.</li>
      </ul>

      <h2 id="corrections">Corrections et contact</h2>
      <p>Une erreur factuelle, un désaccord argumenté, une demande de précision : <a href="mailto:contact@edgio.fr">contact@edgio.fr</a>. Les corrections sont faites dans l'article, et la date de mise à jour est modifiée en conséquence.</p>

      <h2 id="articles">Articles publiés</h2>
      <ul>
        ${posts.map((p) => `<li><a href="/blog/posts/${p.slug}.html">${esc(p.titre)}</a> — ${frDate(p.date_publication)}</li>`).join('\n        ')}
      </ul>
    </div>
    <p class="risk-note"><strong>Avertissement.</strong> Les contenus de ce blog sont pédagogiques et ne constituent ni un conseil en investissement, ni une recommandation personnalisée. Le trading sur instruments à effet de levier comporte un risque élevé de perte rapide du capital.</p>
  </div>
</article>
${footer()}`;
}

/* --------------------------------------------------------------------- rss */

const renderFeed = (posts) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>Blog Edgio — psychologie et discipline de trading</title>
<link>${SITE}/blog/</link>
<atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml"/>
<description>Articles de fond sur la psychologie du trader, la discipline d'exécution et le journal de trading.</description>
<language>fr-FR</language>
<lastBuildDate>${new Date(`${posts[0]?.date_maj || posts[0]?.date_publication || '1970-01-01'}T08:00:00Z`).toUTCString()}</lastBuildDate>
${posts.map((p) => `<item>
<title>${esc(p.titre)}</title>
<link>${SITE}/blog/posts/${p.slug}.html</link>
<guid isPermaLink="true">${SITE}/blog/posts/${p.slug}.html</guid>
<pubDate>${new Date(`${p.date_publication}T08:00:00Z`).toUTCString()}</pubDate>
<category>${esc(p.categorie)}</category>
<description>${esc(p.chapeau)}</description>
</item>`).join('\n')}
</channel>
</rss>
`;

const renderSitemap = (posts) => {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${SITE}/`, lastmod: today, priority: '1.0', changefreq: 'weekly' },
    { loc: `${SITE}/blog/`, lastmod: posts[0]?.date_maj || posts[0]?.date_publication || today, priority: '0.9', changefreq: 'daily' },
    ...posts.map((p) => ({
      loc: `${SITE}/blog/posts/${p.slug}.html`,
      lastmod: p.date_maj || p.date_publication,
      priority: '0.8',
      changefreq: 'monthly',
    })),
    { loc: `${SITE}/blog/a-propos.html`, lastmod: today, priority: '0.5', changefreq: 'monthly' },
    { loc: `${SITE}/mentions-legales.html`, lastmod: '2026-08-22', priority: '0.2', changefreq: 'yearly' },
    { loc: `${SITE}/confidentialite.html`, lastmod: '2026-08-22', priority: '0.2', changefreq: 'yearly' },
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
};

/* -------------------------------------------------------------------- main */

const REQUIRED = ['titre', 'chapeau', 'meta_description', 'categorie', 'date_publication', 'corps'];

async function main() {
  if (!existsSync(SRC)) { console.error(`Dossier introuvable : ${SRC}`); process.exit(1); }
  await mkdir(OUT, { recursive: true });

  const files = (await readdir(SRC)).filter((f) => f.endsWith('.json'));
  const today = new Date().toISOString().slice(0, 10);
  const posts = [];
  const skipped = [];

  for (const f of files) {
    let p;
    try {
      p = JSON.parse(await readFile(path.join(SRC, f), 'utf8'));
    } catch (e) {
      console.error(`✗ ${f} : JSON invalide — ${e.message}`);
      process.exitCode = 1;
      continue;
    }
    p.slug = p.slug || slugify(path.basename(f, '.json'));
    p.auteur = p.auteur || 'Leon Banner';

    const missing = REQUIRED.filter((k) => !p[k]);
    if (missing.length) {
      console.error(`✗ ${f} : champs manquants — ${missing.join(', ')}`);
      process.exitCode = 1;
      continue;
    }
    // Un article n'est publié que s'il est explicitement validé ET daté d'aujourd'hui
    // ou d'avant : c'est ce qui permet de programmer les publications à l'avance.
    if ((p.statut || 'brouillon').toLowerCase() !== 'publie') { skipped.push(`${p.slug} (statut ${p.statut || 'brouillon'})`); continue; }
    if (p.date_publication > today) { skipped.push(`${p.slug} (programmé le ${p.date_publication})`); continue; }

    p.temps_lecture = p.temps_lecture || readingTime(p.corps);
    posts.push(p);
  }

  posts.sort((a, b) => (a.date_publication < b.date_publication ? 1 : -1));

  for (const p of posts) {
    await writeFile(path.join(OUT, `${p.slug}.html`), renderPost(p, posts));
  }
  await writeFile(path.join(ROOT, 'blog/index.html'), renderIndex(posts));
  await writeFile(path.join(ROOT, 'blog/a-propos.html'), renderAuthor(posts));
  await writeFile(path.join(ROOT, 'blog/feed.xml'), renderFeed(posts));
  await writeFile(path.join(ROOT, 'sitemap.xml'), renderSitemap(posts));

  console.log(`✓ ${posts.length} article(s) publié(s) : ${posts.map((p) => p.slug).join(', ') || '—'}`);
  if (skipped.length) console.log(`· ${skipped.length} en attente : ${skipped.join(', ')}`);
}

main();
