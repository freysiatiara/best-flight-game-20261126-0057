// Aircraft: a low-poly propeller plane built from primitives — fuselage,
// wings, tail, spinning propeller, glass canopy and wingtip lights — so it
// reads as a built machine, not a drawn icon.
export function buildAircraft(THREE) {
  const plane = new THREE.Group();
  const paint = new THREE.MeshLambertMaterial({ color: 0xd8432f }); // merpati red
  const cream = new THREE.MeshLambertMaterial({ color: 0xf2ead8 });
  const dark = new THREE.MeshLambertMaterial({ color: 0x2b2e33 });
  const glass = new THREE.MeshPhongMaterial({
    color: 0x9fd4e8,
    shininess: 120,
    specular: 0xffffff,
  });

  // Fuselage: a tapered cylinder pointing +Z.
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.55, 6.4, 10), paint);
  body.rotation.x = Math.PI / 2;
  body.position.z = 0.2;
  plane.add(body);
  // Nose cone.
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.6, 10), cream);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = 4.1;
  plane.add(nose);
  // Canopy glass.
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.72, 12, 8), glass);
  canopy.scale.set(1, 0.75, 1.7);
  canopy.position.set(0, 0.75, 1.1);
  plane.add(canopy);
  // Main wings.
  const wing = new THREE.Mesh(new THREE.BoxGeometry(11, 0.22, 1.9), cream);
  wing.position.set(0, -0.1, 0.9);
  plane.add(wing);
  const wingStripe = new THREE.Mesh(new THREE.BoxGeometry(11.05, 0.1, 0.5), paint);
  wingStripe.position.set(0, 0.06, 0.4);
  plane.add(wingStripe);
  // Tailplane and fin.
  const tail = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 1.1), cream);
  tail.position.set(0, 0.15, -2.9);
  plane.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.7, 1.4), paint);
  fin.position.set(0, 0.8, -2.9);
  plane.add(fin);
  // Propeller hub + two blades (spun by main.js).
  const prop = new THREE.Group();
  prop.position.set(0, 0, 5.0);
  const hub = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.7, 8), dark);
  hub.rotation.x = Math.PI / 2;
  prop.add(hub);
  const bladeGeo = new THREE.BoxGeometry(0.28, 3.4, 0.1);
  const bladeMat = new THREE.MeshLambertMaterial({ color: 0x1d1f24 });
  const bladeA = new THREE.Mesh(bladeGeo, bladeMat);
  const bladeB = new THREE.Mesh(bladeGeo, bladeMat);
  bladeB.rotation.z = Math.PI / 2;
  prop.add(bladeA);
  prop.add(bladeB);
  plane.add(prop);
  // Wingtip navigation lights.
  const tipMatL = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  const tipMatR = new THREE.MeshBasicMaterial({ color: 0x22ff66 });
  for (const [x, mat] of [[-5.5, tipMatL], [5.5, tipMatR]]) {
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), mat);
    tip.position.set(x, -0.05, 0.9);
    plane.add(tip);
  }
  // Landing skids, visible on approach.
  const skidGeo = new THREE.BoxGeometry(0.16, 1.0, 0.16);
  for (const x of [-0.6, 0.6]) {
    const skid = new THREE.Mesh(skidGeo, dark);
    skid.position.set(x, -1.05, 1.2);
    plane.add(skid);
  }
  plane.userData.propeller = prop;
  return plane;
}
