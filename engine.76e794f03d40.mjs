import {MODES, displayUnits} from './format.76e794f03d40.mjs';
export const VERSION = 'aptvs_v4';
const positive = x => Number.isFinite(x) && x > 0;
const text = x => typeof x === 'string' && x.trim().length > 0;
export function validPair(a, b, mode) {
  if (!a || !b || a.id === b.id || !positive(a.price) || !positive(b.price)) return false;
  if (a.name && ['name', 'dong', 'region', 'area'].every(key => a[key] === b[key])) return false;
  const gap = Math.abs(a.price - b.price) / Math.max(a.price, b.price);
  return gap > .05 && gap < 1 && displayUnits(a.price, mode) !== displayUnits(b.price, mode);
}
export const LEVEL_RULES = [
  '서울·경기 비교 · 같은 전용 평형',
  '같은 시도 · 같은 전용 평형',
  '같은 지역구 · 같은 전용 평형',
  '같은 법정동 · 같은 전용 평형',
  '전용 26평형 ↔ 18평형',
  '전용 25·26평형 ↔ 17·18평형',
  '전용 25·26평형 ↔ 30~34평형',
  '전용 17·18평형 ↔ 30~34평형',
  '모든 지역 · 모든 전용 평형',
];
export const levelForScore = score => Math.min(20, Math.floor(Math.max(0, score) / 3) + 1);
export const gapText = level => level <= 9 ? `시세 차이 ${{1:50,2:30,3:15}[level] || 10}% 초과` :
  `시세 차이 ${level === 20 ? 10 : 20}% 이내`;
export function levelRule(level, reference) {
  if (level <= 9) return LEVEL_RULES[level-1];
  const year = Number(reference.slice(0,4));
  if (level === 10) return `모든 단지 · ${year}년 같은 기준일`;
  if (level === 11) return `모든 단지 · ${year}년 안에서 다른 월 허용`;
  if (level === 20) return '최고 난도 · 모든 단지 · 전체 연도';
  return `모든 단지 · ${year-(level-11)}~${year}년 비교`;
}
export function gapAllowed(a, b, level) {
  const gap = Math.abs(a.price-b.price)/Math.max(a.price,b.price);
  return level <= 9 ? gap > ({1:.50,2:.30,3:.15}[level] || .10) :
    gap > .05 && gap <= (level === 20 ? .10 : .20);
}
export function dateAllowed(r, level, reference) {
  if (!reference || !r.referenceDate || r.referenceDate > reference) return false;
  if (level <= 10) return r.referenceDate === reference;
  return level === 20 || Number(r.referenceDate.slice(0,4)) >= Number(reference.slice(0,4))-(level-11);
}
export function levelAllowed(a, b, level) {
  if (!a || !b || !Number.isInteger(a.unitType) || !Number.isInteger(b.unitType)) return false;
  const sameUnit = a.unitType === b.unitType;
  if (level === 1) return sameUnit;
  if (level === 2) return sameUnit && a.province === b.province;
  if (level === 3) return sameUnit && a.province === b.province && a.region === b.region;
  if (level === 4) return sameUnit && a.province === b.province && a.region === b.region && a.dongCode === b.dongCode;
  const groups = {5:[[26],[18]], 6:[[25,26],[17,18]], 7:[[25,26],[30,31,32,33,34]], 8:[[17,18],[30,31,32,33,34]]};
  if (groups[level]) {
    const [left, right] = groups[level];
    return (left.includes(a.unitType) && right.includes(b.unitType)) ||
      (left.includes(b.unitType) && right.includes(a.unitType));
  }
  return level >= 9 && level <= 20;
}
const playable = (cards, mode, level, reference) => Array.isArray(cards) && cards.length === 2 &&
  validPair(cards[0], cards[1], mode) && levelAllowed(cards[0], cards[1], level) &&
  gapAllowed(cards[0], cards[1], level) && cards.every(r => dateAllowed(r, level, reference));
