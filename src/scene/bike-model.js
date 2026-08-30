import { createMaterials } from './materials.js';
import { getBikeGeometry } from './bike-geometry.js';
import { createTextDecal } from './text-decal.js';
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

function markComponent(object, componentRole) {
  object.userData.componentRole = componentRole;
  object.name = componentRole;
  return object;
}

function addTube(
  THREE,
  group,
  start,
  end,
  radiusStart,
  radiusEnd,
  material,
  materialKey,
  componentRole,
) {
  const mesh = addMesh(
    group,
    tubeBetween(THREE, start, end, radiusStart, radiusEnd, material),
    materialKey,
  );
  if (componentRole) markComponent(mesh, componentRole);
  return mesh;
}

function buildFrame(THREE, root, config, materials) {
  const geometry = getBikeGeometry(config.frame);
  const bb = vector(THREE, ...geometry.bottomBracket, 0);
  const seat = vector(THREE, ...geometry.seatTop, 0);
  const headTop = vector(THREE, ...geometry.headTop, 0);
  const headBottom = vector(THREE, ...geometry.headBottom, 0);
  const rearAxle = vector(THREE, ...geometry.rearAxle, 0);
  const frontAxle = vector(THREE, ...geometry.frontAxle, 0);
  const forkCrown = vector(THREE, ...geometry.forkCrown, 0);
  const rearLeft = rearAxle.clone().setZ(-0.075);
  const rearRight = rearAxle.clone().setZ(0.075);

  const frame = createPartGroup(THREE, 'frame');
  addTube(THREE, frame, bb, seat, 0.064 * geometry.tubeScale, 0.052, materials.frame, 'frameColor', 'frame-seat-tube');
  addTube(THREE, frame, headBottom, headTop, 0.064, 0.058, materials.frame, 'frameColor', 'frame-head-tube');
  addTube(THREE, frame, rearLeft, vector(THREE, bb.x, bb.y, -0.055), 0.024, 0.039, materials.frame, 'frameColor', 'frame-chainstay-left');
  addTube(THREE, frame, rearRight, vector(THREE, bb.x, bb.y, 0.055), 0.024, 0.039, materials.frame, 'frameColor', 'frame-chainstay-right');
  addTube(THREE, frame, rearLeft, vector(THREE, seat.x, seat.y - 0.08, -0.04), 0.021, 0.032, materials.frame, 'frameColor', 'frame-seatstay-left');
  addTube(THREE, frame, rearRight, vector(THREE, seat.x, seat.y - 0.08, 0.04), 0.021, 0.032, materials.frame, 'frameColor', 'frame-seatstay-right');

  const bbShell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.095, 0.18, 24),
    materials.frame,
  );
  bbShell.rotation.x = Math.PI / 2;
  bbShell.position.copy(bb);
  bbShell.castShadow = true;
  markComponent(bbShell, 'frame-bottom-bracket-shell');
  addMesh(frame, bbShell, 'frameColor');

  const topTube = createPartGroup(THREE, 'topTube');
  const topRadius = config.frame === 'aero' ? 0.072 : 0.052;
  addTube(THREE, topTube, seat, headTop, topRadius, topRadius * 0.92, materials.frame, 'frameColor', 'top-tube');
  const accentStart = seat.clone().lerp(headTop, 0.08).add(vector(THREE, 0, 0.037, 0));
  const accentEnd = seat.clone().lerp(headTop, 0.92).add(vector(THREE, 0, 0.037, 0));
  addTube(THREE, topTube, accentStart, accentEnd, 0.012, 0.012, materials.accent, 'accentColor');

  const downTube = createPartGroup(THREE, 'downTube');
  const downRadius = config.frame === 'aero' ? 0.1 : 0.076;
  addTube(THREE, downTube, headBottom, bb, downRadius * 0.86, downRadius, materials.frame, 'frameColor', 'down-tube');

  const fork = createPartGroup(THREE, 'fork');
  addTube(
    THREE,
    fork,
    forkCrown.clone().setZ(-0.075),
    forkCrown.clone().setZ(0.075),
    0.047,
    0.047,
    materials.fork,
    'forkColor',
    'fork-crown',
  );
  for (const z of [-0.075, 0.075]) {
    addTube(
      THREE,
      fork,
      vector(THREE, forkCrown.x, forkCrown.y, z * 0.7),
      vector(THREE, frontAxle.x, frontAxle.y, z),
      0.047,
      0.022,
      materials.fork,
      'forkColor',
      z < 0 ? 'fork-blade-left' : 'fork-blade-right',
    );
  }

  root.add(frame, topTube, downTube, fork);
  return {
    geometry,
    bb,
    seat,
    headTop,
    headBottom,
    rearAxle,
    frontAxle,
    forkCrown,
    downTube,
  };
}

