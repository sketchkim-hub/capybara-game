/** Hub minigame rules: five difficulties, rewards, best scores, one-time payout. */
export const HUB_ENERGY = 5;
export const HUB_ENERGY_MSG = '체력이 부족해요! 시작하려면 체력 5가 필요해요 💤';
export const HUB_DEFAULT_DIFF = 'normal';
export const HUB_DIFF_ORDER = ['easy', 'normal', 'hard', 'veryhard', 'extreme'];
export const HUB_LABELS = ['쉬움', '보통', '어려움', '매우 어려움', '극악'];
export const BEST_KEY = 'capy_best_v1';

export const HUB_DIFF = {
  easy:     { id: 'easy',     label: '쉬움',        reward: 0.8,  speed: 0.72, spawn: 0.70, gap: 1.45, window: 1.45, hazard: 0.82 },
  normal:   { id: 'normal',   label: '보통',        reward: 1,    speed: 1,    spawn: 1,    gap: 1,    window: 1,    hazard: 1 },
  hard:     { id: 'hard',     label: '어려움',      reward: 1.35, speed: 1.32, spawn: 1.35, gap: 0.72, window: 0.75, hazard: 1.15 },
  veryhard: { id: 'veryhard', label: '매우 어려움', reward: 1.8,  speed: 1.68, spawn: 1.70, gap: 0.55, window: 0.55, hazard: 1.32 },
  extreme:  { id: 'extreme',  label: '극악',        reward: 2.5,  speed: 2.10, spawn: 2.15, gap: 0.42, window: 0.40, hazard: 1.50 },
};

export const HUB_GAME_ORDER = ['jump', 'dodge', 'catch', 'mole', 'match', 'balance'];

export const HUB_GAMES = {
  jump:    { id: 'jump',    name: '장애물 뛰어넘기', hint: '화면을 탭하면 점프!', blurb: '화면을 탭해서 점프! 돌멩이를 넘어요' },
  dodge:   { id: 'dodge',   name: '장애물 피하기', hint: '화면 왼쪽/오른쪽을 탭해서 움직여요', blurb: '좌우로 터치해서 떨어지는 돌을 피해요' },
  catch:   { id: 'catch',   name: '유자 받기', hint: '유자를 받고, 돌은 피하세요', blurb: '좌우로 움직여 유자를 받아요 (돌은 조심!)' },
  mole:    { id: 'mole',    name: '두더지 톡톡', hint: '두더지를 톡톡 두드리세요! 돌은 피하세요', blurb: '구멍을 톡톡! 두더지만 두드리고 돌은 피해요' },
  match:   { id: 'match',   name: '귤 짝맞추기', hint: '같은 귤을 찾아 짝을 맞추세요', blurb: '같은 귤 카드를 찾아 짝을 맞춰요' },
  balance: { id: 'balance', name: '균형 잡기', hint: '기울어진 쪽을 눌러 균형을 잡으세요', blurb: '좌우를 눌러 카피바라 균형을 지켜요' },
};

const LIVES = {
  jump:    { easy: 3, normal: 2, hard: 1, veryhard: 1, extreme: 1 },
  dodge:   { easy: 4, normal: 2, hard: 1, veryhard: 1, extreme: 1 },
  catch:   { easy: 5, normal: 3, hard: 2, veryhard: 1, extreme: 1 },
  mole:    { easy: 5, normal: 3, hard: 2, veryhard: 2, extreme: 1 },
  match:   { easy: 6, normal: 4, hard: 3, veryhard: 2, extreme: 1 },
  balance: { easy: 4, normal: 3, hard: 2, veryhard: 1, extreme: 1 },
};

const MATCH = {
  easy:     { pairs: 3, cols: 3, seconds: 55, peek: 100, flip: 55 },
  normal:   { pairs: 4, cols: 4, seconds: 45, peek: 70,  flip: 42 },
  hard:     { pairs: 6, cols: 3, seconds: 40, peek: 36,  flip: 32 },
  veryhard: { pairs: 8, cols: 4, seconds: 34, peek: 18,  flip: 24 },
  extreme:  { pairs: 8, cols: 4, seconds: 22, peek: 0,   flip: 16 },
};

const MOLE_UP = { easy: 1, normal: 2, hard: 2, veryhard: 3, extreme: 3 };
const MOLE_ROCK = { easy: 0.05, normal: 0.15, hard: 0.28, veryhard: 0.40, extreme: 0.55 };
const CATCH_ROCK = { easy: 0.10, normal: 0.25, hard: 0.38, veryhard: 0.50, extreme: 0.66 };
const JUMP_CLEAR = { easy: 22, normal: 26, hard: 30, veryhard: 34, extreme: 40 };

