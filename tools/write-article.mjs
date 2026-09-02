#!/usr/bin/env node
/**
 * Edgio — rédacteur automatique du blog.
 *
 * Prend le prochain sujet de content/plan.json, le fait rédiger par Claude,
 * le passe au contrôle qualité, et écrit content/posts/<slug>.json.
 * `build-blog.mjs` génère ensuite le HTML. Aucune intervention humaine.
 *
 * Quand la file de sujets est vide, elle est réalimentée automatiquement à
 * partir de ce qui a déjà été publié (sans jamais reprendre un mot-clé existant).
 *
 * Seul secret nécessaire : ANTHROPIC_API_KEY.
 *
 * Codes de sortie : 0 = article écrit, ou rien à faire, ou refusé par le
 * contrôle qualité (on ne publie pas ce jour-là plutôt que de publier mal).
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS = path.join(ROOT, 'content/posts');
const PLAN = path.join(ROOT, 'content/plan.json');
const MODEL = 'claude-opus-5';

export const CATEGORIES = ['Psychologie', 'Discipline', 'Journal de trading', 'Prop firm', 'Méthode'];

const slugify = (s = '') =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);

/* ------------------------------------------------------- consignes d'écriture */

const SYSTEM = `Tu écris les articles du blog d'Edgio (edgio.fr), un journal de trading axé
psychologie et discipline, pour des scalpers et day traders francophones, dont beaucoup sont
en challenge prop firm. L'auteur signataire est Noa Blenner, fondateur d'Edgio, qui trade les
futures indices et l'or en intraday depuis 2020. Tu écris à sa place, à la première personne
quand c'est utile.

CE QUI EST EN JEU. Le trading est un sujet YMYL : Google y attend un niveau d'expérience vécue
et de fiabilité très supérieur à la moyenne, et un article générique ne se contente pas de mal
se classer — il abaisse la qualité perçue de tout le domaine. Écris comme un praticien qui
raconte ce qu'il a vu, jamais comme un rédacteur qui résume le web.

INTERDITS ABSOLUS — un seul suffit à rendre l'article inutilisable :
- Inventer une statistique, un pourcentage, une étude, un chiffre de marché ou une source.
  Aucune exception, et c'est la faute qui revient le plus souvent : tu ne disposes d'aucune
  donnée vérifiable sur les traders, les prop firms ou les taux de réussite, donc tu n'en
  écris aucune. Sont interdits, même en les présentant comme des ordres de grandeur ou en
  écrivant « environ », « la plupart » ou « une grande partie » : tout pourcentage portant sur
  des personnes, tout « X sur Y », tout taux d'échec ou de réussite, toute étude, toute
  recherche, tout chiffre attribué à un secteur ou à une plateforme.
  Écris le mécanisme à la place du chiffre. « La majorité des comptes sautent le dernier
  jour » est interdit ; « le dernier jour concentre le risque, et voici pourquoi » est ce
  qu'on attend.
  Les seuls chiffres autorisés sont ceux de la méthode elle-même — un seuil de règle, un
  nombre de trades, un montant en R, une durée, un pourcentage de drawdown fixé par un
  règlement de prop firm — présentés comme des repères de méthode, jamais comme des faits
  mesurés sur une population.
- Toute promesse de gain, tout rendement, tout signal, tout conseil d'investissement.
- Les emoji, les points d'exclamation, les hashtags.
- Les formules creuses : « dans le monde du trading », « il est important de », « dans cet
  article nous verrons », « conseils pour réussir », « la clé du succès ».
- Une dernière section intitulée « Conclusion » qui résume ce qui vient d'être lu.
- Un titre de niveau 1 (#) dans le corps, du HTML, des images.

STYLE :
- Ouvre sur une situation concrète et physique : ce que le trader voit sur son écran, ce qu'il
  fait avec ses mains, ce qu'il se dit. Jamais sur une généralité.
- Tutoie le lecteur. Ton direct, sec, sans complaisance et sans condescendance.
- Phrases courtes. Un paragraphe, une idée, trois à cinq lignes.
- Nomme les mécanismes, ne les survole pas. Explique pourquoi une chose se produit avant de
  dire quoi faire.
- Termine par du concret : un protocole, une règle à coller au-dessus de l'écran, une
  séquence d'actions numérotée.
- Le produit Edgio n'est jamais le sujet. Deux mentions maximum dans tout l'article, jamais
  dans l'introduction, toujours en fin de section, avec le lien markdown [Edgio](/) et
  présenté comme une façon de faire parmi d'autres. L'article doit rester entièrement utile
  pour quelqu'un qui ne l'utilisera jamais.

STRUCTURE : 1500 à 1900 mots. 5 à 7 titres de niveau 2 (##), des ### seulement s'ils servent.
Le mot-clé principal apparaît dans le titre, dans le premier paragraphe, et dans deux ## au
maximum, toujours naturellement. Markdown autorisé : ##, ###, listes - et 1., **gras**,
[lien](url), > citation, tableaux.`;

