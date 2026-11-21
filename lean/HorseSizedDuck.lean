/-
  Horse-Sized Duck: the formally verified bit.

  This file restates the site's model (src/data.ts, src/battle/fighters.ts,
  src/battle/ubs.ts, src/battle/engine.ts) in Lean 4 and proves things about it.
  Lean checks every step, so if this file compiles, the theorems are true
  *about the model*. Whether real ducks behave like the model is a matter for
  biologists (and brave volunteers).

  Plain Lean 4 core, no Mathlib, no `sorry`. Check it with:
    lean HorseSizedDuck.lean
-/

namespace HorseSizedDuck

/-! ## The animals (src/data.ts) -/

structure Animal where
  massKg : Rat
  heightM : Rat
  densityKgPerL : Rat
  skinM2 : Rat

def mallard : Animal := ⟨121/100, 2/5, 7/10, 11/100⟩
def pluckedMallard : Animal := { mallard with densityKgPerL := 95/100 }
def horse : Animal := ⟨500, 8/5, 1, 5⟩

/-! ## Small facts about ordering, used throughout -/

theorem div_le_iff {a b c : Rat} (hb : 0 < b) : a / b ≤ c ↔ a ≤ c * b := by
  constructor
  · intro h; exact Rat.not_lt.mp fun h' => Rat.not_lt.mpr h ((Rat.lt_div_iff hb).mpr h')
  · intro h; exact Rat.not_lt.mp fun h' => Rat.not_lt.mpr h ((Rat.lt_div_iff hb).mp h')

theorem le_div_iff {a b c : Rat} (hc : 0 < c) : a ≤ b / c ↔ a * c ≤ b := by
  constructor
  · intro h; exact Rat.not_lt.mp fun h' => Rat.not_lt.mpr h ((Rat.div_lt_iff hc).mpr h')
  · intro h; exact Rat.not_lt.mp fun h' => Rat.not_lt.mpr h ((Rat.div_lt_iff hc).mp h')

theorem mul_self_le {a b : Rat} (ha : 0 ≤ a) (hab : a ≤ b) : a * a ≤ b * b := by
  have h1 := Rat.mul_le_mul_of_nonneg_left hab ha
  have h2 := Rat.mul_le_mul_of_nonneg_right hab (by grind : 0 ≤ b)
  grind

theorem cube_le {a b : Rat} (ha : 0 ≤ a) (hab : a ≤ b) : a * a * a ≤ b * b * b := by
  have h1 := Rat.mul_le_mul_of_nonneg_left hab (Rat.mul_nonneg ha ha)
  have h2 := Rat.mul_le_mul_of_nonneg_right (mul_self_le ha hab) (by grind : 0 ≤ b)
  grind

/-! ## Sizing: shrink the horse by `k`, grow the duck by `1/k` -/

def hordeKg (k : Rat) : Rat := 100 * (horse.massKg * k ^ 3)
def giantDuckKg (d : Animal) (k : Rat) : Rat := d.massKg / k ^ 3

/-- The site's verdict rule: the side with less total mass is the easier fight. -/
def horsesEasier (d : Animal) (k : Rat) : Prop := hordeKg k < giantDuckKg d k

/-- **The break-even theorem.** The herd is the easier fight exactly when
    `k⁶ < duck mass / (100 × horse mass)`. -/
theorem horsesEasier_iff (d : Animal) (k : Rat) (hk : 0 < k) :
    horsesEasier d k ↔ k ^ 6 < d.massKg / (100 * horse.massKg) := by
  have h3 : 0 < k ^ 3 := Rat.pow_pos hk
  have hm : (0 : Rat) < 100 * horse.massKg := by decide +kernel
  unfold horsesEasier hordeKg giantDuckKg
  rw [Rat.lt_div_iff h3, Rat.lt_div_iff hm]
  have e : 100 * (horse.massKg * k ^ 3) * k ^ 3 = k ^ 6 * (100 * horse.massKg) := by grind
  rw [e]

/-- The flip point sits between 0.170⁶ and 0.171⁶: the horses must shrink to
    about 17% of their real height before the herd becomes the easier fight. -/
theorem breakEven_bounds :
    (17/100 : Rat) ^ 6 < mallard.massKg / (100 * horse.massKg) ∧
    mallard.massKg / (100 * horse.massKg) < (171/1000 : Rat) ^ 6 := by
  decide +kernel

/-- **Monotonicity of the verdict.** Once the horses are big enough that the
    duck is the easier fight, making them any bigger never flips it back. -/
