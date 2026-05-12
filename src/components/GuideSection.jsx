import { useState } from 'react';
import { IPAGuide } from './IPAGuide';

function GuidePanel({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="guide-panel">
      <button className="guide-panel-header" onClick={() => setOpen((v) => !v)}>
        <span>{title}</span>
        <span className="guide-chevron">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="guide-panel-body">{children}</div>}
    </div>
  );
}

function Tip({ children }) {
  return <div className="guide-tip">{children}</div>;
}

function Step({ n, children }) {
  return (
    <div className="guide-step">
      <span className="guide-step-n">{n}</span>
      <span>{children}</span>
    </div>
  );
}

function Tool({ name, badge, children }) {
  return (
    <div className="guide-tool">
      <div className="guide-tool-header">
        <strong>{name}</strong>
        <span className="guide-tool-badge">{badge}</span>
      </div>
      <div className="guide-tool-body">{children}</div>
    </div>
  );
}

export function GuideSection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="guide-section">
      <button className="guide-toggle" onClick={() => setOpen((v) => !v)}>
        <span>Study guide &amp; setup</span>
        <span className="guide-chevron">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="guide-body">

          {/* How to use the app */}
          <GuidePanel title="How to use this app">
            <Step n="1">
              Each row is one week. Click anywhere on a row to expand it and see that week's vocabulary, grammar focus, writing prompt, and daily schedule.
            </Step>
            <Step n="2">
              Check the box on the left when you've completed the week. Your progress saves automatically and persists between sessions.
            </Step>
            <Step n="3">
              The progress bar at the top tracks your overall completion across all 37 weeks.
            </Step>
            <Step n="4">
              Weeks marked <span className="review-flag" style={{verticalAlign:'middle'}}>iTalki week</span> include conversation starter questions for your tutoring session. Expand the row to find them.
            </Step>
            <Tip>
              On mobile, add this app to your home screen using the button in the top right (Android) or Safari's Share menu (iOS). It works fully offline once installed.
            </Tip>
          </GuidePanel>

          {/* Writing prompt clarification */}
          <GuidePanel title="Writing prompts — what to actually do">
            <p className="guide-prose">
              Each week includes an Italian starter sentence and an English direction. Your job is to use the starter as a springboard, not a template.
            </p>
            <Step n="1">
              Open the week and read the Italian prompt sentence and the English direction underneath it.
            </Step>
            <Step n="2">
              Copy the starter sentence into a notebook or notes app. Then write 3-5 more sentences continuing the thought in your own Italian.
            </Step>
            <Step n="3">
              Use vocabulary from that week's list. Don't worry about being correct — write what you know, then check. Crossing grammar boundaries is how the grammar sticks.
            </Step>
            <Step n="4">
              On review weeks (weeks 8, 18, 28, 36, 37), write a full short paragraph rather than just a few sentences.
            </Step>
            <Tip>
              Don't translate from English in your head. Think of a simple Italian sentence you know how to write and expand from there.
            </Tip>
          </GuidePanel>

          {/* Tool setup */}
          <GuidePanel title="Tool setup">
            <Tool name="Babbel" badge="15 min/day">
              <p>Babbel provides the scaffolded grammar and pronunciation drills that hold the rest of the study together. Do not skip ahead to match the Bible reading — the Babbel pacing is intentionally slower so grammar is absorbed before it's needed in the text.</p>
              <ul>
                <li>Download the Babbel app and set Italian as your target language.</li>
                <li>Set a daily reminder for the same time each day — consistency beats length.</li>
                <li>Complete exactly one lesson unit per session. If a unit feels too easy, note the grammar point and move on — don't skip the unit.</li>
              </ul>
            </Tool>

            <Tool name="Anki" badge="10 min/day">
              <p>Anki handles the vocabulary load so your reading time is spent on meaning, not decoding individual words. You build the deck yourself from what you encounter in the text — this is intentional.</p>
              <ul>
                <li>Download Anki (desktop at ankiweb.net, or AnkiDroid / AnkiMobile for phone).</li>
                <li>Create one deck called <strong>Italian Bible</strong>. Create a sub-deck called <strong>Teologia</strong> for theological terms (used in Phase 4).</li>
                <li>Card format: Italian word on front, English + example sentence from the passage on back. Each week's vocab list gives you the example.</li>
                <li>Add 5-8 cards per reading session (not all 7 at once). Smaller batches review sooner.</li>
                <li>Review every card Anki surfaces that day before adding new ones. Never skip review to add new cards.</li>
                <li>When you mark a card Again, write the word out by hand once before continuing.</li>
              </ul>
              <Tip>Irregular past participles (Week 10) deserve their own tag in Anki. You'll want to filter and drill them as a set before Phase 3.</Tip>
            </Tool>

            <Tool name="iTalki" badge="5 review weeks">
              <p>iTalki sessions happen on the five review weeks (8, 18, 28, 36, 37). You're looking for a community tutor rather than a professional teacher — someone for conversation practice, not structured lessons.</p>
              <ul>
                <li>Create an account at italki.com before Week 8.</li>
                <li>Search for community tutors in Italian. Filter by availability and price — you don't need the most expensive option.</li>
                <li>Book a 30-minute session. Tell them you're reading the Bible in Italian and want to practice conversational recall.</li>
                <li>Expand the review week row in this app to find 4 conversation starter questions prepared for that session.</li>
                <li>Try to answer each question in at least 3-4 Italian sentences before the tutor corrects or continues.</li>
              </ul>
              <Tip>Record your sessions if your tutor agrees. Listening back after 10 weeks shows you exactly how far your fluency has moved.</Tip>
            </Tool>

            <Tool name="La Bibbia CEI 2008" badge="Primary text">
              <p>The CEI 2008 is the standard Catholic Italian Bible and the text all vocabulary and grammar examples in this app are drawn from. Use it as your Italian source; use Bible Gateway for the parallel English.</p>
              <ul>
                <li><strong>Text (online):</strong> <a href="https://www.lachiesa.it/bibbia/" target="_blank" rel="noreferrer">lachiesa.it/bibbia</a> — CEI 2008 alongside CEI 1974 for comparison. Also on Bible Gateway: select Italian → CEI.</li>
                <li><strong>Audio — streaming:</strong> <a href="https://www.bibbiaedu.it/CEI2008/" target="_blank" rel="noreferrer">bibbiaedu.it/CEI2008</a> — official CEI/EDB recordings, professional studio quality, chapter by chapter. The best free streaming source.</li>
                <li><strong>Audio — download (MP3):</strong> <a href="http://www.proclamarelaparola.it/bibbia-in-mp3/" target="_blank" rel="noreferrer">proclamarelaparola.it/bibbia-in-mp3</a> — confirmed CEI 2008, free MP3 per chapter or full-book zip. Download to listen offline or load into an audiobook app.</li>
                <li><strong>Audio — podcast (Gospels):</strong> The official CEI podcast on Spotify covers all four Gospels in CEI 2008 — search for <em>Vangelo secondo Giovanni CEI 2008</em> or <em>Vangelo secondo Luca CEI 2008</em>. Directly useful for Phases 1 and 2 of this program.</li>
                <li><strong>Audio — YouTube:</strong> The <em>La Bibbia in Audio</em> playlist (search YouTube) explicitly labels each video CEI 2008, reads cleanly with no music, and works well on a TV or Chromecast.</li>
                <li><strong>Parallel reading:</strong> Open two browser tabs side by side, or use Bible Gateway's parallel view with an English translation on the right.</li>
              </ul>
              <Tip>bibbiaedu.it is streaming-only (no download). If you want files for offline use, proclamarelaparola.it is the most complete downloadable CEI 2008 source.</Tip>
            </Tool>
          </GuidePanel>

          {/* IPA guide */}
          <GuidePanel title="How to read the pronunciations (IPA key)">
            <IPAGuide />
          </GuidePanel>

          {/* Methodology */}
          <GuidePanel title="Study methodology">
            <p className="guide-prose">
              This course uses three overlapping learning loops working simultaneously. Understanding how they interact helps you use your 65 minutes well.
            </p>

            <div className="guide-method-block">
              <div className="guide-method-label">Loop 1 — Input</div>
              <p>Listening then reading the same passage builds comprehensible input. You hear Italian without pressure, then decode it with the parallel text. Don't look words up during the listening phase — tolerance for ambiguity is a skill you're training.</p>
            </div>

            <div className="guide-method-block">
              <div className="guide-method-label">Loop 2 — Retention</div>
              <p>Anki handles spaced repetition so you don't have to decide what to review. Trust the algorithm. Adding too many cards at once is the most common mistake — 5-8 per session is a ceiling, not a target.</p>
            </div>

            <div className="guide-method-block">
              <div className="guide-method-label">Loop 3 — Production</div>
              <p>Writing and iTalki sessions force you to retrieve rather than recognise. Retrieval is where long-term memory is built. The writing prompt is not optional — even writing badly for 10 minutes is worth more than another 10 minutes of reading.</p>
            </div>

            <Tip>
              If you miss a day, do not try to catch up by doubling the next day. Mark the week incomplete and continue from where you are. One missed day costs you nothing; two weeks of disrupted Anki reviews costs you a lot.
            </Tip>

            <Tip>
              The grammar focus each week describes what to <em>notice</em> in the text, not what to master before moving on. Mastery comes from repeated exposure across multiple weeks — the grammar notes are attention directors, not checkboxes.
            </Tip>
          </GuidePanel>

        </div>
      )}
    </div>
  );
}
