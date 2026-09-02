# Blog Edgio — comment ça marche

Le blog s'écrit et se publie seul. Rien à valider, rien à lancer, aucun outil externe :
tout tient dans ce dépôt et dans GitHub Actions.

## La seule chose à faire

Ajouter le secret **`ANTHROPIC_API_KEY`** dans
*Settings → Secrets and variables → Actions → New repository secret*,
et vérifier que *Settings → Actions → General → Workflow permissions* est sur
**Read and write**.

C'est tout. Coût : quelques centimes par article, soit moins d'un euro par mois.

## Ce qui se passe tout seul

**Mardi et jeudi à 7h.** Le workflow `.github/workflows/blog.yml` :

1. prend le premier sujet non traité de `content/plan.json` ;
2. le fait rédiger par Claude (`tools/write-article.mjs`) ;
3. passe l'article au contrôle qualité — s'il échoue, une seule réécriture est demandée,
   et si elle échoue aussi **rien n'est publié ce jour-là** ;
4. écrit `content/posts/<slug>.json` ;
5. régénère le blog (`tools/build-blog.mjs`) : pages, hub, sommaires, JSON-LD, RSS, sitemap ;
6. commit et push. GitHub Pages met en ligne dans la minute.

Quand `content/plan.json` se vide, le script demande à Claude huit nouveaux sujets en lui
donnant la liste de tout ce qui est déjà publié, pour qu'aucun mot-clé ne soit repris.
La file ne se tarit jamais.

## Le contrôle qualité, à la place d'une relecture

Sans humain dans la boucle, c'est ce filet qui protège le domaine. Un article est refusé s'il
contient :

- un pourcentage ou une proportion portant sur une population (« 90 % des traders… ») ;
- une étude, une statistique ou une source citée sans référence ;
- une promesse de gain, un rendement chiffré, un conseil d'achat ou de vente ;
- des emoji, du HTML, un titre de niveau 1 ;
- moins de 1200 mots, plus de 2600, ou moins de 4 sections ;
- plus de 3 mentions d'Edgio ;
- un mot-clé ou un slug déjà couvert par un autre article (cannibalisation).

Ces règles vivent dans `controle()`, dans `tools/write-article.mjs`. Pour en ajouter une,
ajoute une ligne à `inventions` ou `promesses` — le message est renvoyé à Claude pour la
réécriture.

## Intervenir quand tu le veux

Rien n'est verrouillé. Tout passe par des fichiers du dépôt.

**Forcer un sujet.** Mets-le en tête de `content/plan.json` : il passera à la prochaine
publication.

**Publier maintenant.** Onglet *Actions* → *Blog* → *Run workflow*.

**Régénérer sans écrire.** Même chose, en décochant « Rédiger un nouvel article ».

**Corriger un article publié.** Édite son `content/posts/<slug>.json` et commit — le push
régénère la page. Change aussi `date_maj` pour que la fraîcheur remonte dans le sitemap.

**Retirer un article.** Passe son `statut` à `brouillon`, ou supprime le fichier.

**Programmer une date.** Mets `date_publication` dans le futur : l'article reste invisible
jusque-là.

**Changer le style.** La constante `SYSTEM` en haut de `tools/write-article.mjs` contient
toutes les consignes d'écriture. **Changer le design.** `assets/css/blog.css` et les gabarits
dans `tools/build-blog.mjs`.

## Ce que ce système ne fera pas

Il produit et publie du contenu structuré et techniquement propre, à un rythme régulier.
Il ne remplace pas trois choses :

1. **L'autorité du domaine.** Sur les requêtes finance, la première position s'accompagne
   en moyenne de plusieurs centaines de domaines référents. Aucune automatisation ne les
   fabrique : ça se gagne à la main, dans les communautés prop firm, les forums et les
   podcasts. C'est la vraie limite, pas le nombre d'articles.
2. **Le temps.** Compte quatre à huit mois avant les premiers résultats sur un domaine neuf
   en finance. Publier plus vite ne raccourcit pas ce délai.
3. **Ton œil.** Le filet attrape les fautes graves et mécaniques, pas la médiocrité. Passer
   sur `/blog/` une fois par mois et corriger ce qui te déplaît coûte vingt minutes et vaut
   plus que n'importe quelle règle ajoutée au script.

## La cadence, et pourquoi pas plus

Deux articles par semaine. Le trading est un sujet YMYL, où Google attend un niveau de
fiabilité supérieur à la moyenne, et où la production massive de pages est explicitement
traitée comme du spam — que le texte soit écrit par une machine ou par une personne. Sur un
domaine neuf, un pic de publication est le signal le plus visible qu'on puisse envoyer.

Pour changer la cadence, modifie le `cron` dans `.github/workflows/blog.yml`
(`0 5 * * 2,4` = mardi et jeudi, 05h UTC).

## Les fichiers

| Fichier | Rôle |
|---|---|
| `.github/workflows/blog.yml` | L'automatisation complète |
| `tools/write-article.mjs` | Rédaction, consignes de style, contrôle qualité |
| `tools/build-blog.mjs` | Génération HTML, JSON-LD, RSS, sitemap |
| `content/plan.json` | File des sujets à traiter |
| `content/posts/*.json` | Les articles, source de vérité |
| `assets/css/blog.css` | Habillage du blog |
| `blog/`, `sitemap.xml` | Généré — ne pas éditer à la main |
