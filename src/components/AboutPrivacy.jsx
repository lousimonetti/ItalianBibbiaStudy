import { useEffect, useState } from 'react';
import { config } from '../../course/config';

// About / Privacy / Licenses — a static, offline page behind a footer link.
// The privacy text describes the app's architecture (all data in this
// browser's localStorage, no accounts, no analytics) and the only outbound
// calls the code makes: the opt-in LanguageTool grammar check and the Saints
// tab's Wikipedia fetch. Content/licensing notices are course data
// (config.licenses) so forks ship their own.
function AboutPrivacyModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sync-overlay" onClick={onClose} role="presentation">
      <div className="sync-modal about-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="About and privacy">
        <div className="sync-modal-head">
          <h2>About &amp; privacy</h2>
          <button className="sync-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="about-body">
          <h3>Your data stays on your device</h3>
          <p>
            {config.brand.name} has no accounts, no server, and no analytics. Everything you
            do — progress, flashcard history, streaks, journal entries — is stored only in
            this browser's local storage. Moving between devices happens through the Sync
            panel (QR code, sync code, or backup file) that you trigger yourself. To delete
            everything, clear this site's data in your browser settings.
          </p>

          <h3>Online services</h3>
          <p>
            The app works fully offline, with two optional online features. The Journal's
            grammar check — off by default — sends the text of the entry you're checking to
            the <a href="https://languagetool.org" target="_blank" rel="noreferrer">LanguageTool</a>{' '}
            public API and nothing else. The Saints tab fetches each day's story from
            Wikipedia. No other network requests carry your data.
          </p>

          <h3>Device permissions</h3>
          <p>
            The microphone is used only while a pronunciation or dictation exercise is
            running; speech is processed by your browser's built-in speech service and the
            app never records or uploads audio. The camera is used only to scan a sync QR
            code. Notifications, if you enable them, are generated locally on this device.
          </p>

          {Array.isArray(config.licenses) && config.licenses.length > 0 && (
            <>
              <h3>Content &amp; licenses</h3>
              {config.licenses.map(({ name, note, url }) => (
                <p key={name} className="about-license">
                  <strong>{name}</strong> — {note}
                  {url && (
                    <>
                      {' '}
                      <a href={url} target="_blank" rel="noreferrer">Learn more →</a>
                    </>
                  )}
                </p>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function AboutPrivacy() {
  const [open, setOpen] = useState(false);
  return (
    <footer className="app-footer">
      <button className="about-link" onClick={() => setOpen(true)}>
        About · privacy &amp; licenses
      </button>
      {open && <AboutPrivacyModal onClose={() => setOpen(false)} />}
    </footer>
  );
}
