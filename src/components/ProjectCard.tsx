import { useRef, type MouseEvent } from 'react';
import type { Project } from '../data/projects';

interface ProjectCardProps {
  project: Project;
  onOpen: (id: string) => void;
  onHover?: (id: string | null) => void;
}

export default function ProjectCard({ project, onOpen, onHover }: ProjectCardProps) {
  const cardRef = useRef<HTMLElement>(null);

  const handleMove = (e: MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const rotX = ((y - r.height / 2) / r.height) * -8;
    const rotY = ((x - r.width / 2) / r.width) * 8;
    card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
  };

  const handleLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = '';
    onHover?.(null);
  };

  const handleEnter = () => {
    onHover?.(project.id);
  };

  return (
    <article
      ref={cardRef}
      className="card"
      data-id={project.id}
      onMouseEnter={handleEnter}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={() => onOpen(project.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(project.id);
        }
      }}
    >
      <div className="card-top">
        <div className="card-icon">{project.icon}</div>
        <div className="card-tags">
          {project.tags.map((t) => (
            <span key={t} className={`tag ${t}`}>
              {t}
            </span>
          ))}
          {project.private && <span className="tag">private</span>}
        </div>
      </div>
      <h3>{project.name}</h3>
      <p>{project.short}</p>
      <div className="card-footer">
        {project.demo && (
          <a
            className="primary"
            href={project.demo}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Live demo
          </a>
        )}
        <a
          href={project.repo}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          GitHub
        </a>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(project.id);
          }}
        >
          Details
        </button>
      </div>
    </article>
  );
}
