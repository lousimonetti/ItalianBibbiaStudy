// Node 26 defines its own `localStorage`/`sessionStorage` globals that stay
// undefined unless the process is started with --localstorage-file. Those
// getters already exist on globalThis when Vitest's jsdom environment copies
// the jsdom window over, so jsdom's working Storage never lands and every
// `localStorage.getItem(...)` in the app blows up under test.
//
// Fix: take a real jsdom Storage and install it over Node's inert getter. A
// fresh JSDOM per setup run means one isolated store per test file.
import { JSDOM } from 'jsdom';

const { window: storageWindow } = new JSDOM('', { url: 'http://localhost:3000/' });

for (const name of ['localStorage', 'sessionStorage']) {
  Object.defineProperty(globalThis, name, {
    value: storageWindow[name],
    configurable: true,
    writable: true,
    enumerable: true,
  });
}
