import type { ResourceType } from '../world/ResourceNode';

const RESOURCE_COLORS: Record<ResourceType, string> = {
  wood: '#8B5E3C',
  stone: '#888',
  iron: '#99a',
  gold: '#da2',
};

/**
 * HUD manager that updates the HTML overlay elements.
 */
export class HUD {
  private healthBar: HTMLElement;
  private healthText: HTMLElement;
  private killCounter: HTMLElement;
  private damageFlash: HTMLElement;
  private pickupFlash: HTMLElement;
  private resourceBar: HTMLElement;
  private flashTimeout: ReturnType<typeof setTimeout> | null = null;
  private pickupTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.healthBar = document.getElementById('health-bar')!;
    this.healthText = document.getElementById('health-text')!;
    this.killCounter = document.getElementById('kill-counter')!;
    this.damageFlash = document.getElementById('damage-flash')!;
    this.pickupFlash = document.getElementById('pickup-flash')!;
    this.resourceBar = document.getElementById('resource-bar')!;
    this.updateResources({ wood: 0, stone: 0, iron: 0, gold: 0 });
  }

  updateHealth(current: number, max: number): void {
    const pct = Math.max(0, (current / max) * 100);
    this.healthBar.style.width = `${pct}%`;
    this.healthText.textContent = `${Math.ceil(current)} / ${max}`;

    // Color shifts as health drops
    if (pct > 50) {
      this.healthBar.style.background = 'linear-gradient(to bottom, #e44, #b22)';
    } else if (pct > 25) {
      this.healthBar.style.background = 'linear-gradient(to bottom, #e84, #b42)';
    } else {
      this.healthBar.style.background = 'linear-gradient(to bottom, #e22, #800)';
    }
  }

  updateKills(count: number): void {
    this.killCounter.textContent = `Defeated: ${count}`;
  }

  flashDamage(): void {
    this.damageFlash.style.opacity = '1';
    if (this.flashTimeout) clearTimeout(this.flashTimeout);
    this.flashTimeout = setTimeout(() => {
      this.damageFlash.style.opacity = '0';
    }, 150);
  }

  updateResources(inventory: Record<ResourceType, number>): void {
    const types: ResourceType[] = ['wood', 'stone', 'iron', 'gold'];
    this.resourceBar.innerHTML = types
      .map(t => `<span class="res"><span class="dot" style="background:${RESOURCE_COLORS[t]}"></span>${inventory[t]}</span>`)
      .join('');
  }

  flashPickup(): void {
    this.pickupFlash.style.opacity = '1';
    if (this.pickupTimeout) clearTimeout(this.pickupTimeout);
    this.pickupTimeout = setTimeout(() => {
      this.pickupFlash.style.opacity = '0';
    }, 120);
  }
}
