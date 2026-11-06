/**
 * Mobile smoke test. Requires puppeteer-core and Chrome.
 *   GAME_URL=http://127.0.0.1:8765/index.html node test/browser-smoke.mjs
 */
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';

const URL = process.env.GAME_URL || 'http://127.0.0.1:8765/index.html';
const ART = '/opt/cursor/artifacts';
const CHROME = process.env.CHROME || '/usr/bin/google-chrome-stable';
const LABELS = ['쉬움', '보통', '어려움', '매우 어려움', '극악'];
const GAMES = ['jump', 'dodge', 'catch', 'mole', 'match', 'balance'];
const NAMES = {
  jump: '장애물 뛰어넘기', dodge: '장애물 피하기', catch: '유자 받기',
  mole: '두더지 톡톡', match: '귤 짝맞추기', balance: '균형 잡기',
};

const errors = [];
const warnings = [];

function saveOf(extra = {}) {
  return {
    name: '바라', exp: 20, coin: 50, hunger: 70, happy: 40, energy: 80,
    fit: 30, smart: 30, clean: 80, own: ['rug'], t: Date.now(), ...extra,
  };
}

async function launch() {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  });
}

async function prep(page, save, best) {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.evaluate((data, bestData) => {
    localStorage.setItem('capy_save_v1', JSON.stringify(data));
    if (bestData) localStorage.setItem('capy_best_v1', JSON.stringify(bestData));
    else localStorage.removeItem('capy_best_v1');
  }, save, best || null);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForFunction(() => window.__hub && window.__capy && window.__care, { timeout: 15000 });
}

async function shot(page, name) {
  const path = `${ART}/${name}`;
  await page.screenshot({ path, fullPage: false });
  return path;
}

const browser = await launch();
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
page.on('console', (msg) => {
  const t = msg.type();
  const text = msg.text();
  if (t === 'error' && !/favicon|Failed to load resource/i.test(text)) errors.push(text);
  else if (t === 'warning') warnings.push(text);
});
page.on('pageerror', (err) => errors.push(String(err)));
page.on('response', (res) => {
  if (res.status() >= 400 && !res.url().endsWith('/favicon.ico')) errors.push(`HTTP ${res.status()} ${res.url()}`);
});
page.on('requestfailed', (req) => {
  const url = req.url();
  if (url.endsWith('/favicon.ico')) return;
  errors.push(`request failed ${url} ${req.failure()?.errorText || ''}`);
});

await mkdir(ART, { recursive: true });
const problems = [];
const shots = [];