export const ArticleSchema = z.object({
  titre: z.string().describe('H1, 55 à 70 caractères, contient le mot-clé principal'),
  meta_title: z.string().describe('60 caractères maximum, se termine par " | Edgio"'),
  meta_description: z.string().describe('150 à 160 caractères, donne envie de cliquer sans rien promettre'),
  chapeau: z.string().describe('2 à 3 phrases sous le titre : pose la scène, ne résume pas'),
  mot_cle_principal: z.string(),
  mots_cles_secondaires: z.array(z.string()).describe('3 à 5 requêtes proches'),
  categorie: z.enum(CATEGORIES),
  corps: z.string().describe("L'article complet en markdown, sans titre de niveau 1"),
  faq: z.array(z.object({
    question: z.string(),
    reponse: z.string().describe('2 à 4 phrases autonomes, compréhensibles hors contexte'),
  })).describe('3 à 5 entrées'),
});

export const PlanSchema = z.object({
  sujets: z.array(z.object({
    mot_cle: z.string(),
    angle: z.string(),
    categorie: z.enum(CATEGORIES),
  })),
});

/* --------------------------------------------------------- contrôle qualité */

/**
 * Remplace la relecture humaine. Chaque règle correspond à une faute qui, sur un
 * sujet financier, coûte plus cher que de sauter une publication.
 */
/** Phrase complète contenant l'index donné : un fragment isolé ne dit pas au
 *  modèle quoi corriger, la phrase entière si. */
function phraseAutour(texte, index) {
  const debut = Math.max(
    texte.lastIndexOf('.', index) + 1,
    texte.lastIndexOf('\n', index) + 1,
  );
  let fin = texte.indexOf('.', index);
  if (fin === -1) fin = Math.min(texte.length, index + 200);
  return texte.slice(debut, fin + 1).trim();
}

