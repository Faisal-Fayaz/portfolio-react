export const githubStats = {
  username: 'Faisal-Fayaz',
  profileUrl: 'https://github.com/Faisal-Fayaz',
  publicRepos: 19,
  followers: 4,
  following: 3,
  liveDemos: 5,
  mergedUpstreamPrs: 7,
  openUpstreamPrs: 0,
  asOf: '2026-09-25',
};

export type ContributionStatus = 'merged' | 'open' | 'closed';

export interface UpstreamPr {
  repo: string;
  repoUrl: string;
  number: number;
  title: string;
  url: string;
  status: ContributionStatus;
  mergedAt?: string;
}

export interface UpstreamProject {
  id: string;
  name: string;
  org: string;
  url: string;
  blurb: string;
  stars?: string;
  language: string;
  prs: UpstreamPr[];
}

export const upstreamProjects: UpstreamProject[] = [
  {
    id: 'soup',
    name: 'Soup',
    org: 'MakazhanAlpamys',
    url: 'https://github.com/MakazhanAlpamys/Soup',
    blurb:
      'Fine-tune LLMs from one YAML. Layer streaming trains an 8B model on a 4 GB laptop GPU. ~6.2k stars.',
    stars: '6.2k',
    language: 'Python',
    prs: [
      {
        repo: 'MakazhanAlpamys/Soup',
        repoUrl: 'https://github.com/MakazhanAlpamys/Soup',
        number: 592,
        title: 'fix(export): require explicit AWQ calibration data',
        url: 'https://github.com/MakazhanAlpamys/Soup/pull/592',
        status: 'merged',
        mergedAt: '2026-09-12',
      },
      {
        repo: 'MakazhanAlpamys/Soup',
        repoUrl: 'https://github.com/MakazhanAlpamys/Soup',
        number: 588,
        title: 'fix(train): make FSDP QLoRA dtype-compatible',
        url: 'https://github.com/MakazhanAlpamys/Soup/pull/588',
        status: 'merged',
        mergedAt: '2026-08-28',
      },
      {
        repo: 'MakazhanAlpamys/Soup',
        repoUrl: 'https://github.com/MakazhanAlpamys/Soup',
        number: 466,
        title: 'feat(data): add provider sampling to best-of-n',
        url: 'https://github.com/MakazhanAlpamys/Soup/pull/466',
        status: 'merged',
        mergedAt: '2026-08-22',
      },
      {
        repo: 'MakazhanAlpamys/Soup',
        repoUrl: 'https://github.com/MakazhanAlpamys/Soup',
        number: 437,
        title: 'test(stream): pin non-LoRA meta guard scope',
        url: 'https://github.com/MakazhanAlpamys/Soup/pull/437',
        status: 'merged',
        mergedAt: '2026-08-17',
      },
      {
        repo: 'MakazhanAlpamys/Soup',
        repoUrl: 'https://github.com/MakazhanAlpamys/Soup',
        number: 435,
        title: 'fix(stream): verify adapter materialization',
        url: 'https://github.com/MakazhanAlpamys/Soup/pull/435',
        status: 'merged',
        mergedAt: '2026-08-17',
      },
      {
        repo: 'MakazhanAlpamys/Soup',
        repoUrl: 'https://github.com/MakazhanAlpamys/Soup',
        number: 432,
        title: 'feat: add DeepSeek V4 Flash GRPO recipe',
        url: 'https://github.com/MakazhanAlpamys/Soup/pull/432',
        status: 'merged',
        mergedAt: '2026-08-16',
      },
      {
        repo: 'MakazhanAlpamys/Soup',
        repoUrl: 'https://github.com/MakazhanAlpamys/Soup',
        number: 422,
        title: 'feat: add Qwen3.5 4B pretrain recipe',
        url: 'https://github.com/MakazhanAlpamys/Soup/pull/422',
        status: 'merged',
        mergedAt: '2026-08-16',
      },
    ],
  },
];
