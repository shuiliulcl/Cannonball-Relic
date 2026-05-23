import * as THREE from "three";
import type { Vec2 } from "./types";

export class Input {
  readonly keys = new Set<string>();
  readonly pointer = new THREE.Vector2();
  leftDown = false;
  rightPressed = false;
  leftReleased = false;
  pausePressed = false;

  constructor(private readonly target: HTMLElement) {
    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      this.keys.add(key);
      if (key === "escape" || key === "p") {
        if (!event.repeat) {
          this.pausePressed = true;
        }
        event.preventDefault();
      }
      if (["w", "a", "s", "d", " "].includes(key)) {
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.key.toLowerCase());
    });

    target.addEventListener("pointermove", (event) => {
      const rect = target.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    });

    target.addEventListener("pointerdown", (event) => {
      target.setPointerCapture(event.pointerId);
      if (event.button === 0) {
        this.leftDown = true;
      }
      if (event.button === 2) {
        this.rightPressed = true;
      }
    });

    target.addEventListener("pointerup", (event) => {
      if (event.button === 0 && this.leftDown) {
        this.leftReleased = true;
        this.leftDown = false;
      }
    });

    target.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  movement(): Vec2 {
    const x = (this.keys.has("d") ? 1 : 0) - (this.keys.has("a") ? 1 : 0);
    const z = (this.keys.has("s") ? 1 : 0) - (this.keys.has("w") ? 1 : 0);
    const len = Math.hypot(x, z);
    return len > 0 ? { x: x / len, z: z / len } : { x: 0, z: 0 };
  }

  consumeLeftRelease(): boolean {
    const released = this.leftReleased;
    this.leftReleased = false;
    return released;
  }

  consumeRightPress(): boolean {
    const pressed = this.rightPressed;
    this.rightPressed = false;
    return pressed;
  }

  consumePausePress(): boolean {
    const pressed = this.pausePressed;
    this.pausePressed = false;
    return pressed;
  }

  clearPointerActions(): void {
    this.leftDown = false;
    this.leftReleased = false;
    this.rightPressed = false;
  }
}
