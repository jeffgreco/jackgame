import { InputManager } from '../game/InputManager';

const JOYSTICK_SIZE = 120;
const JOYSTICK_KNOB_SIZE = 50;
const BUTTON_SIZE = 64;
const DEAD_ZONE = 0.15;

/**
 * Virtual touch controls for mobile:
 * - Left side: joystick for movement
 * - Right side: A (sword) and B (bow) buttons
 *
 * Only shown on touch devices.
 */
export class TouchControls {
  private container: HTMLElement;
  private input: InputManager;

  // Joystick state
  private joystickBase: HTMLElement;
  private joystickKnob: HTMLElement;
  private joystickTouchId: number | null = null;
  private joystickOrigin = { x: 0, y: 0 };

  // Track which virtual direction keys are held
  private virtualKeys = { up: false, down: false, left: false, right: false };

  constructor(input: InputManager) {
    this.input = input;

    this.container = document.createElement('div');
    this.container.id = 'touch-controls';
    document.body.appendChild(this.container);

    // Build joystick
    this.joystickBase = this.createJoystickBase();
    this.joystickKnob = this.createJoystickKnob();
    this.joystickBase.appendChild(this.joystickKnob);
    this.container.appendChild(this.joystickBase);

    // Build action buttons
    this.container.appendChild(this.createButton('A', 'touch-btn-a', this.onSword));
    this.container.appendChild(this.createButton('B', 'touch-btn-b', this.onBow));

    // Touch events
    this.container.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.container.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.container.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.container.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });

    this.injectStyles();
  }

  private createJoystickBase(): HTMLElement {
    const el = document.createElement('div');
    el.id = 'joystick-base';
    return el;
  }

  private createJoystickKnob(): HTMLElement {
    const el = document.createElement('div');
    el.id = 'joystick-knob';
    return el;
  }

  private createButton(label: string, id: string, _handler: () => void): HTMLElement {
    const el = document.createElement('div');
    el.id = id;
    el.className = 'touch-btn';
    el.textContent = label;
    return el;
  }

  private onSword = (): void => {
    this.input.triggerPress('a');
  };

  private onBow = (): void => {
    this.input.triggerPress('b');
  };

  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);

      if (target && (target.id === 'touch-btn-a' || target.closest('#touch-btn-a'))) {
        this.onSword();
        this.flashButton('touch-btn-a');
      } else if (target && (target.id === 'touch-btn-b' || target.closest('#touch-btn-b'))) {
        this.onBow();
        this.flashButton('touch-btn-b');
      } else if (touch.clientX < window.innerWidth / 2) {
        // Left half = joystick
        this.joystickTouchId = touch.identifier;
        this.joystickOrigin.x = touch.clientX;
        this.joystickOrigin.y = touch.clientY;
        // Move joystick base to touch position
        this.joystickBase.style.left = `${touch.clientX - JOYSTICK_SIZE / 2}px`;
        this.joystickBase.style.top = `${touch.clientY - JOYSTICK_SIZE / 2}px`;
        this.joystickBase.style.opacity = '1';
        this.joystickKnob.style.transform = 'translate(-50%, -50%)';
      }
    }
  };

  private handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      if (touch.identifier === this.joystickTouchId) {
        const dx = touch.clientX - this.joystickOrigin.x;
        const dy = touch.clientY - this.joystickOrigin.y;
        const maxDist = JOYSTICK_SIZE / 2;
        const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
        const angle = Math.atan2(dy, dx);

        const clampedX = Math.cos(angle) * dist;
        const clampedY = Math.sin(angle) * dist;

        this.joystickKnob.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;

        // Normalize to -1..1
        const nx = clampedX / maxDist;
        const ny = clampedY / maxDist;

        this.updateVirtualDirection(nx, ny);
      }
    }
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    e.preventDefault();
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      if (touch.identifier === this.joystickTouchId) {
        this.joystickTouchId = null;
        this.joystickKnob.style.transform = 'translate(-50%, -50%)';
        this.joystickBase.style.opacity = '0.5';
        this.updateVirtualDirection(0, 0);
      }
    }
  };

  private updateVirtualDirection(nx: number, ny: number): void {
    const newKeys = {
      up: ny < -DEAD_ZONE,
      down: ny > DEAD_ZONE,
      left: nx < -DEAD_ZONE,
      right: nx > DEAD_ZONE,
    };

    // Map to the keyboard keys Player.ts listens for
    if (newKeys.up !== this.virtualKeys.up) {
      this.input.setHeld('arrowup', newKeys.up);
    }
    if (newKeys.down !== this.virtualKeys.down) {
      this.input.setHeld('arrowdown', newKeys.down);
    }
    if (newKeys.left !== this.virtualKeys.left) {
      this.input.setHeld('arrowleft', newKeys.left);
    }
    if (newKeys.right !== this.virtualKeys.right) {
      this.input.setHeld('arrowright', newKeys.right);
    }

    this.virtualKeys = newKeys;
  }

  private flashButton(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.background = 'rgba(255, 255, 255, 0.5)';
    setTimeout(() => {
      el.style.background = '';
    }, 120);
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      #touch-controls {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 100;
        user-select: none;
        -webkit-user-select: none;
        touch-action: none;
      }

      /* Show on touch devices */
      @media (pointer: coarse) {
        #touch-controls {
          display: block;
          pointer-events: auto;
        }
        #controls-hint {
          display: none !important;
        }
      }

      #joystick-base {
        position: absolute;
        bottom: 40px;
        left: 30px;
        width: ${JOYSTICK_SIZE}px;
        height: ${JOYSTICK_SIZE}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.15);
        border: 2px solid rgba(255, 255, 255, 0.3);
        opacity: 0.5;
        transition: opacity 0.2s;
      }

      #joystick-knob {
        position: absolute;
        top: 50%;
        left: 50%;
        width: ${JOYSTICK_KNOB_SIZE}px;
        height: ${JOYSTICK_KNOB_SIZE}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.4);
        border: 2px solid rgba(255, 255, 255, 0.6);
        transform: translate(-50%, -50%);
        transition: background 0.1s;
      }

      .touch-btn {
        position: absolute;
        width: ${BUTTON_SIZE}px;
        height: ${BUTTON_SIZE}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid rgba(255, 255, 255, 0.4);
        color: #fff;
        font-size: 20px;
        font-weight: bold;
        font-family: 'Segoe UI', Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        pointer-events: auto;
        transition: background 0.1s;
      }

      .touch-btn:active {
        background: rgba(255, 255, 255, 0.5);
      }

      #touch-btn-a {
        bottom: 60px;
        right: 30px;
      }

      #touch-btn-b {
        bottom: 140px;
        right: 30px;
      }
    `;
    document.head.appendChild(style);
  }
}
