// The learner's local-AI setting: whether Conversa is on, and with which model. Stored
// under its own key, deliberately outside STORAGE_PREFIX-*, so it stays out of sync
// backups: it describes this computer, and a phone restoring it would have no such model.
//
// Until someone opts in, the app never contacts localhost. A browser may ask permission
// for a site to reach local addresses, and nobody should see that prompt unprompted.

const KEY = 'coursekit-tutor-ai';

export function loadTutorAI() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    if (stored && typeof stored === 'object') {
      return { enabled: stored.enabled === true, model: typeof stored.model === 'string' ? stored.model : '' };
    }
  } catch { /* unreadable, so fall through to the default */ }
  return { enabled: false, model: '' };
}

export function saveTutorAI(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ enabled: !!settings.enabled, model: settings.model ?? '' }));
  } catch { /* storage full or blocked; the setting just won't persist */ }
}

export function forgetTutorAI() {
  try { localStorage.removeItem(KEY); } catch { /* blocked, so nothing to forget */ }
}

// The command that lets this site's origin reach Ollama, or null where it already can.
// Ollama allows localhost by default, which was checked against a running server.
export function originCommand(origin) {
  if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return null;
  return `launchctl setenv OLLAMA_ORIGINS "${origin}"`;
}

// On-device recognition, where the browser offers it and Italian is already installed.
// It never installs anything itself, since that would be a download nobody asked for.
export async function localSpeechAvailable(SR, lang) {
  if (typeof SR?.available !== 'function') return false;
  try {
    return (await SR.available({ langs: [lang], processLocally: true })) === 'available';
  } catch {
    return false;
  }
}
