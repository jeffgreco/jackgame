export interface GameState {
  playerHealth: number;
  playerMaxHealth: number;
  kills: number;
  /** Timestamp of last time player was hit (for damage flash). */
  lastHitTime: number;
}

export function createInitialState(): GameState {
  return {
    playerHealth: 100,
    playerMaxHealth: 100,
    kills: 0,
    lastHitTime: 0,
  };
}
