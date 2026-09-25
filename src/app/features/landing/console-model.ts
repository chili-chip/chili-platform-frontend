import * as THREE from '../../../vendor/three';

export interface ConsolePart {
  id: string;
  object: THREE.Group;
  home: THREE.Vector3;
  explode: THREE.Vector3;
}

export interface ChiliChipRig {
  root: THREE.Group;
  parts: ConsolePart[];
  tickScreen: (time: number) => void;
  setExplode: (amount: number) => void;
  dispose: () => void;
}

const geos: THREE.BufferGeometry[] = [];
const mats: THREE.Material[] = [];

export function createChiliChip(): ChiliChipRig {
  const root = new THREE.Group();
  const parts: ConsolePart[] = [];

  const shellMat = mat(0x3a4356, { roughness: 0.32, metalness: 0.28 });
  const shellEdge = mat(0x4c566b, { roughness: 0.36, metalness: 0.22 });
  const dark = mat(0x0c0f14, { roughness: 0.55, metalness: 0.08 });
  const cream = mat(0xd7cfc3, { roughness: 0.4, metalness: 0.05 });
  const chili = mat(0xff3b3b, { roughness: 0.38, metalness: 0.08 });
  const phosphor = mat(0x7dffb3, { roughness: 0.4, metalness: 0.04 });
  const amber = mat(0xffb347, { roughness: 0.42, metalness: 0.05 });
  const pcbMat = mat(0x1c6b38, { roughness: 0.62, metalness: 0.12 });
  const chipMat = mat(0x141414, { roughness: 0.35, metalness: 0.4 });
  const batteryMat = mat(0x2a3140, { roughness: 0.55, metalness: 0.2 });
  const gold = mat(0xc6a15b, { roughness: 0.3, metalness: 0.7 });

  const rear = group('rear', new THREE.Vector3(0, 0, -0.05), new THREE.Vector3(0, 0, -0.62));
  rear.object.add(mesh(roundedBox(1.22, 1.94, 0.22, 0.12), shellEdge));
  for (const [x, y] of [
    [-0.48, 0.78],
    [0.48, 0.78],
    [-0.48, -0.78],
    [0.48, -0.78],
  ] as const) {
    const screw = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12), dark);
    screw.rotation.x = Math.PI / 2;
    screw.position.set(x, y, 0.1);
    rear.object.add(screw);
  }
  add(root, parts, rear);

  const battery = group('battery', new THREE.Vector3(0, -0.08, -0.04), new THREE.Vector3(0, -0.22, -0.28));
  battery.object.add(mesh(roundedBox(0.74, 1.08, 0.07, 0.06), batteryMat));
  const cellLabel = mesh(new THREE.PlaneGeometry(0.46, 0.28), basic(wordTexture('LiPo  ·  9h', '#f4f1ea', '#2a3140')));
  cellLabel.position.z = 0.037;
  battery.object.add(cellLabel);
  const wire = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 8), chili);
  wire.position.set(0.18, 0.58, 0.02);
  battery.object.add(wire);
  add(root, parts, battery);

  const mcu = group('mcu', new THREE.Vector3(0, 0.02, 0.02), new THREE.Vector3(0, 0.06, 0.02));
  mcu.object.add(mesh(roundedBox(0.98, 1.52, 0.035, 0.04), pcbMat));
  const chip = mesh(roundedBox(0.34, 0.34, 0.03, 0.02), chipMat);
  chip.position.set(0, 0.12, 0.03);
  mcu.object.add(chip);
  const chipLabel = mesh(new THREE.PlaneGeometry(0.28, 0.1), basic(wordTexture('RP2350', '#d7cfc3', '#141414')));
  chipLabel.position.set(0, 0.12, 0.047);
  mcu.object.add(chipLabel);
  for (let i = 0; i < 5; i += 1) {
    const pad = mesh(new THREE.BoxGeometry(0.08, 0.045, 0.012), gold);
    pad.position.set(-0.32 + i * 0.16, -0.62, 0.02);
    mcu.object.add(pad);
  }
  const usb = mesh(new THREE.BoxGeometry(0.16, 0.06, 0.04), dark);
  usb.position.set(0, -0.76, 0);
  mcu.object.add(usb);
  add(root, parts, mcu);

  const speaker = group('speaker', new THREE.Vector3(0, -0.64, 0.01), new THREE.Vector3(0, -0.48, 0.22));
  const buzzer = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.045, 20), dark);
  buzzer.rotation.x = Math.PI / 2;
  speaker.object.add(buzzer);
  const cone = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.01, 16), mat(0x3a4252, { roughness: 0.4, metalness: 0.3 }));
  cone.rotation.x = Math.PI / 2;
  cone.position.z = 0.02;
  speaker.object.add(cone);
  add(root, parts, speaker);

  const front = group('front', new THREE.Vector3(0, 0, 0.115), new THREE.Vector3(0, 0, 0.58));
  front.object.add(mesh(roundedBox(1.1, 1.74, 0.055, 0.1), shellMat));
  const word = mesh(new THREE.PlaneGeometry(0.46, 0.08), basic(wordTexture('CHILICHIP', '#f4f1ea', '#3a4356')));
  word.position.set(0, -0.5, 0.03);
  front.object.add(word);
  for (let i = 0; i < 6; i += 1) {
    const hole = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8), dark);
    hole.rotation.x = Math.PI / 2;
    hole.position.set(-0.07 + (i % 3) * 0.07, -0.64 + Math.floor(i / 3) * 0.05, 0.03);
    front.object.add(hole);
  }
  const led = mesh(
    new THREE.SphereGeometry(0.018, 12, 12),
    mat(0x7dffb3, { emissive: 0x7dffb3, emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.1 }),
  );
  led.position.set(0.42, 0.72, 0.03);
  front.object.add(led);
  add(root, parts, front);

  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 128;
  screenCanvas.height = 128;
  const screenCtx = screenCanvas.getContext('2d');
  if (!screenCtx) {
    throw new Error('2d context unavailable');
  }
  screenCtx.imageSmoothingEnabled = false;
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.magFilter = THREE.NearestFilter;
  screenTexture.minFilter = THREE.NearestFilter;
  const screenMat = new THREE.MeshBasicMaterial({
    map: screenTexture,
  });
  mats.push(screenMat);

  const display = group('display', new THREE.Vector3(0, 0.38, 0.17), new THREE.Vector3(0, 0.2, 0.42));
  display.object.add(mesh(roundedBox(0.84, 0.84, 0.03, 0.05), dark));
  const glass = mesh(new THREE.PlaneGeometry(0.7, 0.7), screenMat);
  glass.position.z = 0.045;
  display.object.add(glass);
  add(root, parts, display);

  const dpad = group('dpad', new THREE.Vector3(-0.3, -0.28, 0.17), new THREE.Vector3(-0.32, -0.16, 0.5));
  const keyMat = mat(0x151920, { roughness: 0.45, metalness: 0.15 });
  const key = 0.11;
  const reach = 0.075;
  for (const [x, y] of [
    [0, reach],
    [0, -reach],
    [-reach, 0],
    [reach, 0],
  ] as const) {
    const button = mesh(roundedBox(key, key * 1.05, 0.04, 0.02), keyMat);
    button.position.set(x, y, 0);
    dpad.object.add(button);
  }
  add(root, parts, dpad);

  const face = group('face', new THREE.Vector3(0.32, -0.24, 0.17), new THREE.Vector3(0.34, -0.1, 0.5));
  faceButton(face.object, 0.12, 0, chili, 'A');
  faceButton(face.object, -0.12, 0, cream, 'B');
  faceButton(face.object, 0, 0.12, phosphor, 'X');
  faceButton(face.object, 0, -0.12, amber, 'Y');
  add(root, parts, face);

  const system = group('system', new THREE.Vector3(0, 0.02, 0.165), new THREE.Vector3(0, 0.04, 0.36));
  systemButton(system.object, -0.16, 'MENU');
  systemButton(system.object, 0.16, 'HOME');
  add(root, parts, system);

  paintScreen(screenCtx, 0);
  screenTexture.needsUpdate = true;

  return {
    root,
    parts,
    tickScreen(time: number) {
      paintScreen(screenCtx, time);
      screenTexture.needsUpdate = true;
    },
    setExplode(amount: number) {
      for (const part of parts) {
        part.object.position.copy(part.home).addScaledVector(part.explode, amount);
      }
    },
    dispose() {
      screenTexture.dispose();
      for (const geometry of geos) {
        geometry.dispose();
      }
      for (const material of mats) {
        material.dispose();
      }
      geos.length = 0;
      mats.length = 0;
    },
  };
}