theorem duck_stays_easier (d : Animal) {k k' : Rat} (hk : 0 < k) (hkk : k ≤ k')
    (h : ¬ horsesEasier d k) : ¬ horsesEasier d k' := by
  have hk' : 0 < k' := by grind
  rw [horsesEasier_iff d k hk] at h
  rw [horsesEasier_iff d k' hk']
  have c := mul_self_le (Rat.mul_nonneg (Rat.mul_nonneg (by grind) (by grind)) (by grind))
    (cube_le (Rat.le_of_lt hk) hkk)
  have e : ∀ x : Rat, x ^ 6 = x * x * x * (x * x * x) := by intro x; grind
  rw [e] at h ⊢
  intro h'
  exact h (by grind)

/-! ### Each meaning of "sized" (the four scenes on the site) -/

/-- By **weight**: `k³ = duck mass / horse mass`. Fight the horses. -/
theorem weight_verdict (k : Rat) (hk : 0 < k)
    (hw : k ^ 3 = mallard.massKg / horse.massKg) : horsesEasier mallard k := by
  rw [horsesEasier_iff _ _ hk, show k ^ 6 = k ^ 3 * k ^ 3 by grind, hw]
  decide +kernel

/-- By **height**: `k = duck height / horse height = 1/4`. Fight the duck. -/
theorem height_verdict : ¬ horsesEasier mallard (mallard.heightM / horse.heightM) := by
  rw [horsesEasier_iff _ _ (by decide +kernel)]
  decide +kernel

/-- By **volume**: `k³ = duck volume / horse volume`. Fight the horses,
    feathers or no feathers. -/
theorem volume_verdict (d : Animal) (hd : d = mallard ∨ d = pluckedMallard)
    (k : Rat) (hk : 0 < k)
    (hv : k ^ 3 = (d.massKg / d.densityKgPerL) / (horse.massKg / horse.densityKgPerL)) :
    horsesEasier d k := by
  rw [horsesEasier_iff _ _ hk, show k ^ 6 = k ^ 3 * k ^ 3 by grind, hv]
  rcases hd with rfl | rfl <;> decide +kernel

/-- By **skin area**: `k² = duck skin / horse skin`. Fight the horses. -/
theorem skin_verdict (k : Rat) (hk : 0 < k)
    (hs : k ^ 2 = mallard.skinM2 / horse.skinM2) : horsesEasier mallard k := by
  rw [horsesEasier_iff _ _ hk, show k ^ 6 = k ^ 2 * k ^ 2 * k ^ 2 by grind, hs]
  decide +kernel

/-! ## The square–cube law (src/battle/fighters.ts) -/

structure Stats where
  power : Rat
  stamina : Rat
  knowledge : Rat

def PERSON : Stats := ⟨10, 10, 10⟩
def HORSE : Stats := ⟨34, 30, 0⟩
def DUCK : Stats := ⟨1/2, 3/5, 0⟩

/-- Strength and toughness follow muscle cross-section, so they scale by `k²`. -/
def scaleStats (b : Stats) (k : Rat) : Stats :=
  { b with power := b.power * k ^ 2, stamina := b.stamina * k ^ 2 }

/-- Weight follows volume, so it scales by `k³`. -/
def scaleMass (m k : Rat) : Rat := m * k ^ 3

/-- **Square–cube law.** Scale anything by `k` and its strength per kilo
    is divided by `k`. A duck ten times longer is a tenth as strong for its weight. -/
theorem square_cube (b : Stats) (m k : Rat) (hm : 0 < m) (hk : 0 < k) :
    (scaleStats b k).power / scaleMass m k = (b.power / m) / k := by
  have hm' : m ≠ 0 := Rat.ne_of_gt hm
  have hk' : k ≠ 0 := Rat.ne_of_gt hk
  unfold scaleStats scaleMass
  simp only [Rat.div_def]
  grind

/-! ## Combat (src/battle/ubs.ts and engine.ts) -/

/-- UBS: `stamina × 8 + power × 2`. -/
def maxHealth (s : Stats) : Rat := s.stamina * 8 + s.power * 2
/-- UBS: `power × 0.8 + knowledge × 0.2`. -/
def attackDamage (s : Stats) : Rat := s.power * (8/10) + s.knowledge * (2/10)
/-- engine.ts: skin, fur and bone soak up `stamina × 0.05`. -/
def armor (s : Stats) : Rat := s.stamina * (5/100)
/-- engine.ts: how much of a blow lands, `raw² / (raw + armor)`. -/
def landed (raw a : Rat) : Rat := raw * raw / (raw + a)

/-- **Toughness never helps the attacker**: a blow never lands harder than it was thrown. -/
theorem landed_le_raw (raw a : Rat) (hr : 0 < raw) (ha : 0 ≤ a) : landed raw a ≤ raw := by
  have hpos : 0 < raw + a := by grind
  unfold landed
  rw [div_le_iff hpos]
  have := Rat.mul_le_mul_of_nonneg_left ha (Rat.le_of_lt hr)
  grind

