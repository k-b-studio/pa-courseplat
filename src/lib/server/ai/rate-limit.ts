/**
 * Client-side limiter for ThaiLLM: at most `maxConcurrent` requests in flight and at most
 * `perSecond` starts in any rolling one-second window (spec 02: 3 in flight, 4 per second).
 * The clock is injectable so a test can prove the window.
 */
export type Clock = { now(): number; sleep(ms: number): Promise<void> };

export const realClock: Clock = {
	now: () => Date.now(),
	sleep: (ms) => new Promise((r) => setTimeout(r, ms))
};

export class RateLimiter {
	private active = 0;
	private starts: number[] = [];
	private waiters: (() => void)[] = [];

	constructor(
		private readonly opts: { maxConcurrent: number; perSecond: number },
		private readonly clock: Clock = realClock
	) {}

	private async acquire(): Promise<void> {
		for (;;) {
			const t = this.clock.now();
			while (this.starts.length && this.starts[0] <= t - 1000) this.starts.shift();
			if (this.active < this.opts.maxConcurrent && this.starts.length < this.opts.perSecond) {
				this.starts.push(t);
				this.active++;
				return;
			}
			if (this.active >= this.opts.maxConcurrent) {
				await new Promise<void>((r) => this.waiters.push(r));
			} else {
				await this.clock.sleep(Math.max(1, this.starts[0] + 1000 - t + 1));
			}
		}
	}

	private release() {
		this.active--;
		const w = this.waiters.shift();
		if (w) w();
	}

	async run<T>(fn: () => Promise<T>): Promise<T> {
		await this.acquire();
		try {
			return await fn();
		} finally {
			this.release();
		}
	}
}
