import { screenForHash, hashForScreen } from './navigation.js';
import { createCheckIn } from './checkin.js';
import { BreathClock, breathState, DEFAULT_PROTOCOL } from './breathing.js';
const $ = id => document.getElementById(id);
const clock = new BreathClock();
let config = { ...DEFAULT_PROTOCOL };
let frame = null;
let mode = 'ready';
let currentScreen = 'breathing-screen';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
$('pa-motion').checked = reduced.matches;

const airPaths = ['flow-left','flow-right'].map(id => $(id));
const wavelets = airPaths.flatMap((path, side) => Array.from({length:6}, (_, index) => {
  const wave = document.createElementNS('http://www.w3.org/2000/svg','path');
  wave.setAttribute('d','M-5 -3 Q0 -7 5 -3 M-4 2 Q0 -1 4 2');
  $('airflow').append(wave);
  return {wave,path,index,side,length:path.getTotalLength()};
}));

function updateClock() {
  const now = new Date();
  const hour = now.getHours();
  $('pa-greeting').textContent = `${hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'}, there.`;
  $('pa-time').textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  $('pa-time').dateTime = now.toISOString();
}
updateClock();
setInterval(updateClock, 30000); // Wall clock only; never drives breathing.

function renderBreathing() {
  const state = breathState(clock.read(), config);
  const moving = !$('pa-motion').checked && mode !== 'own';
  const expansion = moving ? state.expansion : 0;
  $('airflow').style.visibility = moving && mode !== 'ready' ? 'visible' : 'hidden';
  for (const {wave,path,index,length} of wavelets) {
    const position = (expansion * .82 + index / 6) % 1;
    const point = path.getPointAtLength(length * position);
    const next = path.getPointAtLength(Math.min(length, length * position + 1));
    const angle = Math.atan2(next.y - point.y,next.x - point.x) * 180 / Math.PI - 90;
    wave.setAttribute('transform',`translate(${point.x} ${point.y}) rotate(${angle})`);
    wave.style.opacity = String(Math.sin(position * Math.PI) * .65);
  }
  $('chest-glow').setAttribute('opacity',.12 + expansion * .16);
  $('lungs').setAttribute('transform', `translate(210 250) scale(${1 + expansion * .045} ${1 + expansion * .055}) translate(-210 -250)`);
  const meter = $('cycle-progress');
  // Fill on inhale and release on exhale; text and color both identify phase.
  const active = mode === 'running' || mode === 'paused';
  const level = active ? (state.inhaling ? state.phaseProgress : 1 - state.phaseProgress) : 0;
  // Explicit fill avoids browser-dependent native progress rendering.
  const shownLevel = $('pa-motion').checked ? Math.round(level * 10) / 10 : level;
  $('breath-fill').style.transform = `scaleX(${shownLevel})`;
  meter.setAttribute('aria-valuenow', String(Math.round(level * 100)));
  $('motion-note').hidden = !$('pa-motion').checked;
  $('torso').setAttribute('transform', `translate(210 174) scale(${1 + expansion * .035} ${1 + expansion * .014}) translate(-210 -174)`);
  $('belly-line').setAttribute('d', `M168 313 Q210 ${326 + expansion * 6} 252 313`);
  $('diaphragm').setAttribute('d', `M162 303 Q210 ${274 + expansion * 23} 258 303`);
  meter.dataset.phase = state.inhaling ? 'inhale' : 'exhale';
  meter.setAttribute('aria-label', active ? `${state.inhaling ? 'Inhale' : 'Exhale'}${mode === 'paused' ? ', paused' : ''}` : 'Breathing pace');
  $('count-number').hidden = mode === 'own';
  $('count-number').textContent = mode === 'own' ? '—' : state.seconds;
  $('cycle-label').textContent = mode === 'ready'
    ? `${config.cycles} cycles · ${(config.inhale + config.exhale) * config.cycles} seconds · optional`
    : `Cycle ${state.cycle} of ${config.cycles}`;
  const phase = state.inhaling ? 'Breathe in' : 'Breathe out';
  if (mode === 'running' || mode === 'paused') {
    const label = mode === 'paused' ? `${phase} · paused` : phase;
    if ($('pa-phase').textContent !== label) $('pa-phase').textContent = label;
    $('pa-count').textContent = `${state.seconds} ${state.seconds === 1 ? 'second' : 'seconds'}${mode === 'paused' ? ' remaining · breathe normally while paused' : ' · gently'}`;
    $('companion-message').textContent = mode === 'paused' ? 'Easy does it.' : state.inhaling ? 'No need to match the count perfectly.' : 'Let it out gently.';
  }
  return state;
}
function loop() {
  const state = renderBreathing();
  if (state.done) {
    clock.pause(); mode = 'complete';
    showScreen('transition-screen');
    return;
  }
  if (clock.running) frame = requestAnimationFrame(loop);
}
function pauseBreathing() {
  if (!clock.running) return;
  clock.pause(); cancelAnimationFrame(frame);
  mode = 'paused'; $('pa-start').textContent = 'Resume';
  renderBreathing();
}
function resetBreathing() {
  clock.reset(); cancelAnimationFrame(frame); mode = 'ready';
  $('pa-start').textContent = 'Start breathing';
  $('pa-phase').textContent = 'Take a moment for yourself.';
  $('pa-count').textContent = `${config.inhale} seconds in · ${config.exhale} seconds out`;
  $('companion-message').textContent = 'Breathe with me.';
  renderBreathing();
}
function showScreen(id, fromHistory = false) {
  if (currentScreen === 'reflection-screen' && id !== currentScreen) checkin.leave();
  if (id === 'transition-screen' && currentScreen === 'breathing-screen') checkin.home();
  if (id !== 'breathing-screen') pauseBreathing();
  for (const screen of ['breathing-screen', 'transition-screen', 'reflection-screen', 'finish-screen']) $(screen).hidden = screen !== id;
  currentScreen = id;
  const hash = hashForScreen(id);
  if (!fromHistory && location.hash !== hash) history.pushState(null, '', hash);
  for (const link of document.querySelectorAll('.main-nav a')) {
    if (link.hash === hash) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
  }
  $('open-checkin').textContent = checkin.hasDraft() ? 'Resume daily check-in' : 'Start daily check-in';
  $(id).querySelector('h1')?.focus();
  window.scrollTo({ top: 0, behavior: 'instant' });
}
$('pa-start').addEventListener('click', () => {
  if (clock.running) { pauseBreathing(); return; }
  if (mode === 'own' || mode === 'complete') resetBreathing();
  clock.start(); mode = 'running'; $('pa-start').textContent = 'Pause'; loop();
});
$('pa-restart').addEventListener('click', resetBreathing);
$('pa-own').addEventListener('click', () => {
  resetBreathing(); mode = 'own'; renderBreathing();
  $('pa-phase').textContent = 'Breathe at your own pace.';
  $('pa-count').textContent = 'No timer. No need to change your breath.';
  $('cycle-label').textContent = 'Continue whenever you’re ready.';
  $('pa-start').textContent = 'Try guided breathing';
});
$('pa-skip').addEventListener('click', () => showScreen('transition-screen'));
$('return-breathing').addEventListener('click', () => { if (mode === 'complete') resetBreathing(); showScreen('breathing-screen'); });
$('finish-breathe').addEventListener('click', () => { resetBreathing(); showScreen('breathing-screen'); });
$('finish-transition').addEventListener('click', () => showScreen('finish-screen'));
for (const name of ['inhale', 'exhale']) $(name).addEventListener('change', () => {
  config[name] = Number($(name).value); resetBreathing();
});
$('pa-motion').addEventListener('change', renderBreathing);
reduced.addEventListener('change', event => { $('pa-motion').checked = event.matches; renderBreathing(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseBreathing(); else updateClock();
});
$('help-open').addEventListener('click', () => { pauseBreathing(); $('help-dialog').showModal(); });
$('clear-session').addEventListener('click', () => { pauseBreathing(); $('clear-dialog').showModal(); });
$('cancel-clear').addEventListener('click', () => $('clear-dialog').close());
resetBreathing();

const checkin = createCheckIn(showScreen);
checkin.home();
document.getElementById('review-again').addEventListener('click', () => { checkin.home(); showScreen('transition-screen'); });

document.getElementById('confirm-clear').addEventListener('click', () => {
  checkin.clear(); document.getElementById('clear-dialog').close(); showScreen('transition-screen');
});

function openCheckIn() { checkin.home(); showScreen('transition-screen'); }
$('open-checkin').addEventListener('click', openCheckIn);
for (const link of document.querySelectorAll('.main-nav a')) link.addEventListener('click', event => {
  event.preventDefault();
  if (link.hash === '#check-in') openCheckIn(); else showScreen('breathing-screen');
});
function followLocation() {
  if (location.hash === '#main') return;
  const screen = screenForHash(location.hash);
  if (screen === 'transition-screen') checkin.home();
  showScreen(screen, true);
}
window.addEventListener('popstate', followLocation);
window.addEventListener('hashchange', followLocation);
followLocation();






