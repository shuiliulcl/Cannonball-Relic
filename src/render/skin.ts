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
  readonly enemyRunner: string;
  readonly enemyTank: string;
  readonly enemyOctopus: string;
  readonly enemyHound: string;
  readonly enemyBoar: string;
  readonly enemySlime: string;
  readonly enemyRabbit: string;
  readonly enemyBombBug: string;
  readonly enemyShieldCrab: string;
  readonly enemyVoodooFlower: string;
  readonly enemyEyeCannon: string;
  readonly enemyPriest: string;
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
    enemyRunner: `${base}/sprites/enemy-runner.png`,
    enemyTank: `${base}/sprites/enemy-tank.png`,
    enemyOctopus: `${base}/sprites/enemy-octopus.png`,
    enemyHound: `${base}/sprites/enemy-hound.png`,
    enemyBoar: `${base}/sprites/enemy-boar.png`,
    enemySlime: `${base}/sprites/enemy-slime.png`,
    enemyRabbit: `${base}/sprites/enemy-rabbit.png`,
    enemyBombBug: `${base}/sprites/enemy-bomb-bug.png`,
    enemyShieldCrab: `${base}/sprites/enemy-shield-crab.png`,
    enemyVoodooFlower: `${base}/sprites/enemy-voodoo-flower.png`,
    enemyEyeCannon: `${base}/sprites/enemy-eye-cannon.png`,
    enemyPriest: `${base}/sprites/enemy-priest.png`,
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

// ─── Theme (scene + HUD colour palette) ───────────────────────────────────────
// Controlled by ?theme=<id>  (default: "dark")
// Independent of ?skin= so existing sprite sets are reused without new assets.

export interface SkinTheme {
  readonly id: string;
  /** WebGL clear colour & scene.background */
  readonly clearColor: number;
  /** THREE.AmbientLight colour */
  readonly ambientColor: number;
  readonly ambientIntensity: number;
  /** 2D top-down floor texture tint */
  readonly floorTint: number;
  /** 2D top-down wall body colour */
  readonly wallColor: number;
  /** 2D top-down inner wall lip colour */
  readonly wallLipColor: number;
  /** Marble mesh base colour */
  readonly marbleColor: number;
  readonly marbleEmissive: number;
  readonly marbleEmissiveIntensity: number;
  /** CSS class applied to the stage-shell element */
  readonly cssClass: string;
}

export function resolveSkinTheme(): SkinTheme {
  const id = new URLSearchParams(window.location.search).get("theme") ?? "dark";
  const skinId = sanitizeSkinId(new URLSearchParams(window.location.search).get("skin"));
  if (id === "hozy") {
    return {
      id: "hozy",
      clearColor: 0xf0e4cc,
      ambientColor: 0xfff0d0,
      ambientIntensity: 5.0,
      floorTint: 0xd4a46a,
      wallColor: 0x8a4820,
      wallLipColor: 0xcc6030,
      marbleColor: 0xffcc88,
      marbleEmissive: 0xff8020,
      marbleEmissiveIntensity: 2.5,
      cssClass: "theme-hozy",
    };
  }
  if (skinId === "toem") {
    return {
      id: "dark",
      clearColor: 0x09090b,
      ambientColor: 0xffffff,
      ambientIntensity: 3.4,
      floorTint: 0xffffff,
      wallColor: 0x111111,
      wallLipColor: 0x111111,
      marbleColor: 0xf5f5f5,
      marbleEmissive: 0x111111,
      marbleEmissiveIntensity: 0.35,
      cssClass: "theme-dark",
    };
  }
  // Default: dark space / relic-ruins
  return {
    id: "dark",
    clearColor: 0x0a0a0f,
    ambientColor: 0xffffff,
    ambientIntensity: 3.2,
    floorTint: 0x555560,
    wallColor: 0x14102a,
    wallLipColor: 0x2a1f56,
    marbleColor: 0xaaefff,
    marbleEmissive: 0x00ddff,
    marbleEmissiveIntensity: 3.0,
    cssClass: "theme-dark",
  };
}

export function preparePixelTexture(texture: THREE.Texture, markForUpdate = true): THREE.Texture {
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  if (markForUpdate) {
    texture.needsUpdate = true;
  }
  return texture;
}
