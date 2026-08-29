function createCarbonTexture(THREE) {
  const size = 8;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const weave = ((x + Math.floor(y / 2)) % 4 < 2) === (y % 2 === 0);
      const value = weave ? 154 : 96;
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
      data[index + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(18, 18);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createMaterials(THREE, config) {
  const carbonTexture = createCarbonTexture(THREE);

  return {
    frame: new THREE.MeshPhysicalMaterial({
      color: config.frameColor,
      metalness: 0.08,
      roughness: 0.24,
      clearcoat: 0.95,
      clearcoatRoughness: 0.18,
    }),
    fork: new THREE.MeshPhysicalMaterial({
      color: config.forkColor,
      metalness: 0.05,
      roughness: 0.28,
      clearcoat: 0.9,
      clearcoatRoughness: 0.2,
    }),
    rim: new THREE.MeshPhysicalMaterial({
      color: config.rimColor,
      map: carbonTexture,
      metalness: 0.18,
      roughness: 0.3,
      clearcoat: 0.5,
      clearcoatRoughness: 0.32,
      side: THREE.DoubleSide,
    }),
    accent: new THREE.MeshPhysicalMaterial({
      color: config.accentColor,
      metalness: 0.12,
      roughness: 0.25,
      clearcoat: 0.85,
    }),
    tape: new THREE.MeshStandardMaterial({
      color: config.tapeColor,
      metalness: 0,
      roughness: 0.92,
    }),
    saddle: new THREE.MeshPhysicalMaterial({
      color: config.saddleColor,
      metalness: 0,
      roughness: 0.72,
      clearcoat: 0.08,
    }),
    hardware: new THREE.MeshStandardMaterial({
      color: config.hardwareColor,
      metalness: 0.86,
      roughness: 0.3,
    }),
    darkHardware: new THREE.MeshStandardMaterial({
      color: '#242625',
      metalness: 0.78,
      roughness: 0.38,
    }),
    rotor: new THREE.MeshStandardMaterial({
      color: '#c7cacb',
      metalness: 0.95,
      roughness: 0.24,
    }),
    chain: new THREE.MeshStandardMaterial({
      color: '#777a79',
      metalness: 0.9,
      roughness: 0.34,
    }),
    rubber: new THREE.MeshStandardMaterial({
      color: '#121413',
      metalness: 0,
      roughness: 0.96,
    }),
    translucent: new THREE.MeshPhysicalMaterial({
      color: config.accentColor,
      metalness: 0,
      roughness: 0.28,
      transmission: 0.12,
      transparent: true,
      opacity: 0.78,
    }),
  };
}
