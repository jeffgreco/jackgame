import type { ResourceType } from '../world/ResourceNode';

const RESOURCE_COLORS: Record<ResourceType, string> = {
  wood: '#8B5E3C',
  stone: '#888',
  iron: '#99a',
  gold: '#da2',
};

const RESOURCE_NAMES: Record<ResourceType, string> = {
  wood: 'Wood',
  stone: 'Stone',
  iron: 'Iron',
  gold: 'Gold',
};

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  cost: Partial<Record<ResourceType, number>>;
  applied: boolean;
}

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
  private shelterPanel: HTMLElement;
  private shelterUpgrades: HTMLElement;
  private shelterIndicator: HTMLElement;
  private flashTimeout: ReturnType<typeof setTimeout> | null = null;
  private pickupTimeout: ReturnType<typeof setTimeout> | null = null;
  onUpgrade?: (id: string) => void;

  constructor() {
    this.healthBar = document.getElementById('health-bar')!;
    this.healthText = document.getElementById('health-text')!;
    this.killCounter = document.getElementById('kill-counter')!;
    this.damageFlash = document.getElementById('damage-flash')!;
    this.pickupFlash = document.getElementById('pickup-flash')!;
    this.resourceBar = document.getElementById('resource-bar')!;
    this.shelterPanel = document.getElementById('shelter-panel')!;
    this.shelterUpgrades = document.getElementById('shelter-upgrades')!;
    this.shelterIndicator = document.getElementById('shelter-indicator')!;
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

  showShelterPanel(upgrades: UpgradeDef[], inventory: Record<ResourceType, number>): void {
    this.shelterPanel.style.display = 'block';
    this.shelterIndicator.style.display = 'block';
    this.renderUpgrades(upgrades, inventory);
  }

  hideShelterPanel(): void {
    this.shelterPanel.style.display = 'none';
    this.shelterIndicator.style.display = 'none';
  }

  renderUpgrades(upgrades: UpgradeDef[], inventory: Record<ResourceType, number>): void {
    this.shelterUpgrades.innerHTML = '';
    for (const up of upgrades) {
      const btn = document.createElement('button');
      btn.className = 'upgrade-btn';
      if (up.applied) btn.classList.add('done');

      const canAfford = !up.applied && Object.entries(up.cost).every(
        ([res, amt]) => inventory[res as ResourceType] >= (amt as number)
      );

      const costStr = Object.entries(up.cost)
        .map(([res, amt]) => `${amt} ${RESOURCE_NAMES[res as ResourceType]}`)
        .join(', ');

      btn.innerHTML = up.applied
        ? `<div>${up.name} <span style="color:#8c8">&#10003;</span></div><div class="cost">${up.description}</div>`
        : `<div>${up.name}</div><div class="cost">${costStr}</div>`;

      btn.disabled = up.applied || !canAfford;

      if (!up.applied && canAfford) {
        btn.addEventListener('click', () => {
          this.onUpgrade?.(up.id);
        });
      }

      this.shelterUpgrades.appendChild(btn);
    }
  }
}
