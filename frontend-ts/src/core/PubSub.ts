/**
 * Project Y — Global Event Bus (PubSub)
 * Isolates UI modules from each other via a publish/subscribe pattern.
 */

type Handler = (data?: unknown) => void;

class PubSubBus {
  private listeners: Map<string, Set<Handler>> = new Map();

  on(event: string, handler: Handler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: Handler): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, data?: unknown): void {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (e) {
        console.error(`[PubSub] Error in handler for "${event}":`, e);
      }
    });
  }
}

export const PubSub = new PubSubBus();