function createWheel(THREE, style, axle, wheelRadius, isRear, materials) {
  const side = isRear ? 'rear' : 'front';
  const resolvedStyle = style === 'disc' && !isRear ? 'deep' : style;
  const wheel = new THREE.Group();
  wheel.name = `${side}-${resolvedStyle}-wheel`;
  wheel.position.set(axle[0], axle[1], 0);

  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(wheelRadius, 0.029, 12, 96),
    materials.rubber,
  );
  tire.castShadow = true;
  tire.receiveShadow = true;
  markComponent(tire, `wheel-${side}-tire`);
  wheel.add(tire);

  const rimDepth = resolvedStyle === 'deep' ? 0.15 : 0.055;
  const rimOuter = wheelRadius - 0.043;
  const rimInner = rimOuter - rimDepth;
  const rimRing = new THREE.Mesh(
    new THREE.RingGeometry(rimInner, rimOuter, 96),
    materials.rim,
  );
  rimRing.position.z = isRear ? -0.006 : 0.006;
  rimRing.castShadow = true;
  markComponent(rimRing, `wheel-${side}-rim`);
  addMesh(wheel, rimRing, 'rimColor');

  const rimEdge = new THREE.Mesh(
    new THREE.TorusGeometry(rimOuter, resolvedStyle === 'deep' ? 0.022 : 0.015, 10, 96),
    materials.rim,
  );
  markComponent(rimEdge, `wheel-${side}-rim-edge`);
  addMesh(wheel, rimEdge, 'rimColor');

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.052, isRear ? 0.18 : 0.14, 20),
    materials.hardware,
  );
  hub.rotation.x = Math.PI / 2;
  hub.castShadow = true;
  markComponent(hub, `wheel-${side}-hub`);
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
      markComponent(spoke, `wheel-${side}-spoke`);
      addMesh(wheel, spoke, resolvedStyle === 'deep' ? 'rimColor' : 'hardwareColor');
    }
  }

  const axleMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.28, 12),
    materials.darkHardware,
  );
  axleMesh.rotation.x = Math.PI / 2;
  markComponent(axleMesh, `wheel-${side}-axle`);
  wheel.add(axleMesh);
  return wheel;
}

function buildWheelset(THREE, root, config, materials, framePoints) {
  const { geometry } = framePoints;
  const group = createPartGroup(THREE, 'wheelset');
  group.add(
    createWheel(THREE, config.wheel, geometry.rearAxle, geometry.wheelRadius, true, materials),
    createWheel(THREE, config.wheel, geometry.frontAxle, geometry.wheelRadius, false, materials),
  );
  root.add(group);
}

function createRotor(THREE, axle, side, materials) {
  const rotor = new THREE.Group();
  rotor.position.set(axle.x, axle.y, -0.095);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.17, 0.012, 8, 48),
    materials.rotor,
  );
  markComponent(ring, `brake-${side}-rotor`);
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

