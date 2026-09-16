// @ts-nocheck
import * as THREE from 'three/webgpu';
import {
  EPSILON, color, deltaTime, dot, float, Fn, hash, If, instancedArray,
  instanceIndex, Loop, mix, positionLocal, uniform, uint, vec3, PI2,
} from 'three/tsl';

export type FieldFilter = 'all' | 'game' | 'ai' | 'web' | 'mobile' | 'tool';
const COUNT = 720;

function filterCode(filter: FieldFilter) {
  if (filter === 'game') return 1;
  if (filter === 'ai' || filter === 'mobile') return 2;
  if (filter === 'tool' || filter === 'web') return 3;
  return 0;
}

export default class ParticleField {
  constructor({ $canvas }) {
    this.$canvas = $canvas;
    this.playing = false;
    this.tick = this.tick.bind(this);
    this.resize = this.resize.bind(this);
  }

  async init() {
    this.setSizes();
    this.renderer = new THREE.WebGPURenderer({ canvas: this.$canvas, antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
    this.renderer.setSize(this.sizes.width, this.sizes.height, false);
    await this.renderer.init();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, this.sizes.width / Math.max(this.sizes.height, 1), 0.1, 80);
    this.camera.position.set(0, 0, 16);
    this.scene.add(this.camera);
    this.ambient = new THREE.AmbientLight(0xb8fff6, 0.55);
    this.scene.add(this.ambient);
    this.dir = new THREE.DirectionalLight(0x7ef0e0, 0.65);
    this.dir.position.set(4, 6, 8);
    this.scene.add(this.dir);
    this.setCursor();
    this.setParticles();
    this.resize();
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(this.$canvas.parentElement || document.body);
  }

  setSizes() {
    const w = this.$canvas.parentElement?.clientWidth || window.innerWidth;
    const h = this.$canvas.parentElement?.clientHeight || window.innerHeight;
    this.sizes = { width: w, height: h, pixelRatio: Math.min(window.devicePixelRatio || 1, 2) };
  }

  setCursor() {
    this.cursor = {
      raycaster: new THREE.Raycaster(),
      ndc: new THREE.Vector2(),
      plane: new THREE.Plane(this.camera.position.clone().normalize(), 0),
      intersect: new THREE.Vector3(),
      sampled: false,
    };
    this.onPointerMove = (event) => {
      const box = this.$canvas.getBoundingClientRect();
      this.cursor.ndc.x = ((event.clientX - box.left) / box.width) * 2 - 1;
      this.cursor.ndc.y = -((event.clientY - box.top) / box.height) * 2 + 1;
    };
    window.addEventListener('pointermove', this.onPointerMove);
  }

  setParticles() {
    const count = COUNT;
    this.positionsBuffer = instancedArray(count, 'vec3');
    this.velocitiesBuffer = instancedArray(count, 'vec3');
    this.heatBuffer = instancedArray(count, 'float');
    this.typesBuffer = instancedArray(count, 'float');
    this.idsBuffer = instancedArray(count, 'float');
    this.radius = uniform(0.09);
    this.contactRadius = uniform(0.12);
    this.gravityStrength = uniform(0.018);
    this.impactDamping = uniform(0.08);
    this.generalDamping = uniform(0.45);
    this.heatDamping = uniform(2.4);
    this.heatImpactStrength = uniform(14);
    this.cursorPosition = uniform(vec3());
    this.cursorVelocity = uniform(vec3());
    this.cursorRadius = uniform(2.1);
    this.cursorStrength = uniform(0.05);
    this.cursorHeatStrength = uniform(22);
    this.filterMode = uniform(0);
    this.focusId = uniform(-1);
    this.themeMode = uniform(0);
    this.seeColor = uniform(color(0x0f766e));
    this.playColor = uniform(color(0x2dd4bf));
    this.rememberColor = uniform(color(0x99f6e4));
    this.hotColor = uniform(color(0x5eead4));

    const randomSphericalPosition = Fn(([seed = uint(0), radius = float(1)]) => {
      const u = hash(seed);
      const v = hash(seed.add(123).mul(2));
      const w = hash(seed.add(456).mul(3));
      const theta = u.mul(PI2);
      const phi = v.remap(0, 1, -1, 1).acos();
      const sinPhi = phi.sin();
      const r = radius.mul(w.pow(1 / 3));
      return vec3(theta.sin().mul(sinPhi), phi.cos(), theta.cos().mul(sinPhi)).mul(r);
    });

    const initCompute = Fn(() => {
      const position = this.positionsBuffer.element(instanceIndex);
      const type = this.typesBuffer.element(instanceIndex);
      const id = this.idsBuffer.element(instanceIndex);
      position.assign(randomSphericalPosition(instanceIndex, 4.2));
      position.mulAssign(vec3(3.4, 2.2, 1.05));
      type.assign(hash(instanceIndex.add(7)).mul(3).floor());
      id.assign(hash(instanceIndex.add(99)).mul(12).floor());
    })().compute(count);
    this.renderer.compute(initCompute);

    this.updateCompute = Fn(() => {
      const dt = deltaTime.min(1 / 30);
      const aPosition = this.positionsBuffer.element(instanceIndex);
      const aVelocity = this.velocitiesBuffer.element(instanceIndex);
      const aHeat = this.heatBuffer.element(instanceIndex);
      const aType = this.typesBuffer.element(instanceIndex);
      const aId = this.idsBuffer.element(instanceIndex);
      const cursorDistance = aPosition.distance(this.cursorPosition);
      const ratio = cursorDistance.div(this.cursorRadius).remap(0.45, 1).oneMinus().max(0);
      const pushed = this.cursorVelocity.mul(ratio).mul(this.cursorStrength);
      aVelocity.addAssign(pushed);
      aHeat.addAssign(pushed.length().mul(this.cursorHeatStrength));
      const toCenter = aPosition.negate().normalize();
      aVelocity.addAssign(toCenter.mul(this.gravityStrength).mul(dt));
      If(this.focusId.greaterThanEqual(0).and(aId.sub(this.focusId).abs().lessThan(0.5)), () => {
        aHeat.addAssign(float(0.045));
        aVelocity.addAssign(toCenter.mul(-0.004));
      });
      const mode = this.filterMode;
      const inactive = mode.greaterThan(0.5).and(
        mode.equal(1).and(aType.notEqual(1))
          .or(mode.equal(2).and(aType.notEqual(0)))
          .or(mode.equal(3).and(aType.notEqual(2))),
      );
      If(inactive, () => {
        aVelocity.mulAssign(0.82);
        aHeat.mulAssign(0.85);
      });
      Loop({ start: instanceIndex.add(1), end: instanceIndex.add(28), condition: '<', name: 'i' }, ({ i }) => {
        const other = i.mod(count);
        const bPosition = this.positionsBuffer.element(other);
        const bVelocity = this.velocitiesBuffer.element(other);
        const bHeat = this.heatBuffer.element(other);
        const delta = bPosition.sub(aPosition);
        const distance = delta.length();
        const direction = delta.div(distance.max(EPSILON));
        const radius2 = this.contactRadius.mul(2);
        If(distance.lessThan(radius2), () => {
          const avoidance = direction.mul(radius2.sub(distance).div(2));
          aPosition.subAssign(avoidance);
          bPosition.addAssign(avoidance);
          const impactStrength = dot(aVelocity.sub(bVelocity), direction);
          const impactVelocity = direction.mul(impactStrength).mul(this.impactDamping.oneMinus());
          aVelocity.subAssign(impactVelocity);
          bVelocity.addAssign(impactVelocity);
          const heat = impactStrength.sub(0.01).max(0).mul(this.heatImpactStrength);
          aHeat.addAssign(heat);
          bHeat.addAssign(heat);
        });
      });
      aPosition.addAssign(aVelocity);
      aVelocity.mulAssign(this.generalDamping.mul(dt).oneMinus());
      aHeat.mulAssign(this.heatDamping.mul(dt).oneMinus());
    })().compute(count);

    this.geometry = new THREE.IcosahedronGeometry(1, 1);
    this.material = new THREE.MeshLambertNodeMaterial({ transparent: true, opacity: 0.92 });
    this.material.positionNode = Fn(() => {
      const aType = this.typesBuffer.element(instanceIndex);
      const mode = this.filterMode;
      const inactive = mode.greaterThan(0.5).and(
        mode.equal(1).and(aType.notEqual(1))
          .or(mode.equal(2).and(aType.notEqual(0)))
          .or(mode.equal(3).and(aType.notEqual(2))),
      );
      const scale = mix(this.radius, this.radius.mul(0.22), inactive.select(1, 0));
      positionLocal.mulAssign(scale);
      positionLocal.addAssign(this.positionsBuffer.element(instanceIndex));
      return positionLocal;
    })();
    const heat = this.heatBuffer.element(instanceIndex);
    const aType = this.typesBuffer.element(instanceIndex);
    const base = mix(this.seeColor, mix(this.playColor, this.rememberColor, aType.greaterThan(1.5).select(1, 0)), aType.greaterThan(0.5).select(1, 0));
    this.material.colorNode = mix(base, this.hotColor, heat.saturate());
    this.material.emissiveNode = this.hotColor.mul(heat.saturate().mul(1.8));
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.count = count;
    this.scene.add(this.mesh);
  }

  setFilter(filter) {
    if (this.filterMode) this.filterMode.value = filterCode(filter);
  }

  setFocus(projectId) {
    if (!this.focusId) return;
    if (!projectId) { this.focusId.value = -1; return; }
    let hashVal = 0;
    for (let i = 0; i < projectId.length; i++) hashVal = (hashVal + projectId.charCodeAt(i) * (i + 3)) % 12;
    this.focusId.value = hashVal;
  }

  setTheme(theme) {
    if (!this.themeMode) return;
    this.themeMode.value = theme === 'dark' ? 1 : 0;
    if (theme === 'dark') {
      this.seeColor.value.set(0x5eead4);
      this.playColor.value.set(0x2dd4bf);
      this.rememberColor.value.set(0xccfbf1);
      this.hotColor.value.set(0xa5f3fc);
      this.ambient.intensity = 0.28;
      this.dir.intensity = 0.4;
    } else {
      this.seeColor.value.set(0x0f766e);
      this.playColor.value.set(0x14b8a6);
      this.rememberColor.value.set(0x5eead4);
      this.hotColor.value.set(0x2dd4bf);
      this.ambient.intensity = 0.55;
      this.dir.intensity = 0.65;
    }
  }

  play() {
    if (this.playing) return;
    this.playing = true;
    this.cursor.sampled = false;
    this.renderer.setAnimationLoop(this.tick);
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    this.renderer.setAnimationLoop(null);
  }

  resize() {
    this.setSizes();
    if (!this.sizes.width || !this.sizes.height || !this.renderer) return;
    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
    this.renderer.setSize(this.sizes.width, this.sizes.height, false);
  }

  tick() {
    this.cursor.raycaster.setFromCamera(this.cursor.ndc, this.camera);
    this.cursor.raycaster.ray.intersectPlane(this.cursor.plane, this.cursor.intersect);
    if (this.cursor.sampled) this.cursorVelocity.value.copy(this.cursor.intersect).sub(this.cursorPosition.value);
    else this.cursorVelocity.value.set(0, 0, 0);
    this.cursorPosition.value.copy(this.cursor.intersect);
    this.cursor.sampled = true;
    this.renderer.compute(this.updateCompute);
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.pause();
    this.resizeObserver?.disconnect();
    window.removeEventListener('pointermove', this.onPointerMove);
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.geometry.dispose();
      this.material.dispose();
    }
    for (const buffer of [this.positionsBuffer, this.velocitiesBuffer, this.heatBuffer, this.typesBuffer, this.idsBuffer]) {
      buffer?.value?.dispose?.();
    }
    this.renderer?.dispose();
  }
}
