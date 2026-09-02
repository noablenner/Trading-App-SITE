# Blog Edgio — playbook SEO et éditorial

Ce document est la référence du système de publication. Il décrit **ce qui est en place**,
**pourquoi ces choix**, et **ce qu'il reste à faire à la main**. Le prompt du scénario Make
« 05 - Blog Writer SEO » encode déjà l'essentiel des règles de style — si tu changes une règle
ici, change-la aussi là-bas.

---

## 1. Le contexte à connaître avant tout

Le trading est un sujet **YMYL** (*Your Money or Your Life*). Google y applique une barre
de qualité nettement plus haute : les signaux E-E-A-T pèsent environ 8 % du classement sur
les requêtes ordinaires, mais autour de 24 % sur les sujets santé et finance. Le premier
« E » — *Experience*, l'expérience vécue — est aujourd'hui le facteur le plus déterminant
de cette famille.

Deux conséquences directes, qui ont dicté toute l'architecture ci-dessous :

1. **Le contenu généré par IA n'est pas pénalisé en tant que tel.** Google le répète : ce
   qui compte est l'intention et la valeur, pas l'outil. En revanche, la production
   massive de pages destinées d'abord au classement tombe sous la règle du *scaled content
   abuse*, et depuis la mise à jour spam de mars 2026, SpamBrain détecte nettement mieux
   le contenu produit en série. Spam humain et spam IA subissent exactement les mêmes
   conséquences.
2. **Sur un domaine neuf en YMYL, un blog qui publie beaucoup et vite est un risque, pas
   un avantage.** Un article médiocre ne se contente pas de ne pas classer : il abaisse la
   qualité perçue de l'ensemble du domaine, edgio.fr compris.

C'est pourquoi le système ci-dessous **ne publie jamais tout seul**. Une relecture humaine
est un point de passage obligatoire, et c'est délibéré.

---

## 2. Architecture de la chaîne

```
Radar (01/02)  →  Signaux ──04──▶ Idées ──03──▶ Contenus (brief SEO Blog)
                                                     │
                                                     ▼
                                        05 · Blog Writer SEO   (Make, quotidien 06h30)
                                        rédige l'article complet
                                                     │
                                                     ▼
                                        Airtable « Articles »  ── statut : A relire
                                                     │
                                          ⚠ RELECTURE HUMAINE  ← statut : Valide
                                                     │
                                                     ▼
                                        06 · Blog Publisher    (Make, quotidien 07h15)
                                        PUT GitHub content/posts/<slug>.json
                                                     │
                                                     ▼
                                        GitHub Action build-blog
                                        node tools/build-blog.mjs
                                                     │
                                                     ▼
                          blog/posts/*.html · blog/index.html · feed.xml · sitemap.xml
                                                     │
                                                     ▼
                                        GitHub Pages → edgio.fr/blog/
```

**Pourquoi Make n'écrit pas de HTML.** Make dépose un simple JSON ; tout le rendu (balises,
JSON-LD, sommaire, maillage, sitemap) vit dans `tools/build-blog.mjs`. Le scénario ne casse
donc pas quand le design du blog change, et un article peut être régénéré à volonté.

### Les pièces

| Pièce | Où | Rôle |
|---|---|---|
| Table `Articles` | Airtable base Edgio (`tblFPJZazY0lo2833`) | Une ligne = un article, du brouillon à la publication |
| `05 - Blog Writer SEO` | Make `7202727` | Brief → article rédigé, statut *A relire* |
| `06 - Blog Publisher GitHub` | Make `7202742` | Articles *Valide* → fichier JSON sur GitHub |
| `tools/build-blog.mjs` | Ce dépôt | Génère HTML, hub, RSS, sitemap |
| `.github/workflows/build-blog.yml` | Ce dépôt | Lance le build à chaque push + tous les jours à 08h10 |
| `content/posts/*.json` | Ce dépôt | Source de vérité des articles |

---

