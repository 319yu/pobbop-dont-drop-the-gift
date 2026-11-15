# Assignment 3 Process Log

## Route

Browser game built with Vite, JavaScript, Matter.js, Canvas and Web Audio. Codex assisted with coding, debugging, testing, visual iteration and documentation.

## Key prompts

1. Develop a complete, playable POBBOP gift-box stacking game with real physics and premium fashion art direction.
2. Fix the release bug so every box falls immediately when Space is pressed.
3. Add three stages, changing platform widths, local wind corridors and player-controlled stage progression.
4. Make wind visible and make tailwind accelerate boxes while headwind slows them.
5. Align the project with AMCC 5160 Assignment 3 and prepare a public browser build.

## Major iterations

1. Grey-box: moving box, physical release, platform collision, score and lives.
2. Physics repair: replaced unreliable static-to-dynamic transitions with kinematic suspension and explicit wake-up on release.
3. Experience pass: branded box materials, PERFECT feedback, mystery rewards, stage progression, wind zones, music and sound.
4. UI pass: separated logo, stage, score, lives and wind meter; added mobile layout.

## Playtesting evidence

Technical browser playtests covered repeated Space input, pause/resume, mobile viewport, restart, multiple sequential boxes and console errors.

Two human playtests required by the brief:

- Player 1: [name], [date]. Observation: [complete after playtest]. Change made: [complete after playtest].
- Player 2: [name], [date]. Observation: [complete after playtest]. Change made: [complete after playtest].

## Credits

- Direction, mechanic decisions and brand requirements: student.
- Code and documentation assistance: OpenAI Codex.
- AI background asset: generated with OpenAI image generation from a project-specific prompt; edited into the game at reduced opacity.
- Logo: existing POBBOP project asset supplied in the workspace.
- Physics: Matter.js 0.20.0.
- Build system: Vite.
- Music and sound effects: original procedural Web Audio synthesis; no sampled audio.
- Fonts: Archivo Black and DM Sans via Google Fonts.
- No copied game characters, music or third-party visual assets.