const BAL = {
  easy:     { amp: 0.62, follow: 0.020, gust: 150, grace: 80, safe: 0.48, lean: 0.22 },
  normal:   { amp: 0.72, follow: 0.035, gust: 100, grace: 48, safe: 0.40, lean: 0.20 },
  hard:     { amp: 0.85, follow: 0.050, gust: 70,  grace: 32, safe: 0.32, lean: 0.18 },
  veryhard: { amp: 0.95, follow: 0.070, gust: 48,  grace: 20, safe: 0.24, lean: 0.16 },
  extreme:  { amp: 1.05, follow: 0.095, gust: 32,  grace: 12, safe: 0.16, lean: 0.14 },
};

function diffOf(diffId) {
  const d = HUB_DIFF[diffId];
  if (!d) throw new Error('unknown difficulty');
  return d;
}

export function jumpInterval(t, diffId) {
  const d = diffOf(diffId);
  const base = Math.max(50, Math.floor(100 - t / 60));
  return Math.max(22, Math.round(base * d.gap));
}
export function jumpSpeed(t, diffId) {
  return (5 + t / 400) * diffOf(diffId).speed;
}
export function dodgeInterval(t, diffId) {
  const d = diffOf(diffId);
  const base = Math.max(12, 40 - t / 80);
  return Math.max(6, Math.floor(base / d.spawn));
}
export function fallSpeed(t, rand, diffId) {
  return (3 + rand * 2 + t / 700) * diffOf(diffId).speed;
}
export function catchInterval(diffId) {
  return Math.max(8, Math.round(30 / diffOf(diffId).spawn));
}

export function gameParams(gameId, diffId) {
  if (!HUB_GAMES[gameId]) throw new Error('unknown game');
  const d = diffOf(diffId);
  const lives = LIVES[gameId][d.id];
  const reward = d.reward;
  if (gameId === 'jump') {
    return {
      id: d.id, label: d.label, reward, lives,
      speed: jumpSpeed(0, d.id),
      spawn: jumpInterval(0, d.id),
      timing: JUMP_CLEAR[d.id],
      hitPad: Math.round(36 * d.hazard),
      rockR: Math.max(12, Math.round(18 * d.hazard)),
    };
  }
  if (gameId === 'dodge') {
    return {
      id: d.id, label: d.label, reward, lives,
      speed: fallSpeed(0, 0.5, d.id),
      spawn: dodgeInterval(0, d.id),
      timing: Math.round(38 * d.hazard),
      radius: Math.max(10, Math.round(16 * d.hazard)),
    };
  }
  if (gameId === 'catch') {
    return {
      id: d.id, label: d.label, reward, lives,
      speed: fallSpeed(0, 0.5, d.id),
      spawn: catchInterval(d.id),
      timing: d.id === 'easy' ? 46 : Math.max(22, Math.round(38 / d.hazard)),
      rockChance: CATCH_ROCK[d.id],
      rockInstant: d.id !== 'easy',
    };
  }
  if (gameId === 'mole') {
    const up = Math.max(14, Math.round(64 * d.window));
    const every = Math.max(8, Math.round(36 * d.gap));
    return {
      id: d.id, label: d.label, reward, lives,
      speed: +(1 / d.window).toFixed(3),
      spawn: every,
      timing: up,
      maxUp: MOLE_UP[d.id],
      rockChance: MOLE_ROCK[d.id],
      roundFrames: 16 * 60,
    };
  }
  if (gameId === 'match') {
    const m = MATCH[d.id];
    return {
      id: d.id, label: d.label, reward, lives,
      speed: +((m.peek === 0 ? 2.4 : 70 / m.peek)).toFixed(3),
      spawn: m.pairs,
      timing: m.peek,
      pairs: m.pairs, cols: m.cols, seconds: m.seconds, peek: m.peek, flip: m.flip,
    };
  }
  const b = BAL[d.id];
  return {
    id: d.id, label: d.label, reward, lives,
    speed: b.follow,
    spawn: b.gust,
    timing: b.grace,
    amp: b.amp, safe: b.safe, lean: b.lean, seconds: 18,
  };
}

function fmt(n) {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/0$/, '').replace(/\.0$/, '');
}

