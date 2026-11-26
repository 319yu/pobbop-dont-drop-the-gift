export const COLORS = { cream: '#EAE7DF', ink: '#1A1A1A', lemon: '#E8F139', silver: '#BFC3C7', grey: '#777777' };

export const GAME = {
  maxLives: 3, stableMs: 600, baseSpeed: 118, platformWidth: 260,
  boxWidth: 118, boxHeight: 68, worldWidth: 720, worldHeight: 980,
  perfectRatio: .1,
};

export const STAGES = [
  { number: 1, name: 'THE WARM-UP', start: 0, target: 10, platformWidth: 300, wind: 0 },
  { number: 2, name: 'CROSSWIND', start: 10, target: 20, platformWidth: 235, wind: .000018 },
  { number: 3, name: 'WILD AIR', start: 20, target: 30, platformWidth: 180, wind: .000032 },
];

export function stageForScore(score) {
  if (score >= 20) return STAGES[2];
  if (score >= 10) return STAGES[1];
  return STAGES[0];
}

export function windSpeedMultiplier(moveDirection, windDirection) {
  if (!windDirection) return 1;
  return Math.sign(moveDirection) === Math.sign(windDirection) ? 1.45 : .62;
}

export const BOX_TYPES = {
  classic: { label: 'CLASSIC', fill: '#1A1A1A', friction: .88, frictionStatic: 1.15, frictionAir: .012, restitution: .025, density: .0025, chamfer: 12, aspect: 657/292 },
  mirror: { label: 'MIRROR', fill: '#BFC3C7', friction: .12, frictionStatic: .28, frictionAir: .008, restitution: .06, density: .0020, chamfer: 12, aspect: 641/292 },
  bouncy: { label: 'SPECIAL', fill: '#E8F139', friction: .58, frictionStatic: .82, frictionAir: .011, restitution: .06, density: .0019, chamfer: 12, aspect: 656/296 },
  mystery: { label: 'MYSTERY', fill: '#1A1A1A', friction: .55, restitution: .14, density: .0022, chamfer: 12, aspect: 657/292 },
};

export function chooseBoxType(score, random = Math.random) {
  const r = random();
  if (score < 5) return 'classic';
  if (score < 10) return r < .74 ? 'classic' : 'mirror';
  if (score < 20) return r < .68 ? 'classic' : r < .95 ? 'mirror' : 'bouncy';
  return r < .64 ? 'classic' : r < .94 ? 'mirror' : 'bouncy';
}

export function titleFor(score) {
  if (score <= 5) return 'THE BEGINNER';
  if (score <= 10) return 'THE GIFT LOVER';
  if (score <= 20) return 'THE BALANCE MASTER';
  if (score <= 30) return 'THE CHAOS ARCHITECT';
  return 'THE UNBOXABLE';
}
