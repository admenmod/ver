import { EventDispatcher, Event } from './events';
import type { Camera } from './Camera';
import type { getInstanceOf } from '@ver/types';


type Layers = Record<string, CanvasRenderingContext2D>;

type getTree<T extends Scene> = { [K in keyof ReturnType<T['TREE']>]: getInstanceOf<ReturnType<T['TREE']>[K]>; };

type splice0_t<T> = T extends [infer _, ...infer R] ? R : never;

export class Scene extends EventDispatcher {
	protected readonly _class: typeof Scene;

	private _owner: Scene | null = null;
	public get owner() { return this._owner; }

	private _name: string = this.constructor.name;
	public get name() { return this._name; }


	public '@init' = new Event<Scene, never[]>(this);
	public '@exit' = new Event<Scene, never[]>(this);
	public '@ready' = new Event<Scene, never[]>(this);

	public '@process' = new Event<Scene, [number, ...never[]]>(this);
	public '@render' = new Event<Scene, [Layers, Camera, ...never[]]>(this);


	protected static _TREE: Record<string, typeof Scene>;
	protected tree: Record<string, Scene> = Object.create(null);

	public TREE(): Record<string, typeof Scene> { return {}; };

	public get(): getTree<this>;
	public get<Name extends keyof getTree<this>>(name: Name): getTree<this>[Name];
	public get(name: any = null) {
		if(name === null) return this.tree;
		return this.tree[name];
	}


	protected _isReady: boolean = false;
	protected _isInited: boolean = false;
	protected _isExited: boolean = true;

	public get isReady(): boolean { return this._isReady; }
	public get isInited(): boolean { return this._isInited; }
	public get isExited(): boolean { return this._isExited; }

	public get isLoaded(): boolean { return this._class._isLoaded; }
	public get isUnloaded(): boolean { return this._class._isUnloaded; }


	constructor() {
		super();
		this._class = new.target;

		this._init_tree();
	}

	private _init_tree(): void {
		if(!this.isLoaded) throw new Error(`(${this.name}) you can't instantiate a scene before it's loaded`);

		for(const id in this._class._TREE) {
			const s = this._class._TREE[id];

			this.tree[id] = new s();
			this.tree[id]._owner = this;
			this.tree[id]._name = id;
		}
	}


	protected _ready(): void {}
	// protected _enter_tree(): void {}
	// protected _exit_tree(): void {}

	protected async _init(...args: never[]): Promise<void> {}
	protected async _exit(...args: never[]): Promise<void> {}

	protected _process(dt: number, ...args: never[]): void {}
	protected _render(layers: Layers, camera: Camera, ...args: never[]): void {}


	public ready(): void {
		if(this._isReady || !this._isInited || !this.isLoaded) return;

		this._ready();

		for(const id in this.tree) this.tree[id].ready();

		this._isReady = true;

		(this as Scene).emit('ready');
	}

	//@ts-ignore
	public async init<This extends Scene>(this: This, ...args: Parameters<This['_init']>): Promise<void>;
	public async init(...args: never[]): Promise<void> {
		if(this._isInited || !this.isLoaded) return;

		await this._init(...args);

		this._isInited = true;
		this._isExited = false;

		if(this._owner === null) this.ready();

		(this as Scene).emit('init', ...args);
	}

	//@ts-ignore
	public async exit<This extends Scene>(this: This, ...args: Parameters<This['_exit']>): Promise<void>;
	public async exit(...args: never[]): Promise<void> {
		if(this._isExited || this.isUnloaded) return;

		await this._exit(...args);

		this._isExited = true;
		this._isInited = false;

		(this as Scene).emit('exit', ...args);
	}


	//@ts-ignore
	public process<This extends Scene>(this: This, ...args: Parameters<This['_process']>): void;
	public process(...args: never[]): void {
		if(!this._isInited) return;

		//@ts-ignore
		this._process(...args);
		//@ts-ignore
		this['@process'].emit(...args);
	}

	//@ts-ignore
	public render<This extends Scene>(this: This, ...args: Parameters<This['_render']>): void;
	public render(...args: never[]): void {
		if(!this._isInited) return;

		//@ts-ignore
		this._render(...args);
		//@ts-ignore
		this['@render'].emit(...args);
	}


	private static _init_TREE(path: any[] = [], target_error: any = this.name): void {
		if(!this._TREE) this._TREE = this.prototype.TREE.call(null);

		if(path.includes(this._TREE)) {
			throw new Error(`cyclic dependence found "${this.name} -> ... -> ${target_error} -> ${this.name}"`);
		}

		for(let id in this._TREE) {
			this._TREE[id]._init_TREE([...path, this._TREE], this.name);
		}
	}

	protected static _isLoaded: boolean = false;
	protected static _isUnloaded: boolean = true;

	public static get isLoaded(): boolean { return this._isLoaded; }
	public static get isUnloaded(): boolean { return this._isUnloaded; }

	protected static async _load(scene: typeof Scene, ...args: never[]): Promise<void> {}
	protected static async _unload(scene: typeof Scene, ...args: never[]): Promise<void> {}


	public static '@load' = new Event<typeof Scene, [typeof Scene, ...never[]]>(this);
	public static '@unload' = new Event<typeof Scene, [typeof Scene, ...never[]]>(this);

	//@ts-ignore
	public static async load<This extends typeof Scene>(this: This, ...args: splice0_t<[...Parameters<This['_load']>]>): Promise<void>;
	public static async load(...args: never[]): Promise<void> {
		if(this._isLoaded) return;

		this._init_TREE();

		await this._load(this, ...args);

		const proms = [];
		const cache: any = [];
		for(const id in this._TREE) {
			if(!cache.includes(this._TREE[id])) {
				cache.push(this._TREE[id]);
				if(!this._TREE[id]._isLoaded && this._TREE[id]._isUnloaded) proms.push(this._TREE[id].load());
			}
		}
		await Promise.all(proms);

		this._isLoaded = true;
		this._isUnloaded = false;

		this.emit('load', this, ...args);
	}

	//@ts-ignore
	public static async unload<This extends typeof Scene>(this: This, ...args: splice0_t<Parameters<This['_unload']>>): Promise<void>;
	public static async unload(...args: never[]): Promise<void> {
		if(this._isUnloaded) return;

		await this._unload(this, ...args);

		this._isUnloaded = true;
		this._isLoaded = false;

		this.emit('unload', this, ...args);
	}
}
