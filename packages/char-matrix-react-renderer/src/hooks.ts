import { createContext, useContext, useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { RenderLoopController } from "@adam26davidson/char-matrix";
import type { CMElementRef } from "./types";

// ---------------------------------------------------------------------------
// Render Loop Context
// ---------------------------------------------------------------------------

export const RenderLoopContext = createContext<RenderLoopController | null>(null);

/**
 * Access the RenderLoopController from a React component.
 * Returns null if no controller was provided.
 */
export function useRenderLoop(): RenderLoopController | null {
  return useContext(RenderLoopContext);
}

// ---------------------------------------------------------------------------
// useAnimation Hook
// ---------------------------------------------------------------------------

/**
 * Imperative animation controls for a char-matrix element ref.
 */
export function useAnimation(ref: RefObject<CMElementRef | null>) {
  return {
    triggerEntrance(onComplete?: () => void) {
      const el = ref.current;
      if (el && el.getStage() === "main") {
        el.startTransition("enter", onComplete);
      }
    },
    triggerExit(onComplete?: () => void) {
      const el = ref.current;
      if (el) {
        el.startTransition("exit", onComplete);
      }
    },
    isAnimating() {
      return ref.current?.getAnimationHandler()?.hasActiveAnimation() ?? false;
    },
  };
}

// ---------------------------------------------------------------------------
// usePolledData Hook
// ---------------------------------------------------------------------------

/**
 * Polls an async data source on an interval.
 * Calls onData with the result, onError on failure.
 * The first fetch happens immediately.
 */
export function usePolledData<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  onData: (data: T) => void,
  onError?: (error: unknown) => void
): void {
  // Stable refs for callbacks that may change between renders
  const onDataRef = useRef(onData);
  const onErrorRef = useRef(onError);
  onDataRef.current = onData;
  onErrorRef.current = onError;

  const stableFetcher = useCallback(fetcher, [fetcher]);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const data = await stableFetcher();
        if (active) onDataRef.current(data);
      } catch (err) {
        if (active) onErrorRef.current?.(err);
      }
    }

    poll(); // Immediate first fetch
    const id = setInterval(poll, intervalMs);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, [stableFetcher, intervalMs]);
}
