import { skills } from '../data/projects';
import { fieldHandle } from './ParticleBackground';

export default function Skills() {
  return (
    <section id="skills">
      <div className="section-head">
        <div>
          <h2 className="section-title">
            Tech <span>Stack</span>
          </h2>
          <div className="section-sub">// hover the chips</div>
        </div>
      </div>
      <div className="skills-cloud">
        {skills.map((s) => (
          <span
            key={s}
            className="skill"
            onMouseEnter={() => {
              const value = s.toLowerCase();
              if (value.includes('webgpu') || value.includes('three') || value.includes('game')) {
                fieldHandle.setFilter('game');
              } else if (value.includes('tensor') || value.includes('whisper') || value.includes('llama') || value.includes('python')) {
                fieldHandle.setFilter('ai');
              } else if (value.includes('react') || value.includes('vite') || value.includes('node')) {
                fieldHandle.setFilter('web');
              }
            }}
            onMouseLeave={() => fieldHandle.setFilter('all')}
          >
            {s}
          </span>
        ))}
      </div>
    </section>
  );
}
