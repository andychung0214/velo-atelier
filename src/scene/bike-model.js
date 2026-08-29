import { createMaterials } from './materials.js';
import {
  curvedTube,
  disposeHierarchy,
  markMaterial,
  markPart,
  tubeBetween,
} from './primitives.js';

const STRUCTURAL_KEYS = ['frame', 'brake', 'wheel', 'drivetrain', 'cockpit'];
const COLOR_KEYS = [
  'frameColor',
  'forkColor',
  'rimColor',
  'accentColor',
  'tapeColor',
  'saddleColor',
  'hardwareColor',
  'textColor',
];
const WHEEL_RADIUS = 0.86;
const REAR_X = -1.73;
const FRONT_X = 1.73;
const AXLE_Y = 0.88;

function vector(THREE, x, y, z = 0) {
  return new THREE.Vector3(x, y, z);
}

function createPartGroup(THREE, partId, name = partId) {
  const group = markPart(new THREE.Group(), partId);
  group.name = name;
  return group;
}

function addMesh(group, mesh, materialKey) {
  if (materialKey) markMaterial(mesh, materialKey);
  group.add(mesh);
  return mesh;
}

function addTube(THREE, group, start, end, radiusStart, radiusEnd, material, materialKey) {
  return addMesh(
    group,
    tubeBetween(THREE, start, end, radiusStart, radiusEnd, material),
    materialKey,
  );
}

function geometryForFrame(frame) {
  if (frame === 'aero') {
    return {
      bottomBracket: [-0.3, 0.86],
      seatTop: [-0.53, 2.13],
      headTop: [0.77, 2.14],
      headBottom: [0.91, 1.2],
      tubeScale: 1.22,
    };
  }

  if (frame === 'endurance') {
    return {
      bottomBracket: [-0.38, 0.84],
      seatTop: [-0.61, 2.08],
      headTop: [0.72, 2.26],
      headBottom: [0.9, 1.18],
      tubeScale: 0.98,
    };
  }

  return {
    bottomBracket: [-0.36, 0.84],
    seatTop: [-0.58, 2.13],
    headTop: [0.77, 2.12],
    headBottom: [0.91, 1.14],
    tubeScale: 1,
  };
}

function buildFrame(THREE, root, config, materials) {
  const geometry = geometryForFrame(config.frame);
  const bb = vector(THREE, ...geometry.bottomBracket, 0);
  const seat = vector(THREE, ...geometry.seatTop, 0);
  const headTop = vector(THREE, ...geometry.headTop, 0);
  const headBottom = vector(THREE, ...geometry.headBottom, 0);
  const rearLeft = vector(THREE, REAR_X, AXLE_Y, -0.075);
  const rearRight = vector(THREE, REAR_X, AXLE_Y, 0.075);

  const frame = createPartGroup(THREE, 'frame');
  addTube(THREE, frame, bb, seat, 0.083 * geometry.tubeScale, 0.066, materials.frame, 'frameColor');
  addTube(THREE, frame, headBottom, headTop, 0.09, 0.082, materials.frame, 'frameColor');
  addTube(THREE, frame, rearLeft, vector(THREE, bb.x, bb.y, -0.055), 0.034, 0.052, materials.frame, 'frameColor');
  addTube(THREE, frame, rearRight, vector(THREE, bb.x, bb.y, 0.055), 0.034, 0.052, materials.frame, 'frameColor');
  addTube(THREE, frame, rearLeft, vector(THREE, seat.x, seat.y - 0.1, -0.042), 0.027, 0.042, materials.frame, 'frameColor');
  addTube(THREE, frame, rearRight, vector(THREE, seat.x, seat.y - 0.1, 0.042), 0.027, 0.042, materials.frame, 'frameColor');

  const bbShell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.19, 24),
    materials.frame,
  );
  bbShell.rotation.x = Math.PI / 2;
  bbShell.position.copy(bb);
  bbShell.castShadow = true;
  addMesh(frame, bbShell, 'frameColor');

  const topTube = createPartGroup(THREE, 'topTube');
  const topRadius = config.frame === 'aero' ? 0.105 : 0.07;
  addTube(THREE, topTube, seat, headTop, topRadius, topRadius * 0.9, materials.frame, 'frameColor');
  const accentStart = seat.clone().lerp(headTop, 0.08).add(vector(THREE, 0, 0.045, 0));
  const accentEnd = seat.clone().lerp(headTop, 0.92).add(vector(THREE, 0, 0.045, 0));
  addTube(THREE, topTube, accentStart, accentEnd, 0.012, 0.012, materials.accent, 'accentColor');

  const downTube = createPartGroup(THREE, 'downTube');
  const downRadius = config.frame === 'aero' ? 0.135 : 0.095;
  addTube(THREE, downTube, headBottom, bb, downRadius * 0.88, downRadius, materials.frame, 'frameColor');

  const fork = createPartGroup(THREE, 'fork');
  const forkCrown = headBottom.clone().add(vector(THREE, 0.02, -0.08, 0));
  addTube(THREE, fork, headTop, headBottom, 0.055, 0.07, materials.fork, 'forkColor');
  for (const z of [-0.075, 0.075]) {
    addTube(
      THREE,
      fork,
      vector(THREE, forkCrown.x, forkCrown.y, z * 0.62),
      vector(THREE, FRONT_X, AXLE_Y, z),
      0.054,
      0.026,
      materials.fork,
      'forkColor',
    );
  }

  root.add(frame, topTube, downTube, fork);
  return { bb, seat, headTop, headBottom };
}

