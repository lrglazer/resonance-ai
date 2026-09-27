# Pushing electrons

An interactive, animated guide to resonance in organic chemistry.

Watch curved arrows draw themselves and electrons move between resonance contributors, then switch to **Try it** mode and draw the arrows yourself.

## Features

- 65 molecules in 7 groups: allylic systems, cations, carbonyl groups, enolates, small molecules and ions, aromatic rings, and substituted benzenes
- Animated curved arrows with moving electron pairs
- Resonance hybrid view with partial bonds and δ+/δ− charges
- Automatic major/minor contributor ranking (octets, charge separation, electronegativity)
- Try-it mode with feedback on common mistakes
- Light and dark themes, keyboard shortcut (→ pushes electrons)

## Run it

Unzip the whole folder, then open `index.html` in a browser. It needs the `css/` and `js/` folders next to it.

`standalone.html` is the same app in a single file, for sharing or opening anywhere. No build step, no dependencies.

## Project structure

```
index.html         Page layout
standalone.html    Everything in one file (same app)
css/style.css      All styles (colors, layout, light/dark theme)
js/engine.js       Chemistry engine: applies arrows to build each contributor,
                   computes lone pairs, formal charges, layout and ranking
js/molecules.js    The 65 molecules (first structure + arrows only)
js/app.js          Drawing, animation, try-it mode and the interface
```

Scripts load in that order: `engine.js`, then `molecules.js`, then `app.js`.

## Adding a molecule

Add an entry to the `EX` array in `js/molecules.js`. You only define the first structure and the arrows; the other contributors, charges and lone pairs are computed.

```js
{n:'Amide', c:'Carbonyl groups', b:'Short description', i:'Intro text', h:'Hybrid text',
 atoms:{m:[0,0,'H3C'], c:['m',-30,'C'], o:['c',-90,'O'], n:['c',30,'NH2']},
 bonds:'m-c c-o c-n', d:'c-o', steps:['n>c-n c-o>o']}
```

- `atoms`: `[x, y, label]` for the first atom, then `[neighbor, angle, label]` (angles in degrees, 0 = right, -90 = up)
- `d` / `t`: double and triple bonds; `q`: formal charges, e.g. `{o:-1}`
- `steps`: arrows for each step. `n>c-n` = lone pair on n moves into the c–n bond; `c-o>o` = the c=o π bond moves onto o. With one step, the reverse is added automatically. With several steps, the last one must lead back to the first structure.
