#!/usr/bin/env node
/**
 * Vérifications qui ne coûtent pas un appel API.
 *
 * Tourne avant chaque rédaction dans le workflow : mieux vaut échouer ici, en
 * deux secondes et gratuitement, qu'au milieu d'un appel au modèle.
 *
 * Couvre ce qui a déjà cassé une fois : les schémas doivent être réellement
 * convertibles en JSON Schema par le SDK (un décalage de version de zod ne se
 * voit pas autrement), et le contrôle qualité ne doit ni laisser passer une
 * faute grave ni rejeter un article correct.
 */

import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { controle, ArticleSchema, PlanSchema, CATEGORIES } from './write-article.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let echecs = 0;

const verifier = (nom, fn) => {
  try {
    fn();
    console.log(`  ok   ${nom}`);
  } catch (e) {
    console.error(`  ÉCHEC ${nom} — ${e.message}`);
    echecs++;
  }
};

console.log('Schémas convertibles en JSON Schema par le SDK');
for (const [nom, schema] of [['article', ArticleSchema], ['plan', PlanSchema]]) {
  verifier(nom, () => {
    const f = zodOutputFormat(schema);
    if (f.type !== 'json_schema' || !f.schema?.properties) throw new Error('sortie inattendue');
  });
}
verifier('zod v4', () => {
  if (!z.toJSONSchema) throw new Error('zod v4 requis par le helper du SDK');
});

console.log('\nContrôle qualité — le fond des articles publiés (hors bornes de format)');
const POSTS = path.join(ROOT, 'content/posts');
for (const f of (await readdir(POSTS)).filter((f) => f.endsWith('.json'))) {
  const a = JSON.parse(await readFile(path.join(POSTS, f), 'utf8'));
  verifier(f, () => {
    const v = controle(a, [], [], { format: false });
    if (!v.ok) throw new Error(v.problemes.join(' | '));
  });
}

console.log('\nContrôle qualité — les fautes graves doivent être attrapées');
const remplissage = 'mot '.repeat(1000);
const pieges = [
  ['pourcentage sur une population', '90 % des traders perdent leur capital.'],
  ['étude sans source', "D'après une étude, le tilt double les pertes."],
  ['étude sans accent', 'Selon une etude recente, la discipline paie.'],
  ['statistique attribuée', 'Les statistiques montrent que la patience gagne.'],
  ['proportion inventée', '7 traders sur 10 abandonnent la première année.'],
  ['rendement chiffré', 'Tu peux viser 8 % par mois avec cette méthode.'],
  ['promesse de garantie', 'Ce protocole est garanti sur le long terme.'],
  ['emoji', 'Bravo 🚀 tu progresses vite.'],
];
for (const [nom, phrase] of pieges) {
  verifier(nom, () => {
    const corps = `## A\n${phrase}\n## B\n## C\n## D\n${remplissage}`;
    const v = controle(
      { corps, mot_cle_principal: 'sujet de test', meta_description: 'x'.repeat(150), faq: [1, 2, 3] },
      [], [],
    );
    if (v.ok) throw new Error('non détecté');
  });
}

console.log('\nCohérence des catégories');
const plan = JSON.parse(await readFile(path.join(ROOT, 'content/plan.json'), 'utf8'));
for (const s of plan.sujets) {
  verifier(`sujet « ${s.mot_cle} »`, () => {
    if (!CATEGORIES.includes(s.categorie)) throw new Error(`catégorie inconnue : ${s.categorie}`);
    if (!s.mot_cle?.trim() || !s.angle?.trim()) throw new Error('mot-clé ou angle vide');
  });
}

console.log(echecs ? `\n${echecs} vérification(s) en échec.` : '\nToutes les vérifications passent.');
process.exit(echecs ? 1 : 0);
