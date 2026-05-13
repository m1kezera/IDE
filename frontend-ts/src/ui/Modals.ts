/**
 * Project Y — Modal Controller (v5.0)
 * Controls Identity Lock, Sentinel Panic, and Boot Screen via style.display toggling.
 * Zero DOM creation/destruction — all modals are pre-baked in the HTML.
 */

import { registerIdentity } from '../api/client';
import { PubSub } from '../core/PubSub';

export function initModals(): void {
  // ─── Identity Modal ────────────────────────────────────────────
  const identityModal = document.getElementById('projecty-identity-modal') as HTMLElement;
  const identityForm = document.getElementById('projecty-identity-form') as HTMLFormElement;
  const identityInput = document.getElementById('projecty-identity-input') as HTMLInputElement;

  if (identityForm) {
    identityForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = identityInput.value.trim();
      if (!name) return;

      try {
        await registerIdentity(name);
        identityModal.style.display = 'none';
        PubSub.emit('identity:registered', name);
      } catch (err) {
        console.error('[Modals] Identity registration failed:', err);
      }
    });
  }

  // ─── Sentinel Panic Overlay ─────────────────────────────────────
  const panicOverlay = document.getElementById('projecty-panic-overlay') as HTMLElement;
  const panicReason = document.getElementById('projecty-panic-reason') as HTMLElement;
  const panicDismiss = document.getElementById('projecty-panic-dismiss') as HTMLElement;

  PubSub.on('sentinel:panic', (reason) => {
    if (panicOverlay && panicReason) {
      panicReason.textContent = reason as string;
      panicOverlay.style.display = 'flex';
    }
  });

  if (panicDismiss) {
    panicDismiss.addEventListener('click', () => {
      panicOverlay.style.display = 'none';
    });
  }
}

export function showIdentityModal(): void {
  const el = document.getElementById('projecty-identity-modal');
  if (el) el.style.display = 'flex';
}

export function hideBootScreen(): void {
  const boot = document.getElementById('projecty-boot-screen');
  const ide = document.getElementById('projecty-ide');
  if (boot) boot.style.display = 'none';
  if (ide) ide.style.display = 'grid';
}
