type Listener = (data: unknown) => void;

export class EventManager {
  private listeners = new Map<string, Set<Listener>>();
  private onceListeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
  }

  once(event: string, listener: Listener): void {
    if (!this.onceListeners.has(event)) this.onceListeners.set(event, new Set());
    this.onceListeners.get(event)!.add(listener);
  }

  off(event: string, listener: Listener): void {
    this.listeners.get(event)?.delete(listener);
    this.onceListeners.get(event)?.delete(listener);
  }

  emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((l) => l(data));
    const once = this.onceListeners.get(event);
    if (once) {
      once.forEach((l) => l(data));
      once.clear();
    }
  }

  clear(): void {
    this.listeners.clear();
    this.onceListeners.clear();
  }
}
