import { useState, useCallback, useEffect } from 'react';
import { ImmersionContext, STORAGE_KEY } from './ImmersionContext';

function load() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function ImmersionProvider({ children }) {
  const [immersive, setImmersive] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, immersive ? '1' : '0');
    } catch {
      // storage unavailable — degrade silently
    }
  }, [immersive]);

  const toggle = useCallback(() => setImmersive((v) => !v), []);

  return (
    <ImmersionContext.Provider value={{ immersive, toggle }}>
      {children}
    </ImmersionContext.Provider>
  );
}
