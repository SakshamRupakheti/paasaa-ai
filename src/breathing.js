// Pure timing model: every visual cue derives from the same elapsed time.
export const DEFAULT_PROTOCOL = Object.freeze({ inhale: 3, exhale: 6, cycles: 5 });

export function breathState(elapsed, config = DEFAULT_PROTOCOL) {
  const cycleMs = (config.inhale + config.exhale) * 1000;
  const totalMs = cycleMs * config.cycles;
  const time = Math.max(0, Math.min(elapsed, totalMs));
  const done = time >= totalMs;
  const cycleTime = done ? cycleMs : time % cycleMs;
  const inhaling = cycleTime < config.inhale * 1000;
  const phaseMs = (inhaling ? config.inhale : config.exhale) * 1000;
  const phaseTime = inhaling ? cycleTime : cycleTime - config.inhale * 1000;
  const fraction = Math.min(1, phaseTime / phaseMs);
  const expansion = done ? 0 : inhaling ? fraction : 1 - fraction;
  return {
    elapsed: time, done, inhaling,
    seconds: done ? 0 : Math.ceil((phaseMs - phaseTime) / 1000),
    expansion: (1 - Math.cos(expansion * Math.PI)) / 2,
    phaseProgress: fraction,
    cycleProgress: cycleTime / cycleMs,
    cycle: Math.min(config.cycles, Math.floor(time / cycleMs) + 1),
  };
}

export class BreathClock {
  constructor(now = () => performance.now()) {
    this.now = now;
    this.elapsed = 0;
    this.startedAt = 0;
    this.running = false;
  }
  read() { return this.elapsed + (this.running ? this.now() - this.startedAt : 0); }
  start() {
    if (this.running) return;
    this.startedAt = this.now();
    this.running = true;
  }
  pause() {
    this.elapsed = this.read();
    this.running = false;
  }
  reset() { this.elapsed = 0; this.running = false; }
}

