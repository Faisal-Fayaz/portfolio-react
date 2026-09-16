import { useMemo, useState } from 'react';
import { projects, type ProjectTag } from '../data/projects';
import ProjectCard from './ProjectCard';
import { fieldHandle } from './ParticleBackground';

const FILTERS: { id: 'all' | ProjectTag; label: string }[] = [
  { id: 'all', label: 'all' },
  { id: 'game', label: 'games' },
  { id: 'ai', label: 'ai / ml' },
  { id: 'web', label: 'web / 3d' },
  { id: 'mobile', label: 'mobile' },
  { id: 'tool', label: 'tools' },
];

interface ProjectGridProps {
  onOpen: (id: string) => void;
  onFilter: (filter: string) => void;
}

export default function ProjectGrid({ onOpen, onFilter }: ProjectGridProps) {
  const [filter, setFilter] = useState<'all' | ProjectTag>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return projects;
    return projects.filter((p) => p.tags.includes(filter));
  }, [filter]);

  const handleFilter = (id: 'all' | ProjectTag) => {
    setFilter(id);
    onFilter(id);
    fieldHandle.setFilter(id);
  };

  return (
    <section id="projects">
      <div className="section-head">
        <div>
          <h2 className="section-title">
            Selected <span>Projects</span>
          </h2>
          <div className="section-sub">// filter by category · click a card for details · earn XP</div>
        </div>
      </div>

      <div className="filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`filter-btn ${filter === f.id ? 'active' : ''}`}
            onClick={() => handleFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="projects">
        {filtered.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            onOpen={onOpen}
            onHover={(id) => fieldHandle.setFocus(id)}
          />
        ))}
      </div>
    </section>
  );
}