## 3. Mise en service (à faire une seule fois)

1. **Créer un PAT GitHub** *fine-grained*, limité au dépôt `noablenner/Trading-App-SITE`,
   avec la seule permission **Contents : Read and write**. Durée conseillée : 1 an,
   avec un rappel de renouvellement.
2. **Coller le token** dans Airtable → table `Config` → ligne `GITHUB_TOKEN`
   (créée, valeur `A_REMPLIR`).
3. **Activer les deux scénarios** Make (ils sont créés inactifs, exprès).
4. **Google Search Console** : ajouter la propriété `edgio.fr`, soumettre
   `https://edgio.fr/sitemap.xml`, demander l'indexation des trois articles de départ.
5. **Bing Webmaster Tools** : même chose. Bing alimente aussi ChatGPT Search.
6. Vérifier que GitHub Actions a le droit d'écrire :
   *Settings → Actions → General → Workflow permissions → Read and write*.

---

## 4. Le garde-fou éditorial : non négociable

Le statut `A relire` → `Valide` est **manuel**. C'est le seul point du système qui
transforme du texte généré en contenu publiable sur un sujet YMYL. Compte 15 à 20 minutes
par article, et vérifie dans cet ordre :

- [ ] **Aucun chiffre inventé.** Pas de « 90 % des traders », pas d'étude citée sans lien.
      C'est l'erreur la plus fréquente et la plus coûteuse : une statistique fausse sur un
      sujet financier détruit la confiance d'un lecteur comme d'un évaluateur qualité.
- [ ] **Au moins un passage que seul quelqu'un qui trade pourrait écrire.** Un détail
      d'exécution, une heure précise, une sensation concrète. C'est le premier « E » de
      E-E-A-T, celui qui pèse le plus lourd. Si l'article pourrait avoir été écrit par
      quelqu'un qui n'a jamais passé d'ordre, réécris ce passage toi-même.
- [ ] **Aucun conseil d'investissement, aucun signal, aucune promesse de gain.**
- [ ] **Le produit reste discret** : deux mentions maximum, jamais dans l'introduction.
- [ ] **Le mot-clé principal n'est visé par aucun autre article** (cannibalisation).
- [ ] **Le maillage est rempli** : 2 à 3 slugs existants dans `Articles lies`.
- [ ] **La FAQ tient debout** : 3 à 5 questions, réponses autonomes et lisibles hors contexte.
- [ ] **Le titre ne ment pas** sur ce que contient l'article.

Note ce que tu as corrigé dans le champ `Note relecture` : c'est la trace éditoriale du site.

> Si tu n'as pas le temps de relire, ne publie pas. Un blog à 4 articles solides bat un blog
> à 40 articles moyens, et de très loin, sur ce type de sujet.

---

## 5. Fréquence de publication

**Cadence de référence : 2 articles par semaine, mardi et jeudi.** C'est le meilleur
compromis entre la régularité — qui corrèle nettement avec la performance — et le temps de
relecture réellement disponible.

Ce qui compte plus que le volume : la **constance**. Deux articles par semaine pendant six
mois valent bien mieux que quinze articles en trois semaines suivis de deux mois de silence.

Un plan de montée en charge raisonnable :

| Période | Rythme | Objectif |
|---|---|---|
| Mois 1-2 | 2/semaine | Poser les 4 piliers + 8 articles de cluster, se faire indexer |
| Mois 3-4 | 2/semaine + 1 refresh / 2 semaines | Couvrir les clusters, commencer le maillage sérieux |
| Mois 5-6 | 2/semaine + 1 refresh / semaine | Consolider les pages qui montent en Search Console |
| Au-delà | Selon les données | Arbitrer refresh contre nouveauté avec les vrais chiffres |

**Ne monte pas au-dessus de 3 par semaine** tant que les premiers articles ne rankent pas.
Un pic de publication sur un domaine neuf en finance est exactement le signal de
*scaled content abuse*.

