// Decides when a game launch should play the insert animation: once per launch.
// Steam reports one launch several times: a "LaunchApp" game action when Play is pressed, and "running" once the game
// process exists. Steam Cloud sync (or a cloud conflict dialog that restarts the action) can put a long time between
// them, so the old fixed window (15 s) let a later report play the animation a second time.
export class LaunchGate {
  private cur: { key: string; action: string; t: number; running: boolean } | null = null;
  static readonly REPRESS_MS = 60 * 1000;     // a new Play action for the same game this soon, before it runs: same launch
  static readonly MAX_MS = 15 * 60 * 1000;    // a launch that never ran or exited is forgotten after this

  private same(key: string, now: number): boolean {
    return !!this.cur && this.cur.key === key && now - this.cur.t < LaunchGate.MAX_MS;
  }
  /** Play pressed (Steam's "LaunchApp" game action). `action` is Steam's id for that action, if it gave one. */
  onAction(key: string, action: any, now: number): boolean {
    const id = action === undefined || action === null ? "" : String(action);
    if (this.same(key, now)) {
      const c = this.cur!;
      if (id !== "" && id === c.action) return false;                          // the same action reported again
      if (c.running) return false;                                             // already in the game
      if (now - c.t < LaunchGate.REPRESS_MS) { c.action = id || c.action; return false; } // restarted after cloud sync
    }
    this.cur = { key, action: id, t: now, running: false };
    return true;
  }
  /** The game process is running: only a launch that was not seen yet plays the animation. */
  onRunning(key: string, now: number): boolean {
    if (this.same(key, now)) { this.cur!.running = true; return false; }
    this.cur = { key, action: "", t: now, running: true };
    return true;
  }
  /** The game exited: the next Play is a new launch. */
  onExit(key: string): void {
    if (this.cur && this.cur.key === key) this.cur = null;
  }
}
