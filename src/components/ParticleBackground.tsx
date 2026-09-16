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

export default function ParticleBackground({ theme }: { theme: 'dark' | 'light' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cancelled = false;
    let field: {
      destroy: () => void;
      pause: () => void;
      play: () => void;
      setTheme: (t: 'dark' | 'light') => void;
      setFilter: (f: FieldFilter) => void;
      setFocus: (id: string | null) => void;
    } | null = null;

    const boot = async () => {
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
        console.warn('Particle field failed', err);
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
      field?.destroy();
      fieldHandle.setFilter = () => {};
      fieldHandle.setFocus = () => {};
      fieldHandle.setTheme = () => {};
    };
  }, []);

  useEffect(() => {
    fieldHandle.setTheme(theme);
  }, [theme]);

  return (
    <canvas
      id="bg-canvas"
      ref={canvasRef}
      aria-hidden
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
