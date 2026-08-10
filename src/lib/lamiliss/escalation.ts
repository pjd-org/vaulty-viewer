export type EscalationDecision = 'retry' | 'escalate';

export class LamilissEscalationController {
  private gate: string | null = null;
  private attempts = 0;

  recordFailure(failingGate: string): EscalationDecision {
    if (this.gate !== failingGate) {
      this.gate = failingGate;
      this.attempts = 0;
    }
    this.attempts += 1;
    return this.attempts >= 2 ? 'escalate' : 'retry';
  }

  get state(): { gate: string | null; attempts: number } {
    return { gate: this.gate, attempts: this.attempts };
  }

  reset(): void {
    this.gate = null;
    this.attempts = 0;
  }
}
