type Passage = {
  canPlay: () => boolean;
  play: () => void;
};

type Clock = {
  now: () => number;
  random: () => number;
  schedule: (
    callback: () => void,
    delay: number,
  ) => ReturnType<typeof setTimeout>;
  cancel: (timer: ReturnType<typeof setTimeout>) => void;
};

const browserClock: Clock = {
  now: () => performance.now(),
  random: Math.random,
  schedule: (callback, delay) => setTimeout(callback, delay),
  cancel: (timer) => clearTimeout(timer),
};

/** One short pulse at a time, with the least recently played passage first. */
export function createPeriodicTextScheduler(clock: Clock = browserClock) {
  const passages = new Map<Passage, number>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let enabled = true;

  function schedule() {
    if (!enabled || timer !== undefined || passages.size === 0) return;
    timer = clock.schedule(pulse, 3000 + clock.random() * 1000);
  }

  function pulse() {
    timer = undefined;
    const now = clock.now();
    const eligible = [...passages].filter(
      ([passage, lastPlayed]) => now - lastPlayed >= 12000 && passage.canPlay(),
    );
    const oldest = Math.min(...eligible.map(([, played]) => played));
    const candidates = eligible.filter(([, played]) => played === oldest);
    const next = candidates[Math.floor(clock.random() * candidates.length)];
    if (next) {
      passages.set(next[0], now);
      next[0].play();
    }
    schedule();
  }

  function cancel() {
    if (timer !== undefined) clock.cancel(timer);
    timer = undefined;
  }

  return {
    add(passage: Passage) {
      passages.set(passage, -Infinity);
      schedule();
      return () => {
        passages.delete(passage);
        if (passages.size === 0) cancel();
      };
    },
    setEnabled(value: boolean) {
      enabled = value;
      if (enabled) schedule();
      else cancel();
    },
  };
}
