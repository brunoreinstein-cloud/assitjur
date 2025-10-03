/**
 * @vitest-environment jsdom
 */

import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LoadingHints } from "@/features/testemunhas/LoadingHints";
import { useMapaTestemunhasStore } from "@/lib/store/mapa-testemunhas";

// Utility to set default store state for tests
const setupStore = (nextHint: () => void) => {
  useMapaTestemunhasStore.setState({
    loadingHints: ["hint1", "hint2"],
    currentHintIndex: 0,
    nextHint,
  });
};

describe("LoadingHints interval behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("clears existing intervals before creating new ones and on unmount", () => {
    const firstNextHint = vi.fn();
    setupStore(firstNextHint);

    const { rerender, unmount } = render(<LoadingHints />);

    // First interval triggers
    vi.advanceTimersByTime(800);
    expect(firstNextHint).toHaveBeenCalledTimes(1);

    // Change nextHint to simulate effect re-run
    const secondNextHint = vi.fn();
    setupStore(secondNextHint);
    rerender(<LoadingHints />);

    // Ensure old interval was cleared and new one runs
    vi.advanceTimersByTime(800);
    expect(firstNextHint).toHaveBeenCalledTimes(1);
    expect(secondNextHint).toHaveBeenCalledTimes(1);

    // Unmount and verify no further calls occur
    unmount();
    vi.advanceTimersByTime(800);
    expect(secondNextHint).toHaveBeenCalledTimes(1);
  });
});