---

## 6. Stratégie de contenu : clusters, pas articles isolés

Google classe des sujets, pas des pages. On travaille par **cluster** : un article pilier
large, entouré d'articles satellites qui pointent vers lui et entre eux.

### Cluster 1 — Journal de trading *(pilier en ligne)*
`journal-de-trading-comment-le-tenir`
Satellites à produire : modèle de journal de trading · journal de trading Excel ou
application · que noter après une séance · journal de trading pour scalpeur ·
analyser son journal chaque mois

### Cluster 2 — Psychologie du trader *(pilier partiel en ligne)*
`revenge-trading`
Satellites : peur d'entrer en position · FOMO en trading · trader après une grosse perte ·
gérer le tilt · pourquoi je coupe mes gagnants trop tôt · la sur-confiance après une série

### Cluster 3 — Discipline et plan *(pilier en ligne)*
`respecter-son-plan-de-trading`
Satellites : check-list pré-séance · règles de trading exemples · stop de perte journalier ·
comment construire un playbook · overtrading

### Cluster 4 — Prop firm *(à écrire — priorité haute)*
Pilier à produire : **réussir un challenge prop firm : la partie que personne ne prépare**
Satellites : pourquoi on échoue au dernier jour · gérer la drawdown quotidienne ·
la phase 2 est plus dure que la phase 1 · prop firm et discipline

C'est le cluster à plus fort potentiel : intention forte, audience exactement celle d'Edgio,
et concurrence moins verrouillée que sur « psychologie trading ».

### Règles de maillage

- Chaque satellite pointe vers **son pilier** dans le premier tiers de l'article.
- Chaque pilier pointe vers **au moins trois satellites**.
- 2 à 3 liens internes par article, avec une ancre descriptive — jamais « cliquez ici ».
- Le champ `Articles lies` alimente le bloc « À lire ensuite » en bas de page.

---

## 7. Style d'écriture

Ce qui différencie ce blog de la masse de contenu trading francophone, c'est le ton. Les
règles sont dans le prompt du scénario 05 ; les voici en clair.

**Ce qu'on fait**

- Partir d'une **situation concrète**, dans le corps du trader : ce qu'il voit, ce qu'il
  fait avec ses mains, ce qu'il se dit. Jamais « la psychologie est essentielle en trading ».
- **Tutoyer.** Ton direct et sec, sans complaisance et sans condescendance.
- **Phrases courtes.** Un paragraphe, une idée, trois à cinq lignes.
- **Chiffrer.** Des seuils, des durées, des R. Ce qui n'est pas mesurable n'est pas écrit.
- Terminer par du **concret** : un protocole, une règle à coller sur l'écran.

**Ce qu'on ne fait jamais**

- Emoji, point d'exclamation, « il est important de », « dans cet article nous verrons ».
- Une section intitulée « Conclusion » qui résume ce qui vient d'être lu.
- Une promesse de gain, un signal, un conseil d'investissement.
- Une statistique ou une étude inventée. **Aucune exception.**
- Faire du produit le sujet. Deux mentions maximum, jamais dans l'introduction.

**Format cible** : 1500 à 1900 mots, 5 à 7 H2, une FAQ de 3 à 5 questions. Les pages les
mieux classées tournent autour de 1750 mots — c'est une conséquence de la profondeur
attendue, pas un objectif de remplissage. Un article de 1200 mots qui répond mieux bat un
article de 2000 mots dilué.

---

## 8. SEO technique — ce qui est déjà en place

Généré automatiquement par `tools/build-blog.mjs`, rien à faire à la main :

- `<title>` unique ≤ 60 caractères, meta description de 150-160 caractères, canonical.
- Open Graph et Twitter Card complets.
- **JSON-LD** : `BlogPosting` (auteur, dates, `wordCount`, section, mots-clés),
  `BreadcrumbList`, `FAQPage` quand une FAQ existe, `Blog` sur le hub, `ProfilePage`
  sur la page auteur.
