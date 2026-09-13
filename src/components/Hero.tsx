import { useEffect, useState } from 'react';
import { githubStats } from '../data/github';

const PHRASES = [
  'AI/ML + Full-stack · India',
  'Building offline vision models…',
  'Neon arcade games in the browser…',
  '3D system-design flight simulators…',
  'Local AI that never leaves your machine…',
  'Contributing upstream to LLM tooling…',
];

export default function Hero() {
  const [text, setText] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = PHRASES[phraseIdx];
    const speed = deleting ? 28 : 48;

    const timer = window.setTimeout(() => {
      if (!deleting) {
        const next = current.slice(0, text.length + 1);
        setText(next);
        if (next === current) {
          window.setTimeout(() => setDeleting(true), 1800);
        }
      } else {
        const next = current.slice(0, text.length - 1);
        setText(next);
        if (next === '') {
          setDeleting(false);
          setPhraseIdx((i) => (i + 1) % PHRASES.length);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [text, deleting, phraseIdx]);

  return (
    <header className="hero">
      <div>
        <div className="badge">online · building in public</div>
        <h1>
          Teaching machines
          <br />
          to <span className="accent">see</span>, <span className="accent">play</span> &amp;{' '}
          <span className="accent">remember</span>
        </h1>
        <div className="type-line">
          <span>{text}</span>
          <span className="cursor" />
        </div>
        <p className="hero-desc">
          Full-stack + AI/ML engineer. I ship neon arcade games, on-device vision models, 3D
          system-design simulators, and private local AI tools — and send the hard fixes back
          upstream. Usually TypeScript, React, Three.js, FastAPI and a dash of TensorFlow Lite.
        </p>
        <div className="cta-row">
          <a className="btn btn-primary" href="#projects">
            Explore projects →
          </a>
          <a className="btn btn-ghost" href="#oss">
            Upstream PRs
          </a>
          <a
            className="btn btn-ghost"
            href={githubStats.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>

      <div className="profile-card">
        <div className="avatar-wrap">
          <img
            className="avatar"
            src="https://avatars.githubusercontent.com/u/119831413?v=4"
            alt="Faisal Fayaz"
            width={72}
            height={72}
          />
          <div>
            <div className="profile-name">Faisal Fayaz</div>
            <div className="profile-handle">@{githubStats.username}</div>
          </div>
        </div>
        <div className="stat-grid">
          <div className="stat">
            <div className="stat-val">{githubStats.publicRepos}</div>
            <div className="stat-label">Public repos</div>
          </div>
          <div className="stat">
            <div className="stat-val">{githubStats.mergedUpstreamPrs}</div>
            <div className="stat-label">Merged PRs</div>
          </div>
          <div className="stat">
            <div className="stat-val">{githubStats.liveDemos}</div>
            <div className="stat-label">Live demos</div>
          </div>
        </div>
        <div className="profile-links">
          <a href={githubStats.profileUrl} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="https://linkedin.com/in/faisal-fayaz" target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        </div>
      </div>
    </header>
  );
}
