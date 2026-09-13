import ThemeToggle from './ThemeToggle';
import ScoreHUD from './ScoreHUD';
import type { AchievementId } from '../hooks/useScore';

interface NavProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  score: number;
  unlocked: AchievementId[];
}

export default function Nav({ theme, onToggleTheme, score, unlocked }: NavProps) {
  return (
    <nav>
      <a className="logo" href="#">
        <span className="logo-dot" />
        FAISAL.SYS
      </a>
      <div className="nav-right">
        <div className="nav-links">
          <a href="#projects">projects</a>
          <a href="#oss">oss</a>
          <a href="#skills">stack</a>
          <a href="#about">about</a>
          <a href="#contact">contact</a>
        </div>
        <ScoreHUD score={score} unlocked={unlocked} />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </nav>
  );
}
