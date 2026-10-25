import { test } from 'node:test';
import assert from 'node:assert/strict';
import { breathState, BreathClock } from '../src/breathing.js';

test('phase, countdown, motion, and progress share exact boundaries across cycles', () => {
  for (let cycle = 0; cycle < 5; cycle++) {
    const base = cycle * 9000;
    assert.equal(breathState(base).inhaling, true);
    assert.equal(breathState(base).seconds, 3);
    assert.equal(breathState(base + 2999).seconds, 1);
    assert.equal(breathState(base + 3000).inhaling, false);
    assert.equal(breathState(base + 3000).seconds, 6);
    assert.equal(breathState(base + 3000).expansion, 1);
    assert.equal(breathState(base + 3000).cycleProgress, 1 / 3);
    assert.equal(breathState(base + 8999).seconds, 1);
  }
  assert.equal(breathState(45000).done, true);
  assert.equal(breathState(50000).expansion, 0);
});
test('pause freezes elapsed time; resume continues; restart resets', () => {
  let now = 0;
  const clock = new BreathClock(() => now);
  clock.start(); now = 2500; clock.pause();
  const frozen = breathState(clock.read());
  now = 100000;
  assert.deepEqual(breathState(clock.read()), frozen);
  clock.start(); now += 500;
  assert.equal(breathState(clock.read()).inhaling, false);
  clock.reset(); assert.equal(clock.read(), 0); assert.equal(clock.running, false);
});
test('configurable durations use the same clock and session end', () => {
  const config = { inhale: 4, exhale: 4, cycles: 2 };
  assert.equal(breathState(3999, config).inhaling, true);
  assert.equal(breathState(4000, config).seconds, 4);
  assert.equal(breathState(16000, config).done, true);
});

test('phase progress fills inhale and releases exhale at exact boundaries',()=>{
 assert.equal(breathState(1500).phaseProgress,.5);
 assert.equal(breathState(3000).phaseProgress,0);
 assert.equal(breathState(6000).phaseProgress,.5);
 assert.equal(breathState(9000).phaseProgress,0);
});