function createWheel(THREE, style, x, isRear, materials) {
  const side = isRear ? 'rear' : 'front';
  const resolvedStyle = style === 'disc' && !isRear ? 'deep' : style;
  const wheel = new THREE.Group();
  wheel.name = `${side}-${resolvedStyle}-wheel`;
  wheel.position.set(x, AXLE_Y, 0);

  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(WHEEL_RADIUS, 0.031, 12, 96),
    materials.rubber,
  );
  tire.castShadow = true;
  tire.receiveShadow = true;
  wheel.add(tire);

  const rimDepth = resolvedStyle === 'deep' ? 0.15 : 0.055;
  const rimOuter = WHEEL_RADIUS - 0.045;
  const rimInner = rimOuter - rimDepth;
  const rimRing = new THREE.Mesh(
    new THREE.RingGeometry(rimInner, rimOuter, 96),
    materials.rim,
  );
  rimRing.position.z = isRear ? -0.006 : 0.006;
  rimRing.castShadow = true;
  addMesh(wheel, rimRing, 'rimColor');

  const rimEdge = new THREE.Mesh(
    new THREE.TorusGeometry(rimOuter, resolvedStyle === 'deep' ? 0.022 : 0.015, 10, 96),
    materials.rim,
  );
  addMesh(wheel, rimEdge, 'rimColor');

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.052, isRear ? 0.18 : 0.14, 20),
    materials.hardware,
  );
  hub.rotation.x = Math.PI / 2;
  hub.castShadow = true;
  addMesh(wheel, hub, 'hardwareColor');

  if (style === 'disc' && isRear) {
    wheel.name = 'rear-disc-wheel';
    const shell = new THREE.Mesh(
      new THREE.CircleGeometry(rimInner + 0.018, 96),
      materials.rim,
    );
    shell.position.z = -0.012;
    shell.castShadow = true;
    addMesh(wheel, shell, 'rimColor');

    const valveMark = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.11, 0.012),
      materials.accent,
    );
    valveMark.position.set(0, 0.52, 0.005);
    addMesh(wheel, valveMark, 'accentColor');
  } else {
    const spokeCount = resolvedStyle === 'deep' ? 12 : 22;
    for (let index = 0; index < spokeCount; index += 1) {
      const angle = (index / spokeCount) * Math.PI * 2;
      const hubOffset = index % 2 === 0 ? -0.045 : 0.045;
      const start = vector(THREE, 0, 0, hubOffset);
      const end = vector(
        THREE,
        Math.cos(angle) * (rimInner - 0.015),
        Math.sin(angle) * (rimInner - 0.015),
        -hubOffset * 0.25,
      );
      const spoke = tubeBetween(
        THREE,
        start,
        end,
        resolvedStyle === 'deep' ? 0.007 : 0.0035,
        resolvedStyle === 'deep' ? 0.004 : 0.0025,
        resolvedStyle === 'deep' ? materials.rim : materials.hardware,
        7,
      );
      addMesh(wheel, spoke, resolvedStyle === 'deep' ? 'rimColor' : 'hardwareColor');
    }
  }

  const axle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.28, 12),
    materials.darkHardware,
  );
  axle.rotation.x = Math.PI / 2;
  wheel.add(axle);
  return wheel;
}

