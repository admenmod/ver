import { Event, EventDispatcher } from './events.js';


export class MainLoop extends EventDispatcher {
	public '@start' = new Event<MainLoop, []>(this);
	public '@stop' = new Event<MainLoop, []>(this);
	public '@update' = new Event<MainLoop, [dt: number]>(this);

	public isEnabled: boolean;
	public prevTime: number;
	public maxDiff: number;
	public mindt: number;

	public dt!: number;


	constructor(p: {
		maxDiff?: number,
		mindt?: number,
		fps?: number
	} = {}) {
		super();

		this.isEnabled = false;
		this.prevTime = 0;
		this.maxDiff = p.maxDiff || 1000;
		this.mindt = p.mindt || 1000 / (p.fps || 120);
	}

	public start(this: MainLoop): void {
		if(this.isEnabled) return;
		this.isEnabled = true;

		let _update = (currentTime: number): void => {
			if(!this.isEnabled) {
				this.emit('stop');
				return;
			}

			this.dt = currentTime - this.prevTime;

			if(this.dt > this.mindt) {
				if(this.dt < this.maxDiff) this['@update'].emit(this.dt);
				this.prevTime = currentTime;
			}

			if('requestAnimationFrame' in globalThis ) requestAnimationFrame(_update);
			else setTimeout(_update, this.mindt, performance.now());
		};

		this.emit('start');

		if('requestAnimationFrame' in globalThis ) requestAnimationFrame(_update);
		else setTimeout(_update, this.mindt, performance.now());
	}

	public stop(): void {
		if(!this.isEnabled) return;
		this.isEnabled = false;
	}


	public destroy(): void {
		this.events_off(true);
	}
}