try {
  await prep(page, saveOf(), { jump: 77, dodge: 12 });
  await page.click('#gameBtn');
  await page.waitForSelector('#menuM.on');
  const menuText = await page.$$eval('.gm', (els) => els.map((e) => e.innerText));
  if (menuText.length !== 6) problems.push(`menu count ${menuText.length}`);
  for (const name of Object.values(NAMES)) {
    if (!menuText.some((t) => t.includes(name))) problems.push(`menu missing ${name}`);
  }
  const legacy = await page.$eval('#b_jump', (e) => e.textContent);
  if (legacy !== '77') problems.push(`legacy best shown as ${legacy}`);
  const menuBox = await page.$eval('#menuM .box', (el) => {
    const r = el.getBoundingClientRect();
    const buttons = [...el.querySelectorAll('.gm,#menuX')].map((b) => {
      const br = b.getBoundingClientRect();
      return { text: b.innerText.split('\n')[0], top: br.top, bottom: br.bottom, h: br.height };
    });
    return { top: r.top, bottom: r.bottom, h: r.height, buttons };
  });
  if (menuBox.bottom > 844 || menuBox.top < 0) problems.push(`menu clipped ${JSON.stringify(menuBox)}`);
  shots.push(await shot(page, 'hub-menu-390x844.png'));

  await page.click('.gm[data-g="mole"]');
  await page.waitForSelector('#hubDiffM.on');
  const labels = await page.$$eval('#hubDiffList .lab', (els) => els.map((e) => e.textContent));
  const selected = await page.$eval('#hubDiffList button.sel', (b) => b.dataset.d);
  if (JSON.stringify(labels) !== JSON.stringify(LABELS)) problems.push(`labels ${labels.join('|')}`);
  if (selected !== 'normal') problems.push(`default ${selected}`);
  const normalBest = await page.$$eval('#hubDiffList button', (els) => els.map((b) => ({ d: b.dataset.d, t: b.innerText })));
  const jumpMenu = normalBest.find((b) => b.d === 'normal');
  if (!jumpMenu || !jumpMenu.t.startsWith('보통')) problems.push(`보통 button ${jumpMenu && jumpMenu.t}`);
  for (const id of ['easy', 'hard', 'veryhard', 'extreme']) {
    await page.click(`#hubDiffList button[data-d="${id}"]`);
    const now = await page.$eval('#hubDiffList button.sel', (b) => b.dataset.d);
    if (now !== id) problems.push(`select ${id} got ${now}`);
  }
  await page.click('#hubDiffList button[data-d="normal"]');
  const pickerBox = await page.$eval('#hubDiffM .box', (el) => {
    const r = el.getBoundingClientRect();
    const buttons = [...el.querySelectorAll('button')].map((b) => {
      const br = b.getBoundingClientRect();
      return { d: b.dataset.d || b.id, top: Math.round(br.top), bottom: Math.round(br.bottom) };
    });
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), buttons };
  });
  if (pickerBox.bottom > 844 || pickerBox.top < 0) problems.push(`picker clipped ${JSON.stringify(pickerBox)}`);
  if (pickerBox.buttons.some((b) => b.top < 0 || b.bottom > 844)) problems.push(`picker button offscreen ${JSON.stringify(pickerBox)}`);
  shots.push(await shot(page, 'difficulty-picker-390x844.png'));

  await page.evaluate(() => { window.__capy.S.energy = 0; window.__capy.ui(); });
  const energyBefore = await page.evaluate(() => window.__capy.S.energy);
  await page.click('#hubDiffGo');
  await page.waitForFunction(() => getComputedStyle(document.getElementById('toast')).opacity === '1' || document.getElementById('toast').style.opacity === '1');
  const toast = await page.$eval('#toast', (e) => e.textContent);
  const playing = await page.$eval('#mg', (e) => e.classList.contains('on'));
  const energyAfter = await page.evaluate(() => window.__capy.S.energy);
  const stillOpen = await page.$eval('#hubDiffM', (e) => e.classList.contains('on'));
  if (energyBefore !== 0 || energyAfter !== 0) problems.push(`energy mutated ${energyBefore}->${energyAfter}`);
  if (playing) problems.push('game started without energy');
  if (!stillOpen) problems.push('difficulty menu closed on blocked start');
  if (!toast.includes('체력 5')) problems.push(`toast ${toast}`);

  await page.evaluate(() => { window.__capy.S.energy = 80; window.__capy.ui(); });
  await page.click('#hubDiffGo');
  await page.waitForSelector('#mg.on');
  await page.waitForFunction(() => window.__hub.G && window.__hub.G.k === 'mole' && window.__hub.G.diff === 'normal');
  await new Promise((r) => setTimeout(r, 350));
  const moleTitle = await page.$eval('#mgTitle', (e) => e.textContent);
  if (!moleTitle.includes('두더지 톡톡') || !moleTitle.includes('보통')) problems.push(`title ${moleTitle}`);
  shots.push(await shot(page, 'game-mole-390x844.png'));
  const whack = await page.evaluate(() => {
    const g = window.__hub.G;
    const before = g.score;
    const x = innerWidth * 0.5;
    const y = innerHeight * 0.5;
    const c = document.getElementById('mgc');
    c.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true }));
    c.dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y, bubbles: true }));
    return { before, after: g.score, lives: g.lives };
  });
  if (whack.after <= whack.before) problems.push(`mole tap did not score ${JSON.stringify(whack)}`);

  await page.click('#mgBack');
  await page.waitForFunction(() => !document.getElementById('mg').classList.contains('on'));

  await page.evaluate(() => window.__hub.beginHub('match', 'normal'));
  await page.waitForFunction(() => window.__hub.G && window.__hub.G.k === 'match');
  await new Promise((r) => setTimeout(r, 250));
  shots.push(await shot(page, 'game-match-390x844.png'));
  await page.evaluate(() => window.__hub.home());

  await page.evaluate(() => window.__hub.beginHub('balance', 'normal'));
  await page.waitForFunction(() => window.__hub.G && window.__hub.G.k === 'balance');
  await page.mouse.move(80, 760);
  await page.mouse.down();
  await new Promise((r) => setTimeout(r, 280));
  const lean = await page.evaluate(() => window.__hub.G.lean);
  await page.mouse.up();
  if (!(lean < -0.05)) problems.push(`balance hold lean ${lean}`);
  shots.push(await shot(page, 'game-balance-390x844.png'));
  await page.evaluate(() => window.__hub.home());

  const blockedCoin = await page.evaluate(() => window.__capy.S.coin);
  await page.click('button[data-a="exercise"]');
  await page.waitForSelector('#diffM.on');
  const care = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('#diffList button')].map((b) => b.innerText);
    const diff = window.__care.DIFF;
    return {
      buttons,
      keys: Object.keys(diff),
      very: diff.veryhard && diff.veryhard.n,
      extreme: diff.extreme,
      rewards: Object.fromEntries(Object.entries(diff).map(([k, v]) => [k, v.reward])),
      speeds: Object.fromEntries(Object.entries(diff).map(([k, v]) => [k, v.speed])),
    };
  });
  if (care.keys.length !== 4 || care.extreme) problems.push(`care keys ${care.keys}`);
  if (care.very !== '매우어려움') problems.push(`care veryhard label ${care.very}`);
  if (care.buttons.some((t) => t.includes('극악'))) problems.push('care picker has 극악');
  if (!care.buttons.some((t) => t.includes('매우어려움'))) problems.push(`care buttons ${care.buttons.join(' / ')}`);
  if (care.rewards.easy !== 0.85 || care.rewards.normal !== 1 || care.rewards.hard !== 1.25 || care.rewards.veryhard !== 1.5) problems.push(`care rewards ${JSON.stringify(care.rewards)}`);
  if (care.speeds.normal !== 4.2 || care.speeds.veryhard !== 9) problems.push(`care speeds ${JSON.stringify(care.speeds)}`);
  const energyCare = await page.evaluate(() => window.__capy.S.energy);
  await page.click('#diffX');
  const energyCare2 = await page.evaluate(() => window.__capy.S.energy);
  if (energyCare !== energyCare2) problems.push('care picker spent energy');
  if (await page.evaluate(() => window.__capy.S.coin) !== blockedCoin) problems.push('care picker paid coins');

  await prep(page, saveOf({ energy: 400, coin: 100, exp: 10, happy: 20 }), null);
  const matrix = await page.evaluate(async (games) => {
    const diffs = window.__hub.HUB_DIFF_ORDER;
    const issues = [];
    const touch = (x, y) => {
      const c = document.getElementById('mgc');
      c.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true }));
      c.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, bubbles: true }));
      c.dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y, bubbles: true }));
    };
    for (const g of games) {
      for (const d of diffs) {
        window.__capy.S.energy = 80;
        const params = window.__hub.gameParams(g, d);
        const coin0 = window.__capy.S.coin;
        const exp0 = window.__capy.S.exp;
        const happy0 = window.__capy.S.happy;
        const energy0 = window.__capy.S.energy;
        if (!window.__hub.beginHub(g, d)) { issues.push(`start ${g} ${d} energy ${window.__capy.S.energy}`); continue; }
        const G = window.__hub.G;
        if (!G || G.k !== g || G.diff !== d) { issues.push(`state ${g} ${d}`); continue; }
        for (const key of ['speed', 'spawn', 'timing', 'lives', 'reward']) {
          if (!G || G.D[key] !== params[key]) issues.push(`param ${g} ${d} ${key} ${G && G.D[key]} != ${params[key]}`);
        }
        if (window.__capy.S.energy !== energy0 - 5) issues.push(`energy spend ${g} ${d}`);
        G.lives = 99;
        G.inv = 999;
        touch(innerWidth * 0.3, innerHeight * 0.55);
        touch(innerWidth * 0.7, innerHeight * 0.62);
        await new Promise((r) => setTimeout(r, 180));
        if (window.__capy.S.coin !== coin0 || window.__capy.S.exp !== exp0) issues.push(`paid during play ${g} ${d}`);
        const run = window.__hub.G && window.__hub.G.run;
        window.__hub.G.score = 100;
        window.__hub.endHub();
        const expect = window.__hub.hubReward(100, d);
        if (window.__capy.S.coin !== coin0 + expect.coin) issues.push(`coin ${g} ${d} got ${window.__capy.S.coin - coin0} want ${expect.coin}`);
        if (window.__capy.S.exp !== exp0 + expect.xp) issues.push(`xp ${g} ${d} got ${window.__capy.S.exp - exp0} want ${expect.xp}`);
        window.__hub.endHub();
        if (window.__capy.S.coin !== coin0 + expect.coin || window.__capy.S.exp !== exp0 + expect.xp) issues.push(`double pay ${g} ${d}`);
        const best = JSON.parse(localStorage.getItem('capy_best_v1') || '{}');
        if ((best[g] && best[g][d]) < 100) issues.push(`best ${g} ${d} ${best[g] && best[g][d]}`);
        document.getElementById('again').click();
        await new Promise((r) => setTimeout(r, 30));
        const midCoin = window.__capy.S.coin;
        const retry = window.__hub.G;
        if (!retry || retry.run === run || retry.run.paid) issues.push(`retry run ${g} ${d}`);
        if (window.__capy.S.energy !== energy0 - 10) issues.push(`retry energy ${g} ${d} ${window.__capy.S.energy} from ${energy0}`);
        retry.score = 90;
        document.getElementById('mgBack').click();
        if (window.__capy.S.coin !== midCoin || window.__capy.S.exp !== exp0 + expect.xp) issues.push(`exit exploit ${g} ${d}`);
        const best2 = JSON.parse(localStorage.getItem('capy_best_v1') || '{}');
        if (best2[g][d] !== best[g][d]) issues.push(`exit wrote best ${g} ${d}`);
        if (window.__hub.G) issues.push(`exit left game ${g} ${d}`);
        if (happy0 > 100) issues.push('happy');
      }
    }
    const pet = window.__capy.S;
    return { issues, pet: { name: pet.name, hunger: pet.hunger, fit: pet.fit, smart: pet.smart, clean: pet.clean, own: pet.own } };
  }, GAMES);

  problems.push(...matrix.issues);
  if (matrix.pet.name !== '바라') problems.push('name changed');
  if (JSON.stringify(matrix.pet.own) !== JSON.stringify(['rug'])) problems.push(`own changed ${matrix.pet.own}`);
  const expectedPet = { hunger: 70, fit: 30, smart: 30, clean: 80 };
  for (const key of Object.keys(expectedPet)) {
    if (Math.abs(matrix.pet[key] - expectedPet[key]) > 1) problems.push(`${key} drifted to ${matrix.pet[key]}`);
  }
  const manifest = await page.$('link[rel="manifest"]');
  if (manifest) problems.push('manifest present');

  const finalSave = await page.evaluate(() => JSON.parse(localStorage.getItem('capy_save_v1')));
  for (const key of ['name', 'exp', 'coin', 'hunger', 'happy', 'energy', 'fit', 'smart', 'clean', 'own', 't']) {
    if (!(key in finalSave)) problems.push(`save missing ${key}`);
  }
} catch (err) {
  problems.push(`exception ${err && err.stack || err}`);
  try { shots.push(await shot(page, 'failure-390x844.png')); } catch { /* ignore */ }
}

await browser.close();
const report = { problems, errors, warnings: warnings.slice(0, 20), shots };
console.log(JSON.stringify(report, null, 2));
if (problems.length || errors.length) process.exit(1);
