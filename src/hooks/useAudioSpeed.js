import { useSyncExternalStore } from 'react';

import { subscribe, getSpeedId, setSpeedId, rateForId } from '../utils/audioSpeed';

// React glue over the pure audioSpeed store. Returns the current speed id, its
// utterance rate, and a setter. Provider-free (useSyncExternalStore), so it works
// in any component — and in tests — without an extra wrapper.
export function useAudioSpeed() {
  const speedId = useSyncExternalStore(subscribe, getSpeedId, getSpeedId);
  return { speedId, rate: rateForId(speedId), setSpeed: setSpeedId };
}