function buildBrakes(THREE, root, config, materials, framePoints) {
  const { geometry, rearAxle, frontAxle, forkCrown, seat } = framePoints;
  const group = createPartGroup(THREE, 'brake');
  if (config.brake === 'disc') {
    group.name = 'brakes-disc';
    const brakePoints = [
      { side: 'rear', axle: rearAxle, support: seat, z: -0.1 },
      { side: 'front', axle: frontAxle, support: forkCrown, z: -0.1 },
    ];
    for (const { side, axle, support, z } of brakePoints) {
      group.add(createRotor(THREE, axle, side, materials));
      const caliper = new THREE.Mesh(
        new THREE.BoxGeometry(0.085, 0.14, 0.07),
        materials.darkHardware,
      );
      caliper.position.copy(axle).lerp(support, side === 'front' ? 0.18 : 0.15).setZ(z);
      caliper.rotation.z = side === 'front' ? -0.4 : 0.42;
      caliper.castShadow = true;
      markComponent(caliper, `brake-${side}-disc-caliper`);
      group.add(caliper);
    }
  } else {
    group.name = 'brakes-caliper';
    const brakePoints = [
      { side: 'rear', mount: vector(THREE, ...geometry.rearBrakeMount, 0), axle: rearAxle },
      { side: 'front', mount: vector(THREE, ...geometry.frontBrakeMount, 0), axle: frontAxle },
    ];
    for (const { side, mount, axle } of brakePoints) {
      const padY = axle.y + geometry.wheelRadius - 0.075;
      addTube(
        THREE,
        group,
        mount.clone().add(vector(THREE, -0.105, -0.015, -0.035)),
        vector(THREE, axle.x - 0.105, padY, -0.035),
        0.014,
        0.011,
        materials.hardware,
        'hardwareColor',
      );
      addTube(
        THREE,
        group,
        mount.clone().add(vector(THREE, 0.105, -0.015, 0.035)),
        vector(THREE, axle.x + 0.105, padY, 0.035),
        0.014,
        0.011,
        materials.hardware,
        'hardwareColor',
      );
      const bridge = new THREE.Mesh(
        new THREE.TorusGeometry(0.115, 0.015, 8, 24, Math.PI),
        materials.hardware,
      );
      bridge.position.copy(mount);
      bridge.rotation.z = Math.PI;
      markComponent(bridge, `brake-${side}-caliper`);
      addMesh(group, bridge, 'hardwareColor');

      for (const z of [-0.06, 0.06]) {
        const pad = new THREE.Mesh(
          new THREE.BoxGeometry(0.055, 0.02, 0.018),
          materials.darkHardware,
        );
        pad.position.set(axle.x, padY, z);
        markComponent(pad, `brake-${side}-pad`);
        group.add(pad);
      }
    }
  }
  root.add(group);
}

function buildDrivetrain(THREE, root, config, materials, framePoints) {
  const { bb, rearAxle, seat, headTop, headBottom } = framePoints;
  const crankset = createPartGroup(THREE, 'crankset');
  const chainring = new THREE.Mesh(
    new THREE.TorusGeometry(0.255, 0.018, 9, 52),
    materials.hardware,
  );
  chainring.position.set(bb.x, bb.y, 0.145);
  chainring.castShadow = true;
  markComponent(chainring, 'crankset-chainring');
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
  cassette.position.set(rearAxle.x, rearAxle.y, 0.13);
  for (let index = 0; index < 9; index += 1) {
    const radius = 0.09 + index * 0.009;
    const cog = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, 0.006, 24),
      materials.hardware,
    );
    cog.rotation.x = Math.PI / 2;
    cog.position.z = index * 0.009;
    markComponent(cog, 'cassette-cog');
    addMesh(cassette, cog, 'hardwareColor');
  }

  const drivetrain = createPartGroup(THREE, 'drivetrain');
  const chainTop = tubeBetween(
    THREE,
    vector(THREE, rearAxle.x, rearAxle.y + 0.1, 0.2),
    vector(THREE, bb.x, bb.y + 0.22, 0.16),
    0.008,
    0.008,
    materials.chain,
    6,
  );
  const chainBottom = tubeBetween(
    THREE,
    vector(THREE, rearAxle.x, rearAxle.y - 0.1, 0.2),
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
  rearMech.position.set(rearAxle.x + 0.09, rearAxle.y - 0.24, 0.16);
  rearMech.rotation.z = -0.35;
  rearMech.castShadow = true;
  markComponent(rearMech, 'drivetrain-rear-derailleur');
  drivetrain.add(rearMech);

  const jockeyWheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.012, 8, 24),
    materials.hardware,
  );
  jockeyWheel.position.set(rearAxle.x + 0.14, rearAxle.y - 0.36, 0.16);
  markComponent(jockeyWheel, 'drivetrain-jockey-wheel');
  addMesh(drivetrain, jockeyWheel, 'hardwareColor');

  const frontMech = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.13, 0.075),
    materials.darkHardware,
  );
  frontMech.position.copy(bb).lerp(seat, 0.17).setZ(0.11);
  frontMech.rotation.z = -0.28;
  frontMech.castShadow = true;
  markComponent(frontMech, 'drivetrain-front-derailleur');
  drivetrain.add(frontMech);

  if (config.drivetrain === 'electronic') {
    const battery = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.038, 0.32, 6, 12),
      materials.darkHardware,
    );
    battery.position.copy(bb).lerp(seat, 0.5).setZ(-0.04);
    battery.rotation.z = Math.atan2(seat.y - bb.y, seat.x - bb.x) - (Math.PI / 2);
    markComponent(battery, 'drivetrain-battery');
    drivetrain.add(battery);
    drivetrain.name = 'electronic-drivetrain';
  } else {
    const cable = curvedTube(
      THREE,
      [
        headTop.clone().add(vector(THREE, 0.12, 0.02, 0.06)),
        headBottom.clone().add(vector(THREE, -0.06, 0.02, 0.08)),
        bb.clone().add(vector(THREE, 0.02, 0.12, 0.1)),
        rearAxle.clone().add(vector(THREE, 0.1, -0.1, 0.16)),
      ],
      0.009,
      materials.darkHardware,
      36,
    );
    markComponent(cable, 'drivetrain-shift-cable');
    drivetrain.add(cable);
    drivetrain.name = 'mechanical-drivetrain';
  }

  root.add(crankset, cassette, drivetrain);
}

