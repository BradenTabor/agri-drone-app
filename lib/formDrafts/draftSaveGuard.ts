/**
 * Tracks debounced-save timers and save-generation tokens for form draft sync.
 * Used by useFormDraft.clearDraft() to cancel pending debounced saves and discard
 * in-flight upserts that resolve after submit/discard.
 */
export type DraftSaveGuard = {
  cancelPendingDebouncedSave: () => void;
  invalidateInFlightSaves: () => void;
  setDebouncedTimer: (timerId: number) => void;
  clearDebouncedTimerIfMatch: (timerId: number) => void;
  beginSave: () => number;
  isGenerationCurrent: (generation: number) => boolean;
};

export function createDraftSaveGuard(
  clearTimeoutFn: (timerId: number) => void = (timerId) => clearTimeout(timerId),
): DraftSaveGuard {
  let debounceTimerId: number | null = null;
  let generation = 0;

  return {
    cancelPendingDebouncedSave() {
      if (debounceTimerId !== null) {
        clearTimeoutFn(debounceTimerId);
        debounceTimerId = null;
      }
    },
    invalidateInFlightSaves() {
      if (debounceTimerId !== null) {
        clearTimeoutFn(debounceTimerId);
        debounceTimerId = null;
      }
      generation += 1;
    },
    setDebouncedTimer(timerId: number) {
      debounceTimerId = timerId;
    },
    clearDebouncedTimerIfMatch(timerId: number) {
      if (debounceTimerId === timerId) {
        debounceTimerId = null;
      }
    },
    beginSave() {
      return ++generation;
    },
    isGenerationCurrent(gen: number) {
      return gen === generation;
    },
  };
}
