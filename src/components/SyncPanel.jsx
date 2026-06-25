import { useState, useEffect, useRef, useCallback } from 'react';
import { config } from '../../course/config';
import {
  exportSnapshot,
  importSnapshot,
  decode,
  encode,
  toFileText,
} from '../utils/syncSnapshot';

function SyncIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8a6 6 0 0110-4.5M14 8a6 6 0 01-10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 1.5V4H9.5M4 14.5V12h2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Export half: shows the current device's progress as a QR code, a copy-paste
// "sync code", and a downloadable .json backup. The QR is best-effort — large
// snapshots (lots of journal text + SRS history) can exceed a single QR's
// capacity, in which case we fall back to the code/file (multi-QR is a noted
// follow-up).
function ExportView() {
  const [code, setCode] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [qrTooBig, setQrTooBig] = useState(false);
  const [copied, setCopied] = useState(false);
  const snapshotRef = useRef(null);

  useEffect(() => {
    const snap = exportSnapshot();
    snapshotRef.current = snap;
    const c = encode(snap);
    setCode(c);
    // qrcode is only needed when this panel opens — keep it out of the main bundle.
    import('qrcode')
      .then(({ default: QRCode }) =>
        QRCode.toDataURL(c, { errorCorrectionLevel: 'L', margin: 1, width: 240 }))
      .then((url) => { setQrUrl(url); setQrTooBig(false); })
      .catch(() => { setQrUrl(''); setQrTooBig(true); });
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — the textarea is still selectable
    }
  };

  const download = () => {
    const snap = snapshotRef.current;
    if (!snap) return;
    const blob = new Blob([toFileText(snap)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.id}-progress-${snap.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sync-view">
      <p className="sync-hint">
        Scan this on another device (Import → Scan), or copy the code / download the file.
      </p>
      {qrUrl && <img className="sync-qr" src={qrUrl} alt="Sync QR code" width={240} height={240} />}
      {qrTooBig && (
        <p className="sync-warn">
          Your progress is too large for a QR code — use the sync code or file below instead.
        </p>
      )}
      <textarea className="sync-code" readOnly value={code} rows={3} onFocus={(e) => e.target.select()} />
      <div className="sync-actions">
        <button className="sync-btn" onClick={copy}>{copied ? 'Copied!' : 'Copy code'}</button>
        <button className="sync-btn" onClick={download}>Download file</button>
      </div>
    </div>
  );
}

// Import half: accepts a snapshot via camera QR scan, a pasted code, or an
// uploaded .json file. Any successful read is confirmed before it replaces this
// device's progress, then the page reloads so every hook re-reads localStorage.
function ImportView() {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(0);

  const apply = useCallback((snapshot, label) => {
    const count = Object.keys(snapshot?.data || {}).length;
    const ok = window.confirm(
      `Import ${count} item(s) and REPLACE this device's progress for "${config.brand.name}"? This can't be undone.`,
    );
    if (!ok) return;
    try {
      importSnapshot(snapshot, { mode: 'replace' });
      window.location.reload();
    } catch (e) {
      setError(`${label}: ${e.message}`);
    }
  }, []);

  const stopScan = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => stopScan, [stopScan]);

  const startScan = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setScanning(true);
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      // jsqr is only needed for camera scanning — lazy-load it on demand.
      const { default: jsQR } = await import('jsqr');

      const tick = () => {
        if (!streamRef.current) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const found = jsQR(img.data, img.width, img.height);
          if (found?.data) {
            try {
              const snap = decode(found.data);
              stopScan();
              apply(snap, 'Scanned code');
              return;
            } catch {
              // not a sync QR — keep scanning
            }
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setScanning(false);
      setError('Could not access the camera. Use a pasted code or file instead.');
    }
  }, [apply, stopScan]);

  const importCode = () => {
    setError('');
    const code = document.getElementById('sync-paste')?.value || '';
    try {
      apply(decode(code), 'Pasted code');
    } catch (e) {
      setError(e.message);
    }
  };

  const importFile = (e) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        apply(JSON.parse(String(reader.result)), 'File');
      } catch {
        setError('That file is not a valid sync backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="sync-view">
      <p className="sync-hint">Bring progress in from another device.</p>

      {scanning ? (
        <>
          <video ref={videoRef} className="sync-video" playsInline muted />
          <button className="sync-btn" onClick={stopScan}>Stop scanning</button>
        </>
      ) : (
        <button className="sync-btn sync-btn-primary" onClick={startScan}>Scan QR with camera</button>
      )}

      <div className="sync-or">or paste a sync code</div>
      <textarea id="sync-paste" className="sync-code" rows={3} placeholder="Paste sync code here…" />
      <div className="sync-actions">
        <button className="sync-btn" onClick={importCode}>Import code</button>
        <label className="sync-btn sync-file-label">
          Import file
          <input type="file" accept="application/json,.json" onChange={importFile} hidden />
        </label>
      </div>

      {error && <p className="sync-warn">{error}</p>}
    </div>
  );
}

function SyncModal({ onClose }) {
  const [tab, setTab] = useState('export');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sync-overlay" onClick={onClose} role="presentation">
      <div className="sync-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Sync progress">
        <div className="sync-modal-head">
          <h2>Sync progress</h2>
          <button className="sync-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="sync-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'export'} className={`sync-tab${tab === 'export' ? ' active' : ''}`} onClick={() => setTab('export')}>This device</button>
          <button role="tab" aria-selected={tab === 'import'} className={`sync-tab${tab === 'import' ? ' active' : ''}`} onClick={() => setTab('import')}>Import</button>
        </div>
        {tab === 'export' ? <ExportView /> : <ImportView />}
        <p className="sync-foot">No account needed — your data stays on your devices. Online auto-sync is on the roadmap.</p>
      </div>
    </div>
  );
}

// Header control: opens a modal to move this course's progress between devices
// via QR code, a copy-paste sync code, or a .json backup file. No backend.
export function SyncPanel() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="sync-toggle" onClick={() => setOpen(true)} aria-label="Sync progress between devices" title="Sync progress between devices">
        <SyncIcon />
      </button>
      {open && <SyncModal onClose={() => setOpen(false)} />}
    </>
  );
}
