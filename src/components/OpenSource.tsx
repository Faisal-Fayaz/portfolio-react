import { githubStats, upstreamProjects, type ContributionStatus } from '../data/github';

const STATUS_LABEL: Record<ContributionStatus, string> = {
  merged: 'merged',
  open: 'open',
  closed: 'closed',
};

export default function OpenSource() {
  return (
    <section id="oss">
      <div className="section-head">
        <div>
          <h2 className="section-title">
            Open source <span>upstream</span>
          </h2>
          <div className="section-sub">
            // {githubStats.mergedUpstreamPrs} merged PRs · {githubStats.openUpstreamPrs} open ·
            synced {githubStats.asOf}
          </div>
        </div>
      </div>

      <div className="oss-grid">
        {upstreamProjects.map((project) => (
          <article key={project.id} className="oss-card">
            <div className="oss-card-top">
              <div>
                <a className="oss-repo" href={project.url} target="_blank" rel="noopener noreferrer">
                  {project.org}/{project.name}
                </a>
                <p className="oss-blurb">{project.blurb}</p>
              </div>
              <div className="oss-meta">
                {project.stars ? <span className="tag">{project.stars}★</span> : null}
                <span className="tag">{project.language}</span>
              </div>
            </div>
            <ul className="oss-prs">
              {project.prs.map((pr) => (
                <li key={pr.url}>
                  <a href={pr.url} target="_blank" rel="noopener noreferrer">
                    <span className={`oss-status ${pr.status}`}>{STATUS_LABEL[pr.status]}</span>
                    <span className="oss-pr-num">#{pr.number}</span>
                    <span className="oss-pr-title">{pr.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
