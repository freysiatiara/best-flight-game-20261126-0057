// Sky: gradient dome, sun disc and drifting low-poly clouds, all procedural.
export function buildSky(THREE) {
  const group = new THREE.Group();

  // Gradient sky dome (canvas texture, no external image).
  const cv = document.createElement('canvas');
  cv.width = 4;
  cv.height = 256;
  const ctx = cv.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#2f6fb8');
  grad.addColorStop(0.45, '#7fb2dd');
  grad.addColorStop(0.72, '#cfe4f2');
  grad.addColorStop(1, '#eef3ee');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(cv);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(3600, 24, 16),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false }),
  );
  group.add(dome);

  // Sun: a bright disc high in the west, plus a soft halo.
  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(90, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff3c0, fog: false }),
  );
  sun.position.set(-2200, 1500, -2400);
  sun.lookAt(0, 0, 0);
  group.add(sun);
  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(190, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffe9a8,
      transparent: true,
      opacity: 0.28,
      fog: false,
    }),
  );
  halo.position.copy(sun.position).multiplyScalar(1.001);
  halo.lookAt(0, 0, 0);
  group.add(halo);

  // Clouds: flattened clusters of white spheres, drifting slowly.
  const cloudMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.92,
  });
  const puffGeo = new THREE.SphereGeometry(1, 10, 8);
  const clouds = [];
  let seed = 4242;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 26; i++) {
    const cloud = new THREE.Group();
    const puffs = 4 + Math.floor(rnd() * 4);
    for (let p = 0; p < puffs; p++) {
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      const s = 14 + rnd() * 22;
      puff.scale.set(s, s * 0.42, s * 0.8);
      puff.position.set((rnd() - 0.5) * 70, (rnd() - 0.5) * 8, (rnd() - 0.5) * 30);
      cloud.add(puff);
    }
    cloud.position.set((rnd() - 0.5) * 3600, 260 + rnd() * 180, (rnd() - 0.5) * 3600);
    cloud.userData.drift = 2 + rnd() * 3;
    clouds.push(cloud);
    group.add(cloud);
  }
  group.userData.clouds = clouds;
  return group;
}

export function updateSky(sky, dt) {
  for (const cloud of sky.userData.clouds) {
    cloud.position.x += cloud.userData.drift * dt;
    if (cloud.position.x > 1900) cloud.position.x = -1900;
  }
}
