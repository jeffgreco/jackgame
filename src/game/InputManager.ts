/** Tracks which keys are currently held down and provides one-shot press detection. */
export class InputManager {
  private held = new Set<string>();
  private justPressed = new Set<string>();
  private consumed = new Set<string>();

  constructor() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (!this.held.has(key)) {
        this.justPressed.add(key);
      }
      this.held.add(key);
    });
    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.held.delete(key);
      this.consumed.delete(key);
    });
  }

  isDown(key: string): boolean {
    return this.held.has(key);
  }

  /** Returns true only once per key press (until released and pressed again). */
  wasPressed(key: string): boolean {
    if (this.justPressed.has(key) && !this.consumed.has(key)) {
      this.consumed.add(key);
      return true;
    }
    return false;
  }

  /** Call at end of each frame. */
  endFrame(): void {
    this.justPressed.clear();
  }
}
