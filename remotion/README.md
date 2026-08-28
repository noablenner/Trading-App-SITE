# Edgio — kit vidéo Remotion

8 scènes verticales (1080×1920, 30fps) calées sur l'identité du site Edgio (couleurs, dégradé, typos Sora/Manrope, écrans réels de l'app).

## Installation

```bash
cd remotion
npm install
```

## Prévisualiser (édition en direct)

```bash
npm start
```

Ouvre le Remotion Studio dans le navigateur : tu peux scruber la timeline, modifier le texte/les couleurs dans `src/scenes/*.tsx` et voir le résultat en direct.

## Exporter la vidéo

```bash
npm run render
```

Génère `out/edgio-story.mp4`.

## Exporter une image fixe (ex: pour vignette)

```bash
npm run still
```

## Structure

- `src/tokens.ts` — couleurs, dégradé, dimensions, durée des scènes (repris de `assets/css/style.css`)
- `src/components/SceneBackground.tsx` — fond "aurora" + grille, identique au hero du site
- `src/components/FadeUp.tsx` — animation d'entrée (fondu + translation) réutilisable
- `src/scenes/Scene1..8` — une scène = un composant. Modifie le texte, les chiffres ou les délais (`delay`, en frames) directement dedans.
- `src/Root.tsx` — enchaîne les 8 scènes dans une composition `EdgioStory` (4s chacune, modifiable via `SCENE_DURATION` dans `tokens.ts`)

## Personnaliser

- Réordonner/retirer une scène → édite le tableau `scenes` dans `src/Root.tsx`.
- Changer la durée d'une scène individuelle → passe une durée différente au `<Sequence>` correspondant au lieu de `SCENE_DURATION`.
- Ajouter une scène → duplique un fichier existant dans `src/scenes/`, ajoute-le au tableau `scenes`.
