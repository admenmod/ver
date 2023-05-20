import { Event, EventDispatcher } from './events';


type getTree<T extends Scene> = { [K in keyof ReturnType<T['TREE']>]: InstanceType<ReturnType<T['TREE']>[K]>; };
type pos_t = number | 'start' | 'end';


export class Scene extends EventDispatcher {
	public '@ready' = new Event<Scene, []>(this);
	public '@init' = new Event<Scene, []>(this);
	public '@destroy' = new Event<Scene, []>(this);
	public '@destroyed' = new Event<Scene, []>(this);

	private _isReady: boolean = false;
	private _isInited: boolean = false;
	private _isDestroyed: boolean = false;

	public get isInited(): boolean { return this._isInited; }
	public get isDestroyed(): boolean { return this._isDestroyed; }

	public get isLoaded(): boolean { return (this.constructor as typeof Scene).isLoaded; }
	public get isUnloaded(): boolean { return (this.constructor as typeof Scene).isUnloaded; }

	/** @virtual */
	protected _ready(): void {}
	/** @virtual */
	protected async _init(): Promise<void> {
		await Promise.all([...this.children()].map(i => i.init()));
	}
	/** @virtual */
	protected async _destroy(): Promise<void> {
		await Promise.all([...this.children()].map(i => i.destroy()));
	}


	public ready(): boolean {
		if(this._isReady || !this._isInited || !this.isLoaded) return false;

		for(const scene of this.children()) scene.ready();

		this._ready();

		this._isReady = true;

		this['@ready'].emit();

		return true;
	}

	public async init(): Promise<boolean> {
		if(this._isInited || !this.isLoaded) return false;

		this.__init_tree();

		await this._init();
		this['@init'].emit();

		this._isInited = true;
		this._isDestroyed = false;

		if(this.isRoot) this.ready();

		return true;
	}

	public async destroy(): Promise<boolean> {
		if(!this._isInited || this._isDestroyed) return false;

		this['@destroy'].emit();
		await this._destroy();

		this._children.length = 0;

		this._isDestroyed = true;
		this._isInited = false;

		this['@destroyed'].emit();

		this.events_off(true);

		return true;
	}

	private static _isLoaded: boolean;
	private static _isUnloaded: boolean;

	public static get isLoaded(): boolean {
		return Object.prototype.hasOwnProperty.call(this, '_isLoaded') ? this._isLoaded : this._isLoaded = false;
	}
	public static get isUnloaded(): boolean {
		return Object.prototype.hasOwnProperty.call(this, '_isUnloaded') ? this._isUnloaded : this._isUnloaded = false;
	}

	/** @virtual */
	protected static async _load(Scene: typeof this): Promise<void> {
		await Promise.all([...this.TREE()].map(i => i.load()));
	}
	/** @virtual */
	protected static async _unload(Scene: typeof this): Promise<void> {
		await Promise.all([...this.TREE()].map(i => i.unload()));
	}


	public static '@load' = new Event<typeof this, [Scene: typeof this]>(this);
	public static '@unload' = new Event<typeof this, [Scene: typeof this]>(this);

	public static async load(): Promise<boolean> {
		if(this.isLoaded) return false;

		this.__init_TREE();

		await this._load(this);
		this.emit('load', this);

		this._isLoaded = true;
		this._isUnloaded = false;

		return true;
	}

	public static async unload(): Promise<boolean> {
		if(!this.isLoaded) return false;

		this.emit('unload', this);
		await this._unload(this);

		this.events_off(true);

		this._isUnloaded = true;
		this._isLoaded = false;

		return true;
	}


	public '@child_entered_tree' = new Event<Scene, [scene: Scene]>(this);
	public '@child_exiting_tree' = new Event<Scene, [scene: Scene]>(this);
	public '@child_exited_tree' = new Event<Scene, [scene: Scene]>(this);

	public '@tree_entered' = new Event<Scene, [parent: Scene]>(this);
	public '@tree_exiting' = new Event<Scene, [parent: Scene]>(this);
	public '@tree_exited' = new Event<Scene, [parent: Scene]>(this);

	public '@renamed' = new Event<Scene, []>(this);


	protected _parent: Scene | null = null;
	protected get parent() { return this._parent; }

	protected _children: Scene[] = [];

	private _owner: Scene | null = null;
	public get owner() { return this._owner; }

	private _name: string = this.constructor.name;
	public get name() { return this._name; }
	public set name(v) {
		v = v.replace(/@|\s/g, '');

		if(this._name === v) return;
		if(this._parent && this._parent.getChild(v)) throw new Error(`(${v}) this name is already in use`);

		this._name = v;
		this['@renamed'].emit();
	}

	public get isRoot(): boolean { return this._parent === null; }

	public get root(): Scene { return this._owner?.root || this; }


	private _isEmbedded: boolean = false;
	public get isEmbedded() { return this._isEmbedded; }

	public TREE(): Record<string, typeof Scene> { return {}; }
	private static __TREE: Record<string, typeof Scene>;
	protected static get _TREE(): typeof Scene['__TREE'] {
		return Object.prototype.hasOwnProperty.call(this, '__TREE') ? this.__TREE : void 0 as any;
	}
	protected static set _TREE(v) { this.__TREE = v!; }

	public get SCENE_TYPE() { return this.constructor.name; }

	constructor() {
		super();

		if(!this.isLoaded) throw new Error(`(${this.SCENE_TYPE}) you can't instantiate a scene before it's loaded`);
	}

