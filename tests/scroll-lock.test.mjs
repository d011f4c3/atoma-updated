import assert from "node:assert/strict";
import test from "node:test";
import { observeScrollLock } from "../src/lib/scroll-lock.ts";

function harness(t, overflowY = "visible") {
  const observers = new Set();
  const element = { overflowY };
  const calls = [];

  class MockMutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.target = null;
      this.options = null;
      this.records = [];
      this.queued = false;
      observers.add(this);
    }

    observe(target, options) {
      this.target = target;
      this.options = options;
    }

    disconnect() {
      this.target = null;
      // Native disconnect also discards mutations awaiting delivery.
      this.records = [];
    }

    mutate(target, attributeName) {
      if (
        this.target !== target ||
        !this.options.attributes ||
        (this.options.attributeFilter &&
          !this.options.attributeFilter.includes(attributeName))
      ) {
        return;
      }
      this.records.push({ type: "attributes", target, attributeName });
      if (this.queued) return;
      this.queued = true;
      queueMicrotask(() => {
        this.queued = false;
        const records = this.records;
        this.records = [];
        if (records.length) this.callback(records, this);
      });
    }
  }

  for (const [name, value] of Object.entries({
    MutationObserver: MockMutationObserver,
    getComputedStyle: (target) => ({ overflowY: target.overflowY }),
  })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value,
    });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else delete globalThis[name];
    });
  }

  const disconnect = observeScrollLock(
    {
      stop: () => calls.push("stop"),
      start: () => calls.push("start"),
    },
    element,
  );
  t.after(disconnect);

  return {
    calls,
    disconnect,
    setOverflow(value, attribute = "style") {
      element.overflowY = value;
      for (const observer of observers) observer.mutate(element, attribute);
    },
    flush: () => Promise.resolve(),
  };
}

for (const overflow of ["hidden", "clip"]) {
  test(`an existing ${overflow} lock stops inertia immediately`, (t) => {
    const page = harness(t, overflow);
    assert.deepEqual(page.calls, ["stop"]);
  });
}

test("an unlocked page never starts the controller unnecessarily", async (t) => {
  const page = harness(t);
  assert.deepEqual(page.calls, []);
  page.setOverflow("auto");
  await page.flush();
  page.setOverflow("scroll", "class");
  await page.flush();
  assert.deepEqual(page.calls, []);
});

test("style and class changes only act when the lock state changes", async (t) => {
  const page = harness(t);
  page.setOverflow("hidden");
  await page.flush();
  assert.deepEqual(page.calls, ["stop"]);

  page.setOverflow("hidden", "class");
  await page.flush();
  page.setOverflow("clip");
  await page.flush();
  assert.deepEqual(page.calls, ["stop"]);

  page.setOverflow("auto", "class");
  await page.flush();
  page.setOverflow("visible");
  await page.flush();
  assert.deepEqual(page.calls, ["stop", "start"]);

  page.setOverflow("clip", "class");
  await page.flush();
  assert.deepEqual(page.calls, ["stop", "start", "stop"]);
});

test("cleanup discards queued mutations and never restarts a locked controller", async (t) => {
  const page = harness(t, "hidden");
  page.setOverflow("visible");
  page.disconnect();
  await page.flush();
  assert.deepEqual(page.calls, ["stop"]);

  page.setOverflow("hidden", "class");
  await page.flush();
  page.setOverflow("visible");
  await page.flush();
  assert.deepEqual(page.calls, ["stop"]);
});
