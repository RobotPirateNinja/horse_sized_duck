# The Lean proofs

`HorseSizedDuck.lean` restates the site's model (the animals in `src/data.ts`, the size scaling in `src/battle/fighters.ts`, and the combat rules in `src/battle/ubs.ts` and `engine.ts`) in [Lean 4](https://lean-lang.org) and proves theorems about it. The site's "Formally verified" modal shows this file's theorems, imported as raw text, so the page and the proofs can't drift apart.

It uses plain Lean core (no Mathlib) and has no `sorry`. Every theorem depends only on Lean's three standard axioms (`propext`, `Classical.choice`, `Quot.sound`).

## Check it

With [elan](https://github.com/leanprover/elan) installed:

```sh
cd lean
lake build          # or: lean HorseSizedDuck.lean
```

No output means every proof checked.

## What it does and doesn't prove

It proves things about the model, not about real animals. The numbers (a 1.21 kg mallard, a 500 kg horse, the stat blocks) are the site's assumptions. The combat theorems are worst cases over the simulator's dice (each blow lands at 75% to 125%), so they hold for every possible roll. They are about single blows; who wins a whole fight also depends on movement and how many horses reach you at once, which the file doesn't model.

If you change a number in `src/data.ts` or `src/battle/fighters.ts`, change it here too and re-check.
