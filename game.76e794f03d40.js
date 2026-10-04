// Old shared links remain usable without a visible version parameter.
const cleanURL = new URL(location.href);
if (cleanURL.searchParams.has('v')) {
  cleanURL.searchParams.delete('v');
  history.replaceState(null, '', cleanURL.pathname + cleanURL.search + cleanURL.hash);
}
import {Deck, VERSION, levelRule, gapText, initialState, transition, validateSnapshot} from './engine.76e794f03d40.mjs';
import {MODES, areaText, priceText, grade, provinceText, buildingText, householdText} from './format.76e794f03d40.mjs';

const main = document.querySelector('#main');
const announcer = document.querySelector('#announcer');
let state = initialState(), snapshot, deck, timer, request, generation = 0;
let autoAdvance = true, errorMessage = '', lastPhase;
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const crown = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="m8 14 10 9 6-14 6 14 10-9-5 23H13L8 14Zm5 29h22"/></svg>';
const buildings = '<svg class="buildings" viewBox="0 0 300 130" aria-hidden="true"><path d="M0 120h300M34 120V44h63v76M44 44V30h43v14M119 120V16h73v104M130 16V7h51v9M215 120V57h54v63M225 57V44h34v13"/><path class="windows" d="M49 59h10m12 0h10M49 78h10m12 0h10M49 97h10m12 0h10M135 37h10m20 0h10M135 57h10m20 0h10M135 77h10m20 0h10M135 97h10m20 0h10M229 74h9m12 0h9M229 95h9m12 0h9"/></svg>';
const number = n => n.toLocaleString('ko-KR');
const dateText = (value = snapshot.referenceDate) => value.replaceAll('-', '.');
const periodText = r => `${r.referenceDate.slice(0,4)}년 ${Number(r.referenceDate.slice(5,7))}월`;
const ruleText = level => levelRule(level, snapshot.referenceDate);
const bestKey = mode => `${VERSION}:best:${mode}`;
function best(mode) {
  try { const n = Number(localStorage.getItem(bestKey(mode))); return Number.isSafeInteger(n) && n >= 0 ? n : 0; }
  catch { return 0; }
}
function saveBest() {
  try { localStorage.setItem(bestKey(state.mode), String(Math.max(best(state.mode), state.score))); } catch { /* Optional storage. */ }
}
function announce(message) { announcer.textContent = message; }
function focusHeading() { main.querySelector('h1')?.focus({preventScroll: true}); }
function dispatch(action) {
  const next = transition(state, action);
  if (next === state) return;
  clearTimeout(timer);
  state = next;
  if (state.phase === 'game-over') saveBest();
  render();
  schedule();
}
function schedule() {
  clearTimeout(timer);
  if (document.hidden) return;
  if (state.phase === 'answer-selected') timer = setTimeout(() => safe(() => dispatch({type:'REVEAL'})), 180);
  if (state.phase === 'revealing') timer = setTimeout(() => safe(() => dispatch({type:'SETTLE'})), 820);
  if (state.phase === 'round-result' && autoAdvance) timer = setTimeout(() => safe(nextRound), 2200);
}
function safe(fn) {
  try { fn(); } catch { fail('게임을 이어가지 못했어요. 다시 시작해 주세요.'); }
}
function fail(message) {
  clearTimeout(timer);
  errorMessage = message;
  dispatch({type:'FAIL'});
}
async function start() {
  if (!['mode-selection', 'game-over', 'error'].includes(state.phase)) return;
  request?.abort();
  request = new AbortController();
  const ownRequest = request, id = ++generation;
  dispatch({type:'START'});
  const timeout = setTimeout(() => ownRequest.abort(), 15000);
  try {
    if (!snapshot) {
      const response = await fetch('./data/snapshot.76e794f03d40.json', {signal: ownRequest.signal, cache: 'no-cache'});
      if (!response.ok) throw new Error('fetch_failed');
      const raw = await response.text();
      if (raw.length > 3 * 1024 * 1024) throw new Error('oversized');
      const loaded = validateSnapshot(JSON.parse(raw));
      if (id !== generation) return;
      snapshot = loaded;
    }
    if (id !== generation || state.phase !== 'loading') return;
    const pool = snapshot.modes[state.mode];
    if (pool.levelPairs[1].length < 8) {
      fail('이 모드에서 게임에 사용할 수 있는 시세 데이터가 충분하지 않습니다. 다른 모드를 골라 주세요.');
      return;
    }
    deck = new Deck(pool, Math.random, state.mode === 'sale');
    dispatch({type:'READY', cards: deck.next(state.level), referenceDate: snapshot.referenceDate});
  } catch {
    if (id === generation) fail('시세 데이터를 불러오지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.');
  } finally { clearTimeout(timeout); }
}
function reset() {
  generation++;
  request?.abort();
  dispatch({type:'RESET'});
}
function nextRound() {
  if (state.phase !== 'round-result') return;
  dispatch({type:'NEXT', cards: deck.next(state.level)});
}
function modeSelection() {
  return `<section class="lobby" aria-labelledby="game-title">
    <div class="intro"><p class="eyebrow"><span class="tiny-line"></span>두 아파트, 하나의 선택</p>
      <h1 id="game-title" tabindex="-1">당신의<br>부동산 감각은<span class="accent">?</span></h1>
      <p class="lead">큰 가격 차이부터, 시간을 넘는 비교까지.<br><strong>3점마다 높아지는 난이도</strong>에 도전하세요.</p>
      <div class="rule-pills"><span>2026년 6월 기준</span><span>최대 레벨 20</span><span>기회는 딱 3번</span><span>3점마다 레벨 업</span></div>
      <div class="intro-art" aria-hidden="true">${buildings}<span class="art-caption">어느 쪽이 더 비쌀까?</span><span class="art-orbit"></span></div>
    </div>
    <div class="start-panel"><div class="panel-top"><span class="eyebrow">오늘의 감각을 시험할 시간</span>${crown}</div>
      <h2>어떤 시세로 겨뤄볼까요?</h2><p class="muted">한 판 동안 같은 기준으로 비교해요.</p>
      <fieldset class="mode-picker"><legend class="sr-only">시세 종류 선택</legend>
      ${Object.entries(MODES).map(([mode, label], i) => `<label class="mode-option"><input type="radio" name="mode" value="${mode}" ${state.mode === mode ? 'checked' : ''}><span class="mode-body" data-mode="${mode}"><span class="mode-number">0${i+1}</span><strong>${label}</strong><span class="mode-mark" aria-hidden="true">↗</span></span></label>`).join('')}</fieldset>
      <p class="mode-note">${state.mode === 'monthly' ? '보증금 1,000만원 기준으로 환산한 월세예요.' : state.mode === 'jeonse' ? '두 아파트의 추정 전세보증금을 비교해요.' : '두 아파트의 추정 매매가격을 비교해요.'}</p>
      <button class="primary" data-action="start">게임 시작 <span aria-hidden="true">↗</span></button>
      <div class="personal-best"><span>나의 ${MODES[state.mode]} 최고 기록</span><strong>${number(best(state.mode))}<small>점</small></strong></div>
      <div class="mini-guide"><span><b>01</b> 비싼 쪽 선택</span><span><b>02</b> 시세 공개</span><span><b>03</b> 기록 도전</span></div>
    </div>
  </section>`;
}
function card(r, index) {
  const revealed = ['revealing', 'round-result'].includes(state.phase);
  const winner = revealed && r.price > state.cards[1-index].price;
  const selected = state.selected === index;
  const settled = state.phase === 'round-result';
  return `<button class="apartment-card ${selected ? 'selected' : ''} ${revealed ? 'revealed' : ''} ${winner ? 'winner' : ''} ${settled && selected && !winner ? 'miss' : ''}" data-card="${index}" data-reference-date="${r.referenceDate}" ${state.phase !== 'playing' ? 'disabled' : ''}>
    <span class="card-top"><span class="region">${provinceText(r.province)} ${esc(snapshot.regions[r.region])}<span class="card-market">${MODES[state.mode]}</span></span><span class="keycap" aria-hidden="true">${index+1}</span></span>
    ${state.roundLevel >= 10 ? `<span class="period-badge"><span>${state.roundLevel === 20 ? '최고 난도' : '고난도'}</span><time datetime="${r.referenceDate}" title="${dateText(r.referenceDate)} 기준">${periodText(r)} 시세</time></span>` : ''}
    <span class="dong">${esc(r.dong)}</span><span class="apartment-name">${esc(r.name)}</span>
    <span class="area">${esc(areaText(r.area, snapshot.pyeongM2, r.unitType))}</span>
    <span class="building-age">${buildingText(r.buildYear, snapshot.ageReferenceDate)}<small>2026.06 기준</small></span>
    <span class="households">${householdText(r.households)}</span>
    ${buildings}
    <span class="price-zone">${revealed ? `<span class="price-label">${winner ? '✓ 더 높은 시세' : '더 낮은 시세'}${selected ? ' · 내 선택' : ''}</span><strong class="price">${priceText(r.price, state.mode)}</strong>` : `<span class="hidden-price" aria-hidden="true">? <small>만원</small></span><span class="choose-label">${selected ? '선택 완료' : '이 아파트가 더 비싸요'}<span aria-hidden="true">↗</span></span>`}</span>
  </button>`;
}
function play() {
  const settled = state.phase === 'round-result';
  const feedback = settled ? state.correct ? '정답! +1' : '오답 · 기회 −1' : state.phase === 'playing' ? '더 높은 시세의 아파트를 선택하세요' : '두 아파트의 시세를 공개합니다';
  return `<section class="arena ${state.roundLevel === 20 ? 'expert-arena' : state.roundLevel >= 10 ? 'challenge-arena' : ''}" aria-labelledby="round-title"><div class="arena-toolbar"><button class="text-button" data-action="reset">← 모드 선택</button><span class="snapshot-date">${state.roundLevel >= 11 ? `비교 시기 · 각 카드에 표시` : `${dateText()} 기준`}</span></div>
    <div class="hud"><span class="mode-badge">${MODES[state.mode]} APT VS</span><div class="score"><span>점수</span><strong>${state.score}</strong></div><div class="lives" aria-label="남은 기회 ${state.lives}개, 총 3개"><span>남은 기회</span><span aria-hidden="true">${[0,1,2].map(i => `<span class="heart ${i < state.lives ? '' : 'spent'}">♥</span>`).join('')}</span></div></div>
    <div class="level-panel" data-level="${state.level}"><div class="level-heading"><strong>레벨 ${state.level}</strong><span>${state.level < 20 ? `다음 레벨까지 ${3-state.score%3}점` : '최고 레벨 도달'}</span></div><p>${state.level !== state.roundLevel ? '다음 대결부터 · ' : ''}${ruleText(state.level)}</p><progress max="3" value="${state.level === 20 ? 3 : state.score%3}" aria-label="${state.level === 20 ? '최고 레벨 도달' : `레벨 ${state.level+1}까지 ${3-state.score%3}점 필요`}"></progress></div>
    <div class="round-heading"><p class="eyebrow">${String(state.round).padStart(2,'0')}번째 대결</p><h1 id="round-title" tabindex="-1">어느 아파트가 더 비쌀까요?</h1><p>${state.mode === 'monthly' ? '보증금 1,000만원 기준' : '전용면적에 맞춘 모형 추정 시세'}<span class="divider">·</span>${gapText(state.roundLevel)}</p></div>
    <div class="card-grid">${card(state.cards[0],0)}<span class="versus" aria-hidden="true">대</span>${card(state.cards[1],1)}</div>
    <div class="round-feedback ${settled ? state.correct ? 'correct-feedback' : 'wrong-feedback' : ''}"><strong>${feedback}</strong>${settled ? `<span>시세 차이 ${(Math.abs(state.cards[0].price-state.cards[1].price)/Math.max(...state.cards.map(r=>r.price))*100).toFixed(1)}%${state.streak > 1 ? ` · ${state.streak}연속 정답` : ''}</span>` : '<span class="keyboard-hint">카드를 누르거나 숫자 1 · 2 키로 선택</span>'}</div>
    <div class="round-controls"><label class="auto-control"><input id="auto" type="checkbox" ${autoAdvance ? 'checked' : ''}>자동으로 다음 문제</label><button class="secondary next" data-action="next" ${settled ? '' : 'disabled'}>다음 문제 <span aria-hidden="true">→</span></button></div>
  </section>`;
}
function result() {
  const rank = grade(state.score);
  return `<section class="result ${state.score >= 6 ? 'celebrate' : ''} ${state.score >= 15 ? 'master' : ''}" aria-labelledby="result-title">
    <div class="result-halo" aria-hidden="true"></div><div class="rank-icon">${crown}</div>
    <p class="eyebrow">${MODES[state.mode]} APT VS · ${state.reason === 'exhausted' ? `레벨 ${state.level} 문제 소진` : '도전 완료'}</p>
    <h1 id="result-title" tabindex="-1">${rank.title}</h1><div class="final-score" aria-label="최종 점수 ${state.score}점">${state.score}<span>점</span></div>
    <p class="result-copy">${state.reason === 'exhausted' ? '이 레벨의 조건에 맞는 새 문제가 더 없어요. 기록을 남기고 다시 도전해 보세요.' : rank.copy}</p><p class="result-level">도달 레벨 ${state.level}</p>
    <div class="result-stats"><div><span>최고 기록</span><strong>${Math.max(best(state.mode), state.score)}<small>점</small></strong></div><div><span>최고 연속 정답</span><strong>${state.bestStreak}<small>회</small></strong></div><div><span>플레이한 문제</span><strong>${state.round}<small>개</small></strong></div></div>
    <div class="result-actions"><button class="primary" data-action="start">한 번 더 도전 <span aria-hidden="true">↗</span></button><button class="secondary" data-action="reset">다른 모드 선택</button></div>
    <section class="mistake-review" aria-labelledby="mistake-title"><h2 id="mistake-title">이번 게임 오답 <span>${state.mistakes.length}개</span></h2>
      ${state.mistakes.length ? `<p class="review-note">내 선택과 정답의 시세를 다시 비교해 보세요.${state.mode==='monthly' ? ' 보증금 1,000만원 기준입니다.' : ''}</p>
      <ol class="mistake-list">${state.mistakes.map(m => `<li class="mistake-item"><h3>${m.round}번째 대결 <span>레벨 ${m.level}</span></h3><div class="review-pair">${m.cards.map((r,i) => `<div class="review-card ${i===m.selected ? 'review-choice' : 'review-answer'}"><span class="review-label">${i===m.selected ? '내 선택 · 더 낮은 시세' : '✓ 정답 · 더 높은 시세'}</span><span class="review-location">${provinceText(r.province)} ${esc(snapshot.regions[r.region])} · ${esc(r.dong)}</span><strong class="review-name">${esc(r.name)}</strong><span class="review-area">${esc(areaText(r.area,snapshot.pyeongM2,r.unitType))}</span><time datetime="${r.referenceDate}">${periodText(r)} 시세</time><strong class="review-price">${priceText(r.price,state.mode)}</strong></div>`).join('')}</div></li>`).join('')}</ol>` : '<p class="review-empty">이번 게임에는 오답이 없어요.</p>'}
    </section>
  </section>`;
}
function render() {
  const phaseChanged = state.phase !== lastPhase;
  main.dataset.phase = state.phase;
  main.dataset.level = state.level;
  main.dataset.mode = state.mode;
  if (state.phase === 'mode-selection') main.innerHTML = modeSelection();
  else if (state.phase === 'loading') main.innerHTML = '<section class="notice"><span class="loader" aria-hidden="true"></span><h1 tabindex="-1">대결을 준비하고 있어요</h1><p>이번 레벨에 맞는 두 아파트를 찾는 중이에요.</p><button class="secondary" data-action="reset">모드 선택으로</button></section>';
  else if (state.phase === 'error') main.innerHTML = `<section class="notice"><p class="eyebrow">잠시 쉬어갈까요?</p><h1 tabindex="-1">게임을 준비하지 못했어요</h1><p>${esc(errorMessage)}</p><div class="result-actions"><button class="primary" data-action="start">다시 시도</button><button class="secondary" data-action="reset">모드 선택으로</button></div></section>`;
  else if (state.phase === 'game-over') main.innerHTML = result();
  else main.innerHTML = play();
  if (phaseChanged && ['playing', 'game-over', 'error', 'loading', 'mode-selection'].includes(state.phase)) focusHeading();
  if (state.phase === 'round-result') {
    main.querySelector('[data-action="next"]')?.focus({preventScroll:true});
    announce(`${state.correct ? '정답입니다' : '오답입니다'}. ${state.cards.map(r => `${r.name}${state.roundLevel >= 10 ? `, ${periodText(r)}` : ''}, ${priceText(r.price,state.mode)}`).join('. ')}. 점수 ${state.score}점, 남은 기회 ${state.lives}개.${state.level !== state.roundLevel ? ` 레벨 ${state.level} 달성. 다음 대결은 ${ruleText(state.level)}.` : ''}`);
  } else if (state.phase === 'playing') announce(`레벨 ${state.level}. ${ruleText(state.level)}. ${state.round}번째 대결. 점수 ${state.score}점, 남은 기회 ${state.lives}개.`);
  else if (state.phase === 'game-over') announce(`게임 종료. ${grade(state.score).title}, 최종 ${state.score}점, 도달 레벨 ${state.level}.`);
  lastPhase = state.phase;
}
main.addEventListener('click', event => safe(() => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.card !== undefined) dispatch({type:'SELECT', index:Number(button.dataset.card)});
  else if (button.dataset.action === 'start') void start();
  else if (button.dataset.action === 'reset') reset();
  else if (button.dataset.action === 'next') nextRound();
}));
main.addEventListener('change', event => safe(() => {
  if (event.target.name === 'mode') {
    dispatch({type:'MODE', mode:event.target.value});
    main.querySelector(`input[value="${state.mode}"]`)?.focus();
  }
  if (event.target.id === 'auto') { autoAdvance = event.target.checked; schedule(); }
}));
document.addEventListener('keydown', event => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input:not([type="checkbox"]), select, textarea, summary')) return;
  safe(() => {
    if (state.phase === 'playing' && ['1','2'].includes(event.key)) {
      event.preventDefault(); dispatch({type:'SELECT', index:Number(event.key)-1});
    } else if (event.key === 'Enter' && state.phase === 'round-result' && event.target === main.querySelector('h1')) {
      event.preventDefault(); nextRound();
    }
  });
});
document.addEventListener('visibilitychange', () => safe(schedule));
window.addEventListener('pagehide', () => { clearTimeout(timer); request?.abort(); });
window.addEventListener('pageshow', () => safe(schedule));
safe(render);
