export type ProjectTag = 'game' | 'ai' | 'web' | 'mobile' | 'tool';

export interface Project {
  id: string;
  name: string;
  icon: string;
  tags: ProjectTag[];
  short: string;
  long: string;
  highlights: string[];
  demo: string | null;
  repo: string;
  lang: string;
  private?: boolean;
}

export const projects: Project[] = [
  {
    id: 'autoapply',
    name: 'AutoApply',
    icon: '📄',
    tags: ['tool', 'ai'],
    short:
      'Semantic job-form autofill for Greenhouse, Lever, Workday and LinkedIn Easy Apply — local-first, confidence-scored.',
    long: 'Chrome MV3 extension + FastAPI backend that treats ATS field matching as a scored classification problem. Every fill is logged with confidence so accuracy is measured, not guessed. Profiles stay in chrome.storage.local; cloud sync is opt-in.',
    highlights: [
      'Semantic label matching instead of brittle CSS selectors',
      'Confidence threshold + one-key-per-field constraint',
      'Workday shadow-DOM + LinkedIn multi-step support',
      'Accuracy dashboard across four ATS platforms',
    ],
    demo: null,
    repo: 'https://github.com/Faisal01011/autoapply',
    lang: 'Python / JavaScript',
  },
  {
    id: 'repropack',
    name: 'Repropack',
    icon: '📦',
    tags: ['tool'],
    short:
      'Wrap a failing command and get a redacted, review-ready reproduction report — locally, with no upload.',
    long: 'CLI that streams a command, captures result + system/Git context, redacts secrets (JWTs, API keys, emails, home paths), and writes Markdown + JSON reports. Built for bug reports you can actually share.',
    highlights: [
      'Local-only; nothing leaves the machine',
      'Heuristic redaction with stable aliases',
      'Markdown + JSON reports, preview mode',
      'Preserves wrapped-command exit codes',
    ],
    demo: null,
    repo: 'https://github.com/Faisal01011/repropack-cli',
    lang: 'TypeScript',
  },
  {
    id: 'llama-autotune',
    name: 'llama-autotune',
    icon: '🎛️',
    tags: ['ai', 'tool'],
    short:
      'C++17 llama.cpp hardware auto-tuner with a live Dear ImGui dashboard for thread and batch tradeoffs.',
    long: 'Finds good llama.cpp CPU runtime settings for one local GGUF: generation threads, prompt-processing threads, and prompt micro-batch size. Measures real prompt vs decode throughput and shows Fastest / Long-doc / Memory / Balanced presets.',
    highlights: [
      'Real llama.cpp C API, no mock results',
      'Live Dear ImGui charts and candidate table',
      'Transparent balanced scoring formula',
      'CLI + GUI + smoke verification paths',
    ],
    demo: null,
    repo: 'https://github.com/Faisal01011/llama-autotune',
    lang: 'C++',
  },
  {
    id: 'codebase-xray',
    name: 'Codebase X-Ray',
    icon: '🩻',
    tags: ['tool', 'web'],
    short:
      'Point it at a GitHub repo and get a live dependency graph, churn×complexity hotspots, blast radius and a reading path.',
    long: 'Interactive architecture maps for unfamiliar codebases. Tree-sitter graph + git churn + cyclomatic complexity, rendered in D3. Optional on-demand Ollama file summaries stay local.',
    highlights: [
      'Tree-sitter dependency graph',
      'Churn × complexity risk layer',
      'Blast-radius ripple + suggested reading path',
      'FastAPI + React + D3',
    ],
    demo: null,
    repo: 'https://github.com/Faisal01011/codebase-xray',
    lang: 'TypeScript / Python',
  },
  {
    id: 'ionstorm',
    name: 'IONSTORM',
    icon: '⚡',
    tags: ['game', 'web'],
    short:
      'Neon browser arcade shooter with WebGPU, PWA offline play, daily challenges, hangar upgrades & cloud pilot sync.',
    long: 'Defend the Veil. Ride the Surge. A polished neon arcade shooter with escalating waves, four-phase Dreadnought bosses, SURGE overdrive, cosmetics, and optional Supabase account sync. Runs as a PWA with offline caching.',
    highlights: [
      'WebGPU + WebGL2 fallback renderer',
      'GPU particles, procedural backgrounds, screen effects',
      'Persistent progression, achievements, daily UTC challenges',
      'Mobile + desktop controls, installable PWA',
    ],
    demo: 'https://ionstorm.vercel.app',
    repo: 'https://github.com/Faisal01011/IONSTORM',
    lang: 'JavaScript',
  },
  {
    id: 'wild-roads',
    name: 'Wild Roads',
    icon: '🐍',
    tags: ['game', 'web'],
    short:
      '3D snake survival game. Hunt deer, evade wolves, grow forever in a procedurally streaming wilderness.',
    long: 'A full 3D browser survival game built with raw Three.js (no game engine). Chunk-based procedural terrain, day/night cycle, animal AI, stamina boosts, and mobile-first controls.',
    highlights: [
      'Procedural world streaming with simplex noise',
      'Animated GLTF/FBX creatures + predator AI',
      'Dynamic lighting & ambient audio',
      'Live at wild-roads.vercel.app',
    ],
    demo: 'https://wild-roads.vercel.app',
    repo: 'https://github.com/Faisal01011/wild-roads',
    lang: 'TypeScript',
  },
  {
    id: 'system-design-sim',
    name: 'System Design Simulator',
    icon: '🛰️',
    tags: ['tool', 'web'],
    short:
      'Immersive 3D “flight simulator” for distributed systems. Wire components, inject traffic, watch failures cascade live.',
    long: 'Turn static architecture diagrams into living systems. Place load balancers, caches, queues and databases, then stress them with real-time RPS, latency percentiles and cascading failures.',
    highlights: [
      'Three.js / React Three Fiber scene',
      'Live metrics: p50/p95/p99, cache hit rate, utilization',
      'Templates: monolith, 3-tier + cache, high-traffic API',
      'Failure injection & architecture export',
    ],
    demo: 'https://system-design-simulator-flax.vercel.app',
    repo: 'https://github.com/Faisal01011/system-design-simulator',
    lang: 'TypeScript',
  },
  {
    id: 'leaf-scan',
    name: 'LeafScan',
    icon: '🍃',
    tags: ['ai', 'mobile'],
    short:
      'Offline React Native / Expo app for crop disease & insect triage using on-device TensorFlow Lite models.',
    long: 'Camera and gallery images are classified entirely on-device. Bundled disease model covers 38 PlantVillage-style classes; pest model maps 102 IP102-style classes. Conservative treatment guidance and low-confidence warnings included.',
    highlights: [
      'True offline inference with TFLite',
      'Disease + pest models',
      'Expo development builds (not Expo Go)',
      'Built for field use, not just demos',
    ],
    demo: null,
    repo: 'https://github.com/Faisal01011/Leaf-Scan',
    lang: 'TypeScript',
  },
  {
    id: 'ecomind',
    name: 'EcoMind',
    icon: '🧠',
    tags: ['ai', 'tool'],
    short:
      'Personal voice-memory system. Speak → Faster-Whisper → local Llama extracts topics, tasks, people & projects.',
    long: 'Everything stays on your machine. Record voice notes in the browser; Faster-Whisper transcribes and a local Ollama Llama model structures the memory into searchable notes with tasks, people and projects.',
    highlights: [
      'Fully local & private (Whisper + Ollama)',
      'Multi-language support',
      'FastAPI + PostgreSQL backend',
      'Async processing pipeline',
    ],
    demo: null,
    repo: 'https://github.com/Faisal01011/ecomind',
    lang: 'TypeScript / Python',
  },
  {
    id: 'signal-stt',
    name: 'Signal STT',
    icon: '🎙️',
    tags: ['ai', 'tool'],
    short:
      'Self-hosted speech-to-text with real faster-whisper model, word-level timestamps and confidence scores.',
    long: 'Not a thin wrapper around a free cloud API. Real CTranslate2-optimized Whisper running on CPU, word-level confidence coloring, live waveform, and persistent history on Postgres.',
    highlights: [
      'faster-whisper (int8 quantized)',
      'Word-level confidence visualization',
      'Docker → Render backend, Vercel frontend',
      'Live demo available',
    ],
    demo: 'https://signal-speech-to-text.vercel.app',
    repo: 'https://github.com/Faisal01011/signal-speech-to-text',
    lang: 'JavaScript / Python',
  },
  {
    id: 'sky-duel',
    name: 'Sky Duel',
    icon: '✈️',
    tags: ['game', 'web'],
    short: 'Multiplayer aerial combat. Vite/TypeScript client + Colyseus authoritative game server.',
    long: 'A multiplayer dogfight prototype with dedicated Colyseus rooms, flight controller, weapon system, effects and networked state.',
    highlights: [
      'Colyseus multiplayer server',
      'Custom flight & camera controllers',
      'Object pooling & effects manager',
      'Client/server split architecture',
    ],
    demo: null,
    repo: 'https://github.com/Faisal01011/sky-duel',
    lang: 'TypeScript',
  },
  {
    id: 'dream-architect',
    name: 'Dream Architect',
    icon: '🌌',
    tags: ['game', 'web'],
    short:
      'Multiplayer emotional sandbox. Place memories into a shared 3D dream world and watch the mood shift.',
    long: 'Vertical-slice demo of a collaborative dream space. EmotionField reacts to placed memories (fog, light, intensity). Live WebSocket multiplayer with interest management and persistence.',
    highlights: [
      'Three.js / WebGL2 scene',
      'Live multiplayer via WebSocket',
      'Emotion-driven environment',
      'AOI interest management on server',
    ],
    demo: null,
    repo: 'https://github.com/Faisal01011/dream-architect',
    lang: 'TypeScript',
    private: true,
  },
];

export const skills = [
  'TypeScript',
  'JavaScript',
  'C++',
  'React',
  'Vite',
  'Three.js',
  'React Three Fiber',
  'WebGPU / WebGL',
  'Node.js',
  'FastAPI',
  'Python',
  'TensorFlow Lite',
  'Faster-Whisper',
  'Ollama / Llama',
  'llama.cpp',
  'PEFT / QLoRA',
  'Colyseus',
  'Expo / React Native',
  'Zustand',
  'PostgreSQL',
  'Supabase',
  'Docker',
  'Vercel',
  'PWA',
];
