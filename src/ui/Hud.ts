import type { GameSnapshot, OwnedBuff, Upgrade, UpgradeId, UpgradeRarity } from "../game/types";

type UpgradeHandler = (upgradeId: UpgradeId) => void;
type VoidHandler = () => void;

const MARBLE_STATE_LABEL: Record<GameSnapshot["marbleState"], string> = {
  ready: "待发射",
  charging: "蓄力中",
  flying: "飞行中",
  recalling: "回收中",
  cannon: "人间大炮",
};

const RARITY_LABEL: Record<UpgradeRarity, string> = {
  bronze: "青铜",
  gold: "黄金",
  diamond: "钻石",
};

export class Hud {
  private readonly score = document.querySelector<HTMLElement>("#score");
  private readonly wave = document.querySelector<HTMLElement>("#wave");
  private readonly hp = document.querySelector<HTMLElement>("#hp");
  private readonly hpFill = document.querySelector<HTMLElement>("#hpFill");
  private readonly shields = document.querySelector<HTMLElement>("#shields");
  private readonly charge = document.querySelector<HTMLElement>("#charge");
  private readonly chargeFill = document.querySelector<HTMLElement>("#chargeFill");
  private readonly dashFill = document.querySelector<HTMLElement>("#dashFill");
  private readonly dashCooldown = document.querySelector<HTMLElement>("#dashCooldown");
  private readonly progressFill = document.querySelector<HTMLElement>("#progressFill");
  private readonly marbleState = document.querySelector<HTMLElement>("#marbleState");
  private readonly damageScale = document.querySelector<HTMLElement>("#damageScale");
  private readonly resultKicker = document.querySelector<HTMLElement>("#resultKicker");
  private readonly resultTitle = document.querySelector<HTMLElement>("#resultTitle");
  private readonly resultSummary = document.querySelector<HTMLElement>("#resultSummary");
  private readonly buffButton = document.querySelector<HTMLButtonElement>("#buffButton");
  private readonly buffCloseButton = document.querySelector<HTMLButtonElement>("#buffCloseButton");
  private readonly buffList = document.querySelector<HTMLElement>("#buffList");
  private upgradeHandler: UpgradeHandler | undefined;
  private buffOpenHandler: VoidHandler | undefined;
  private buffCloseHandler: VoidHandler | undefined;