function add(root: THREE.Group, parts: ConsolePart[], part: ConsolePart): void {
  part.object.position.copy(part.home);
  root.add(part.object);
  parts.push(part);
}

function group(id: string, home: THREE.Vector3, explode: THREE.Vector3): ConsolePart {
  return { id, object: new THREE.Group(), home, explode };
}

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
  geos.push(geometry);
  const object = new THREE.Mesh(geometry, material);
  object.castShadow = true;
  return object;
}

function mat(
  color: number,
  opts: { roughness: number; metalness: number; emissive?: number; emissiveIntensity?: number },
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness,
    metalness: opts.metalness,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
  });
  mats.push(material);
  return material;
}

function basic(texture: THREE.CanvasTexture): THREE.MeshBasicMaterial {
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  mats.push(material);
  return material;
}

function faceButton(parent: THREE.Group, x: number, y: number, material: THREE.Material, letter: string): void {
  const cap = mesh(new THREE.CylinderGeometry(0.062, 0.066, 0.04, 22), material);
  cap.rotation.x = Math.PI / 2;
  cap.position.set(x, y, 0);
  parent.add(cap);
  const label = mesh(
    new THREE.CircleGeometry(0.04, 18),
    basic(wordTexture(letter, '#1a0a0d', '#00000000')),
  );
  label.position.set(x, y, 0.022);
  parent.add(label);
}

