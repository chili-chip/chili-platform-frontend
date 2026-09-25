import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  NgZone,
  signal,
  viewChild,
} from '@angular/core';
import * as THREE from '../../../vendor/three';

import { VgcZeroComponent } from '../../shared/vgc-zero/vgc-zero';
import { createChiliChip, type ChiliChipRig } from './console-model';

@Component({
  selector: 'app-console-stage',
  imports: [VgcZeroComponent],
  templateUrl: './console-stage.html',
  styleUrl: './console-stage.scss',
})
export class ConsoleStageComponent {
  readonly failed = signal(false);

  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewportRef = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private renderer?: THREE.WebGLRenderer;
  private rig?: ChiliChipRig;
  private raf = 0;
  private reduced = false;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private yaw = 0.35;
  private pitch = -0.08;
  private bobTime = 0;
  private lastStamp = 0;
  private readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);

  constructor() {
    afterNextRender(() => this.mount());
  }

  onPointerDown(event: PointerEvent): void {
    const canvas = event.currentTarget;
    if (!(canvas instanceof HTMLCanvasElement)) {
      return;
    }
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.yaw += dx * 0.008;
    this.pitch = clamp(this.pitch + dy * 0.005, -0.7, 0.45);
  }

  onPointerUp(): void {
    this.dragging = false;
  }

  private mount(): void {
    const canvas = this.canvasRef().nativeElement;
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reduced = reducedQuery.matches;
    const onReduced = (event: MediaQueryListEvent) => {
      this.reduced = event.matches;
    };
    reducedQuery.addEventListener('change', onReduced);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      this.failed.set(true);
      return;
    }
    if (!renderer.getContext()) {
      renderer.dispose();
      this.failed.set(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer = renderer;

    const scene = new THREE.Scene();
    let rig: ChiliChipRig;
    try {
      rig = createChiliChip();
    } catch {
      renderer.dispose();
      this.failed.set(true);
      return;
    }
    this.rig = rig;
    rig.setExplode(0);
    scene.add(rig.root);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.ShadowMaterial({ opacity: 0.38 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.2;
    ground.receiveShadow = true;
    scene.add(ground);

    scene.add(new THREE.AmbientLight(0xc5cedd, 0.55));
    const key = new THREE.DirectionalLight(0xfff6ee, 3.4);
    key.position.set(2.8, 4.6, 4.2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 16;
    key.shadow.camera.left = -2.5;
    key.shadow.camera.right = 2.5;
    key.shadow.camera.top = 2.5;
    key.shadow.camera.bottom = -2.5;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xff3b3b, 1.7);
    rim.position.set(-3.5, 1.6, -2.4);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0x7dffb3, 0.35);
    fill.position.set(-2.2, 0.4, 3.2);
    scene.add(fill);

    this.camera.position.set(0.05, 0.1, 7.2);
    this.camera.lookAt(0, 0.05, 0);

    const viewport = this.viewportRef().nativeElement;
    const resize = new ResizeObserver(() => this.resize());
    resize.observe(viewport);
    this.resize();

    this.zone.runOutsideAngular(() => {
      this.lastStamp = performance.now();
      const frame = (now: number) => {
        this.raf = requestAnimationFrame(frame);
        this.frame(now);
      };
      this.raf = requestAnimationFrame(frame);
    });

    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(this.raf);
      reducedQuery.removeEventListener('change', onReduced);
      resize.disconnect();
      rig.dispose();
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      renderer.dispose();
    });
  }

  private resize(): void {
    const renderer = this.renderer;
    const viewport = this.viewportRef().nativeElement;
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    if (!renderer || width === 0 || height === 0) {
      return;
    }
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  private frame(now: number): void {
    const renderer = this.renderer;
    const rig = this.rig;
    if (!renderer || !rig) {
      return;
    }
    const dt = Math.min(0.05, (now - this.lastStamp) / 1000);
    this.lastStamp = now;
    this.bobTime += dt;
    rig.root.rotation.y = this.yaw;
    rig.root.rotation.x = this.pitch;
    rig.root.position.y = this.reduced ? 0 : Math.sin(this.bobTime * 1.35) * 0.06;
    if (!this.reduced) {
      rig.tickScreen(this.bobTime);
    }
    renderer.render(rig.root.parent as THREE.Scene, this.camera);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
