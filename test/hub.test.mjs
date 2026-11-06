import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HUB_GAMES, HUB_GAME_ORDER, HUB_DIFF, HUB_DIFF_ORDER, HUB_LABELS, HUB_DEFAULT_DIFF, HUB_ENERGY, HUB_ENERGY_MSG, BEST_KEY,
  gameParams, difficultyMenu, jumpInterval, jumpSpeed, dodgeInterval, fallSpeed, catchInterval,
  canStartHub, spendEnergy, hubReward, applyHubReward, createRun, claimRun, forfeitRun,
  normalizeBest, bestScore, recordBest,
} from '../hub.js';

const legacyReward = (score) => {
  const sc = Math.floor(score);
  return {
    coin: Math.min(30, Math.floor(sc / 5)),
    xp: Math.min(20, Math.floor(sc / 10) + 2),
    happy: Math.min(15, 5 + Math.floor(sc / 20)),
  };
};

test('six hub games and five exact difficulty labels, default 보통', () => {
  assert.deepEqual(HUB_GAME_ORDER, ['jump', 'dodge', 'catch', 'mole', 'match', 'balance']);
  assert.equal(Object.keys(HUB_GAMES).length, 6);
  assert.equal(HUB_GAMES.mole.name, '두더지 톡톡');
  assert.equal(HUB_GAMES.match.name, '귤 짝맞추기');
  assert.equal(HUB_GAMES.balance.name, '균형 잡기');
  assert.deepEqual(HUB_DIFF_ORDER.map((id) => HUB_DIFF[id].label), HUB_LABELS);
  assert.deepEqual(HUB_LABELS, ['쉬움', '보통', '어려움', '매우 어려움', '극악']);
  assert.equal(HUB_DEFAULT_DIFF, 'normal');
  assert.equal(HUB_DIFF.normal.label, '보통');
  assert.equal(BEST_KEY, 'capy_best_v1');
});

test('difficulty menu opens for every game with 보통 selected and does not read energy', () => {
  for (const game of HUB_GAME_ORDER) {
    const menu = difficultyMenu(game);
    assert.equal(menu.levels.length, 5);
    assert.deepEqual(menu.levels.map((l) => l.label), HUB_LABELS);
    assert.equal(menu.levels.find((l) => l.selected).id, 'normal');
    assert.equal(menu.defaultDiff, 'normal');
    for (const level of menu.levels) assert.equal(level.summary.includes(level.label), false);
  }
});

test('energy is checked only by the start gate', () => {
  assert.equal(canStartHub(0), false);
  assert.equal(canStartHub(4), false);
  assert.equal(canStartHub(5), true);
  assert.equal(HUB_ENERGY, 5);
  const blocked = spendEnergy(2);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.energy, 2);
  assert.equal(blocked.message, HUB_ENERGY_MSG);
  assert.match(blocked.message, /체력 5/);
  const ok = spendEnergy(80);
  assert.equal(ok.ok, true);
  assert.equal(ok.energy, 75);
  assert.equal(ok.message, '');
});

test('every difficulty changes speed, spawn, timing, or lives, and raises the reward multiplier', () => {
  for (const game of HUB_GAME_ORDER) {
    const params = HUB_DIFF_ORDER.map((id) => gameParams(game, id));
    assert.equal(new Set(params.map((p) => JSON.stringify([p.speed, p.spawn, p.timing, p.lives, p.reward]))).size, 5, game);
    for (let i = 1; i < params.length; i++) {
      const a = params[i - 1];
      const b = params[i];
      assert.ok(b.reward > a.reward, `${game} reward ${a.id}->${b.id}`);
      assert.ok(a.speed !== b.speed || a.spawn !== b.spawn || a.timing !== b.timing || a.lives !== b.lives, `${game} ${a.id}->${b.id}`);
    }
    assert.ok(params.some((p, i) => i > 0 && p.speed !== params[0].speed), `${game} speed`);
    assert.ok(params.some((p, i) => i > 0 && p.spawn !== params[0].spawn), `${game} spawn`);
    assert.ok(params.some((p, i) => i > 0 && p.timing !== params[0].timing), `${game} timing`);
    assert.ok(params.some((p, i) => i > 0 && p.lives !== params[0].lives), `${game} lives`);
  }
});