function buildCockpit(THREE, root, config, materials, framePoints) {
  const { headTop } = framePoints;
  const cockpit = createPartGroup(THREE, 'cockpit');
  const tape = createPartGroup(THREE, 'barTape');
  const stemEnd = vector(
    THREE,
    headTop.x + (config.cockpit === 'integrated' ? 0.34 : 0.29),
    headTop.y + 0.015,
    0,
  );
  addTube(THREE, cockpit, headTop, stemEnd, 0.038, 0.034, materials.rim, 'rimColor', 'cockpit-stem');

  const centerBar = tubeBetween(
    THREE,
    vector(THREE, stemEnd.x, stemEnd.y, -0.38),
    vector(THREE, stemEnd.x, stemEnd.y, 0.38),
    config.cockpit === 'integrated' ? 0.04 : 0.028,
    config.cockpit === 'integrated' ? 0.04 : 0.028,
    materials.rim,
  );
  markComponent(centerBar, 'cockpit-handlebar-top');
  addMesh(cockpit, centerBar, 'rimColor');

  for (const z of [-0.38, 0.38]) {
    const outward = Math.sign(z);
    const points = [
      vector(THREE, stemEnd.x, stemEnd.y, z),
      vector(THREE, stemEnd.x + 0.13, stemEnd.y - 0.05, z + 0.015 * outward),
      vector(THREE, stemEnd.x + 0.18, stemEnd.y - 0.24, z + 0.025 * outward),
      vector(THREE, stemEnd.x + 0.1, stemEnd.y - 0.42, z + 0.02 * outward),
    ];
    const dropBar = curvedTube(THREE, points, 0.025, materials.rim);
    markComponent(dropBar, z < 0 ? 'cockpit-drop-left' : 'cockpit-drop-right');
    addMesh(cockpit, dropBar, 'rimColor');
    const tapePath = points.map((point) => point.clone().add(vector(THREE, 0.002, 0, 0)));
    const tapedDrop = curvedTube(THREE, tapePath, 0.03, materials.tape);
    markComponent(tapedDrop, z < 0 ? 'bar-tape-left' : 'bar-tape-right');
    addMesh(tape, tapedDrop, 'tapeColor');

    const hood = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.045, 0.11, 6, 10),
      materials.darkHardware,
    );
    hood.position.set(stemEnd.x + 0.12, stemEnd.y + 0.04, z);
    hood.rotation.z = -0.4;
    hood.castShadow = true;
    markComponent(hood, z < 0 ? 'cockpit-hood-left' : 'cockpit-hood-right');
    cockpit.add(hood);
  }
  cockpit.name = config.cockpit === 'integrated' ? 'integrated-cockpit' : 'classic-cockpit';
  root.add(cockpit, tape);
}

function buildContactPoints(THREE, root, materials, framePoints) {
  const { bb, seat } = framePoints;
  const seatpost = createPartGroup(THREE, 'seatpost');
  const seatAxis = seat.clone().sub(bb).normalize();
  const postTop = seat.clone().addScaledVector(seatAxis, 0.32);
  const postStart = seat.clone().addScaledVector(seatAxis, -0.11);
  addTube(THREE, seatpost, postStart, postTop, 0.038, 0.033, materials.rim, 'rimColor', 'seatpost');

  const saddle = createPartGroup(THREE, 'saddle');
  const saddleMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 28, 14),
    materials.saddle,
  );
  saddleMesh.scale.set(1.7, 0.32, 0.66);
  saddleMesh.position.copy(postTop).add(vector(THREE, -0.08, 0.08, 0));
  saddleMesh.rotation.z = -0.03;
  saddleMesh.castShadow = true;
  markComponent(saddleMesh, 'saddle-shell');
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