	private __init_tree(): void {
		if(!this.isLoaded) throw new Error(`(${this.name}) you can't instantiate a scene before it's loaded`);
		if(this._children.length) return;

		for(const name in (this.constructor as typeof Scene)._TREE) {
			const Class = (this.constructor as typeof Scene)._TREE[name];
			if(Class.rootonly) throw new Error(`(${Class.name}) this scene rootonly = true`);

			const scene = new Class();
			scene._owner = this;
			scene._parent = this;
			scene._isEmbedded = true;
			scene._name = name;

			this._children.push(scene);
		}
	}


	public getChild<Name extends keyof getTree<this>>(name: Name): getTree<this>[Name] | null;
	public getChild(name: string): Scene | null;
	public getChild(name: string): Scene | null {
		for(let i = 0; i < this._children.length; i++) {
			if(this._children[i].name === name) return this._children[i];
		}

		return null;
	}


	public addChild<Class extends Scene>(scene: Class, name: string = scene.name, pos: pos_t = 'end'): Class {
		if(!this.isInited) throw new Error(`self scene is not inited`);
		if(!scene.isInited) throw new Error(`this scene is not inited`);

		if(scene._parent) throw new Error(`this scene is not root`);

		if(this._children.some(i => i.name === name)) throw new Error(`(${name}) this name is already in use`);
		if((scene.constructor as typeof Scene).rootonly) {
			throw new Error(`(${(scene.constructor as typeof Scene).name}) this scene rootonly = true`);
		}

		if(typeof pos === 'number') this._children.splice(pos, 0, scene);
		else if(pos === 'start') this._children.unshift(scene);
		else if(pos === 'end') this._children.push(scene);
		else throw new Error('invalid argument "pos"');

		scene._parent = this;

		scene['@tree_entered'].emit(this);
		for(const s of scene.children(true)) s['@tree_entered'].emit(this);
		for(const p of scene.chein_parents()) p['@child_entered_tree'].emit(scene);

		return scene;
	}

	public removeChild(name: string, t: boolean = false): Scene {
		if(!this.isInited) throw new Error(`self scene is not inited`);

		const scene = this._children.find(i => i.name === name);

		if(!scene) throw new Error(`(${name}) no scene with that name`);
		if(t || scene._isEmbedded) throw new Error(`(${name}) this scene is embedded`);

		const l = this._children.indexOf(scene);

		scene['@tree_exiting'].emit(this);
		for(const s of scene.children(true)) s['@tree_exiting'].emit(this);
		for(const p of scene.chein_parents()) p['@child_exiting_tree'].emit(scene);

		scene._parent = null;
		this._children.splice(l, 1);

		scene['@tree_exited'].emit(this);
		for(const s of scene.children(true)) s['@tree_exited'].emit(this);
		for(const p of scene.chein_parents()) p['@child_exited_tree'].emit(scene);

		return scene;
	}

	public moveChild(child: Scene, pos: pos_t) {
		// if(typeof pos === 'number') this._children.splice(pos, 0, scene);
		// else if(pos === 'start') this._children.unshift(scene);
		// else if(pos === 'end') this._children.push(scene);
		// else throw new Error('invalid argument "pos"');
	}


	private static __init_TREE(path: any[] = [], target_error: any = this.name): void {
		if(this._TREE) return;

		this._TREE = Object.create(null);
		const TREE = this.prototype.TREE.call(null);
		for(const name in TREE) this._TREE[name] = TREE[name];

		if(path.includes(this._TREE)) {
			throw new Error(`cyclic dependence found "${this.name} -> ... -> ${target_error} -> ${this.name}"`);
		}

		for(let name in this._TREE) {
			const Class = this._TREE[name];
			if(Class.rootonly) throw new Error(`(${Class.name}) this scene rootonly = true`);
			Class.__init_TREE([...path, this._TREE], this.name);
		}
	}


	protected static _rootonly: boolean;
	public static get rootonly() {
		return Object.prototype.hasOwnProperty.call(this, '_rootonly') ? this._rootonly : this._rootonly = false;
	}


	public *chein_owners(): Generator<Scene> {
		let w: Scene | null = this;
		while(w = w._owner) yield w;
	}

	public *getChainOwnersOf<T extends typeof Scene>(T: T): Generator<InstanceType<T>> {
		for(const i of this.chein_owners()) {
			if(i instanceof T) yield i as InstanceType<T>;
		}
	}


	public *chein_parents(): Generator<Scene> {
		let w: Scene | null = this;
		while(w = w._parent) yield w;
	}

	public *children(r: boolean = false): Generator<Scene> {
		if(!r) {
			for(let i = 0; i < this._children.length; i++) yield this._children[i];
		} else {
			for(const s of this.children()) {
				yield s;
				yield* s.children(true);
			}
		}
	}

	public *getChildrenOf<T extends typeof Scene>(T: T, r: boolean = true): Generator<InstanceType<T>> {
		for(const i of this.children(r)) {
			if(i instanceof T) yield i as InstanceType<T>;
		}
	}

	public *getChainParentsOf<T extends typeof Scene>(T: T): Generator<InstanceType<T>> {
		for(const i of this.chein_parents()) {
			if(i instanceof T) yield i as InstanceType<T>;
		}
	}

	public getRootOf<T extends typeof Scene>(T: T): InstanceType<T> {
		let root: InstanceType<T> = this as InstanceType<T>;

		for(const i of this.chein_parents()) {
			if(i instanceof T) root = i as InstanceType<T>;
		}

		return root;
	}


	public static *TREE(r: boolean = false): Generator<typeof Scene> {
		if(!r) {
			for(const name in this._TREE) yield this._TREE[name];
		} else {
			for(const s of this.TREE()) {
				yield s;
				yield* s.TREE(true);
			}
		}
	}
}
