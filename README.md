# Pushing electrons

An interactive, animated guide to resonance in organic chemistry.

Watch curved arrows draw themselves and electrons move between resonance contributors. Then switch to **Try it** mode and draw the arrows yourself.

**[Open the app](https://lrglazer.github.io/resonance-ai/)**

## Features

- **65 molecules** in 7 groups: allylic systems, cations, carbonyl groups, enolates, small molecules and ions, aromatic rings, and substituted benzenes
- **Animated curved arrows** with electron pairs moving along them
- **Resonance hybrid view** with partial bonds and δ+/δ− charges
- **Major/minor ranking** of contributors, based on octets, charge separation and electronegativity, with an explanation for each
- **Try-it mode** that gives feedback on common mistakes, plus hints
- Light and dark themes, and a keyboard shortcut (→ pushes electrons)

## Run it

Use the [live site](https://lrglazer.github.io/resonance-ai/) in any browser. No install needed.

To run it offline, download the repo (**Code → Download ZIP**), unzip it, and open `index.html`. The other files need to stay in the same folder. Or open `standalone.html`, which is the whole app in one file and works anywhere.

## Files

| File | What it does |
|---|---|
| `index.html` | Page layout; loads the files below |
| `style.css` | Styles: colors, layout, light and dark themes |
| `engine.js` | Chemistry engine: builds each contributor from the arrows, then computes lone pairs, formal charges, layout and ranking |
| `molecules.js` | The 65 molecules |
| `app.js` | Drawing, animation, try-it mode and the interface |
| `standalone.html` | The whole app in a single file |

`index.html` loads the scripts in this order: `engine.js`, `molecules.js`, `app.js`.

`standalone.html` is a separate copy, so changes to the source files don't update it automatically.

## Adding a molecule

Add an entry to the `EX` array in `molecules.js`. You only define the first structure and the arrows. The other contributors, formal charges and lone pairs are computed for you.

```js
{n:'Amide', c:'Carbonyl groups', b:'Short description', i:'Intro text', h:'Hybrid text',
 atoms:{m:[0,0,'H3C'], c:['m',-30,'C'], o:['c',-90,'O'], n:['c',30,'NH2']},
 bonds:'m-c c-o c-n', d:'c-o', steps:['n>c-n c-o>o']}
```

| Field | Meaning |
|---|---|
| `n`, `c`, `b` | Name, category, and a short description for the list |
| `i`, `h` | Intro text, and the explanation shown in the hybrid view |
| `atoms` | `[x, y, label]` for the first atom, then `[neighbor, angle, label]` for each one after. Angles are in degrees: 0 is right, -90 is up. |
| `bonds` | Every bond, as space-separated pairs of atom ids |
| `d`, `t` | Double and triple bonds in the first structure |
| `q` | Formal charges in the first structure, e.g. `{o:-1}` |
| `steps` | The arrows for each step (see below) |

**Writing arrows:** `n>c-n` means the lone pair on `n` moves into the `c–n` bond. `c-o>o` means the `c=o` π bond moves onto `o` as a lone pair. Separate simultaneous arrows with spaces.

- With one step, the reverse step is added automatically.
- With several steps, the last one must lead back to the first structure.

If an arrow breaks a rule (moving electrons that aren't there, or giving C, N or O more than eight), the molecule won't load correctly, so check it in the browser after adding it.

## License

[MIT](LICENSE)
