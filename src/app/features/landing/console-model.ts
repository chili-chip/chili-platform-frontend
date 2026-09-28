import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import * as THREE from '../../../vendor/three';

export interface VgcZeroRig {
  root: THREE.Group;
  dispose: () => void;
}

const MODEL_URL = '/models/vgc-zero.glb';
const SCREEN_FRAME_URLS = ['/models/console-screen-0.png', '/models/console-screen-1.png'];
const SCREEN_FRAME_MS = 400;
/** Longest axis after normalize — fills the sticky hero column. */
const TARGET_SIZE = 5.5;

export async function loadVgcZeroModel(): Promise<VgcZeroRig> {
  const loader = new GLTFLoader();
  const [gltf, screen] = await Promise.all([loader.loadAsync(MODEL_URL), loadScreenTexture()]);

  const root = new THREE.Group();
  const scaled = new THREE.Group();
  const offset = new THREE.Group();
  const orient = new THREE.Group();
  orient.rotation.set(Math.PI / 2 - 0.35, 0.55, 0);
  orient.add(gltf.scene);
  offset.add(orient);
  scaled.add(offset);
  root.add(scaled);

  const disposables: Array<THREE.BufferGeometry | THREE.Material> = [];
  const displays: THREE.Mesh[] = [];

  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) {
      return;
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.geometry.computeVertexNormals();

    const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const nextMaterials = sourceMaterials.map((material) => {
      const color =
        material instanceof THREE.MeshStandardMaterial
          ? material.color.clone()
          : new THREE.Color(0x6f7d96);
      color.offsetHSL(0, 0.04, 0.14);
      const next = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.12,
        roughness: 0.62,
        dithering: false,
        side: THREE.FrontSide,
      });
      disposables.push(next);
      return next;
    });
    mesh.material = nextMaterials.length === 1 ? nextMaterials[0] : nextMaterials;
    if (isDisplayMesh(mesh)) {
      displays.push(mesh);
    }
  });

  for (const display of displays) {
    const overlay = createScreenOverlay(display, screen.texture);
    disposables.push(overlay.geometry, overlay.material as THREE.Material);
  }

  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(orient);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  offset.position.copy(center).multiplyScalar(-1);

  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  scaled.scale.setScalar(TARGET_SIZE / maxDim);
  root.updateMatrixWorld(true);

  return {
    root,
    dispose() {
      screen.dispose();
      for (const item of disposables) {
        item.dispose();
      }
    },
  };
}

function isDisplayMesh(mesh: THREE.Mesh): boolean {
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox;
  if (!box) {
    return false;
  }
  const size = box.getSize(new THREE.Vector3());
  const dims = [size.x, size.y, size.z].sort((a, b) => a - b);
  const [thin, mid, long] = dims;
  return thin < mid * 0.2 && mid / long > 0.85 && mid > 15;
}

function createScreenOverlay(mesh: THREE.Mesh, texture: THREE.Texture): THREE.Mesh {
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox;
  if (!box) {
    return new THREE.Mesh();
  }
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const axes: Array<'x' | 'y' | 'z'> = ['x', 'y', 'z'];
  axes.sort((a, b) => size[b] - size[a]);
  const [uAxis, vAxis, thinAxis] = axes;
  const inset = 0.92;
  const overlay = new THREE.Mesh(
    new THREE.PlaneGeometry(size[uAxis] * inset, size[vAxis] * inset),
    new THREE.MeshBasicMaterial({
      map: texture,
      toneMapped: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  overlay.position.copy(center);
  overlay.position[thinAxis] = box.max[thinAxis] + Math.max(size[thinAxis] * 0.35, 0.2);
  overlay.castShadow = false;
  overlay.receiveShadow = false;
  overlay.renderOrder = 2;
  if (thinAxis === 'x') {
    overlay.rotation.y = Math.PI / 2;
  } else if (thinAxis === 'y') {
    overlay.rotation.x = -Math.PI / 2;
  }
  mesh.add(overlay);
  return overlay;
}

async function loadScreenTexture(): Promise<{ texture: THREE.Texture; dispose: () => void }> {
  const images = await Promise.all(SCREEN_FRAME_URLS.map(loadImage));
  const canvas = document.createElement('canvas');
  canvas.width = images[0]?.naturalWidth || 512;
  canvas.height = images[0]?.naturalHeight || 512;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Screen canvas unavailable');
  }
  context.imageSmoothingEnabled = false;

  let frame = 0;
  const draw = () => {
    const image = images[frame];
    if (image) {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    }
  };
  draw();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  const timer = window.setInterval(() => {
    frame = (frame + 1) % images.length;
    draw();
    texture.needsUpdate = true;
  }, SCREEN_FRAME_MS);

  return {
    texture,
    dispose() {
      window.clearInterval(timer);
      texture.dispose();
    },
  };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${url}`));
    image.src = url;
  });
}