function buildWheelset(THREE, root, config, materials) {
  const group = createPartGroup(THREE, 'wheelset');
  group.add(
    createWheel(THREE, config.wheel, REAR_X, true, materials),
    createWheel(THREE, config.wheel, FRONT_X, false, materials),
  );
  root.add(group);
}

function createRotor(THREE, x, materials) {
  const rotor = new THREE.Group();
  rotor.position.set(x, AXLE_Y, -0.095);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.17, 0.012, 8, 48),
    materials.rotor,
  );
  rotor.add(ring);
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    rotor.add(tubeBetween(
      THREE,
      vector(THREE, Math.cos(angle) * 0.048, Math.sin(angle) * 0.048, 0),
      vector(THREE, Math.cos(angle) * 0.16, Math.sin(angle) * 0.16, 0),
      0.006,
      0.004,
      materials.rotor,
      6,
    ));
  }
  return rotor;
}

function buildBrakes(THREE, root, config, materials) {
  const group = createPartGroup(THREE, 'brake');
  if (config.brake === 'disc') {
    group.name = 'brakes-disc';
    for (const x of [REAR_X, FRONT_X]) {
      group.add(createRotor(THREE, x, materials));
      const caliper = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.16, 0.08),
        materials.darkHardware,
      );
      caliper.position.set(x - 0.12, AXLE_Y + 0.11, -0.1);
      caliper.rotation.z = -0.35;
      caliper.castShadow = true;
      group.add(caliper);
    }
  } else {
    group.name = 'brakes-caliper';
    for (const x of [REAR_X, FRONT_X]) {
      const y = AXLE_Y + WHEEL_RADIUS - 0.06;
      addTube(THREE, group, vector(THREE, x - 0.11, y, -0.04), vector(THREE, x, y - 0.12, 0), 0.018, 0.014, materials.hardware, 'hardwareColor');
      addTube(THREE, group, vector(THREE, x + 0.11, y, 0.04), vector(THREE, x, y - 0.12, 0), 0.018, 0.014, materials.hardware, 'hardwareColor');
      const bridge = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.018, 8, 24, Math.PI),
        materials.hardware,
      );
      bridge.position.set(x, y - 0.01, 0);
      bridge.rotation.z = Math.PI;
      addMesh(group, bridge, 'hardwareColor');
    }
  }
  root.add(group);
}

