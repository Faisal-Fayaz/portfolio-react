// @ts-nocheck
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export type FieldFilter = 'all' | 'game' | 'ai' | 'web' | 'mobile' | 'tool';

const RING = [
  { count: 22, radius: 1.55, tiltX: 0.42, tiltZ: 0.1, speed: 0.14, type: 0, color: 0x5ff2ff },
  { count: 28, radius: 2.15, tiltX: -0.28, tiltZ: 0.32, speed: -0.1, type: 1, color: 0xd946ef },
  { count: 18, radius: 2.72, tiltX: 0.72, tiltZ: -0.16, speed: 0.07, type: 2, color: 0xfbbf24 },
];

function filterCode(filter) {
  if (filter === 'game') return 1;
  if (filter === 'ai' || filter === 'mobile') return 2;
  if (filter === 'tool' || filter === 'web') return 3;
  return 0;
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
    this.onScroll = this.onScroll.bind(this);
  }

  async init() {
    this.setSizes();
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.$canvas, antialias: true, alpha: true, powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
    this.renderer.setSize(this.sizes.width, this.sizes.height, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, this.sizes.width / this.sizes.height, 0.1, 40);
    this.camera.position.set(0, 0.1, 11);
    this.scene.add(this.camera);
    this.scene.add(new THREE.AmbientLight(0x9ad8e8, 0.32));
    const key = new THREE.DirectionalLight(0xffffff, 0.95);
    key.position.set(2.5, 3.5, 6);
    this.scene.add(key);
    this.rim = new THREE.PointLight(0x5ff2ff, 10, 14);
    this.rim.position.set(3, 1, 3);
    this.scene.add(this.rim);

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.38, 1),
      new THREE.MeshStandardMaterial({
        color: 0x06141c, emissive: 0x2dd4bf, emissiveIntensity: 0.45, roughness: 0.28, metalness: 0.62,
      }),
    );
    this.coreWire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.41, 1),
      new THREE.MeshBasicMaterial({ color: 0x5ff2ff, wireframe: true, transparent: true, opacity: 0.22 }),
    );
    this.root.add(this.core, this.coreWire);

    this.ringGroups = [];
    this.dummy = new THREE.Object3D();
    this.color = new THREE.Color();
    this.hot = new THREE.Color(0xf8fafc);
    this.tmp = new THREE.Vector3();
    const nodeGeo = new THREE.OctahedronGeometry(0.06, 0);

    RING.forEach((spec, ringIndex) => {
      const group = new THREE.Group();
      group.rotation.x = spec.tiltX;
      group.rotation.z = spec.tiltZ;
      this.root.add(group);
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(spec.radius, 0.007, 6, 128),
        new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: 0.2 }),
      );
      group.add(torus);
      const mesh = new THREE.InstancedMesh(nodeGeo, new THREE.MeshStandardMaterial({
        color: spec.color, emissive: spec.color, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.35,
      }), spec.count);
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(spec.count * 3), 3);
      mesh.frustumCulled = false;
      group.add(mesh);
      const items = [];
      for (let i = 0; i < spec.count; i++) {
        items.push({ angle: (i / spec.count) * Math.PI * 2, heat: 0, type: spec.type, id: (i + ringIndex * 7) % 12, radius: spec.radius });
      }
      this.ringGroups.push({ spec, group, torus, mesh, items });
    });

    this.spokeCount = 8;
    this.spokePositions = new Float32Array(this.spokeCount * 6);
    this.spokeGeo = new THREE.BufferGeometry();
    this.spokeGeo.setAttribute('position', new THREE.BufferAttribute(this.spokePositions, 3));
    this.spokes = new THREE.LineSegments(this.spokeGeo, new THREE.LineBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.16 }));
    this.root.add(this.spokes);

    this.cursor = {
      ndc: new THREE.Vector2(0.35, 0.05),
      raycaster: new THREE.Raycaster(),
      plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
      hit: new THREE.Vector3(),
      local: new THREE.Vector3(),
    };
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(this.sizes.width, this.sizes.height), 0.28, 0.55, 0.32);
    this.composer.addPass(this.bloom);
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.resize();
    this.placeOnCard();
    this.resizeObserver = new ResizeObserver(() => { this.resize(); this.placeOnCard(); });
    this.resizeObserver.observe(document.documentElement);
    this.setTheme(this.theme);
  }

  setSizes() {
    this.sizes = { width: window.innerWidth, height: window.innerHeight, pixelRatio: Math.min(window.devicePixelRatio || 1, 1.75) };
  }

  ndcToPlane(ndcX, ndcY, target) {
    this.cursor.raycaster.setFromCamera({ x: ndcX, y: ndcY }, this.camera);
    this.cursor.raycaster.ray.intersectPlane(this.cursor.plane, target);
    return target;
  }

  placeOnCard() {
    const card = document.querySelector('.profile-card');
    if (!card || !this.root) { this.root.position.set(2.6, 0.05, 0); this.root.scale.setScalar(1); return; }
    const r = card.getBoundingClientRect();
    const cx = ((r.left + r.width * 0.52) / window.innerWidth) * 2 - 1;
    const cy = -((r.top + r.height * 0.55) / window.innerHeight) * 2 + 1;
    this.ndcToPlane(cx, cy, this.tmp);
    this.root.position.copy(this.tmp);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    this.ndcToPlane(0, 0, a);
    this.ndcToPlane(r.width / window.innerWidth, 0, b);
    const target = Math.max(0.72, Math.min(1.05, Math.abs(b.x - a.x) * 0.55));
    this.root.scale.setScalar(target);
  }

  onPointerMove(event) {
    this.cursor.ndc.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.cursor.ndc.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  onScroll() {
    const hero = document.querySelector('.hero');
    const h = hero ? hero.getBoundingClientRect().bottom : window.innerHeight * 0.7;
    this.$canvas.style.opacity = String(THREE.MathUtils.clamp(h / (window.innerHeight * 0.55), 0, 1));
  }

  isInactive(type) {
    if (this.filterMode === 0) return false;
    if (this.filterMode === 1) return type !== 1;
    if (this.filterMode === 2) return type !== 0;
    return type !== 2;
  }

  setFilter(filter) { this.filterMode = filterCode(filter); }

  setFocus(projectId) {
    if (!projectId) { this.focusId = -1; return; }
    let h = 0;
    for (let i = 0; i < projectId.length; i++) h = (h + projectId.charCodeAt(i) * (i + 3)) % 12;
    this.focusId = h;
  }

  setTheme(theme) {
    this.theme = theme;
    if (!this.bloom) return;
    if (theme === 'dark') {
      this.bloom.strength = 0.32; this.bloom.threshold = 0.28; this.rim.intensity = 11;
      this.core.material.emissiveIntensity = 0.5; this.coreWire.material.opacity = 0.22;
    } else {
      this.bloom.strength = 0.14; this.bloom.threshold = 0.46; this.rim.intensity = 5;
      this.core.material.emissiveIntensity = 0.28; this.coreWire.material.opacity = 0.14;
    }
  }

  play() {
    if (this.playing) return;
    this.playing = true;
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
    if (!this.renderer || !this.sizes.width) return;
    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
    this.renderer.setSize(this.sizes.width, this.sizes.height, false);
    this.composer?.setSize(this.sizes.width, this.sizes.height);
    this.bloom?.setSize(this.sizes.width, this.sizes.height);
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 1 / 30);
    this.elapsed += dt;
    this.cursor.raycaster.setFromCamera(this.cursor.ndc, this.camera);
    this.cursor.raycaster.ray.intersectPlane(this.cursor.plane, this.cursor.hit);
    this.cursor.local.copy(this.cursor.hit);
    this.root.worldToLocal(this.cursor.local);

    this.core.scale.setScalar(1 + Math.sin(this.elapsed * 1.4) * 0.03);
    this.coreWire.rotation.y = this.elapsed * 0.22;
    this.core.rotation.y = this.elapsed * -0.1;
    this.core.rotation.x = Math.sin(this.elapsed * 0.35) * 0.08;
    this.root.rotation.y = Math.sin(this.elapsed * 0.1) * 0.05;
    this.root.rotation.x = Math.sin(this.elapsed * 0.08) * 0.03;

    const hottest = [];
    for (const ring of this.ringGroups) {
      const inactive = this.isInactive(ring.spec.type);
      ring.group.rotation.y += ring.spec.speed * dt;
      ring.torus.material.opacity = inactive ? 0.04 : 0.2;
      for (let i = 0; i < ring.items.length; i++) {
        const n = ring.items[i];
        const x = Math.cos(n.angle) * n.radius;
        const z = Math.sin(n.angle) * n.radius;
        this.tmp.set(x, 0, z);
        ring.group.localToWorld(this.tmp);
        this.root.worldToLocal(this.tmp);
        const d = this.tmp.distanceTo(this.cursor.local);
        const near = Math.max(0, 1 - d / 1.35);
        n.heat = n.heat * (1 - 2.6 * dt) + near * near * 0.75;
        if (this.focusId >= 0 && n.id === this.focusId) n.heat = Math.min(1, n.heat + 0.04);
        const heat = Math.min(1, n.heat);
        const s = inactive ? 0.45 : 0.85 + heat * 0.55;
        this.dummy.position.set(x, heat * 0.12, z);
        this.dummy.scale.set(s, s, s);
        this.dummy.rotation.set(0, n.angle, this.elapsed * 0.3);
        this.dummy.updateMatrix();
        ring.mesh.setMatrixAt(i, this.dummy.matrix);
        this.color.setHex(ring.spec.color).lerp(this.hot, heat * 0.65);
        if (inactive) this.color.multiplyScalar(0.16);
        ring.mesh.setColorAt(i, this.color);
        if (!inactive && heat > 0.42) hottest.push({ x: this.tmp.x, y: this.tmp.y, z: this.tmp.z, heat });
      }
      ring.mesh.instanceMatrix.needsUpdate = true;
      if (ring.mesh.instanceColor) ring.mesh.instanceColor.needsUpdate = true;
    }

    hottest.sort((a, b) => b.heat - a.heat);
    for (let i = 0; i < this.spokeCount; i++) {
      const o = i * 6;
      this.spokePositions[o] = this.spokePositions[o + 1] = this.spokePositions[o + 2] = 0;
      const t = hottest[i];
      this.spokePositions[o + 3] = t ? t.x : 0;
      this.spokePositions[o + 4] = t ? t.y : 0;
      this.spokePositions[o + 5] = t ? t.z : 0;
    }
    this.spokeGeo.attributes.position.needsUpdate = true;
    this.spokes.material.opacity = 0.08 + Math.min(0.18, hottest.length * 0.02);
    this.composer.render();
  }

  destroy() {
    this.pause();
    this.resizeObserver?.disconnect();
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('scroll', this.onScroll);
    this.renderer?.dispose();
    this.composer?.dispose();
  }
}
