import { Event, EventDispatcher } from './events.js';


type Iter = Generator<number | null, void | boolean, number>;

export declare namespace Animation {
	export type Iterator = Iter;
	export type Generator<Args extends any[]> = (...args: Args) => Iter;

	export type ArgsOfAnimation<T extends Animation<any>> = T extends Animation<infer A> ? A : never;
	export type ArgsOfGenerator<T extends Animation.Generator<any>> = T extends Animation.Generator<infer A> ? A : never;
}
export class Animation<const Args extends any[] = never> extends EventDispatcher implements PromiseLike<void> {
	public static readonly MIN_TIME: number = 5;

	public '@play' = new Event<Animation<Args>, []>(this);
	public '@pause' = new Event<Animation<Args>, []>(this);
	public '@done' = new Event<Animation<Args>, []>(this);
	public '@tick' = new Event<Animation<Args>, []>(this);
	public '@end' = new Event<Animation<Args>, []>(this);
	public '@run' = new Event<Animation<Args>, Args>(this);
	public '@replay' = new Event<Animation<Args>, []>(this);
	public '@reset' = new Event<Animation<Args>, [
		next: Animation.Generator<Args>,
		prev: Animation.Generator<Args>
	]>(this);

	public done: boolean = true;

	protected dt: number = 0;
	protected time: number = 0;

	protected _numberOfPlayed: number = 0;
	public get numberOfPlayed() { return this._numberOfPlayed; }

	protected _isPlaying: boolean = false;
	public isPlayed() { return this._isPlaying; }
	public isPaused() { return !this._isPlaying; }

	public looped: boolean;
	public isTimeSync: boolean;
	public readonly MIN_TIME: number;

	public iterator: Animation.Iterator | null = null;

	constructor(public generator: Animation.Generator<Args>, p: {
		looped?: boolean, isTimeSync?: boolean, MIN_TIME?: number
	} = {}) {
		super();

		this.looped = p.looped ?? false;
		this.isTimeSync = p.isTimeSync ?? false;
		this.MIN_TIME = p.MIN_TIME ?? Animation.MIN_TIME;
	}

	public play(): boolean {
		if(this._isPlaying) return false;
		this._isPlaying = true;

		this['@play'].emit();

		return true;
	}
	public pause(): boolean {
		if(!this._isPlaying) return false;
		this._isPlaying = false;
		this['@pause'].emit();

		return true;
	}
	public toggle(force?: boolean): void {
		if(typeof force === 'undefined') this._isPlaying ? this.pause() : this.play();
		else this._isPlaying === !force ? this.pause() : this.play();
	}

	#args?: Args;
	public run(...args: Args): this {
		if(this.iterator || !this.done || this._isPlaying) throw new Error('animation not completed');

		this.iterator = this.generator.apply(this, args);

		this.done = false;
		this._isPlaying = true;

		this['@run'].emit(...args);

		this.#args = args;

		return this;
	}

	public reset(generator?: Animation.Generator<Args>): this {
		if(!this.iterator) return this;

		const prev_generator = this.generator;
		if(generator) this.generator = generator;

		this.iterator.return();
		this.iterator = null;

		this.dt = 0;
		this.done = true;
		this._isPlaying = false;
		if(this.generator !== prev_generator) this._numberOfPlayed = 0;

		this['@reset'].emit(this.generator, prev_generator);

		this.#args = void 0;

		return this;
	}

	public replay(): this {
		if(!this.iterator || !this.#args) throw new Error('replay before running');

		this.iterator.return();
		this.iterator = this.generator.apply(this, this.#args);

		this.dt = 0;
		this.done = false;
		this._isPlaying = true;

		const { done, value } = this.iterator.next();
		if(!done) this.time = value || 0;
		else throw new Error('invalid animation');

		this['@replay'].emit();

		return this;
	}

	public tick(dt: number): void {
		if(!this.iterator || this.done || !this._isPlaying) return;

		this.dt += dt;
		if(this.dt < this.time) return;

		let delta = dt;

		while(true) {
			const { done, value } = this.iterator.next(delta);

			if(done) {
				this['@tick'].emit();

				this._numberOfPlayed++;
				this['@done'].emit();

				if(value === void 0 && this.looped || value) {
					this.replay();
					continue;
				} else {
					this.reset();
					this['@end'].emit();
					return;
				}
			}

			if(value === null) return;

			this.dt -= this.time;
			this.time = value;

			if(this.isTimeSync) {
				if(value < 0 || value < this.MIN_TIME) throw new Error('The time cannot be zero or less MIN_TIME');

				if(this.dt >= value) {
					delta = 0;
					continue;
				}
			} else this.dt = 0;

			this['@tick'].emit();

			return;
		}
	}


	public then<T1 = void, T2 = never>(
		onfulfilled?: (() => T1 | PromiseLike<T1>) | null,
		onrejected?: ((reason: any) => T2 | PromiseLike<T2>) | null
	): Promise<T1 | T2> {
		if(!this.iterator || this.done) return Promise.resolve().then(onfulfilled, onrejected);
		return new Promise<void>(res => this['@end'].once(() => res())).then(onfulfilled, onrejected);
	}
}
