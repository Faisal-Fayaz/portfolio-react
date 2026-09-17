// @ts-nocheck
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export type FieldFilter = 'all' | 'game' | 'ai' | 'web' | 'mobile' | 'tool';

const RING = [
  { count: 28, radius: 2.15, tiltX: 0.55, tiltZ: 0.18, speed: 0.18, type: 0, dark: 0x5ff2ff, light: 0x0f766e },
  { count: 36, radius: 3.05, tiltX: -0.4, tiltZ: 0.5, speed: -0.13, type: 1, dark: 0xff4fd8, light: 0xa21caf },
  { count: 22, radius: 3.85, tiltX: 1.05, tiltZ: -0.25, speed: 0.09, type: 2, dark: 0xffb454, light: 0xb45309 },
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
    this.useBloom = true;
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
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, this.sizes.width / this.sizes.height, 0.1, 60);
    this.camera.position.set(0, 0.15, 10);
    this.scene.add(this.camera);
    this.ambient = new THREE.AmbientLight(0x8fd4ff, 0.35);
    this.scene.add(this.ambient);
    this.key = new THREE.DirectionalLight(0xffffff, 1.2);
    this.key.position.set(3, 4, 6);
    this.scene.add(this.key);
    this.rim = new THREE.PointLight(0x5ff2ff, 18, 16);
    this.rim.position.set(-2, 1.4, 3);
    this.scene.add(this.rim);

    this.root = new THREE.Group();
    this.root.position.set(2.35, 0.15, 0);
    this.scene.add(this.root);

    this.core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.62, 1),
      new THREE.MeshStandardMaterial({
        color: 0x07212a,
        emissive: 0x5ff2ff,
        emissiveIntensity: 0.55,
        roughness: 0.25,
        metalness: 0.55,
      }),
    );
    this.coreWire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.66, 1),
      new THREE.MeshBasicMaterial({ color: 0x5ff2ff, wireframe: true, transparent: true, opacity: 0.35 }),
    );
    this.root.add(this.core, this.coreWire);

    this.ringGroups = [];
    this.dummy = new THREE.Object3D();
    this.color = new THREE.Color();
    this.hot = new THREE.Color(0xffffff);
    const nodeGeo = new THREE.OctahedronGeometry(1, 0);

    RING.forEach((spec, ringIndex) => {
      const group = new THREE.Group();
      group.rotation.x = spec.tiltX;
      group.rotation.z = spec.tiltZ;
      this.root.add(group);
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(spec.radius, 0.012, 8, 96),
        new THREE.MeshBasicMaterial({ color: spec.dark, transparent: true, opacity: 0.28 }),
      );
      group.add(torus);
      const mesh = new THREE.InstancedMesh(nodeGeo, new THREE.MeshStandardMaterial({
        color: spec.dark,
        emissive: spec.dark,
        emissiveIntensity: 0.8,
        roughness: 0.3,
        metalness: 0.4,
      }), spec.count);
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(spec.count * 3), 3);
      mesh.frustumCulled = false;
      group.add(mesh);
      const items = [];
      for (let i = 0; i < spec.count; i++) {
        items.push({
          angle: (i / spec.count) * Math.PI * 2,
          heat: 0,
          type: spec.type,
          id: (i + ringIndex * 7) % 12,
          radius: spec.radius,
        });
      }
      this.ringGroups.push({ spec, group, torus, mesh, items });
    });

    const spokeCount = 18;
    this.spokePositions = new Float32Array(spokeCount * 6);
    this.spokeGeo = new THREE.BufferGeometry();
    this.spokeGeo.setAttribute('position', new THREE.BufferAttribute(this.spokePositions, 3));
    this.spokes = new THREE.LineSegments(
      this.spokeGeo,
      new THREE.LineBasicMaterial({ color: 0x5ff2ff, transparent: true, opacity: 0.22 }),
    );
    this.root.add(this.spokes);
    this.spokeCount = spokeCount;

    this.cursor = {
      ndc: new THREE.Vector2(0.25, 0.1),
      raycaster: new THREE.Raycaster(),
      plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
      hit: new THREE.Vector3(),
      local: new THREE.Vector3(),
    };
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(this.sizes.width, this.sizes.height), 0.45, 0.65, 0.2);
    this.composer.addPass(this.bloom);
    this.clock = new THREE.Clock();
    this.elapsed = 0;
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

  ringColor(spec) {
    return this.theme === 'light' ? spec.light : spec.dark;
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
      this.useBloom = true;
      this.renderer.setClearColor(0x000000, 0);
      this.bloom.strength = 0.55;
      this.bloom.threshold = 0.16;
      this.rim.color.set(0x5ff2ff);
      this.rim.intensity = 18;
      this.ambient.intensity = 0.35;
      this.core.material.color.set(0x07212a);
      this.core.material.emissive.set(0x5ff2ff);
      this.core.material.emissiveIntensity = 0.65;
      this.coreWire.material.color.set(0x5ff2ff);
      this.coreWire.material.opacity = 0.35;
      this.spokes.material.color.set(0x5ff2ff);
      this.hot.set(0xffffff);
    } else {
      this.useBloom = false;
      this.renderer.setClearColor(0xf0f5fa, 0);
      this.rim.color.set(0x0f766e);
      this.rim.intensity = 4;
      this.ambient.intensity = 0.7;
      this.core.material.color.set(0xd1fae5);
      this.core.material.emissive.set(0x0f766e);
      this.core.material.emissiveIntensity = 0.18;
      this.coreWire.material.color.set(0x0f766e);
      this.coreWire.material.opacity = 0.4;
      this.spokes.material.color.set(0x0f766e);
      this.hot.set(0x134e4a);
    }
    for (const ring of this.ringGroups) {
      const c = this.ringColor(ring.spec);
      ring.torus.material.color.setHex(c);
      ring.mesh.material.color.setHex(c);
      ring.mesh.material.emissive.setHex(c);
      ring.mesh.material.emissiveIntensity = theme === 'dark' ? 0.8 : 0.15;
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

    const breathe = 1 + Math.sin(this.elapsed * 1.6) * 0.04;
    this.core.scale.setScalar(breathe);
    this.coreWire.rotation.y = this.elapsed * 0.25;
    this.core.rotation.y = this.elapsed * -0.12;
    this.core.rotation.x = Math.sin(this.elapsed * 0.4) * 0.12;
    this.root.rotation.y = Math.sin(this.elapsed * 0.12) * 0.08;
    this.root.rotation.x = Math.sin(this.elapsed * 0.09) * 0.04;

    const tmp = new THREE.Vector3();
    const hottest = [];
    const isLight = this.theme === 'light';
    for (const ring of this.ringGroups) {
      const inactive = this.isInactive(ring.spec.type);
      ring.group.rotation.y += ring.spec.speed * dt;
      ring.torus.material.opacity = inactive ? 0.04 : (isLight ? 0.45 : 0.32);
      const baseHex = this.ringColor(ring.spec);
      for (let i = 0; i < ring.items.length; i++) {
        const n = ring.items[i];
        const x = Math.cos(n.angle) * n.radius;
        const z = Math.sin(n.angle) * n.radius;
        tmp.set(x, 0, z);
        ring.group.localToWorld(tmp);
        this.root.worldToLocal(tmp);
        const d = tmp.distanceTo(this.cursor.local);
        const near = Math.max(0, 1 - d / 1.8);
        n.heat = n.heat * (1 - 2.4 * dt) + near * near * 0.9;
        if (this.focusId >= 0 && n.id === this.focusId) n.heat = Math.min(1, n.heat + 0.05);
        const lift = n.heat * 0.28;
        const s = inactive ? 0.025 : 0.055 + n.heat * 0.08;
        this.dummy.position.set(x, lift, z);
        this.dummy.scale.setScalar(s);
        this.dummy.rotation.set(n.angle, this.elapsed * 0.4, 0);
        this.dummy.updateMatrix();
        ring.mesh.setMatrixAt(i, this.dummy.matrix);
        this.color.setHex(baseHex).lerp(this.hot, Math.min(1, n.heat) * (isLight ? 0.35 : 1));
        if (inactive) this.color.multiplyScalar(isLight ? 0.35 : 0.18);
        ring.mesh.setColorAt(i, this.color);
        if (!inactive && n.heat > 0.35) hottest.push({ x: tmp.x, y: tmp.y, z: tmp.z, heat: n.heat });
      }
      ring.mesh.instanceMatrix.needsUpdate = true;
      if (ring.mesh.instanceColor) ring.mesh.instanceColor.needsUpdate = true;
    }

    hottest.sort((a, b) => b.heat - a.heat);
    for (let i = 0; i < this.spokeCount; i++) {
      const o = i * 6;
      this.spokePositions[o] = 0;
      this.spokePositions[o + 1] = 0;
      this.spokePositions[o + 2] = 0;
      const t = hottest[i];
      if (t) {
        this.spokePositions[o + 3] = t.x;
        this.spokePositions[o + 4] = t.y;
        this.spokePositions[o + 5] = t.z;
      } else {
        this.spokePositions[o + 3] = 0;
        this.spokePositions[o + 4] = 0;
        this.spokePositions[o + 5] = 0;
      }
    }
    this.spokeGeo.attributes.position.needsUpdate = true;
    this.spokes.material.opacity = isLight ? 0.2 : 0.12 + Math.min(0.35, hottest.length * 0.03);

    if (this.useBloom) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.pause();
    this.resizeObserver?.disconnect();
    window.removeEventListener('pointermove', this.onPointerMove);
    this.renderer?.dispose();
    this.composer?.dispose();
  }
}
