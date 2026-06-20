import { createContext, useContext } from 'react';

export const STORAGE_KEY = 'italian-bible-immersion';

export const ImmersionContext = createContext({ immersive: false, toggle: () => {} });

export function useImmersion() {
  return useContext(ImmersionContext);
}
