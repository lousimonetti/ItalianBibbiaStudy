import { createContext, useContext } from 'react';

import { storageKey } from '../utils/storageKey';

export const STORAGE_KEY = storageKey('immersion');

export const ImmersionContext = createContext({ immersive: false, toggle: () => {} });

export function useImmersion() {
  return useContext(ImmersionContext);
}