function systemButton(parent: THREE.Group, x: number, label: string): void {
  const button = mesh(roundedBox(0.22, 0.07, 0.032, 0.02), mat(0x10141c, { roughness: 0.4, metalness: 0.2 }));
  button.position.set(x, 0, 0);
  parent.add(button);
  const text = mesh(new THREE.PlaneGeometry(0.16, 0.04), basic(wordTexture(label, '#f4f1ea', '#10141c')));
  text.position.set(x, 0, 0.018);
  parent.add(text);
}

function roundedBox(width: number, height: number, depth: number, radius: number): THREE.ExtrudeGeometry {
  const bevel = Math.min(radius * 0.45, depth * 0.22);
  const geometry = new THREE.ExtrudeGeometry(roundedRect(width, height, radius), {
    depth: Math.max(depth - bevel * 2, 0.008),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.55,
    bevelSegments: 2,
    curveSegments: 4,
  });
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (box) {
    geometry.translate(
      -(box.min.x + box.max.x) / 2,
      -(box.min.y + box.max.y) / 2,
      -(box.min.z + box.max.z) / 2,
    );
  }
  geometry.computeVertexNormals();
  return geometry;
}

function roundedRect(width: number, height: number, radius: number): THREE.Shape {
  const r = Math.min(radius, width / 2, height / 2);
  const w = width / 2;
  const h = height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.absarc(w - r, -h + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(w, h - r);
  shape.absarc(w - r, h - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-w + r, h);
  shape.absarc(-w + r, h - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-w, -h + r);
  shape.absarc(-w + r, -h + r, r, Math.PI, Math.PI * 1.5, false);
  return shape;
}

function wordTexture(text: string, color: string, background: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2d context unavailable');
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (background !== '#00000000') {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.fillStyle = color;
  ctx.font = '600 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function paintScreen(ctx: CanvasRenderingContext2D, time: number): void {
  ctx.fillStyle = '#143024';
  ctx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      if (y < 10) {
        continue;
      }
      ctx.fillStyle = (x + y) % 2 === 0 ? '#2f8f4e' : '#1f6b38';
      ctx.fillRect(x * 8, y * 8, 8, 8);
    }
  }
  ctx.fillStyle = '#b6ffd0';
  ctx.fillRect(0, 80, 128, 2);
  ctx.fillStyle = '#ffd27a';
  ctx.fillRect(100, 14, 12, 12);
  ctx.fillStyle = '#ff6b35';
  ctx.fillRect(18, 58, 6, 10);
  ctx.fillRect(20, 52, 2, 6);
  const step = Math.floor(time * 3) % 8;
  const px = 48 + step * 6;
  ctx.fillStyle = '#f4f1ea';
  ctx.fillRect(px, 64, 8, 10);
  ctx.fillStyle = '#ff3b3b';
  ctx.fillRect(px + 2, 58, 4, 6);
  ctx.fillStyle = '#7dffb3';
  ctx.fillRect(px, 74, 3, 6);
  ctx.fillRect(px + 5, 74, 3, 6);
  ctx.fillStyle = '#7dffb3';
  ctx.font = '8px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('ROOM 01', 6, 6);
}