export function diffSummary(gameId, diffId) {
  const p = gameParams(gameId, diffId);
  let body = '';
  if (gameId === 'jump') body = `속도 ${fmt(p.speed)} · 간격 ${p.spawn} · 넘김 ${p.timing} · 목숨 ${p.lives}`;
  else if (gameId === 'dodge') body = `낙하 ${fmt(p.speed)} · 생성 ${p.spawn} · 충돌 ${p.timing} · 목숨 ${p.lives}`;
  else if (gameId === 'catch') body = `낙하 ${fmt(p.speed)} · 생성 ${p.spawn} · 놓침 ${p.lives} · ${p.rockInstant ? '돌 즉시 종료' : '돌은 목숨 -1'}`;
  else if (gameId === 'mole') body = `머무름 ${p.timing} · ${p.spawn}마다 · 목숨 ${p.lives}`;
  else if (gameId === 'match') body = `${p.pairs}쌍 · ${p.seconds}초 · 실수 ${p.lives}`;
  else if (gameId === 'balance') body = `바람 ${fmt(p.amp)} · 돌풍 ${p.spawn} · 버팀 ${p.timing} · 실수 ${p.lives}`;
  return `${body} · 보상 ×${fmt(p.reward)}`;
}

/** Difficulty list is always available. Energy is not consulted. */
export function difficultyMenu(gameId) {
  if (!HUB_GAMES[gameId]) throw new Error('unknown game');
  return {
    game: gameId,
    title: HUB_GAMES[gameId].name,
    defaultDiff: HUB_DEFAULT_DIFF,
    levels: HUB_DIFF_ORDER.map((id) => ({
      id,
      label: HUB_DIFF[id].label,
      selected: id === HUB_DEFAULT_DIFF,
      summary: diffSummary(gameId, id),
      params: gameParams(gameId, id),
    })),
  };
}

export function canStartHub(energy) {
  return Number(energy) >= HUB_ENERGY;
}

export function spendEnergy(energy) {
  if (!canStartHub(energy)) return { ok: false, energy: Number(energy) || 0, message: HUB_ENERGY_MSG };
  return { ok: true, energy: energy - HUB_ENERGY, message: '' };
}

export function hubReward(score, diffId) {
  const d = diffOf(diffId);
  const sc = Math.max(0, Math.floor(Number(score) || 0));
  const m = d.reward;
  const coin = Math.max(0, Math.min(Math.round(30 * m), Math.floor((sc / 5) * m)));
  const xp = Math.max(0, Math.min(Math.round(20 * m), Math.floor((sc / 10) * m) + Math.round(2 * m)));
  const happy = Math.max(0, Math.min(Math.round(15 * m), Math.round((5 + Math.floor(sc / 20)) * m)));
  return { coin, xp, happy, score: sc, reward: m, label: d.label };
}

export function applyHubReward(state, reward) {
  return {
    coin: state.coin + reward.coin,
    exp: state.exp + reward.xp,
    happy: Math.min(100, state.happy + reward.happy),
  };
}

let runSeq = 1;
export function createRun(gameId, diffId) {
  gameParams(gameId, diffId);
  return { id: runSeq++, game: gameId, diff: diffId, paid: false, forfeited: false, over: false, reward: null };
}

/** Pay a finished run once. A second call, a forfeited run, or a retry of the old run returns null. */
export function claimRun(run, score) {
  if (!run || run.paid || run.forfeited || run.over) return null;
  const reward = hubReward(score, run.diff);
  run.over = true;
  run.paid = true;
  run.reward = reward;
  return reward;
}

/** Leave early: lock the run so it can never pay. */
export function forfeitRun(run) {
  if (!run || run.paid || run.over) return false;
  run.forfeited = true;
  run.over = true;
  run.paid = true;
  run.reward = null;
  return true;
}

export function normalizeBest(raw) {
  const out = {};
  for (const id of HUB_GAME_ORDER) out[id] = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const id of HUB_GAME_ORDER) {
    const v = raw[id];
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) out[id].normal = Math.floor(v);
    else if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const d of HUB_DIFF_ORDER) {
        const n = Number(v[d]);
        if (Number.isFinite(n) && n > 0) out[id][d] = Math.floor(n);
      }
    }
  }
  return out;
}

export function bestScore(store, gameId, diffId) {
  const g = store && store[gameId];
  if (!g) return 0;
  if (typeof g === 'number') return diffId === 'normal' ? Math.max(0, Math.floor(g)) : 0;
  return Math.max(0, Math.floor(g[diffId] || 0));
}

export function recordBest(store, gameId, diffId, score) {
  if (!HUB_GAMES[gameId] || !HUB_DIFF[diffId]) throw new Error('bad best key');
  const sc = Math.floor(Number(score) || 0);
  if (!store[gameId] || typeof store[gameId] !== 'object') store[gameId] = {};
  const prev = Math.floor(store[gameId][diffId] || 0);
  if (sc > prev) {
    store[gameId][diffId] = sc;
    return true;
  }
  return false;
}