function buildDrivetrain(THREE, root, config, materials, framePoints) {
  const { bb } = framePoints;
  const crankset = createPartGroup(THREE, 'crankset');
  const chainring = new THREE.Mesh(
    new THREE.TorusGeometry(0.255, 0.018, 9, 52),
    materials.hardware,
  );
  chainring.position.set(bb.x, bb.y, 0.145);
  chainring.castShadow = true;
  addMesh(crankset, chainring, 'hardwareColor');
  const innerRing = chainring.clone();
  innerRing.scale.setScalar(0.72);
  innerRing.position.z = 0.125;
  addMesh(crankset, innerRing, 'hardwareColor');

  for (const direction of [-1, 1]) {
    const armStart = vector(THREE, bb.x, bb.y, direction > 0 ? 0.18 : -0.18);
    const armEnd = vector(THREE, bb.x + 0.12 * direction, bb.y + 0.3 * direction, direction > 0 ? 0.18 : -0.18);
    addTube(THREE, crankset, armStart, armEnd, 0.026, 0.021, materials.darkHardware);
    const pedal = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.035, 0.07),
      materials.darkHardware,
    );
    pedal.position.copy(armEnd);
    pedal.castShadow = true;
    crankset.add(pedal);
  }

  const cassette = createPartGroup(THREE, 'cassette');
  cassette.position.set(REAR_X, AXLE_Y, 0.13);
  for (let index = 0; index < 9; index += 1) {
    const radius = 0.09 + index * 0.009;
    const cog = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, 0.006, 24),
      materials.hardware,
    );
    cog.rotation.x = Math.PI / 2;
    cog.position.z = index * 0.009;
    addMesh(cassette, cog, 'hardwareColor');
  }

  const drivetrain = createPartGroup(THREE, 'drivetrain');
  const chainTop = tubeBetween(
    THREE,
    vector(THREE, REAR_X, AXLE_Y + 0.1, 0.2),
    vector(THREE, bb.x, bb.y + 0.22, 0.16),
    0.008,
    0.008,
    materials.chain,
    6,
  );
  const chainBottom = tubeBetween(
    THREE,
    vector(THREE, REAR_X, AXLE_Y - 0.1, 0.2),
    vector(THREE, bb.x, bb.y - 0.22, 0.16),
    0.008,
    0.008,
    materials.chain,
    6,
  );
  drivetrain.add(chainTop, chainBottom);

  const rearMech = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, config.drivetrain === 'electronic' ? 0.22 : 0.18, 0.08),
    materials.darkHardware,
  );
  rearMech.position.set(REAR_X + 0.08, AXLE_Y - 0.27, 0.16);
  rearMech.rotation.z = -0.35;
  rearMech.castShadow = true;
  drivetrain.add(rearMech);

  const jockeyWheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.012, 8, 24),
    materials.hardware,
  );
  jockeyWheel.position.set(REAR_X + 0.13, AXLE_Y - 0.4, 0.16);
  addMesh(drivetrain, jockeyWheel, 'hardwareColor');

  if (config.drivetrain === 'electronic') {
    const battery = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.038, 0.32, 6, 12),
      materials.darkHardware,
    );
    battery.position.set(-0.52, 1.28, -0.04);
    battery.rotation.z = 0.18;
    drivetrain.add(battery);
    drivetrain.name = 'electronic-drivetrain';
  } else {
    const cable = curvedTube(
      THREE,
      [
        vector(THREE, 0.83, 2.06, 0.06),
        vector(THREE, 0.3, 1.8, 0.08),
        vector(THREE, -0.6, 1.2, 0.1),
        vector(THREE, REAR_X + 0.1, AXLE_Y - 0.1, 0.16),
      ],
      0.009,
      materials.darkHardware,
      36,
    );
    drivetrain.add(cable);
    drivetrain.name = 'mechanical-drivetrain';
  }

  root.add(crankset, cassette, drivetrain);
}

function buildCockpit(THREE, root, config, materials, framePoints) {
  const { headTop } = framePoints;
  const cockpit = createPartGroup(THREE, 'cockpit');
  const tape = createPartGroup(THREE, 'barTape');
  const stemEnd = vector(THREE, headTop.x + (config.cockpit === 'integrated' ? 0.4 : 0.32), headTop.y + 0.03, 0);
  addTube(THREE, cockpit, headTop, stemEnd, 0.045, 0.04, materials.rim, 'rimColor');

  const centerBar = tubeBetween(
    THREE,
    vector(THREE, stemEnd.x, stemEnd.y, -0.38),
    vector(THREE, stemEnd.x, stemEnd.y, 0.38),
    config.cockpit === 'integrated' ? 0.04 : 0.028,
    config.cockpit === 'integrated' ? 0.04 : 0.028,
    materials.rim,
  );
  addMesh(cockpit, centerBar, 'rimColor');

  for (const z of [-0.38, 0.38]) {
    const outward = Math.sign(z);
    const points = [
      vector(THREE, stemEnd.x, stemEnd.y, z),
      vector(THREE, stemEnd.x + 0.13, stemEnd.y - 0.05, z + 0.015 * outward),
      vector(THREE, stemEnd.x + 0.18, stemEnd.y - 0.24, z + 0.025 * outward),
      vector(THREE, stemEnd.x + 0.1, stemEnd.y - 0.42, z + 0.02 * outward),
    ];
    addMesh(cockpit, curvedTube(THREE, points, 0.027, materials.rim), 'rimColor');
    const tapePath = points.map((point) => point.clone().add(vector(THREE, 0.002, 0, 0)));
    addMesh(tape, curvedTube(THREE, tapePath, 0.032, materials.tape), 'tapeColor');

    const hood = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.045, 0.11, 6, 10),
      materials.darkHardware,
    );
    hood.position.set(stemEnd.x + 0.12, stemEnd.y + 0.04, z);
    hood.rotation.z = -0.4;
    hood.castShadow = true;
    cockpit.add(hood);
  }
  cockpit.name = config.cockpit === 'integrated' ? 'integrated-cockpit' : 'classic-cockpit';
  root.add(cockpit, tape);
}

