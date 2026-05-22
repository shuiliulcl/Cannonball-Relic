import type { GameSnapshot, Upgrade, UpgradeId } from "../game/types";

type UpgradeHandler = (upgradeId: UpgradeId) => void;

export class Hud {
  private readonly score = document.querySelector<HTMLElement>("#score");
  private readonly wave = document.querySelector<HTMLElement>("#wave");
  private readonly hp = document.querySelector<HTMLElement>("#hp");
  private readonly charge = document.querySelector<HTMLElement>("#charge");
  private readonly marbleState = document.querySelector<HTMLElement>("#marbleState");
  private readonly damageScale = document.querySelector<HTMLElement>("#damageScale");
  private upgradeHandler: UpgradeHandler | undefined;

  constructor(
    private readonly upgradePanel: HTMLElement,
    private readonly upgradeChoices: HTMLElement,
  ) {
    upgradeChoices.addEventListener("click", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-upgrade]");
      if (!button) {
        return;
      }
      this.upgradeHandler?.(button.dataset.upgrade as UpgradeId);
    });
  }

  update(snapshot: GameSnapshot): void {
    if (this.score) {
      this.score.textContent = Math.floor(snapshot.score).toString();
    }
    if (this.wave) {
      this.wave.textContent = snapshot.wave.toString();
    }
    if (this.hp) {
      this.hp.textContent = snapshot.hp.toString();
    }
    if (this.charge) {
      this.charge.textContent = `${Math.round(snapshot.chargeRatio * 100)}%`;
    }
    if (this.marbleState) {
      this.marbleState.textContent = snapshot.marbleState;
    }
    if (this.damageScale) {
      this.damageScale.textContent = `x${snapshot.damageScale}`;
    }
  }

  showUpgrades(upgrades: Upgrade[]): void {
    this.upgradeChoices.replaceChildren(
      ...upgrades.map((upgrade) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.upgrade = upgrade.id;
        button.dataset.rarity = upgrade.rarity;
        button.innerHTML = `<em>${upgrade.rarity}</em><strong>${upgrade.title}</strong><span>${upgrade.description}</span>`;
        return button;
      }),
    );
    this.upgradePanel.hidden = false;
  }

  hideUpgrades(): void {
    this.upgradePanel.hidden = true;
  }

  showGameOver(score: number, restart: () => void): void {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `Game Over - Score ${Math.floor(score)} - Restart`;
    button.addEventListener("click", restart, { once: true });
    this.upgradeChoices.replaceChildren(button);
    this.upgradePanel.hidden = false;
  }

  onUpgrade(handler: UpgradeHandler): void {
    this.upgradeHandler = handler;
  }
}