/-- **Small blows bounce off**: what lands is at most `raw × (raw / armor)`.
    A kick a tenth the size of your toughness lands at most a tenth of itself. -/
theorem landed_le_ratio (raw a : Rat) (hr : 0 < raw) (ha : 0 < a) :
    landed raw a ≤ raw * (raw / a) := by
  have hpos : 0 < raw + a := by grind
  unfold landed
  rw [div_le_iff hpos, show raw * (raw / a) * (raw + a) = raw * raw * (raw + a) / a by grind,
    le_div_iff ha]
  have h0 : 0 ≤ raw * raw := Rat.mul_nonneg (Rat.le_of_lt hr) (Rat.le_of_lt hr)
  have := Rat.mul_le_mul_of_nonneg_left (show a ≤ raw + a by grind) h0
  grind

/-- **Harder throws land harder**: `landed` only goes up as the blow gets bigger. -/
theorem landed_mono (x y a : Rat) (hx : 0 < x) (hxy : x ≤ y) (ha : 0 ≤ a) :
    landed x a ≤ landed y a := by
  have hxa : 0 < x + a := by grind
  have hya : 0 < y + a := by grind
  unfold landed
  rw [div_le_iff hxa, show y * y / (y + a) * (x + a) = y * y * (x + a) / (y + a) by grind,
    le_div_iff hya]
  have hx0 := Rat.le_of_lt hx
  have h1 := Rat.mul_le_mul_of_nonneg_left hxy (Rat.mul_nonneg hx0 (by grind : (0:Rat) ≤ y))
  have h2 := Rat.mul_le_mul_of_nonneg_right (mul_self_le hx0 hxy) ha
  grind

/-- Scaling multiplies health, hit and toughness by `k²` (knowledge aside, and
    neither animal has any). -/
theorem scaled_combat (b : Stats) (k : Rat) (hb : b.knowledge = 0) :
    maxHealth (scaleStats b k) = k ^ 2 * maxHealth b ∧
    attackDamage (scaleStats b k) = k ^ 2 * attackDamage b ∧
    armor (scaleStats b k) = k ^ 2 * armor b := by
  unfold maxHealth attackDamage armor scaleStats
  simp only [hb]
  refine ⟨?_, ?_, ?_⟩ <;> grind

/-- **A bigger duck is never easier to beat.** Grow it from `k` to `k'` and its
    health, its hit and its toughness can only go up. (It does swing a little
    slower, which is why this is about those three and not "everything".) -/