test('보통 keeps the original arcade numbers', () => {
  assert.equal(jumpSpeed(0, 'normal'), 5);
  assert.equal(jumpSpeed(400, 'normal'), 6);
  assert.equal(jumpInterval(0, 'normal'), 100);
  assert.equal(jumpInterval(120, 'normal'), Math.max(50, Math.floor(100 - 120 / 60)));
  assert.equal(dodgeInterval(0, 'normal'), 40);
  assert.equal(dodgeInterval(80, 'normal'), Math.floor(Math.max(12, 40 - 80 / 80)));
  assert.equal(catchInterval('normal'), 30);
  assert.equal(fallSpeed(0, 0.5, 'normal'), 4);
  const jump = gameParams('jump', 'normal');
  assert.equal(jump.timing, 26);
  assert.equal(jump.hitPad, 36);
  assert.equal(jump.rockR, 18);
  assert.equal(jump.lives, 2);
  const dodge = gameParams('dodge', 'normal');
  assert.equal(dodge.timing, 38);
  assert.equal(dodge.radius, 16);
  const catchP = gameParams('catch', 'normal');
  assert.equal(catchP.lives, 3);
  assert.equal(catchP.rockChance, 0.25);
  assert.equal(catchP.rockInstant, true);
  assert.equal(catchP.timing, 38);
  assert.equal(gameParams('catch', 'easy').rockInstant, false);
});

test('same score pays the old 보통 reward and never less on a higher difficulty', () => {
  for (const sc of [0, 1, 7, 10, 19, 50, 100, 149, 200, 1000]) {
    const got = hubReward(sc, 'normal');
    const old = legacyReward(sc);
    assert.deepEqual({ coin: got.coin, xp: got.xp, happy: got.happy }, old, `score ${sc}`);
  }
  for (let sc = 0; sc <= 500; sc++) {
    let prev = null;
    for (const id of HUB_DIFF_ORDER) {
      const reward = hubReward(sc, id);
      if (prev) {
        assert.ok(reward.coin >= prev.coin, `coin ${sc} ${prev.label}->${reward.label}`);
        assert.ok(reward.xp >= prev.xp, `xp ${sc} ${prev.label}->${reward.label}`);
        assert.ok(reward.happy >= prev.happy, `happy ${sc} ${prev.label}->${reward.label}`);
      }
      prev = reward;
    }
  }
  for (const sc of [80, 120, 250]) {
    const rewards = HUB_DIFF_ORDER.map((id) => hubReward(sc, id));
    for (let i = 1; i < rewards.length; i++) {
      assert.ok(rewards[i].coin > rewards[i - 1].coin, `strict coin ${sc}`);
      assert.ok(rewards[i].xp > rewards[i - 1].xp, `strict xp ${sc}`);
    }
  }
});

test('a run pays once; exit forfeits; retry is a new run', () => {
  const run = createRun('jump', 'hard');
  const first = claimRun(run, 100);
  assert.ok(first.coin > hubReward(100, 'normal').coin);
  assert.equal(claimRun(run, 100), null);
  assert.equal(claimRun(run, 9999), null);
  assert.equal(forfeitRun(run), false);
  assert.equal(run.reward.coin, first.coin);
  const wallet = applyHubReward({ coin: 10, exp: 3, happy: 90 }, first);
  const again = applyHubReward(wallet, first);
  assert.ok(again.coin > wallet.coin, 'applying twice is the caller repeating; claim itself will not');
  assert.equal(claimRun(run, 100), null);

  const left = createRun('balance', 'extreme');
  assert.equal(forfeitRun(left), true);
  assert.equal(left.reward, null);
  assert.equal(claimRun(left, 500), null);
  assert.equal(forfeitRun(left), false);

  const retry = createRun('balance', 'extreme');
  assert.notEqual(retry.id, left.id);
  const second = claimRun(retry, 40);
  assert.ok(second);
  assert.equal(claimRun(left, 40), null);
  assert.equal(claimRun(retry, 40), null);
});

test('best scores are stored per game and difficulty and keep legacy totals on 보통', () => {
  const store = normalizeBest({ jump: 42, dodge: { easy: 3, extreme: 9, normal: 1 }, catch: 0, nope: 8 });
  assert.equal(bestScore(store, 'jump', 'normal'), 42);
  assert.equal(bestScore(store, 'jump', 'easy'), 0);
  assert.equal(bestScore(store, 'jump', 'extreme'), 0);
  assert.equal(bestScore(store, 'dodge', 'easy'), 3);
  assert.equal(bestScore(store, 'dodge', 'extreme'), 9);
  assert.equal(bestScore(store, 'dodge', 'normal'), 1);
  assert.equal(bestScore(store, 'catch', 'normal'), 0);
  assert.equal(store.nope, undefined);
  assert.equal(recordBest(store, 'dodge', 'easy', 2), false);
  assert.equal(bestScore(store, 'dodge', 'easy'), 3);
  assert.equal(recordBest(store, 'jump', 'extreme', 7), true);
  assert.equal(bestScore(store, 'jump', 'normal'), 42);
  assert.equal(bestScore(store, 'jump', 'extreme'), 7);
  assert.equal(bestScore(store, 'mole', 'veryhard'), 0);
});

test('unknown ids are rejected', () => {
  assert.throws(() => gameParams('feed', 'normal'));
  assert.throws(() => gameParams('mole', '보통'));
  assert.throws(() => createRun('sleep', 'easy'));
  assert.throws(() => recordBest({}, 'jump', 'nope', 1));
});
