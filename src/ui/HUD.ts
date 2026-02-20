/**
 * HUD manager that updates the HTML overlay elements.
 */
export class HUD {
  private healthBar: HTMLElement;
  private healthText: HTMLElement;
  private killCounter: HTMLElement;
  private damageFlash: HTMLElement;
  private flashTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.healthBar = document.getElementById('health-bar')!;
    this.healthText = document.getElementById('health-text')!;
    this.killCounter = document.getElementById('kill-counter')!;
    this.damageFlash = document.getElementById('damage-flash')!;
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
}