function endpoint(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value);
  if (!Number.isFinite(d.valueOf()) || d.toISOString().slice(0,10) !== value) return false;
  const end = new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0));
  end.setUTCDate(end.getUTCDate()-(end.getUTCDay()+3)%7);
  return end.toISOString().slice(0,10) === value;
}
export function validateSnapshot(d) {
  if (!d || d.version !== VERSION || d.schemaVersion !== 2 || d.pyeongM2 !== 3.3058 || d.referenceDeposit !== 1000 ||
      d.unitTypeVersion !== 'exclusive_round_half_up_v1' || d.minGap !== .05 || d.pointsPerLevel !== 3 || d.maxLevel !== 20 || d.ageReferenceDate !== '2026-06-30' ||
      !endpoint(d.referenceDate) || !endpoint(d.historyStart) || d.historyStart > d.referenceDate || !d.regions || !d.modes) throw new Error('invalid_snapshot');
  for (const mode of Object.keys(MODES)) {
    const pool = d.modes[mode];
    if (!pool || !pool.levelPairs || !Array.isArray(pool.records) || !Array.isArray(pool.pairs) ||
        pool.records.length > 2400 || pool.pairs.length > 7680) throw new Error('invalid_pool');
    const keys = new Set();
    for (const r of pool.records) {
      if (!r || !(r.households === null || Number.isSafeInteger(r.households) && r.households > 0) || !(r.buildYear === null || Number.isInteger(r.buildYear) && r.buildYear >= 1800 && r.buildYear <= Number(d.ageReferenceDate.slice(0,4)) && r.buildYear <= Number(r.referenceDate.slice(0,4))) || !endpoint(r.referenceDate) || r.referenceDate < d.historyStart || r.referenceDate > d.referenceDate || ![r.id, r.name, r.dong, r.dongCode, r.region, r.band].every(text) || !text(d.regions[r.region]) ||
          !['11','41'].includes(r.province) || r.region.slice(0,2) !== r.province ||
          !/^\d{5}$/.test(r.dongCode) || !Number.isInteger(r.unitType) || r.unitType < 1 ||
          r.unitType !== Math.floor(r.area/d.pyeongM2+.5) || !positive(r.area) || !positive(r.price) || !Number.isInteger(r.priceBand) || r.priceBand < 0 || r.priceBand > 4)
        throw new Error('invalid_record');
      const key = JSON.stringify([r.id, r.area, r.referenceDate]);
      if (keys.has(key)) throw new Error('duplicate_record');
      keys.add(key);
    }
    const pairs = new Set();
    for (const pair of pool.pairs) {
      if (!Array.isArray(pair) || pair.length !== 2 || !pair.every(Number.isInteger)) throw new Error('invalid_pair');
      const [a, b] = pair;
      const key = [...pair].sort((x, y) => x - y).join(':');
      if (pairs.has(key) || !validPair(pool.records[a], pool.records[b], mode)) throw new Error('invalid_pair');
      pairs.add(key);
    }
    for (let level = 1; level <= 20; level++) {
      const indices = pool.levelPairs[level];
      if (!Array.isArray(indices) || indices.length > 384 || new Set(indices).size !== indices.length)
        throw new Error('invalid_level');
      for (const index of indices) {
        const pair = pool.pairs[index];
        if (!Number.isInteger(index) || !pair || !playable(pair.map(i => pool.records[i]), mode, level, d.referenceDate))
          throw new Error('invalid_level_pair');
      }
    }
  }
  return d;
}
const pick = (items, rng) => items[Math.floor(rng() * items.length)];
function leastUsed(items, counts, key) {
  const min = Math.min(...items.map(x => counts.get(key(x)) || 0));
  return items.filter(x => (counts.get(key(x)) || 0) === min);
}
export class Deck {
  constructor(pool, rng = Math.random, focusSale = false) {
    this.pool = pool;
    this.focusSale = focusSale;
    this.rng = rng;
    this.remaining = new Set(pool.pairs.map((_, i) => i));
    this.regions = new Map();
    this.strata = new Map();
    this.previous = new Set();
    this.years = new Map();
  }
  next(level = 1) {
    if (!this.remaining.size) return null;
    const {records, pairs} = this.pool;
    const all = (this.pool.levelPairs[level] || []).filter(i => this.remaining.has(i));
    if (!all.length) return null;
    const fresh = all.filter(i => pairs[i].every(j => !this.previous.has(records[j].id)));
    let available = fresh.length ? fresh : all;
    if (this.focusSale && this.rng() < .75) {
      const focused = available.filter(i => pairs[i].some(j => records[j].price >= 60000 && records[j].price < 210000));
      if (focused.length) available = focused;
    }
    const byAnchor = new Map();
    for (const i of available) for (const j of pairs[i]) {
      if (!byAnchor.has(j)) byAnchor.set(j, []);
      byAnchor.get(j).push(i);
    }
    let anchors = [...byAnchor.keys()];
    if (level >= 11) {
      anchors = leastUsed(anchors, this.years, i => records[i].referenceDate.slice(0,4));
    }
    const region = pick([...new Set(leastUsed(anchors, this.regions, i => records[i].region).map(i => records[i].region))], this.rng);
    const regional = anchors.filter(i => records[i].region === region);
    const stratum = i => `${records[i].region}:${records[i].band}:${records[i].priceBand}`;
    const strata = leastUsed(regional, this.strata, stratum);
    const group = pick([...new Set(strata.map(stratum))], this.rng);
    const anchor = pick(strata.filter(i => stratum(i) === group), this.rng);
    const index = pick(byAnchor.get(anchor), this.rng);
    this.remaining.delete(index);
    const cards = pairs[index].map(i => records[i]);
    for (const r of cards) {
      const year = r.referenceDate?.slice(0,4);
      this.years.set(year, (this.years.get(year) || 0) + 1);
      const key = `${r.region}:${r.band}:${r.priceBand}`;
      this.regions.set(r.region, (this.regions.get(r.region) || 0) + 1);
      this.strata.set(key, (this.strata.get(key) || 0) + 1);
    }
    this.previous = new Set(cards.map(r => r.id));
    // Independent coin flip, never derived from price, pair index, grade or mode.
    return this.rng() < .5 ? cards : cards.reverse();
  }
}
export function initialState() {
  return {phase: 'mode-selection', mode: 'sale', score: 0, lives: 3, streak: 0,
    bestStreak: 0, mistakes: [], referenceDate: null, level: 1, roundLevel: 1, round: 0, cards: null, selected: null, correct: null, reason: null};
}
/** Pure transitions. Timers are effects owned by a single UI scheduler. */
export function transition(s, action) {
  switch (action.type) {
    case 'RESET': return {...initialState(), mode: s.mode};
    case 'MODE': return s.phase === 'mode-selection' && MODES[action.mode] ? {...s, mode: action.mode} : s;
    case 'START': return s.phase === 'mode-selection' || s.phase === 'game-over' || s.phase === 'error'
      ? {...initialState(), mode: s.mode, phase: 'loading'} : s;
    case 'READY': return s.phase === 'loading' && playable(action.cards, s.mode, 1, action.referenceDate)
      ? {...s, phase: 'playing', round: 1, cards: action.cards, referenceDate: action.referenceDate} : s;
    case 'SELECT': return s.phase === 'playing' && [0, 1].includes(action.index)
      ? {...s, phase: 'answer-selected', selected: action.index} : s;
    case 'REVEAL': return s.phase === 'answer-selected' ? {...s, phase: 'revealing'} : s;
    case 'SETTLE': {
      if (s.phase !== 'revealing') return s;
      const correct = s.cards[s.selected].price > s.cards[1 - s.selected].price;
      const lives = s.lives - (correct ? 0 : 1), streak = correct ? s.streak + 1 : 0;
      return {...s, phase: lives === 0 ? 'game-over' : 'round-result', correct, lives,
        score: s.score + (correct ? 1 : 0), level: levelForScore(s.score + (correct ? 1 : 0)), streak, bestStreak: Math.max(s.bestStreak, streak),
        mistakes: correct ? s.mistakes : [...s.mistakes, {round:s.round, level:s.roundLevel, selected:s.selected, cards:s.cards.map(r => ({...r}))}],
        reason: lives === 0 ? 'lives' : null};
    }
    case 'NEXT':
      if (s.phase !== 'round-result') return s;
      if (!action.cards) return {...s, phase: 'game-over', reason: 'exhausted'};
      return playable(action.cards, s.mode, s.level, s.referenceDate) ? {...s, phase: 'playing', cards: action.cards,
        round: s.round + 1, roundLevel: s.level, selected: null, correct: null} : s;
    case 'FAIL': return {...s, phase: 'error'};
    default: return s;
  }
}
