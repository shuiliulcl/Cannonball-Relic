import type { GameSnapshot, Upgrade, UpgradeId } from "../game/types";

type UpgradeHandler = (upgradeId: UpgradeId) => void;

export class Hud {
  private readonly score = document.querySelector<HTMLElement>("#score");
  private readonly wave = document.querySelector<HTMLElement>("#wave");
  private readonly hp = document.querySelector<HTMLElement>("#hp");
  private readonly hpFill = document.querySelector<HTMLElement>("#hpFill");
  private readonly charge = document.querySelector<HTMLElement>("#charge");
  private readonly chargeFill = document.querySelector<HTMLElement>("#chargeFill");
  private readonly progressFill = document.querySelector<HTMLElement>("#progressFill");
  private readonly marbleState = document.querySelector<HTMLElement>("#marbleState");
  private readonly damageScale = document.querySelector<HTMLElement>("#damageScale");
  private readonly resultKicker = document.querySelector<HTMLElement>("#resultKicker");
  private readonly resultTitle = document.querySelector<HTMLElement>("#resultTitle");
  private readonly resultSummary = document.querySelector<HTMLElement>("#resultSummary");
  private upgradeHandler: UpgradeHandler | undefined;

  constructor(
    private readonly upgradePanel: HTMLElement,
    private readonly upgradeChoices: HTMLElement,
    private readonly resultOverlay: HTMLElement,
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
      this.hp.textContent = `${snapshot.hp}/${snapshot.maxHp}`;
    }
    if (this.hpFill) {
      this.hpFill.style.width = `${Math.max(0, Math.min(100, (snapshot.hp / snapshot.maxHp) * 100))}%`;
    }
    if (this.charge) {
      this.charge.textContent = `${Math.round(snapshot.chargeRatio * 100)}%`;
    }
    if (this.chargeFill) {
      this.chargeFill.style.width = `${Math.round(snapshot.chargeRatio * 100)}%`;
    }
    if (this.progressFill) {
      this.progressFill.style.width = `${Math.round(snapshot.waveProgress * 100)}%`;
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

  showResult(kind: "victory" | "defeat", score: number, wave: number): void {
    this.hideUpgrades();
    if (this.resultKicker) {
      this.resultKicker.textContent = kind === "victory" ? "Run Complete" : "Run Failed";
    }
    if (this.resultTitle) {
      this.resultTitle.textContent = kind === "victory" ? "Victory" : "Defeat";
    }
    if (this.resultSummary) {
      this.resultSummary.textContent = `Score ${Math.floor(score)} / Wave ${wave}`;
    }
    this.resultOverlay.hidden = false;
  }

  hideResult(): void {
    this.resultOverlay.hidden = true;
  }

  onUpgrade(handler: UpgradeHandler): void {
    this.upgradeHandler = handler;
  }
}
