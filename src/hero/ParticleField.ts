// @ts-nocheck
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export type FieldFilter = 'all' | 'game' | 'ai' | 'web' | 'mobile' | 'tool';

const COUNT = 420;
const RADIUS = 0.11;
const CONTACT = 0.24;

function filterCode(filter: FieldFilter) {
  if (filter === 'game') return 1;
  if (filter === 'ai' || filter === 'mobile') return 2;
  if (filter === 'tool' || filter === 'web') return 3;
  return 0;
}

function hashId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 3)) % 12;
  return h;
}

export default class ParticleField {
  constructor({ $canvas }) {
    this.$canvas = $canvas;
    this.playing = false;
    this.filterMode = 0;
    this.focusId = -1;
    this.theme = 'dark';
    this.tick = this.tick.bind(this);
    this.resize = this.resize.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
  }

  async init() {
    this.setSizes();
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.$canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
    this.renderer.setSize(this.sizes.width, this.sizes.height, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, this.sizes.width / this.sizes.height, 0.1, 80);
    this.camera.position.set(0, 0.2, 11);
    this.scene.add(this.camera);

    this.ambient = new THREE.AmbientLight(0xb8fff6, 0.55);
    this.scene.add(this.ambient);
    this.key = new THREE.DirectionalLight(0xe8ffff, 1.1);
    this.key.position.set(4, 6, 8);
    this.scene.add(this.key);
    this.fill = new THREE.PointLight(0x5ff2ff, 12, 18);
    this.fill.position.set(-3, 1, 4);
    this.scene.add(this.fill);

    this.cursor = {
      raycaster: new THREE.Raycaster(),
      ndc: new THREE.Vector2(0, 0),
      plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
      hit: new THREE.Vector3(),
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      sampled: false,
    };
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });

    this.positions = new Float32Array(COUNT * 3);
    this.velocities = new Float32Array(COUNT * 3);
    this.heat = new Float32Array(COUNT);
    this.types = new Uint8Array(COUNT);
    this.ids = new Uint8Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const u = Math.random();
      const v = Math.random();
      const w = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(v * 2 - 1);
      const r = 4.4 * Math.cbrt(w);
      this.positions[i * 3] = Math.sin(theta) * Math.sin(phi) * r * 1.35;
      this.positions[i * 3 + 1] = Math.cos(phi) * r * 0.72;
      this.positions[i * 3 + 2] = Math.cos(theta) * Math.sin(phi) * r * 0.55;
      this.types[i] = Math.floor(Math.random() * 3);
      this.ids[i] = Math.floor(Math.random() * 12);
    }

    this.geometry = new THREE.IcosahedronGeometry(1, 1);
    this.material = new THREE.MeshStandardMaterial({
      color: 0xd7f6ff,
      emissive: 0x5ff2ff,
      emissiveIntensity: 0.15,
      roughness: 0.35,
      metalness: 0.15,
      transparent: true,
      opacity: 0.95,
    });

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, COUNT);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.dummy = new THREE.Object3D();
    this.color = new THREE.Color();
    this.baseSee = new THREE.Color(0x7eeadf);
    this.basePlay = new THREE.Color(0x5ff2ff);
    this.baseRemember = new THREE.Color(0xc4b5fd);
    this.hot = new THREE.Color(0xffb454);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(COUNT * 3), 3);
    this.scene.add(this.mesh);
    this.writeInstances();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(this.sizes.width, this.sizes.height), 0.55, 0.7, 0.18);
    this.composer.addPass(this.bloom);

    this.clock = new THREE.Clock();
    this.resize();
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(document.documentElement);
    this.setTheme(this.theme);
  }

  setSizes() {
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    };
  }

  onPointerMove(event) {
    this.cursor.ndc.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.cursor.ndc.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  writeInstances() {
    for (let i = 0; i < COUNT; i++) {
      const inactive = this.isInactive(i);
      const s = inactive ? RADIUS * 0.28 : RADIUS;
      this.dummy.position.set(this.positions[i * 3], this.positions[i * 3 + 1], this.positions[i * 3 + 2]);
      this.dummy.scale.setScalar(s);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      const t = this.types[i];
      const base = t === 1 ? this.basePlay : t === 2 ? this.baseRemember : this.baseSee;
      this.color.copy(base).lerp(this.hot, Math.min(1, this.heat[i]));
      if (inactive) this.color.multiplyScalar(0.25);
      this.mesh.setColorAt(i, this.color);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  isInactive(i) {
    if (this.filterMode === 0) return false;
    if (this.filterMode === 1) return this.types[i] !== 1;
    if (this.filterMode === 2) return this.types[i] !== 0;
    return this.types[i] !== 2;
  }

  setFilter(filter) {
    this.filterMode = filterCode(filter);
  }

  setFocus(projectId) {
    this.focusId = projectId ? hashId(projectId) : -1;
  }

  setTheme(theme) {
    this.theme = theme;
    if (!this.material) return;
    if (theme === 'dark') {
      this.baseSee.set(0x7eeadf);
      this.basePlay.set(0x5ff2ff);
      this.baseRemember.set(0xe9d5ff);
      this.hot.set(0xffb454);
      this.material.color.set(0xe8f7ff);
      this.material.emissive.set(0x5ff2ff);
      this.ambient.intensity = 0.35;
      this.key.intensity = 0.9;
      this.fill.intensity = 16;
      if (this.bloom) { this.bloom.strength = 0.7; this.bloom.threshold = 0.12; }
    } else {
      this.baseSee.set(0x0f766e);
      this.basePlay.set(0x0891b2);
      this.baseRemember.set(0x6d28d9);
      this.hot.set(0xea580c);
      this.material.color.set(0x164e63);
      this.material.emissive.set(0x155e75);
      this.ambient.intensity = 0.7;
      this.key.intensity = 1.05;
      this.fill.intensity = 8;
      if (this.bloom) { this.bloom.strength = 0.28; this.bloom.threshold = 0.35; }
    }
  }

  play() {
    if (this.playing) return;
    this.playing = true;
    this.cursor.sampled = false;
    this.clock.getDelta();
    this.renderer.setAnimationLoop(this.tick);
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    this.renderer.setAnimationLoop(null);
  }

  resize() {
    this.setSizes();
    if (!this.renderer || !this.sizes.width || !this.sizes.height) return;
    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
    this.renderer.setSize(this.sizes.width, this.sizes.height, false);
    this.composer?.setSize(this.sizes.width, this.sizes.height);
    this.bloom?.setSize(this.sizes.width, this.sizes.height);
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 1 / 30);
    this.cursor.raycaster.setFromCamera(this.cursor.ndc, this.camera);
    this.cursor.raycaster.ray.intersectPlane(this.cursor.plane, this.cursor.hit);
    if (this.cursor.sampled) this.cursor.vel.copy(this.cursor.hit).sub(this.cursor.pos);
    else this.cursor.vel.set(0, 0, 0);
    this.cursor.pos.copy(this.cursor.hit);
    this.cursor.sampled = true;

    const cursorR = 2.15;
    const cursorR2 = cursorR * cursorR;

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      let x = this.positions[ix];
      let y = this.positions[ix + 1];
      let z = this.positions[ix + 2];
      let vx = this.velocities[ix];
      let vy = this.velocities[ix + 1];
      let vz = this.velocities[ix + 2];

      const dx = x - this.cursor.pos.x;
      const dy = y - this.cursor.pos.y;
      const dz = z - this.cursor.pos.z;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < cursorR2) {
        const d = Math.sqrt(d2) || 0.001;
        const ratio = Math.max(0, 1 - Math.max(0, d / cursorR - 0.45) / 0.55);
        vx += this.cursor.vel.x * ratio * 0.55;
        vy += this.cursor.vel.y * ratio * 0.55;
        vz += this.cursor.vel.z * ratio * 0.55;
        this.heat[i] += Math.hypot(this.cursor.vel.x, this.cursor.vel.y, this.cursor.vel.z) * ratio * 4.2;
      }

      const len = Math.hypot(x, y, z) || 1;
      vx -= (x / len) * 0.55 * dt;
      vy -= (y / len) * 0.55 * dt;
      vz -= (z / len) * 0.55 * dt;

      if (this.focusId >= 0 && this.ids[i] === this.focusId) {
        this.heat[i] += 0.04;
        vx -= (x / len) * -0.15 * dt;
      }

      if (this.isInactive(i)) {
        vx *= 0.84; vy *= 0.84; vz *= 0.84;
        this.heat[i] *= 0.86;
      }

      const end = Math.min(COUNT, i + 18);
      for (let j = i + 1; j < end; j++) {
        const jx = j * 3;
        const ox = this.positions[jx] - x;
        const oy = this.positions[jx + 1] - y;
        const oz = this.positions[jx + 2] - z;
        const dist = Math.hypot(ox, oy, oz) || 0.0001;
        if (dist < CONTACT) {
          const nx = ox / dist, ny = oy / dist, nz = oz / dist;
          const overlap = (CONTACT - dist) * 0.5;
          x -= nx * overlap; y -= ny * overlap; z -= nz * overlap;
          this.positions[jx] += nx * overlap;
          this.positions[jx + 1] += ny * overlap;
          this.positions[jx + 2] += nz * overlap;
          const rel = (vx - this.velocities[jx]) * nx + (vy - this.velocities[jx + 1]) * ny + (vz - this.velocities[jx + 2]) * nz;
          const bounce = rel * 0.92;
          vx -= nx * bounce; vy -= ny * bounce; vz -= nz * bounce;
          this.velocities[jx] += nx * bounce;
          this.velocities[jx + 1] += ny * bounce;
          this.velocities[jx + 2] += nz * bounce;
          const impact = Math.max(0, rel - 0.01) * 8;
          this.heat[i] += impact;
          this.heat[j] += impact;
        }
      }

      x += vx; y += vy; z += vz;
      const damp = 1 - 0.55 * dt;
      vx *= damp; vy *= damp; vz *= damp;
      this.heat[i] *= 1 - 2.2 * dt;
      this.positions[ix] = x; this.positions[ix + 1] = y; this.positions[ix + 2] = z;
      this.velocities[ix] = vx; this.velocities[ix + 1] = vy; this.velocities[ix + 2] = vz;
    }

    this.writeInstances();
    this.composer.render();
  }

  destroy() {
    this.pause();
    this.resizeObserver?.disconnect();
    window.removeEventListener('pointermove', this.onPointerMove);
    this.geometry?.dispose();
    this.material?.dispose();
    this.composer?.dispose();
    this.renderer?.dispose();
  }
}
