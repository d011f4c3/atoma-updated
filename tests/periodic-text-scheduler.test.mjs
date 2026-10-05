import assert from "node:assert/strict";
import test from "node:test";
import { createPeriodicTextScheduler } from "../src/lib/periodic-text-scheduler.ts";

function harness() {
  let now = 0;
  let sequence = 0;
  const timers = new Map();
  const scheduler = createPeriodicTextScheduler({
    now: () => now,
    random: () => 0,
    schedule(callback, delay) {
      const id = ++sequence;
      timers.set(id, { callback, at: now + delay });
      return id;
    },
    cancel: (id) => timers.delete(id),
  });
  function advance(duration) {
    const end = now + duration;
    while (timers.size) {
      const [id, next] = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (next.at > end) break;
      now = next.at;
      timers.delete(id);
      next.callback();
    }
    now = end;
  }
  return { scheduler, advance, timers, now: () => now };
}

test("one passage plays per pulse and all eligible passages get a turn", () => {
  const clock = harness();
  const played = [];
  for (const label of ["caption", "summary", "profile"]) {
    clock.scheduler.add({
      canPlay: () => true,
      play: () => played.push(label),
    });
  }
  assert.equal(clock.timers.size, 1);
  clock.advance(3000);
  assert.deepEqual(played, ["caption"]);
  clock.advance(6000);
  assert.deepEqual(played, ["caption", "summary", "profile"]);
  clock.advance(6000);
  assert.deepEqual(played, ["caption", "summary", "profile", "caption"]);
  assert.equal(clock.timers.size, 1);
});

test("a solitary passage stays settled for at least twelve seconds", () => {
  const clock = harness();
  const playedAt = [];
  clock.scheduler.add({
    canPlay: () => true,
    play: () => playedAt.push(clock.now()),
  });
  clock.advance(30000);
  assert.deepEqual(playedAt, [3000, 15000, 27000]);
});

test("hidden or busy passages are skipped without losing their next turn", () => {
  const clock = harness();
  let visible = false;
  const played = [];
  clock.scheduler.add({
    canPlay: () => visible,
    play: () => played.push("panel"),
  });
  clock.scheduler.add({
    canPlay: () => true,
    play: () => played.push("caption"),
  });
  clock.advance(6000);
  assert.deepEqual(played, ["caption"]);
  visible = true;
  clock.advance(3000);
  assert.deepEqual(played, ["caption", "panel"]);
});

test("pausing cancels the timer and resuming never creates a catch-up burst", () => {
  const clock = harness();
  let plays = 0;
  clock.scheduler.add({ canPlay: () => true, play: () => plays++ });
  clock.scheduler.setEnabled(false);
  assert.equal(clock.timers.size, 0);
  clock.advance(60000);
  assert.equal(plays, 0);
  clock.scheduler.setEnabled(true);
  clock.scheduler.setEnabled(true);
  assert.equal(clock.timers.size, 1);
  assert.equal(plays, 0);
  clock.advance(3000);
  assert.equal(plays, 1);
});

test("unregistering a passage prevents playback and the last removal stops timers", () => {
  const clock = harness();
  let plays = 0;
  const remove = clock.scheduler.add({
    canPlay: () => true,
    play: () => plays++,
  });
  remove();
  remove();
  assert.equal(clock.timers.size, 0);
  clock.advance(30000);
  assert.equal(plays, 0);
});
