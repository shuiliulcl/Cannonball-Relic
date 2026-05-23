import * as THREE from "three";

const DEFAULT_SKIN = "relic-ruins";

function sanitizeSkinId(value: string | null): string {
  if (!value) {
    return DEFAULT_SKIN;
  }
  return /^[a-z0-9-]+$/i.test(value) ? value : DEFAULT_SKIN;
}

export interface SkinAssets {
  readonly id: string;
  readonly player: string;
  readonly marble: string;
  readonly enemyGrunt: string;
  readonly obstacleCrate: string;
  readonly obstacleStone: string;
  readonly obstacleMetal: string;
  readonly pillar: string;
  readonly brazier: string;
  readonly floor: string;
  readonly floorCracked: string;
  readonly floorMoss: string;
  readonly floorDanger: string;
  readonly wallBorder: string;
}

export function resolveSkinAssets(): SkinAssets {
  const id = sanitizeSkinId(new URLSearchParams(window.location.search).get("skin"));
  const base = `/assets/skins/${id}`;
  return {
    id,
    player: `${base}/sprites/player.png`,
    marble: `${base}/sprites/marble.png`,
    enemyGrunt: `${base}/sprites/enemy-grunt.png`,
    obstacleCrate: `${base}/sprites/obstacle-crate.png`,
    obstacleStone: `${base}/sprites/obstacle-stone.png`,
    obstacleMetal: `${base}/sprites/obstacle-metal.png`,
    pillar: `${base}/sprites/pillar.png`,
    brazier: `${base}/sprites/brazier.png`,
    floor: `${base}/textures/floor.png`,
    floorCracked: `${base}/textures/floor-cracked.png`,
    floorMoss: `${base}/textures/floor-moss.png`,
    floorDanger: `${base}/textures/floor-danger.png`,
    wallBorder: `${base}/textures/wall-border.png`,
  };
}

export function preparePixelTexture(texture: THREE.Texture): THREE.Texture {
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
