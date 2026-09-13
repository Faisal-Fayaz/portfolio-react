import { useCallback, useEffect, useState } from 'react';
import { projects } from './data/projects';
import { useTheme } from './hooks/useTheme';
import { useScore } from './hooks/useScore';
import ParticleBackground from './components/ParticleBackground';
import Nav from './components/Nav';
import Hero from './components/Hero';
import ProjectGrid from './components/ProjectGrid';
import OpenSource from './components/OpenSource';
import Skills from './components/Skills';
import AboutTerminal from './components/AboutTerminal';
import ContactForm from './components/ContactForm';
import Modal from './components/Modal';
import Toast from './components/Toast';
import CursorCompanion from './components/CursorCompanion';
import './App.css';
import './oss.css';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    score,
    unlocked,
    toastMsg,
    showToast,
    viewProject,
    noticeProject,
    meetBuddy,
    useFilter,
    markThemeToggle,
    markContactSent,
    markSurge,
  } = useScore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeProject = projects.find((p) => p.id === activeId) ?? null;

  const handleToggleTheme = useCallback(() => {
    toggleTheme();
    markThemeToggle();
  }, [toggleTheme, markThemeToggle]);

  const handleOpen = useCallback(
    (id: string) => {
      setActiveId(id);
      viewProject(id);
    },
    [viewProject],
  );

  const handleClose = useCallback(() => setActiveId(null), []);

  const handleNotice = useCallback(
    (id: string, name: string) => noticeProject(id, name),
    [noticeProject],
  );

  useEffect(() => {
    let buffer = '';
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      buffer = (buffer + e.key).slice(-8);
      if (buffer.toLowerCase().includes('ionstorm')) {
        markSurge();
        showToast('⚡ SURGE charged — go play IONSTORM');
        buffer = '';
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [markSurge, showToast]);

  return (
    <>
      <ParticleBackground theme={theme} />
      <div className="noise" aria-hidden />
      <div className="wrap">
        <Nav
          theme={theme}
          onToggleTheme={handleToggleTheme}
          score={score}
          unlocked={unlocked}
        />
        <Hero />
        <ProjectGrid onOpen={handleOpen} onFilter={useFilter} />
        <OpenSource />
        <Skills />
        <AboutTerminal />
        <ContactForm onSuccess={markContactSent} showToast={showToast} />
        <footer>
          Built with curiosity · stats synced from{' '}
          <a href="https://github.com/Faisal01011" target="_blank" rel="noopener noreferrer">
            github.com/Faisal01011
          </a>{' '}
          · Sep 2026
        </footer>
      </div>
      <Modal project={activeProject} onClose={handleClose} />
      <Toast message={toastMsg} />
      <CursorCompanion theme={theme} onNoticeProject={handleNotice} onMeet={meetBuddy} />
    </>
  );
}
