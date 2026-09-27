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

To run it offline, download the repo and open `index.html`. Keep the `css/` and `js/` folders next to it. Or open `standalone.html`, which is the whole app in one file and works anywhere.

## Project structure

```
index.html         Page layout
standalone.html    The whole app in a single file
css/style.css      Styles: colors, layout, light and dark themes
js/engine.js       Chemistry engine: builds each contributor from the arrows,
                   then computes lone pairs, formal charges, layout and ranking
js/molecules.js    The 65 molecules
js/app.js