- **`dateModified`** exposé sur chaque page et repris dans le sitemap : 72 % des pages du
  top 3 ont été mises à jour dans l'année, la fraîcheur compte.
- Sommaire auto avec ancres (`#id` sur chaque H2) — favorise les *sitelinks* et les
  citations en recherche générative.
- `sitemap.xml` et `blog/feed.xml` régénérés à chaque build ; `robots.txt` autorise
  explicitement GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot et Google-Extended.
- Fil d'Ariane, bloc auteur avec lien vers la page auteur, avertissement risque en pied
  de chaque article.
- Zéro dépendance externe, CSS partagé avec le site : les Core Web Vitals restent bons.

### Ce qui reste à ta charge

- **Une image par article.** Aujourd'hui tous partagent `og-image.png`. Une image propre
  par article améliore le CTR en partage social et sur Discover. Ajoute le chemin dans le
  champ `image` du JSON.
- **Search Console tous les mois.** Reporte impressions, clics et position moyenne dans les
  champs prévus sur la ligne `Articles`. C'est ce qui dira quoi rafraîchir.
- **Backlinks.** C'est la vraie limite. Sur les requêtes finance, la première position
  s'accompagne en moyenne de 500 à 600 domaines référents. Aucun système automatisé ne
  produit ça — voir §10.

---

## 9. Refresh : la moitié du travail

Un article publié n'est pas terminé. Tous les trois mois, prends les articles en position
moyenne 8-20 dans Search Console — ceux qui sont à portée de la première page — et
retravaille-les : passe le statut à `A mettre a jour`, enrichis les sections faibles,
ajoute une question de FAQ, mets à jour `Date de mise a jour`, republie.

Un article qui passe de la position 12 à la position 6 rapporte plus de trafic qu'un
nouvel article qui démarre à zéro. C'est le meilleur rapport effort/résultat de tout le
système, et c'est presque toujours ce qu'on néglige.

---

## 10. Ce que ce système ne fera pas — à lire une fois

Ce dispositif produit et publie du contenu structuré et techniquement propre. Il ne produit
pas de trafic à lui seul. Trois limites à assumer :

1. **L'autorité de domaine ne s'automatise pas.** Sans citations et backlinks, un domaine
   neuf reste plafonné sur les requêtes concurrentielles, quelle que soit la qualité des
   pages. À faire à la main : forums où tu es déjà crédible, podcasts, échanges avec
   d'autres outils, communauté prop firm.
2. **Le délai est de 4 à 8 mois**, pas de 4 semaines, sur un domaine neuf en finance. Publier
   plus vite ne raccourcit pas ce délai — ça l'allonge, en abaissant la qualité moyenne.
3. **La relecture humaine est le facteur limitant, et c'est très bien ainsi.** Si tu la
   supprimes pour publier davantage, tu ne feras pas monter le blog plus vite : tu prendras
   le risque de faire baisser le domaine entier. Le jour où la relecture ne suit plus,
   réduis la cadence — ne réduis pas la relecture.

---

## 11. Écrire ou corriger un article à la main

Le système Make est un accélérateur, pas une obligation. Pour publier sans lui :

```bash
# 1. créer content/posts/<slug>.json (voir un article existant comme modèle)
# 2. régénérer
node tools/build-blog.mjs
# 3. vérifier blog/index.html et blog/posts/<slug>.html, puis commit
```

Champs obligatoires : `titre`, `chapeau`, `meta_description`, `categorie`,
`date_publication`, `corps`. Le build refuse un article incomplet et le signale.

`"statut": "publie"` est requis pour qu'un article sorte ; une `date_publication` future le
garde invisible jusqu'à cette date — c'est ce qui permet de programmer les publications.
Le markdown accepté est volontairement limité : `##`, `###`, listes `-` et `1.`, `**gras**`,
`[lien](url)`, `> citation`, tableaux.