export function controle(a, slugsExistants, motsClesExistants) {
  const p = [];
  const corps = a.corps || '';
  const mots = corps.split(/\s+/).length;

  // Statistiques et sources inventées : la faute la plus grave et la plus fréquente.
  const inventions = [
    [/\b\d{1,3}[.,]?\d*\s*%\s*(?:des?|du|de la|d'entre)\s+\w+/i, 'pourcentage sur une population'],
    [/\b(?:selon|d'apr[eè]s)\s+(?:une|des|le|la|les)\s+[ée]tudes?\b/i, 'étude citée sans source'],
    [/\b(?:une|des)\s+[ée]tudes?\s+(?:montre|indique|r[ée]v[eè]le|d[ée]montre)/i, 'étude citée sans source'],
    [/\b(?:une|des|les)\s+statistiques?\s+(?:montre|indique|r[ée]v[eè]le)/i, 'statistique attribuée'],
    [/\b\d+\s*(?:traders?|personnes)\s+sur\s+\d+/i, 'proportion inventée'],
    [/\b(?:la plupart|\d+\s*%)\s+des traders\s+(?:perdent|gagnent|échouent)\b/i, 'chiffre sur les traders'],
    [/\b(?:recherches?|chercheurs?|université|revue)\b.{0,40}\b(?:montre|démontre|prouve)/i, 'référence académique inventée'],
  ];
  for (const [re, quoi] of inventions) {
    const m = corps.match(re);
    if (m) p.push(`${quoi}, dans cette phrase : « ${phraseAutour(corps, m.index)} »`);
  }

  // Promesses et conseils : hors périmètre légal du site.
  const promesses = [
    [/\b(?:garanti|garantis|assuré)\b/i, 'promesse de garantie'],
    [/\b\d+\s*(?:%|€|\$|k€)\s*(?:par|\/)\s*(?:mois|semaine|an|jour)\b/i, 'rendement chiffré'],
    [/\b(?:tu vas|vous allez)\s+(?:gagner|devenir rentable|doubler)/i, 'promesse de gain'],
    [/\b(?:achète|vends|achetez|vendez)\s+(?:maintenant|dès)/i, "conseil d'investissement"],
    [/\bje te conseille d'(?:acheter|vendre)/i, "conseil d'investissement"],
  ];
  for (const [re, quoi] of promesses) {
    const m = corps.match(re);
    if (m) p.push(`${quoi}, dans cette phrase : « ${phraseAutour(corps, m.index)} »`);
  }

  // Forme.
  if (mots < 1200) p.push(`article trop court (${mots} mots, minimum 1200)`);
  if (mots > 2600) p.push(`article trop long (${mots} mots)`);
  if (/^#\s/m.test(corps)) p.push('contient un titre de niveau 1');
  if (/<[a-z][^>]*>/i.test(corps)) p.push('contient du HTML');
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(corps)) p.push('contient des emoji');
  if ((corps.match(/^##\s/gm) || []).length < 4) p.push('moins de 4 sections H2');
  if (/^##\s*Conclusion\s*$/im.test(corps)) p.push('section « Conclusion »');

  const mentions = (corps.match(/\bEdgio\b/g) || []).length;
  if (mentions > 3) p.push(`Edgio mentionné ${mentions} fois (3 maximum)`);

  // Doublons : deux articles sur la même requête se cannibalisent.
  const slug = slugify(a.mot_cle_principal);
  if (!slug) p.push('mot-clé principal vide');
  if (slugsExistants.includes(slug)) p.push(`slug déjà publié : ${slug}`);
  if (motsClesExistants.includes(a.mot_cle_principal.trim().toLowerCase()))
    p.push(`mot-clé déjà couvert : ${a.mot_cle_principal}`);

  // Métadonnées.
  if (!a.meta_description || a.meta_description.length < 110 || a.meta_description.length > 200)
    p.push(`meta description hors format (${a.meta_description?.length ?? 0} caractères, attendu 110-200)`);
  if (!a.faq || a.faq.length < 3) p.push('moins de 3 questions en FAQ');

  return { ok: p.length === 0, problemes: p, slug, mots };
}

/* --------------------------------------------------------------- file de sujets */

async function rechargerPlan(client, publies) {
  console.log('· file de sujets vide, génération de nouveaux sujets');
  const res = await client.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    system:
      "Tu construis le plan éditorial du blog d'Edgio, un journal de trading axé psychologie et " +
      "discipline, pour des day traders et scalpers francophones, dont beaucoup en challenge prop firm. " +
      "Tu proposes des sujets qui répondent à une vraie recherche Google en français, avec une intention " +
      "informationnelle claire, et qui touchent au comportement du trader plutôt qu'à l'analyse de marché. " +
      "Jamais de sujet sur une stratégie, un indicateur, un actif ou une prévision.",
    messages: [{
      role: 'user',
      content:
        `Propose 8 nouveaux sujets d'articles.\n\nSujets déjà couverts, à ne jamais reprendre ni ` +
        `reformuler :\n${publies.map((p) => `- ${p.mot_cle_principal} (${p.titre})`).join('\n') || '- aucun'}\n\n` +
        `Pour chacun : le mot-clé principal exact tel qu'un trader le taperait dans Google, ` +
        `l'angle concret à traiter, et la catégorie parmi ${CATEGORIES.join(', ')}.`,
    }],
    output_config: {
      format: zodOutputFormat(PlanSchema),
    },
  });
  const sujets = res.parsed_output?.sujets ?? [];
  if (!sujets.length) throw new Error("impossible de générer de nouveaux sujets");
  await writeFile(PLAN, JSON.stringify({ sujets }, null, 2) + '\n');
  return sujets;
}

/* ---------------------------------------------------------------------- main */

async function main() {
  const client = new Anthropic();

  const fichiers = (await readdir(POSTS)).filter((f) => f.endsWith('.json'));
  const publies = await Promise.all(
    fichiers.map(async (f) => JSON.parse(await readFile(path.join(POSTS, f), 'utf8'))),
  );
  const slugsExistants = publies.map((p) => p.slug);
  const motsClesExistants = publies.map((p) => (p.mot_cle_principal || '').toLowerCase());

  let plan = JSON.parse(await readFile(PLAN, 'utf8'));
  let restants = plan.sujets.filter(
    (s) => !slugsExistants.includes(slugify(s.mot_cle)) &&
           !motsClesExistants.includes(s.mot_cle.toLowerCase()),
  );
  if (!restants.length) {
    restants = await rechargerPlan(client, publies);
  }

  const sujet = restants[0];
  console.log(`· sujet retenu : ${sujet.mot_cle}`);

  // Maillage interne : les deux articles les plus récents de la même catégorie,
  // complétés par les plus récents tous sujets confondus.
  const parDate = [...publies].sort((a, b) => (a.date_publication < b.date_publication ? 1 : -1));
  const lies = [
    ...parDate.filter((p) => p.categorie === sujet.categorie),
    ...parDate,
  ].map((p) => p.slug).filter((s, i, t) => t.indexOf(s) === i).slice(0, 3);

  const demande =
    `MOT-CLÉ PRINCIPAL : ${sujet.mot_cle}\n` +
    `ANGLE À TRAITER : ${sujet.angle}\n` +
    `CATÉGORIE : ${sujet.categorie}\n\n` +
    (parDate.length
      ? `Articles déjà publiés sur le blog, dont tu peux citer un ou deux en lien interne avec ` +
        `l'ancre descriptive et l'URL /blog/posts/<slug>.html quand c'est réellement pertinent :\n` +
        parDate.slice(0, 8).map((p) => `- ${p.titre} → /blog/posts/${p.slug}.html`).join('\n') + '\n\n'
      : '') +
    `Écris l'article.`;

  let article = null;
  let retour = '';

  for (let essai = 1; essai <= 2; essai++) {
    const res = await client.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: essai === 1 ? demande : `${demande}\n\n${retour}` }],
      output_config: { format: zodOutputFormat(ArticleSchema) },
    });

    const candidat = res.parsed_output;
    if (!candidat) { retour = 'La réponse précédente était inexploitable. Recommence.'; continue; }

    const verdict = controle(candidat, slugsExistants, motsClesExistants);
    if (verdict.ok) {
      console.log(`· contrôle qualité passé (${verdict.mots} mots)`);
      article = { ...candidat, slug: verdict.slug };
      break;
    }

    console.log(`· essai ${essai} refusé : ${verdict.problemes.join(' | ')}`);
    retour =
      `Ta version précédente a été refusée pour ces raisons :\n` +
      verdict.problemes.map((p) => `- ${p}`).join('\n') +
      `\n\nRéécris l'article complet en corrigeant chacune. Rappel : aucun chiffre sur une ` +
      `population, aucune étude, aucune promesse. Supprime le passage fautif plutôt que de ` +
      `le reformuler si tu ne peux pas le sourcer.`;
  }

  if (!article) {
    console.log('· aucune version n\'a passé le contrôle qualité — rien n\'est publié aujourd\'hui');
    return;
  }

  const aujourdhui = new Date().toISOString().slice(0, 10);
  const post = {
    slug: article.slug,
    titre: article.titre,
    meta_title: article.meta_title,
    meta_description: article.meta_description,
    mot_cle_principal: article.mot_cle_principal,
    mots_cles_secondaires: article.mots_cles_secondaires,
    categorie: article.categorie,
    chapeau: article.chapeau,
    date_publication: aujourdhui,
    date_maj: aujourdhui,
    auteur: 'Noa Blenner',
    corps: article.corps.trim(),
    faq: article.faq,
    articles_lies: lies,
    cta: {
      url: `https://app.edgio.fr/?utm_source=blog&utm_medium=article&utm_campaign=${article.slug}`,
    },
    statut: 'publie',
  };

  await writeFile(path.join(POSTS, `${article.slug}.json`), JSON.stringify(post, null, 2) + '\n');

  // Le sujet traité sort de la file.
  plan.sujets = plan.sujets.filter((s) => slugify(s.mot_cle) !== article.slug);
  await writeFile(PLAN, JSON.stringify(plan, null, 2) + '\n');

  console.log(`✓ article écrit : content/posts/${article.slug}.json`);
}

// Exécuté directement : on rédige. Importé (tests) : on n'expose que les fonctions.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
