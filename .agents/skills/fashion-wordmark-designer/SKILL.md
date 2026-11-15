---
name: fashion-wordmark-designer
description: Design original, wordmark-only English logos for fashion, streetwear, collectible, lifestyle, beauty, accessories, and contemporary consumer brands. Use when Codex must analyze a Latin-letter brand name, choose and redraw an appropriate typographic skeleton, refine custom letterforms, kerning, tracking, weight, proportions, counters, radii, negative space, and optical balance, then deliver at least three distinct editable SVG-path wordmarks with PNG previews and small-size, monochrome, spacing, and path-quality tests. Never use this skill for icons, mascots, illustrations, emblems, or standalone symbols.
---

# Fashion Wordmark Designer

Create commercially credible typographic identifiers, not decorated text. Draw the brand name itself as the logo.

## Non-negotiable scope

- Output the exact English brand name only.
- Do not add a symbol, icon, mascot, illustration, badge, box, underline, spark, crown, arrow, or unrelated ornament.
- Do not trace or reconstruct an existing brand's letterforms, layout, container, or signature device.
- Treat named brands only as tonal references. Extract broad principles, then change the skeleton, proportions, spacing, and ownable detail.
- Build final masters from SVG paths or basic vector primitives. Do not ship live `<text>` or embedded raster images.
- Present at least three visibly different original directions unless the user explicitly requests refinement of one approved direction.

## Required workflow

### 1. Analyze the name

Write a compact name map before drawing:

- spelling, casing, pronunciation, and character count;
- repeated letters, round/straight balance, symmetry, rhythm, difficult pairs, and likely visual centre;
- distinctive opportunities in counters, joins, terminals, repeated modules, or negative space;
- applications and minimum sizes;
- brand adjectives and commercial category.

For repeated letters, construct one canonical glyph and reuse it exactly before optical corrections. Do not redraw identical letters independently.

### 2. Select three skeletons

Read [style-directions.md](references/style-directions.md) when choosing directions. For a three-route exploration, default to:

1. **Impact / streetwear** — compressed or forward-driving, bold, compact, high silhouette strength.
2. **Clean / commercial fashion** — controlled geometry, mature spacing, restrained custom detail.
3. **Playful / collectible** — geometric warmth, generous counters, rhythmic repetition without childish novelty.

State what is inherited as a broad principle and what is deliberately changed for originality.

### 3. Construct black-first

- Use a clean integer `viewBox`; keep lockup height at 256 units.
- Define a small construction system: cap height, baseline, stem weight, horizontal weight, corner radius, counter ratio, slant, and spacing unit.
- Draw custom glyphs from primitives and low-anchor paths.
- Use identical geometry for repeated letters; apply only documented optical corrections.
- Keep one ownable idea per route. A stylistic effect alone is not a concept.
- Save each direction as its own SVG. Use predictable names such as `a-impact.svg`, `b-clean.svg`, and `c-playful.svg`.

Read [letterform-craft.md](references/letterform-craft.md) before final refinement.

### 4. Space optically

Start from measured sidebearings, then correct by shape:

- round-to-round pairs generally need less measured space than flat-to-flat pairs;
- open letters need protection from adjacent curves entering their aperture;
- repeated pairs must show an intentional rhythm rather than mechanical gaps;
- judge whitespace shapes, not only coordinates;
- verify the visual centre of the complete word, not merely its bounding box.

Record the final pair gaps or box positions in the SVG comments or handoff note.

### 5. Test twice

Run the bundled audit after every substantial revision:

```bash
python3 scripts/audit_wordmark.py a.svg b.svg c.svg --html wordmark-tests.html
```

Inspect the generated sheet and fix failures. Repeat at least once. Require:

- exact brand spelling and instant letter recognition;
- survival at 16, 24, 32, and 64 px heights;
- black on white and white on black;
- no accidental collisions, hairlines, tiny counters, or inconsistent repeated glyphs;
- even visual rhythm at normal view and blurred/squint view;
- no live text, rasters, filters, masks, or excessive path complexity;
- a production master with expanded strokes or a clear note that the concept still uses strokes.

### 6. Present and deliver

For each direction provide:

- editable SVG master;
- transparent PNG preview;
- black version and white/reversed version;
- requested brand-colour application PNG;
- one-sentence concept and short construction rationale;
- test results and any remaining production note.

Show all three at the same optical size. Recommend one direction, name one honest risk for each, and wait for approval before expanding a full identity system.

## Originality boundary for common references

- **Supreme-like tone:** borrow urgency, weight, compression, and merchandise presence; never use its red rectangle, white italic serif treatment, exact proportions, or layout.
- **CASETiFY-like tone:** borrow modern commercial clarity and fashion-tech restraint; never copy its exact condensed skeleton, casing treatment, camera-ring association, or letter spacing.
- **POP MART-like tone:** borrow geometric friendliness, collectible rhythm, and bold shelf presence; never copy its exact glyph construction, playful substitutions, or lockup.

If a result immediately resembles one named reference, revise the skeleton before presenting it.

## POBBOP test guidance

- Treat `P O B B O P` as a six-beat sequence.
- Reuse one P, one B, and one O master; mirror no letters unless the concept requires it.
- Explore the contrast between the open P, closed O, and double-counter B.
- Keep the repeated `BB` pair from becoming a dark lump.
- Balance the first and last P without forcing mathematical symmetry if optical correction requires otherwise.
- Use lemon yellow only as an application colour after the black-first forms pass.

## Resources

- [style-directions.md](references/style-directions.md): select fashion/streetwear skeletons and stay clear of imitation.
- [letterform-craft.md](references/letterform-craft.md): apply proportion, counter, spacing, and SVG construction checks.
- `scripts/audit_wordmark.py`: inspect SVG structure and generate a size/colour/spacing comparison sheet.
