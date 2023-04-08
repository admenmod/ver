import { EventDispatcher, Event } from './events';
import type { KeyboardInputInterceptor } from './KeyboardInputInterceptor';

type mode_t = PropertyKey;
type mapping_t = string[];
type action_t = (mapping: Mapping) => any;


const isPartialMatching = (acc: mapping_t, mapping: mapping_t): boolean => {
	if(acc.length > mapping.length) return false;

	for(let i = 0; i < acc.length; i++) {
		if(acc[i] !== mapping[i]) return false;
	}

	return true;
};

const isFullMatching = (acc: mapping_t, mapping: mapping_t) => acc.length === mapping.length && isPartialMatching(acc, mapping);


interface IMapping {
	mapping: mapping_t;
	action: action_t;
}


export class Mapping implements IMapping {
	constructor(
		public mapping: mapping_t,
		public action: action_t
	) {}
}


export class MappingsMode extends Array<IMapping> {
	constructor(public readonly mode: mode_t) { super(); }

	public register(this: MappingsMode, mapping: mapping_t, action: action_t): void {
		const maps: MappingsMode = this;

		const collision = maps.find(i => isFullMatching(i.mapping, mapping));

		if(collision) collision.action = action;
		else maps.push(new Mapping(mapping, action));
	}
}


export namespace KeymapperOfActions {
	export type Action = action_t;
}

export class KeymapperOfActions extends EventDispatcher {
	public static readonly GLOBAL_MODE = Symbol('GLOBAL_NAMESPACE');

	public '@init' = new Event<KeymapperOfActions, []>(this);
	public '@destroy' = new Event<KeymapperOfActions, []>(this);
	public '@enable' = new Event<KeymapperOfActions, []>(this);
	public '@disable' = new Event<KeymapperOfActions, []>(this);

	public '@newmode' = new Event<KeymapperOfActions, [mode_t, MappingsMode]>(this);
	public '@changemode' = new Event<KeymapperOfActions, [mode_t, MappingsMode]>(this);
	public '@register' = new Event<KeymapperOfActions, [mode_t | 0, mapping_t, action_t]>(this);

	protected keyboardInputInterceptor!: KeyboardInputInterceptor;

	private mode: mode_t | null = null;
	public mapmap: Record<mode_t, MappingsMode> = Object.create(null);

	public gmaps: MappingsMode = new MappingsMode(KeymapperOfActions.GLOBAL_MODE);
	public cmaps!: MappingsMode;
	public mapping: IMapping | null = null;
	public timeoutlen: number = 1000;

	public timeout: number = this.timeoutlen;
	public isTimeRun: boolean = true;
	public acc: string[] = [];

	private _isActive: boolean = true;
	public get isActive(): boolean { return this._isActive; }

	private handler!: (e: KeyboardInputInterceptor.Event) => any;


	constructor(mode: mode_t | MappingsMode, timeoutlen?: number) {
		super();

		if(timeoutlen) this.timeoutlen = timeoutlen;

		this.setMode(mode);
	}


	public resetAcc(): void { this.acc.length = 0; }
	public resetTimer(): void { this.timeout = this.timeoutlen; }

	public enable(this: KeymapperOfActions): void {
		this._isActive = true;
		this.emit('enable');
	}

	public disable(this: KeymapperOfActions): void {
		this._isActive = false;
		this.emit('disable');
	}

	public init(this: KeymapperOfActions, keyboardInputInterceptor: KeyboardInputInterceptor): void {
		this.keyboardInputInterceptor = keyboardInputInterceptor;

		this.handler = e => {
			this.isTimeRun = true;
			this.resetTimer();

			if(e.key === 'Escape') {
				this.resetAcc();
				return;
			}

			let metapref = '';
			if(e.ctrl) metapref += 'Ctrl-';
			if(e.shift) metapref += 'Shift-';
			if(e.alt) metapref += 'Alt-';
			if(e.meta) metapref += 'Meta-';

			this.acc.push(metapref+e.key);


			const maps = this.cmaps;

			const mappings = [
				...maps.filter(i => isPartialMatching(this.acc, i.mapping)),
				...this.gmaps.filter(i => isPartialMatching(this.acc, i.mapping))
			];

			if(!mappings.length) return this.resetAcc();


			const mapping = mappings.find(i => this.acc.length === i.mapping.length) || null;
			this.mapping = mapping;

			if(mapping && mappings.length === 1) {
				mapping.action.call(null, mapping);
				this.resetAcc();
			} else if(!mapping) this.isTimeRun = false;
		};

		this.keyboardInputInterceptor.on('keydown:input', this.handler);

		this.emit('init');
	}

	public destroy(this: KeymapperOfActions): void {
		this.keyboardInputInterceptor.off('keydown:input', this.handler);

		this.emit('disable');
	}

	public register(this: KeymapperOfActions, mode: mode_t | 0, mapping: mapping_t, action: action_t): void {
		if(mode !== 0 && !this.mapmap[mode] || !mapping.length) return;

		let maps: MappingsMode;
		if(mode === 0) maps = this.gmaps;
		else maps = this.mapmap[mode];

		maps.register(mapping, action);

		this.emit('register', mode, mapping, action);
	}

	public getMode(mode: mode_t) { return this.mapmap[mode]; }

	public setMode(this: KeymapperOfActions, mode: mode_t | MappingsMode) {
		if(typeof mode === 'object') {
			this.mapmap[mode.mode] = mode;

			this.emit('newmode', mode.mode, mode);

			this.mode = mode.mode;
			this.cmaps = mode;

			this.emit('changemode', mode.mode, mode);
		} else if(!this.mapmap[mode]) {
			this.mapmap[mode] = new MappingsMode(mode);

			this.emit('newmode', mode, this.mapmap[mode]);

			this.mode = mode;
			this.cmaps = this.mapmap[this.mode];

			this.emit('changemode', mode, this.mapmap[mode]);
		}
	}

	public update(dt: number): void {
		if(!this._isActive) return;

		if(this.acc.length && this.isTimeRun) this.timeout -= dt;

		if(this.timeout < 0) {
			if(this.mapping) this.mapping.action.call(null, this.mapping);

			this.resetAcc();
			this.resetTimer();
		}
	}
}
