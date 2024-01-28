import { Event, EventDispatcher } from './events.js';


type Iter = Generator<number, void, number>;

export declare namespace Animation {
	export type Iterator = Iter;
	export type Generator = (this: Animation) => Iter;
}
export class Animation extends EventDispatcher {
	public static readonly MIN_TIME: number = 10;

	public '@play' = new Event<Animation, []>(this);
	public '@pause' = new Event<Animation, []>(this);
	public '@done' = new Event<Animation, []>(this);
	public '@tick' = new Event<Animation, []>(this);
	public '@reset' = new Event<Animation, []>(this);

	public done: boolean = true;

	protected dt: number = 0;
	protected time: number = 0;

	protected _numberOfPlayed: number = 0;
	public get numberOfPlayed() { return this._numberOfPlayed; }

	protected _isPlaying: boolean = false;
	public get isPlayed() { return this._isPlaying; }
	public get isPaused() { return !this._isPlaying; }

	declare public [Symbol.iterator]: Animation.Iterator;
	public get iterator() { return this[Symbol.iterator]; }
	public set iterator(v) { this[Symbol.iterator] = v; }

	constructor(
		public generator: Animation.Generator,
		public looped: boolean = false,
		public isTimeSync: boolean = false,
		public readonly MIN_TIME: number = Animation.MIN_TIME
	) { super(); }

	public play(a: boolean = false): boolean {
		if(this._isPlaying) return false;
		this._isPlaying = true;

		if(!this._numberOfPlayed || a && this.done) {
			this.reset();
			this.time = this.iterator.next().value || 0;
		}

		this['@play'].emit();

		return true;
	}
	public pause(): boolean {
		if(!this._isPlaying) return false;
		this._isPlaying = false;
		this['@pause'].emit();

		return true;
	}
	public toggle(a: boolean = false): void { this._isPlaying ? this.pause() : this.play(a); }

	public reset(generator?: Animation.Generator): void {
		if(generator) this.generator = generator;

		this.iterator?.return(void 0);
		this.iterator = this.generator.call(this);

		this.dt = 0;
		this.done = false;

		if(generator) this._numberOfPlayed = 0;

		this['@reset'].emit();
	}

	public tick(dt: number): void {
		if(this.done || !this._isPlaying) return;

		this.dt += dt;
		if(this.dt < this.time) return;

		let delta = dt;

		while(true) {
			const { done, value } = this.iterator.next(delta);

			if(done) {
				this._numberOfPlayed++;
				this['@done'].emit();

				if(this.looped) {
					this.reset();
					continue;
				} else {
					this.done = done;
					this._isPlaying = false;
					return;
				}
			}

			this.dt -= this.time;
			this.time = value;

			if(this.isTimeSync) {
				if(!value || value < this.MIN_TIME) throw new Error('The time cannot be zero or less Animation.MIN_TIME');

				if(this.dt >= value) {
					delta = 0;
					continue;
				}
			} else this.dt = 0;

			this['@tick'].emit();

			return;
		}
	}
}
