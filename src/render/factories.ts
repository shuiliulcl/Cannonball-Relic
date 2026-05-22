import * as THREE from "three";

export function makeToonMaterial(color: number, emissive = 0x000000): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color,
    emissive,
    emissiveIntensity: emissive ? 0.35 : 0,
  });
}

export function makeCylinder(radius: number, height: number, color: number): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(radius, radius, height, 24);
  const mesh = new THREE.Mesh(geometry, makeToonMaterial(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function makeBox(width: number, height: number, depth: number, color: number): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry, makeToonMaterial(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
