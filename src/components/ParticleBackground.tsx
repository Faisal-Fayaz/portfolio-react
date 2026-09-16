import { useEffect, useRef } from 'react';
import type { FieldFilter } from '../hero/ParticleField';

export const fieldHandle: {
  setFilter: (f: FieldFilter) => void;
  setFocus: (id: string | null) => void;
  setTheme: (t: 'dark' | 'light') => void;
} = {
  setFilter() {},
  setFocus() {},
  setTheme() {},
};

function shouldUseWebGPU() {
  if (typeof navigator === 'undefined') return false;
  if (!('gpu' in navigator) || !(navigator as Navigator & { gpu?: unknown }).gpu) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return false;
  return true;
}

function startCanvasFallback(canvas: HTMLCanvasElement, theme: 'dark' | 'light') {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  let w = 0;
  let h = 0;
  let raf = 0;
  let running = true;
  const isDark = theme === 'dark';
  type P = { x: number; y: number; vx: number; vy: number; size: number; alpha: number; hue: number };
  let particles: P[] = [];
  const reset = (p: P, init = false) => {
    p.x = Math.random() * w;
    p.y = init ? Math.random() * h : h + 10;
    p.vy = -(0.12 + Math.random() * 0.4);
    p.vx = (Math.random() - 0.5) * 0.28;
    p.size = 0.5 + Math.random() * 1.7;
    p.alpha = 0.12 + Math.random() * 0.4;
    p.hue = Math.random() > 0.65 ? 190 : 175;
  };
  const resize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  };
  const init = () => {
    resize();
    const count = Math.min(90, Math.floor((w * h) / 18000));
    particles = Array.from({ length: count }, () => {
      const p = { x: 0, y: 0, vx: 0, vy: 0, size: 1, alpha: 0.3, hue: 180 };
      reset(p, true);
      return p;
    });
  };
  const frame = () => {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    const gx = w * 0.7;
    const gy = h * 0.2;
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, w * 0.55);
    g.addColorStop(0, isDark ? 'rgba(95, 242, 255, 0.04)' : 'rgba(40, 140, 180, 0.05)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10 || p.x < -20 || p.x > w + 20) reset(p);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = isDark
        ? `hsla(${p.hue}, 100%, 70%, ${p.alpha})`
        : `hsla(${p.hue}, 70%, 40%, ${p.alpha * 0.7})`;
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  };
  init();
  frame();
  window.addEventListener('resize', resize);
  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
  };
}

export default function ParticleBackground({ theme }: { theme: 'dark' | 'light' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let stopFallback: (() => void) | undefined;
    let field: {
      destroy: () => void;
      pause: () => void;
      play: () => void;
      setTheme: (t: 'dark' | 'light') => void;
      setFilter: (f: FieldFilter) => void;
      setFocus: (id: string | null) => void;
    } | null = null;

    const boot = async () => {
      if (!shouldUseWebGPU()) {
        stopFallback = startCanvasFallback(canvas, themeRef.current);
        return;
      }
      try {
        const { default: ParticleField } = await import('../hero/ParticleField');
        if (cancelled) return;
        const instance = new ParticleField({ $canvas: canvas });
        await instance.init();
        if (cancelled) {
          instance.destroy();
          return;
        }
        instance.setTheme(themeRef.current);
        instance.play();
        field = instance;
        fieldHandle.setFilter = (f) => instance.setFilter(f);
        fieldHandle.setFocus = (id) => instance.setFocus(id);
        fieldHandle.setTheme = (t) => instance.setTheme(t);
      } catch (err) {
        console.warn('WebGPU field failed, using canvas fallback', err);
        if (!cancelled) stopFallback = startCanvasFallback(canvas, themeRef.current);
      }
    };

    void boot();
    const onVis = () => {
      if (!field) return;
      if (document.hidden) field.pause();
      else field.play();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      stopFallback?.();
      field?.destroy();
      fieldHandle.setFilter = () => {};
      fieldHandle.setFocus = () => {};
      fieldHandle.setTheme = () => {};
    };
  }, []);

  useEffect(() => {
    fieldHandle.setTheme(theme);
  }, [theme]);

  return <canvas id="bg-canvas" ref={canvasRef} aria-hidden />;
}