theorem bigger_duck_never_easier {k k' : Rat} (hk : 0 ≤ k) (hkk : k ≤ k') :
    maxHealth (scaleStats DUCK k) ≤ maxHealth (scaleStats DUCK k') ∧
    attackDamage (scaleStats DUCK k) ≤ attackDamage (scaleStats DUCK k') ∧
    armor (scaleStats DUCK k) ≤ armor (scaleStats DUCK k') := by
  have h : k ^ 2 ≤ k' ^ 2 := by
    rw [show k ^ 2 = k * k by grind, show k' ^ 2 = k' * k' by grind]
    exact mul_self_le hk hkk
  obtain ⟨h1, d1, a1⟩ := scaled_combat DUCK k rfl
  obtain ⟨h2, d2, a2⟩ := scaled_combat DUCK k' rfl
  rw [h1, h2, d1, d2, a1, a2]
  exact ⟨Rat.mul_le_mul_of_nonneg_right h (by decide +kernel),
         Rat.mul_le_mul_of_nonneg_right h (by decide +kernel),
         Rat.mul_le_mul_of_nonneg_right h (by decide +kernel)⟩

/-! ## The stomp theorem: you vs 100 horses, sized by weight -/

/-- If `k³ = duck mass / horse mass` (about 0.134), then `k ≤ 0.135`. -/
theorem weight_k_le (k : Rat) (hw : k ^ 3 = mallard.massKg / horse.massKg) :
    200 * k ≤ 27 := by
  have e : 50000 * (k * k * k) = 121 := by
    rw [show k * k * k = k ^ 3 by grind, hw]; decide +kernel
  refine Rat.not_lt.mp fun hgt => ?_
  have := cube_le (by decide +kernel) (Rat.le_of_lt hgt)
  grind

theorem weight_k_sq_le (k : Rat) (hk : 0 < k) (hw : k ^ 3 = mallard.massKg / horse.massKg) :
    40000 * k ^ 2 ≤ 729 := by
  have := mul_self_le (by grind) (weight_k_le k hw)
  grind

/-- The arithmetic behind the stomp theorem, with fractions cleared. -/
theorem stomp_arith (r s : Rat) (hr : 15 ≤ 2 * r) (hs0 : 0 ≤ s) (hs : 40000 * s ≤ 729) :
    s * 308 * (2 * r + 3 * s) ≤ 2 * (r * r) := by
  have r0 : (0 : Rat) ≤ r := by grind
  have p1 := Rat.mul_le_mul_of_nonneg_left hs r0
  have p2 := Rat.mul_le_mul_of_nonneg_left hs hs0
  have p3 := Rat.mul_le_mul_of_nonneg_left hr r0
  grind

/-- **Every stomp kills.** Against weight-sized horses, even your weakest
    possible stomp (the dice roll 75%) does more damage than a horse has health. -/
theorem every_stomp_kills (k roll : Rat) (hk : 0 < k)
    (hw : k ^ 3 = mallard.massKg / horse.massKg) (hroll : 3 ≤ 4 * roll) :
    maxHealth (scaleStats HORSE k) ≤
      landed (attackDamage PERSON * roll) (armor (scaleStats HORSE k)) := by
  have hs := weight_k_sq_le k hk hw
  have hs0 : 0 ≤ k ^ 2 := Rat.pow_nonneg (Rat.le_of_lt hk)
  obtain ⟨eh, -, ea⟩ := scaled_combat HORSE k rfl
  rw [eh, ea, show maxHealth HORSE = 308 by decide +kernel,
      show armor HORSE = 3/2 by decide +kernel,
      show attackDamage PERSON = 10 by decide +kernel]
  have hR : 15 ≤ 2 * (10 * roll) := by grind
  generalize k ^ 2 = s at hs hs0
  generalize 10 * roll = r at hR
  have key := stomp_arith r s hR hs0 hs
  have c : (0 : Rat) ≤ 3/2 := by decide +kernel
  have hpos : 0 < r + s * (3/2) := by
    have := Rat.mul_nonneg hs0 c; grind
  unfold landed
  rw [le_div_iff hpos]
  have e : s * 308 * (r + s * (3/2)) * 2 = s * 308 * (2 * r + 3 * s) := by grind
  grind

/-- Each kick from a weight-sized horse lands at most 0.35 damage, however
    lucky the roll (dice go up to 125%). -/
theorem kick_is_small (k roll : Rat) (hk : 0 < k)
    (hw : k ^ 3 = mallard.massKg / horse.massKg) (hroll0 : 0 ≤ roll) (hroll : 4 * roll ≤ 5) :
    landed (attackDamage (scaleStats HORSE k) * roll) (armor PERSON) ≤ 7/20 := by
  have hs := weight_k_sq_le k hk hw
  have hs0 : 0 ≤ k ^ 2 := Rat.pow_nonneg (Rat.le_of_lt hk)
  obtain ⟨-, ed, -⟩ := scaled_combat HORSE k rfl
  rw [ed, show attackDamage HORSE = 136/5 by decide +kernel,
      show armor PERSON = 1/2 by decide +kernel]
  generalize k ^ 2 = s at hs hs0
  have e1 : 50 * (s * (136/5) * roll) = 1360 * (s * roll) := by grind
  have p := Rat.mul_le_mul_of_nonneg_left hroll hs0
  have hraw : 50 * (s * (136/5) * roll) ≤ 31 := by grind
  have hraw0 : 0 ≤ s * (136/5) * roll :=
    Rat.mul_nonneg (Rat.mul_nonneg hs0 (by decide +kernel)) hroll0
  generalize s * (136/5) * roll = r at hraw hraw0 e1
  have half : (0 : Rat) < 1/2 := by decide +kernel
  unfold landed
  rw [div_le_iff (by grind)]
  have q := Rat.mul_le_mul_of_nonneg_left hraw hraw0
  have e2 : 7/20 * (r + 1/2) * 40 = 14 * r + 7 := by grind
  grind

/-- **You survive the first 285 kicks.** If every kick lands at most 0.35,
    any 285 of them add up to less than your 100 health. -/
theorem survive_285 (kicks : List Rat) (hlen : kicks.length ≤ 285)
    (hsmall : ∀ x ∈ kicks, x ≤ 7/20) : kicks.sum < maxHealth PERSON := by
  have bound : ∀ l : List Rat, (∀ x ∈ l, x ≤ 7/20) → 20 * l.sum ≤ 7 * l.length := by
    intro l hl
    induction l with
    | nil => simp; exact Rat.le_refl
    | cons x t ih =>
      have hx := hl x (by simp)
      have ht := ih (fun y hy => hl y (by simp [hy]))
      simp only [List.sum_cons, List.length_cons]
      push_cast
      grind
  have hb := bound kicks hsmall
  have hl : (kicks.length : Rat) ≤ 285 := by exact_mod_cast hlen
  rw [show maxHealth PERSON = 100 by decide +kernel]
  grind

end HorseSizedDuck