function buildContactPoints(THREE, root, materials, framePoints) {
  const { seat } = framePoints;
  const seatpost = createPartGroup(THREE, 'seatpost');
  const postTop = seat.clone().add(vector(THREE, -0.06, 0.38, 0));
  addTube(THREE, seatpost, seat.clone().add(vector(THREE, 0, -0.12, 0)), postTop, 0.047, 0.042, materials.rim, 'rimColor');

  const saddle = createPartGroup(THREE, 'saddle');
  const saddleMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 28, 14),
    materials.saddle,
  );
  saddleMesh.scale.set(1.7, 0.32, 0.66);
  saddleMesh.position.copy(postTop).add(vector(THREE, -0.08, 0.08, 0));
  saddleMesh.rotation.z = -0.03;
  saddleMesh.castShadow = true;
  addMesh(saddle, saddleMesh, 'saddleColor');

  const rails = materials.hardware;
  for (const z of [-0.075, 0.075]) {
    addTube(
      THREE,
      saddle,
      postTop.clone().add(vector(THREE, -0.18, 0.02, z)),
      postTop.clone().add(vector(THREE, 0.12, 0.02, z)),
      0.008,
      0.008,
      rails,
      'hardwareColor',
    );
  }
  root.add(seatpost, saddle);
}

function buildBottleCages(THREE, root, materials) {
  const cage = createPartGroup(THREE, 'bottleCage');
  for (const z of [-0.115, 0.115]) {
    const path = [
      vector(THREE, 0.25, 1.27, z),
      vector(THREE, 0.02, 1.13, z),
      vector(THREE, -0.05, 1.4, z),
      vector(THREE, 0.19, 1.56, z),
    ];
    addMesh(cage, curvedTube(THREE, path, 0.012, materials.accent), 'accentColor');
  }
  root.add(cage);
}

function hasPartAncestor(object) {
  let current = object;
  while (current) {
    if (current.userData.partId) return true;
    current = current.parent;
  }
  return false;
}

function updateColors(root, config) {
  root.traverse((object) => {
    const key = object.userData.materialKey;
    if (!object.isMesh || !key || !COLOR_KEYS.includes(key)) return;
    if (object.material?.color && config[key]) {
      object.material.color.set(config[key]);
    }
  });
}

export function createBikeModel(THREE, initialConfig) {
  const root = new THREE.Group();
  root.name = 'velo-atelier-bike';
  let config = { ...initialConfig };
  let selectable = [];
  let selectedPartId = 'frame';

  function rebuild(nextConfig) {
    disposeHierarchy(root);
    root.clear();
    const materials = createMaterials(THREE, nextConfig);
    const framePoints = buildFrame(THREE, root, nextConfig, materials);
    buildWheelset(THREE, root, nextConfig, materials);
    buildBrakes(THREE, root, nextConfig, materials);
    buildDrivetrain(THREE, root, nextConfig, materials, framePoints);
    buildCockpit(THREE, root, nextConfig, materials, framePoints);
    buildContactPoints(THREE, root, materials, framePoints);
    buildBottleCages(THREE, root, materials);

    selectable = [];
    root.traverse((object) => {
      if (object.isMesh && hasPartAncestor(object)) selectable.push(object);
    });
  }

  rebuild(config);

  return {
    root,
    get selectable() {
      return selectable;
    },
    update(nextConfig) {
      const structuralChange = STRUCTURAL_KEYS.some((key) => nextConfig[key] !== config[key]);
      config = { ...nextConfig };
      if (structuralChange) {
        rebuild(config);
      } else {
        updateColors(root, config);
      }
    },
    selectPart(partId) {
      selectedPartId = partId;
      return selectedPartId;
    },
    dispose() {
      disposeHierarchy(root);
      root.clear();
      selectable = [];
    },
  };
}
