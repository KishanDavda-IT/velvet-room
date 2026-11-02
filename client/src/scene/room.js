import * as THREE from 'three';
import { ROOM } from '../constants.js';

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function buildRoom(scene, { camera = null, canvas = null, onDrink = () => {} } = {}) {
  const group = new THREE.Group();
  group.name = 'CinemaRoom';
  const drinkTargets = [];

  // Floor: BoxGeometry(16, 0.1, 20) at y = -0.05
  const floorGeo = new THREE.BoxGeometry(ROOM.W, 0.1, ROOM.D);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1a0f1a,
    roughness: 0.95,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, -0.05, 0);
  floor.receiveShadow = true;
  group.add(floor);

  // A colored runner and patterned riser carpet break up the dark floor.
  const carpetMat = new THREE.MeshStandardMaterial({ color: 0x38203d, roughness: 0.94 });
  const carpetGoldMat = new THREE.MeshStandardMaterial({ color: 0xb27c39, roughness: 0.78 });
  const carpetTealMat = new THREE.MeshStandardMaterial({ color: 0x276b70, roughness: 0.88 });
  function floorTile(width, depth, x, y, z, material) {
    const tile = new THREE.Mesh(new THREE.BoxGeometry(width, 0.014, depth), material);
    tile.position.set(x, y, z);
    group.add(tile);
    return tile;
  }
  floorTile(8.4, 8.2, 0, 0.008, -4.35, carpetMat);
  floorTile(0.1, 7.9, -4.0, 0.018, -4.35, carpetGoldMat);
  floorTile(0.1, 7.9, 4.0, 0.018, -4.35, carpetGoldMat);
  for (let i = 0; i < 6; i += 1) {
    floorTile(0.38, 0.38, -2.85 + i * 1.14, 0.019, -7.25, i % 2 ? carpetTealMat : carpetGoldMat);
  }
  floorTile(11.5, 3.15, 0, 0.51, 3, carpetMat);
  floorTile(0.08, 3.0, -5.62, 0.522, 3, carpetGoldMat);
  floorTile(0.08, 3.0, 5.62, 0.522, 3, carpetGoldMat);

  // Walls and ceiling: BackSide BoxGeometry(16, 7, 20) centered at (0, 3.5, 0)
  const shellGeo = new THREE.BoxGeometry(ROOM.W, ROOM.H, ROOM.D);
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x120a18,
    roughness: 1,
    side: THREE.BackSide,
  });
  const shell = new THREE.Mesh(shellGeo, shellMat);
  shell.position.set(0, 3.5, 0);
  shell.receiveShadow = true;
  group.add(shell);

  // Very subtle floating dust catches the projector glow and gives the room a
  // lived-in, physical atmosphere without adding another texture or asset.
  const dustPositions = [];
  const dustPhases = [];
  for (let i = 0; i < 42; i += 1) {
    dustPositions.push(
      (Math.random() - 0.5) * 13,
      1.25 + Math.random() * 4.6,
      -8.4 + Math.random() * 14
    );
    dustPhases.push(Math.random() * Math.PI * 2);
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
  const dustMaterial = new THREE.PointsMaterial({
    color: 0xf1c77c,
    size: 0.045,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.renderOrder = 2;
  group.add(dust);

  // Dark acoustic wall panels and ceiling moulding sell the proportions of a
  // real screening room without adding heavy external assets.
  const wallPanelMat = new THREE.MeshStandardMaterial({ color: 0x241426, roughness: 0.86 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x6c452d, roughness: 0.5, metalness: 0.16 });
  for (const side of [-1, 1]) {
    for (const z of [-7.7, -4.9, -2.1, 0.7, 3.5, 6.3]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.7, 1.85), wallPanelMat);
      panel.position.set(side * 7.88, 2.85, z);
      panel.rotation.y = side < 0 ? -0.08 : 0.08;
      panel.receiveShadow = true;
      group.add(panel);
    }
  }
  const ceilingTrim = new THREE.Mesh(new THREE.BoxGeometry(15.7, 0.16, 0.22), trimMat);
  ceilingTrim.position.set(0, 6.72, -9.45);
  group.add(ceilingTrim);

  // Riser: BoxGeometry(12, 0.5, 3.4) at (0, 0.25, 3)
  const riserGeo = new THREE.BoxGeometry(12, 0.5, 3.4);
  const riserMat = new THREE.MeshStandardMaterial({
    color: 0x1f1424,
    roughness: 0.9,
  });
  const riser = new THREE.Mesh(riserGeo, riserMat);
  riser.position.set(0, 0.25, 3);
  group.add(riser);

  // Screen frame: black BoxGeometry(10, 5.8, 0.2) at (0, 3.6, -9.95)
  const frameGeo = new THREE.BoxGeometry(10, 5.8, 0.2);
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.8,
  });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  // Keep the frame behind the screen plane to avoid z-fighting while the
  // canvas/video texture is changing frames.
  frame.position.set(0, 3.6, -10.2);
  frame.castShadow = true;
  group.add(frame);

  const screenTrimMat = new THREE.MeshStandardMaterial({ color: 0x9f6b35, roughness: 0.38, metalness: 0.3 });
  const screenTrimParts = [
    [10.15, 0.12, 0.28, 0, 6.38, -10.08],
    [10.15, 0.12, 0.28, 0, 0.82, -10.08],
    [0.12, 5.68, 0.28, -5.02, 3.6, -10.08],
    [0.12, 5.68, 0.28, 5.02, 3.6, -10.08],
  ];
  for (const [w, h, d, x, y, z] of screenTrimParts) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), screenTrimMat);
    trim.position.set(x, y, z);
    group.add(trim);
  }

  // Curtains: two BoxGeometry(2.4, 6.4, 0.3) velvet (0x8c1c2c, roughness 0.9) at x = ±6.2, y = 3.4, z = -9.7
  const curtainMat = new THREE.MeshStandardMaterial({
    color: 0x8c1c2c,
    roughness: 0.9,
  });
  const curtainGeo = new THREE.BoxGeometry(2.4, 6.4, 0.3);

  const leftCurtain = new THREE.Mesh(curtainGeo, curtainMat);
  leftCurtain.position.set(-6.2, 3.4, -9.7);
  group.add(leftCurtain);

  const rightCurtain = new THREE.Mesh(curtainGeo, curtainMat);
  rightCurtain.position.set(6.2, 3.4, -9.7);
  group.add(rightCurtain);

  // Repeating folds catch the warm room light and make the velvet drapery read
  // as fabric instead of two flat blocks.
  const foldMat = new THREE.MeshStandardMaterial({ color: 0x5f1422, roughness: 0.96 });
  const curtainDetails = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i += 1) {
      const fold = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 6.05, 10), foldMat);
      fold.position.set(side * (5.35 + i * 0.34), 3.35, -9.91);
      curtainDetails.push({ mesh: fold, side, offset: -0.85 + i * 0.34 });
      group.add(fold);
    }
    const tieback = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.055, 8, 20), screenTrimMat);
    tieback.position.set(side * 5.38, 2.25, -10.02);
    tieback.rotation.x = Math.PI / 2;
    curtainDetails.push({ mesh: tieback, side, offset: -0.82 });
    group.add(tieback);
  }

  // Valance: BoxGeometry(16, 0.7, 0.4) at (0, 6.6, -9.6)
  const valanceGeo = new THREE.BoxGeometry(16, 0.7, 0.4);
  const valance = new THREE.Mesh(valanceGeo, curtainMat);
  valance.position.set(0, 6.6, -9.6);
  group.add(valance);

  // Sconces: four small BoxGeometry(0.2, 0.4, 0.2) with MeshBasicMaterial({ color: 0xffb36b })
  const sconceGeo = new THREE.BoxGeometry(0.2, 0.4, 0.2);
  const sconceMat = new THREE.MeshBasicMaterial({ color: 0xffb36b });
  const sconceCoords = [
    [-7.5, 3, -4],
    [7.5, 3, -4],
    [-7.5, 3, 4],
    [7.5, 3, 4],
  ];
  for (const [x, y, z] of sconceCoords) {
    const sconce = new THREE.Mesh(sconceGeo, sconceMat);
    sconce.position.set(x, y, z);
    sconce.castShadow = true;
    group.add(sconce);
  }

  const aisleLightMat = new THREE.MeshBasicMaterial({ color: 0xffc66d });
  for (const z of [-7.4, -5.8, -4.2, -2.6, -1, 0.6, 2.2, 3.8, 5.4]) {
    for (const x of [-5.8, 5.8]) {
      const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.025, 12), aisleLightMat);
      marker.position.set(x, 0.04 + (z >= 1.25 ? 0.5 : 0), z);
      group.add(marker);
    }
  }

  // Wall-mounted speaker cabinets, aimed into the screening room.
  const speakerBodyMat = new THREE.MeshStandardMaterial({ color: 0x17131b, roughness: 0.7, metalness: 0.12 });
  const speakerFaceMat = new THREE.MeshStandardMaterial({ color: 0x302b36, roughness: 0.86 });
  const speakerConeMat = new THREE.MeshStandardMaterial({ color: 0x111016, roughness: 0.9 });
  for (const side of [-1, 1]) {
    for (const z of [-2.6, 2.0]) {
      const speaker = new THREE.Group();
      speaker.position.set(side * 7.78, 3.5, z);
      speaker.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2;
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.15, 0.38), speakerBodyMat);
      const face = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.96, 0.025), speakerFaceMat);
      face.position.z = -0.205;
      speaker.add(cabinet, face);
      for (const [y, radius] of [[0.19, 0.23], [-0.22, 0.12]]) {
        const cone = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.035, 24), speakerConeMat);
        cone.rotation.x = Math.PI / 2;
        cone.position.set(0, y, -0.23);
        speaker.add(cone);
      }
      group.add(speaker);
    }
  }

  // A compact back-corner drinks counter with colorful bottles and glasses.
  const barWoodMat = new THREE.MeshStandardMaterial({ color: 0x3a2022, roughness: 0.72 });
  const barTopMat = new THREE.MeshStandardMaterial({ color: 0x8b5b44, roughness: 0.38, metalness: 0.08 });
  const bottleMaterials = [0x3e9c68, 0xc67c37, 0x754da0, 0x4384a1].map((color) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.08 })
  );
  const barX = 5.15;
  const barZ = 8.55;
  const counter = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.82, 0.9), barWoodMat);
  counter.position.set(barX, 0.41, barZ);
  group.add(counter);
  drinkTargets.push(counter);
  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(4.95, 0.12, 0.98), barTopMat);
  counterTop.position.set(barX, 0.88, barZ);
  group.add(counterTop);
  drinkTargets.push(counterTop);
  for (const [i, x] of [-1.65, -0.55, 0.55, 1.65].entries()) {
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.62, 12), bottleMaterials[i]);
    bottle.position.set(barX + x, 1.25, barZ - 0.08);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 0.2, 10), bottleMaterials[i]);
    neck.position.set(barX + x, 1.66, barZ - 0.08);
    group.add(bottle, neck);
    drinkTargets.push(bottle, neck);
  }
  for (const x of [-0.35, 0.15, 0.65]) {
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.075, 0.28, 12, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xb7d9d9, transparent: true, opacity: 0.58, roughness: 0.2 })
    );
    glass.position.set(barX + x, 1.08, barZ - 0.2);
    group.add(glass);
    drinkTargets.push(glass);
  }
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 128;
  const signContext = signCanvas.getContext('2d');
  if (signContext) {
    signContext.fillStyle = '#261a27';
    signContext.fillRect(0, 0, 512, 128);
    signContext.strokeStyle = '#d4a24c';
    signContext.lineWidth = 6;
    signContext.strokeRect(8, 8, 496, 112);
    signContext.fillStyle = '#f4ecdc';
    signContext.font = 'bold 64px Georgia, serif';
    signContext.textAlign = 'center';
    signContext.textBaseline = 'middle';
    signContext.fillText('DRINKS', 256, 64);
  }
  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.66),
    new THREE.MeshBasicMaterial({ map: signTexture, side: THREE.DoubleSide })
  );
  sign.position.set(barX, 2.5, 9.86);
  sign.rotation.y = Math.PI;
  group.add(sign);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerDown = null;
  function onDrinkPointerDown(event) {
    pointerDown = { x: event.clientX, y: event.clientY };
  }
  function onDrinkPointerUp(event) {
    if (!pointerDown || !camera || !canvas) {
      pointerDown = null;
      return;
    }
    const distance = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
    pointerDown = null;
    if (distance > 6) return;
    const bounds = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1
    );
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.intersectObjects(drinkTargets, false).length > 0) onDrink();
  }
  function onDrinkPointerCancel() {
    pointerDown = null;
  }
  if (canvas) {
    canvas.addEventListener('pointerdown', onDrinkPointerDown);
    canvas.addEventListener('pointerup', onDrinkPointerUp);
    canvas.addEventListener('pointercancel', onDrinkPointerCancel);
  }

  scene.add(group);

  // Curtain tween state
  // Base width is 2.4; at x = ±6.2 the outer edge is at ±(6.2 + 1.2) = ±7.4
  const OUTER_EDGE_X = 7.4;
  const HALF_WIDTH = 1.2;
  let currentScaleX = 1.0;
  let tweenFrom = 1.0;
  let tweenTo = 1.0;
  let tweenStart = 0;
  let tweenActive = false;
  const TWEEN_DURATION_MS = 1500;

  function applyCurtainScale(scaleX) {
    currentScaleX = scaleX;
    const absPosX = OUTER_EDGE_X - HALF_WIDTH * scaleX;
    leftCurtain.scale.x = scaleX;
    rightCurtain.scale.x = scaleX;
    leftCurtain.position.x = -absPosX;
    rightCurtain.position.x = absPosX;
    curtainDetails.forEach(({ mesh, side, offset }) => {
      mesh.position.x = side * absPosX + side * offset;
      mesh.visible = scaleX > 0.22;
    });
  }

  function setCurtainsOpen(isOpen) {
    const target = isOpen ? 0.15 : 1.0;
    if (Math.abs(target - tweenTo) < 0.001 && (tweenActive || Math.abs(currentScaleX - target) < 0.001)) {
      return;
    }
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      tweenActive = false;
      tweenTo = target;
      applyCurtainScale(target);
      return;
    }
    tweenFrom = currentScaleX;
    tweenTo = target;
    tweenStart = performance.now();
    tweenActive = true;
  }

  function update(dt, now) {
    const positions = dustGeometry.attributes.position;
    for (let i = 0; i < dustPhases.length; i += 1) {
      const index = i * 3;
      positions.array[index] += Math.sin(now * 0.00022 + dustPhases[i]) * dt * 0.018;
      positions.array[index + 1] += Math.sin(now * 0.00034 + dustPhases[i]) * dt * 0.012;
      if (positions.array[index] > 6.7) positions.array[index] = -6.7;
      if (positions.array[index] < -6.7) positions.array[index] = 6.7;
      if (positions.array[index + 1] > 5.95) positions.array[index + 1] = 1.15;
      if (positions.array[index + 1] < 1.15) positions.array[index + 1] = 5.95;
    }
    positions.needsUpdate = true;
    if (!tweenActive) return;
    const elapsed = now - tweenStart;
    const t = Math.min(Math.max(elapsed / TWEEN_DURATION_MS, 0), 1);
    const eased = easeInOutCubic(t);
    const scaleX = tweenFrom + (tweenTo - tweenFrom) * eased;
    applyCurtainScale(scaleX);
    if (t >= 1) {
      tweenActive = false;
    }
  }

  return {
    group,
    setCurtainsOpen,
    update,
    dispose() {
      canvas?.removeEventListener('pointerdown', onDrinkPointerDown);
      canvas?.removeEventListener('pointerup', onDrinkPointerUp);
      canvas?.removeEventListener('pointercancel', onDrinkPointerCancel);
      dustGeometry.dispose();
      dustMaterial.dispose();
    },
  };
}