function buildBottleCages(THREE, root, materials, framePoints) {
  const { bb, headBottom } = framePoints;
  const cage = createPartGroup(THREE, 'bottleCage');
  const tubeDirection = bb.clone().sub(headBottom).normalize();
  const inwardNormal = vector(THREE, tubeDirection.y, -tubeDirection.x, 0);
  const upperMount = headBottom.clone().lerp(bb, 0.34);
  const lowerMount = headBottom.clone().lerp(bb, 0.68);
  const upperRail = upperMount.clone().addScaledVector(inwardNormal, 0.07);
  const lowerRail = lowerMount.clone().addScaledVector(inwardNormal, 0.07);

  for (const z of [-0.115, 0.115]) {
    const path = [
      upperRail.clone().setZ(z),
      lowerRail.clone().addScaledVector(inwardNormal, 0.045).setZ(z),
      lowerRail.clone().addScaledVector(tubeDirection, -0.08).setZ(z),
      upperRail.clone().addScaledVector(tubeDirection, 0.06).setZ(z),
    ];
    const rail = curvedTube(THREE, path, 0.011, materials.accent);
    markComponent(rail, 'bottle-cage-rail');
    addMesh(cage, rail, 'accentColor');
  }

  addTube(
    THREE,
    cage,
    upperMount.clone().setZ(-0.12),
    upperMount.clone().setZ(0.12),
    0.009,
    0.009,
    materials.accent,
    'accentColor',
    'bottle-cage-upper-bridge',
  );
  addTube(
    THREE,
    cage,
    lowerMount.clone().setZ(-0.12),
    lowerMount.clone().setZ(0.12),
    0.009,
    0.009,
    materials.accent,
    'accentColor',
    'bottle-cage-lower-bridge',
  );
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

function nearestPartId(object) {
  let current = object;
  while (current) {
    if (current.userData.partId) return current.userData.partId;
    current = current.parent;
  }
  return null;
}

function isolatePartMaterials(root) {
  const sourceMaterials = new Set();
  root.traverse((object) => {
    if (!object.isMesh || !hasPartAncestor(object)) return;
    if (Array.isArray(object.material)) {
      object.material = object.material.map((material) => {
        sourceMaterials.add(material);
        return material.clone();
      });
    } else if (object.material) {
      sourceMaterials.add(object.material);
      object.material = object.material.clone();
    }
  });
  return sourceMaterials;
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
  let textDecal = null;

  function rebuild(nextConfig) {
    disposeHierarchy(root);
    root.clear();
    const materials = createMaterials(THREE, nextConfig);
    const framePoints = buildFrame(THREE, root, nextConfig, materials);
    buildWheelset(THREE, root, nextConfig, materials, framePoints);
    buildBrakes(THREE, root, nextConfig, materials, framePoints);
    buildDrivetrain(THREE, root, nextConfig, materials, framePoints);
    buildCockpit(THREE, root, nextConfig, materials, framePoints);
    buildContactPoints(THREE, root, materials, framePoints);
    buildBottleCages(THREE, root, materials, framePoints);

    textDecal = null;
    if (typeof document !== 'undefined') {
      textDecal = createTextDecal(THREE, {
        text: nextConfig.frameText,
        color: nextConfig.textColor,
        font: nextConfig.font,
        start: framePoints.bb,
        end: framePoints.headBottom,
      });
      framePoints.downTube.add(textDecal.group);
    }
    const sourceMaterials = isolatePartMaterials(root);
    for (const material of new Set([...Object.values(materials), ...sourceMaterials])) {
      material.dispose();
    }

    selectable = [];
    root.traverse((object) => {
      if (object.isMesh && hasPartAncestor(object)) selectable.push(object);
    });
    selectPart(selectedPartId);
  }

  function selectPart(partId) {
    selectedPartId = partId;
    root.traverse((object) => {
      if (!object.isMesh) return;
      const selected = nearestPartId(object) === selectedPartId;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!material?.emissive) continue;
        material.emissive.set(selected ? '#8f1d2c' : '#000000');
        material.emissiveIntensity = selected ? 0.28 : 1;
      }
    });
    return selectedPartId;
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
        textDecal?.update({
          text: config.frameText,
          color: config.textColor,
          font: config.font,
        });
      }
    },
    selectPart,
    dispose() {
      disposeHierarchy(root);
      root.clear();
      selectable = [];
    },
  };
}
