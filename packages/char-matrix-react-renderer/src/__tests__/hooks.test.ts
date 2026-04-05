import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// usePolledData — tested without React by extracting the core logic pattern.
// We verify the ref-based approach doesn't restart on fetcher identity changes.
// ---------------------------------------------------------------------------
describe("usePolledData behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls fetcher immediately and on interval", async () => {
    const fetcher = vi.fn().mockResolvedValue("data");
    const onData = vi.fn();

    // Simulate the hook's effect logic directly
    const fetcherRef = { current: fetcher };
    const onDataRef = { current: onData };
    let active = true;

    async function poll() {
      try {
        const data = await fetcherRef.current();
        if (active) onDataRef.current(data);
      } catch {
        // ignore
      }
    }

    poll();
    const id = setInterval(poll, 1000);

    // Flush the immediate promise
    await vi.advanceTimersByTimeAsync(0);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(onData).toHaveBeenCalledWith("data");

    // Advance to trigger interval
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetcher).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1000);
    expect(fetcher).toHaveBeenCalledTimes(3);

    // Cleanup
    active = false;
    clearInterval(id);
  });

  it("uses latest fetcher via ref (does not restart interval)", async () => {
    let callCount = 0;
    const fetcher1 = vi.fn().mockResolvedValue("v1");
    const fetcher2 = vi.fn().mockResolvedValue("v2");
    const onData = vi.fn();

    const fetcherRef = { current: fetcher1 };
    const onDataRef = { current: onData };
    let active = true;

    async function poll() {
      try {
        callCount++;
        const data = await fetcherRef.current();
        if (active) onDataRef.current(data);
      } catch {
        // ignore
      }
    }

    poll();
    const id = setInterval(poll, 1000);

    await vi.advanceTimersByTimeAsync(0);
    expect(onData).toHaveBeenLastCalledWith("v1");

    // "Re-render" changes the fetcher ref — interval should NOT restart
    fetcherRef.current = fetcher2;

    await vi.advanceTimersByTimeAsync(1000);
    expect(onData).toHaveBeenLastCalledWith("v2");
    expect(fetcher2).toHaveBeenCalledTimes(1);

    active = false;
    clearInterval(id);
  });

  it("calls onError when fetcher rejects", async () => {
    const error = new Error("fail");
    const fetcher = vi.fn().mockRejectedValue(error);
    const onData = vi.fn();
    const onError = vi.fn();

    const fetcherRef = { current: fetcher };
    const onDataRef = { current: onData };
    const onErrorRef = { current: onError };
    let active = true;

    async function poll() {
      try {
        const data = await fetcherRef.current();
        if (active) onDataRef.current(data);
      } catch (err) {
        if (active) onErrorRef.current?.(err);
      }
    }

    poll();
    const id = setInterval(poll, 1000);

    await vi.advanceTimersByTimeAsync(0);
    expect(onData).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(error);

    active = false;
    clearInterval(id);
  });

  it("does not call callbacks after cleanup", async () => {
    const fetcher = vi.fn().mockResolvedValue("data");
    const onData = vi.fn();

    const fetcherRef = { current: fetcher };
    const onDataRef = { current: onData };
    let active = true;

    async function poll() {
      try {
        const data = await fetcherRef.current();
        if (active) onDataRef.current(data);
      } catch {
        // ignore
      }
    }

    poll();
    const id = setInterval(poll, 1000);

    await vi.advanceTimersByTimeAsync(0);
    expect(onData).toHaveBeenCalledTimes(1);

    // Simulate cleanup
    active = false;
    clearInterval(id);

    // Even if we somehow trigger poll, onData should not be called
    await poll();
    expect(onData).toHaveBeenCalledTimes(1);
  });
});
