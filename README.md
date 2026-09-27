# Pushing electrons

An interactive, animated guide to resonance in organic chemistry.

Watch curved arrows draw themselves and electrons move between resonance contributors, then switch to **Try it** mode and draw the arrows yourself.

## Features

- 65 molecules in 7 groups: allylic systems, cations, carbonyl groups, enolates, small molecules and ions, aromatic rings, and substituted benzenes
- Animated curved arrows with moving electron pairs
- Resonance hybrid view with partial bonds and δ+/δ− charges
- Automatic major/minor contributor ranking (octets, charge separation, electronegativity)
- Try-it mode with feedback on common mistakes
- Works offline in any modern browser; light and dark themes

## Run it

Open `index.html` in a browser. No build step or install.

## Adding a molecule

Add an entry to the `EX` array in `index.html`. You only define the first structure and the arrows; the other contributors, charges and lone pairs are computed.

```js
{n:'Amide', c:'Carbonyl groups', b:'Short description', i:'Intro text', h:'Hybrid text',
 atoms:{m:[0,0,'H3C'], c:['m',-30,'C'], o:['c',-90,'O'], n:['c',30,'NH2']},
 bonds:'m-c c-o c-n', d:'c-o', steps:['n>c-n c-o>o']}
```

- `atoms`: `[x, y, label]` for the first atom, then `[neighbor, angle, label]` (angles in degrees, 0 = right, -90 = up)
- `d` / `t`: double and triple bonds; `q`: formal charges, e.g. `{o:-1}`
- `steps`: arrows for each step. `n>c-n` = lone pair on n moves into the c–n bond; `c-o>o` = the c=o π bond moves onto o. With one step, the reverse is added automatically.
