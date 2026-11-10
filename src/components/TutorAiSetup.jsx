import { useState } from 'react';
import { forgetTutorAI, loadTutorAI, originCommand, saveTutorAI } from '../utils/tutorAI';
import { listModels, RECOMMENDED_MODEL } from '../utils/ollamaClient';

// Opt-in setup for Conversa. Nothing contacts Ollama until "Check connection" is pressed,
// and the app never downloads a model: pulling one is the learner's own action.
export function TutorAiSetup({ onChange, onClose }) {
  const [settings, setSettings] = useState(loadTutorAI);
  const [models, setModels] = useState(null);
  const [status, setStatus] = useState('idle');
  const command = originCommand(window.location.origin);

  const check = async () => {
    setStatus('checking');
    try {
      const found = await listModels();
      setModels(found);
      setStatus('ok');
      if (!settings.model || !found.includes(settings.model)) {
        const preferred = found.includes(RECOMMENDED_MODEL) ? RECOMMENDED_MODEL : (found[0] ?? '');
        setSettings((s) => ({ ...s, model: preferred }));
      }
    } catch {
      setModels(null);
      setStatus('failed');
    }
  };

  const turnOn = () => {
    const next = { enabled: true, model: settings.model };
    saveTutorAI(next);
    setSettings(next);
    onChange(next);
    onClose();
  };

  const turnOff = () => {
    forgetTutorAI();
    const next = { enabled: false, model: '' };
    setSettings(next);
    onChange(next);
    onClose();
  };

  return (
    <div className="tutor-ai-setup">
      <strong>Talk freely with a local AI model</strong>
      <span>
        Conversa is a spoken conversation about this week's passage, with replies from a model running on your own
        computer. It's optional, needs a Mac or PC with plenty of memory, and isn't graded.
      </span>
      <ol>
        <li>Install <a href="https://ollama.com" target="_blank" rel="noreferrer">Ollama</a> and open it.</li>
        <li>
          In Terminal, download the model we tested (about 8 GB, Apple Silicon):
          <code>ollama pull {RECOMMENDED_MODEL}</code>
        </li>
        {command && (
          <li>
            Allow this site to reach Ollama, then quit and reopen Ollama:
            <code>{command}</code>
          </li>
        )}
      </ol>

      <div className="tutor-controls">
        <button className="tutor-btn" disabled={status === 'checking'} onClick={check}>
          {status === 'checking' ? 'Checking…' : 'Check connection'}
        </button>
      </div>

      {status === 'failed' && (
        <div className="tutor-ai-error" role="alert">
          Couldn't reach Ollama. Check that it's running{command ? ', and that you allowed this site and reopened it' : ''}.
          {' '}Your browser may also ask permission to reach this computer. Chrome is the browser we tested.
        </div>
      )}

      {models && models.length === 0 && (
        <div className="tutor-ai-error" role="alert">Ollama is running but has no models yet. Run the download step above.</div>
      )}

      {models && models.length > 0 && (
        <label>
          Model{' '}
          <select value={settings.model} onChange={(e) => setSettings({ ...settings, model: e.target.value })}>
            {models.map((m) => (
              <option key={m} value={m}>{m}{m === RECOMMENDED_MODEL ? ' (tested)' : ''}</option>
            ))}
          </select>
        </label>
      )}

      <div className="tutor-controls">
        {models && models.length > 0 && settings.model && (
          <button className="tutor-btn tutor-btn-primary" onClick={turnOn}>Turn on Conversa</button>
        )}
        {settings.enabled && <button className="tutor-btn" onClick={turnOff}>Turn off</button>}
        <button className="tutor-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