  constructor(
    private readonly stageShell: HTMLElement,
    private readonly upgradePanel: HTMLElement,
    private readonly upgradeChoices: HTMLElement,
    private readonly resultOverlay: HTMLElement,
    private readonly pauseOverlay: HTMLElement,
    private readonly buffOverlay: HTMLElement,
  ) {
    upgradeChoices.addEventListener("click", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-upgrade]");
      if (!button) {
        return;
      }
      this.upgradeHandler?.(button.dataset.upgrade as UpgradeId);
    });

    this.buffButton?.addEventListener("click", () => this.buffOpenHandler?.());
    this.buffCloseButton?.addEventListener("click", () => this.buffCloseHandler?.());
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
    if (this.shields) {
      this.shields.textContent = snapshot.shields > 0 ? `◆×${snapshot.shields}` : "";
      this.shields.style.display = snapshot.shields > 0 ? "" : "none";
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
    if (this.dashFill) {
      this.dashFill.style.width = `${Math.round(Math.max(0, Math.min(1, snapshot.dashCooldownRatio)) * 100)}%`;
    }
    if (this.dashCooldown) {
      this.dashCooldown.textContent = snapshot.dashCooldownText;
    }
    if (this.progressFill) {
      this.progressFill.style.width = `${Math.round(snapshot.waveProgress * 100)}%`;
    }
    if (this.marbleState) {
      this.marbleState.textContent = MARBLE_STATE_LABEL[snapshot.marbleState];
    }
    if (this.damageScale) {
      this.damageScale.textContent = `x${snapshot.damageScale}`;
    }
    if (this.buffButton) {
      this.buffButton.dataset.count = snapshot.ownedBuffs.length.toString();
      this.buffButton.classList.toggle("has-buffs", snapshot.ownedBuffs.length > 0);
    }
  }

  showUpgrades(upgrades: Upgrade[]): void {
    this.upgradeChoices.replaceChildren(
      ...upgrades.map((upgrade) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.upgrade = upgrade.id;
        button.dataset.rarity = upgrade.rarity;
        button.innerHTML = `
          <span class="card-rarity">${RARITY_LABEL[upgrade.rarity]}</span>
          <span class="card-art">${this.cardIcon(upgrade.id)}</span>
          <strong>${upgrade.title}</strong>
          <span class="card-desc">${upgrade.description}</span>
          <span class="card-action">选择</span>
        `;
        return button;
      }),
    );
    this.stageShell.classList.add("modal-open");
    this.upgradePanel.hidden = false;
  }

  hideUpgrades(): void {
    this.upgradePanel.hidden = true;
    this.clearModalOpenIfIdle();
  }

  showBuffs(buffs: OwnedBuff[]): void {
    if (this.buffList) {
      if (buffs.length === 0) {
        this.buffList.innerHTML = `<p class="empty-buffs">还没有获得强化。</p>`;
      } else {
        this.buffList.replaceChildren(...buffs.map((buff) => this.buffItem(buff)));
      }
    }
    this.stageShell.classList.add("modal-open");
    this.buffOverlay.hidden = false;
  }

  hideBuffs(): void {
    this.buffOverlay.hidden = true;
    this.clearModalOpenIfIdle();
  }

  showResult(kind: "victory" | "defeat", score: number, wave: number): void {
    this.hideUpgrades();
    this.hideBuffs();
    if (this.resultKicker) {
      this.resultKicker.textContent = kind === "victory" ? "通关成功" : "本局失败";
    }
    if (this.resultTitle) {
      this.resultTitle.textContent = kind === "victory" ? "胜利" : "失败";
    }
    if (this.resultSummary) {
      this.resultSummary.textContent = `分数 ${Math.floor(score)} / 第 ${wave} 波`;
    }
    this.stageShell.classList.add("modal-open");
    this.resultOverlay.hidden = false;
  }

  hideResult(): void {
    this.resultOverlay.hidden = true;
    this.clearModalOpenIfIdle();
  }

  showPause(): void {
    this.stageShell.classList.add("modal-open");
    this.pauseOverlay.hidden = false;
  }

  hidePause(): void {
    this.pauseOverlay.hidden = true;
    this.clearModalOpenIfIdle();
  }

  onUpgrade(handler: UpgradeHandler): void {
    this.upgradeHandler = handler;
  }

  onBuffOpen(handler: VoidHandler): void {
    this.buffOpenHandler = handler;
  }

  onBuffClose(handler: VoidHandler): void {
    this.buffCloseHandler = handler;
  }

  private buffItem(buff: OwnedBuff): HTMLElement {
    const item = document.createElement("article");
    item.className = "buff-item";
    item.dataset.rarity = buff.rarity;
    item.innerHTML = `
      <span class="buff-rarity">${RARITY_LABEL[buff.rarity]}</span>
      <strong>${buff.title}${buff.count > 1 ? ` x${buff.count}` : ""}</strong>
      <p>${buff.description}</p>
    `;
    return item;
  }

  private clearModalOpenIfIdle(): void {
    if (this.upgradePanel.hidden && this.resultOverlay.hidden && this.pauseOverlay.hidden && this.buffOverlay.hidden) {
      this.stageShell.classList.remove("modal-open");
    }
  }

  private cardIcon(upgradeId: UpgradeId): string {
    const icons: Record<UpgradeId, string> = {
      extraDamage: "弹",
      longerRange: "远",
      recallBlade: "回",
      quickDash: "闪",
      vitality: "心",
      humanCannon: "炮",
      piercingMarble: "穿",
      sprintTraining: "跑",
      rollMastery: "滚",
      lightMarble: "速",
      multiBounce: "弹",
      sizeAmplify: "大",
      expandedPouch: "包",
      hunterCalibration: "猎",
      swiftRecall: "收",
      rapidThrow: "射",
      crisisConcentration: "专",
      shieldTrait: "盾",
      vampirism: "吸",
      momentumContinue: "势",
      chainLoading: "连",
      fragmentTrajectory: "碎",
      shockKnockback: "震",
      tripleShot: "三",
      freezeHit: "冰",
      growingMarble: "长",
      drillMarble: "钻",
    };
    return icons[upgradeId];
  }
}
