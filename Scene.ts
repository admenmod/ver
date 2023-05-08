import type { getInstanceOf } from './types';
import { EventDispatcher, Event } from './events';


type getTree<T extends Scene> = { [K in keyof ReturnType<T['TREE']>]: getInstanceOf<ReturnType<T['TREE']>[K]>; };


const CLASS = Symbol('class');
const ENTER_TREE_ROOT = Symbol('enter_tree:root');
const EXIT_TREE_ROOT = Symbol('exit_tree:root');

export class Scene extends EventDispatcher {
	/** Scene entry into tree */
	public '@enter_tree' = new Event<Scene, [owner: Scene]>(this);
	/** Scene exit from tree */
	public '@exit_tree' = new Event<Scene, [owner: Scene]>(this);

	/** Child scene entry in own tree */
	public '@enter_tree:child' = new Event<Scene, [child: Scene]>(this);
	/** Child scene exit from own tree */
	public '@exit_tree:child' = new Event<Scene, [child: Scene]>(this);

	/** Old root entered the tree - new root */
	public '@enter_tree:root' = new Event<Scene, [root: Scene]>(this);
	/** The parent scene exited from root - new root */
	public '@exit_tree:root' = new Event<Scene, [root: Scene]>(this);

	/** Root scene event, child scene entry into tree */
	public '@root#enter_tree:child' = new Event<Scene, [child: Scene]>(this);
	/** Root scene event, child scene exit from tree */
	public '@root#exit_tree:child' = new Event<Scene, [child: Scene]>(this);

	public '@init' = new Event<Scene, []>(this);
	public '@destroy' = new Event<Scene, []>(this);
	public '@ready' = new Event<Scene, []>(this);


	protected readonly [CLASS]: typeof Scene;

	private _owner: Scene | null = null;
	public get owner() { return this._owner; }

	private _name: string = this.constructor.name;
	public get name() { return this._name; }

	public get isRoot(): boolean { return this.owner === null; }
	public get root(): Scene { return this._owner?.root || this; }


	protected static _TREE: Record<string, typeof Scene>;
	protected _tree!: Record<string, Scene>;

	public TREE(): Record<string, typeof Scene> { return {}; }

	public get(): getTree<this>;
	public get<Name extends keyof getTree<this>>(name: Name): getTree<this>[Name];
	public get(name: string): Scene;
	public get(name: any = null) {
		if(name === null) return this._tree;
		return this._tree[name];
	}


	protected _isReady: boolean = false;
	protected _isInited: boolean = false;
	protected _isExited: boolean = true;

	public get isReady(): boolean { return this._isReady; }
	public get isInited(): boolean { return this._isInited; }
	public get isExited(): boolean { return this._isExited; }

	public get isLoaded(): boolean { return this[CLASS]._isLoaded; }
	public get isUnloaded(): boolean { return this[CLASS]._isUnloaded; }


	constructor() {
		super();
		this[CLASS] = new.target;

		this._init_tree();
	}

	private [ENTER_TREE_ROOT](root: Scene, name: string): void {
		this['@enter_tree:root'].emit(root);
		for(const id in this._tree) this._tree[id][ENTER_TREE_ROOT](root, name);
	}
	private [EXIT_TREE_ROOT](root: Scene, name: string): void {
		this['@exit_tree:root'].emit(root);
		for(const id in this._tree) this._tree[id][EXIT_TREE_ROOT](root, name);
	}

	public attachSceneTree<ClassRef extends typeof Scene>(name: string, ClassRef: ClassRef): void {
		if(this._tree[name]) throw new Error(`(${name}) this name is already in use`);

		const scene = new ClassRef();

		this._tree[name] = scene;
		scene._owner = this;
		scene._name = name;

		scene._enter_tree(scene.owner!);
		scene['@enter_tree'].emit(scene.owner!);
		this['@enter_tree:child'].emit(scene);
		this.root['@root#enter_tree:child'].emit(scene);

		scene[ENTER_TREE_ROOT](scene.root, scene.name);
	}

	public detachSceneTree(name: string): void {
		const scene = this._tree[name];

		scene[EXIT_TREE_ROOT](scene.root, scene.name);

		this.root['@root#exit_tree:child'].emit(scene);
		this['@exit_tree:child'].emit(scene);
		scene['@exit_tree'].emit(scene.owner!);
		scene._exit_tree(scene.owner!);

		delete this._tree[name];

		scene._owner = null;
		scene._name = scene.constructor.name;
	}

	private _init_tree(): void {
		if(!this.isLoaded) throw new Error(`(${this.name}) you can't instantiate a scene before it's loaded`);
		if(this._tree) return;

		this._tree = Object.create(null);

		for(const id in this[CLASS]._TREE) {
			this.attachSceneTree(id, this[CLASS]._TREE[id]);
		}
	}


	protected _ready(): void {}
	protected _enter_tree(owner: Scene): void {}
	protected _exit_tree(owner: Scene): void {}

	protected async _init(): Promise<void> {
		await Promise.all([...this.tree()].map(i => i.init()));
	}
	protected async _destroy(): Promise<void> {
		await Promise.all([...this.tree()].map(i => i.destroy()));
	}


	public ready(): void {
		if(this._isReady || !this._isInited || !this.isLoaded) return;

		this._ready();

		for(const scene of this.tree()) scene.ready();

		this._isReady = true;

		this['@ready'].emit();
	}

	public async init(): Promise<void> {
		if(this._isInited || !this.isLoaded) return;

		await this._init();
		this['@init'].emit();

		this._isInited = true;
		this._isExited = false;

		if(this.isRoot) this.ready();
	}

	public async destroy(): Promise<void> {
		if(this._isExited || this.isUnloaded) return;

		this['@destroy'].emit();
		await this._destroy();

		this.events_off(true);

		this._isExited = true;
		this._isInited = false;
	}


	private static _init_TREE(path: any[] = [], target_error: any = this.name): void {
		if(this._TREE) return;

		this._TREE = this.prototype.TREE.call(null);

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

	protected static async _load(scene: typeof this): Promise<void> {
		await Promise.all([...this.tree()].map(i => i.load()));
	}
	protected static async _unload(scene: typeof this): Promise<void> {
		await Promise.all([...this.tree()].map(i => i.unload()));
	}


	public static '@load' = new Event<typeof this, [typeof this]>(this);
	public static '@unload' = new Event<typeof this, [typeof this]>(this);

	public static async load(): Promise<void> {
		if(this._isLoaded) return;

		this._init_TREE();

		await this._load(this);
		this.emit('load', this);

		this._isLoaded = true;
		this._isUnloaded = false;
	}

	public static async unload(): Promise<void> {
		if(this._isUnloaded) return;

		this.emit('unload', this);
		await this._unload(this);

		this.events_off(true);

		this._isUnloaded = true;
		this._isLoaded = false;
	}


	public *chein_owners(): Generator<Scene> {
		let w: Scene | null = this;
		while(w = w.owner) yield w;
	}


	public *tree(a: boolean = false): Generator<Scene> {
		if(!a) {
			for(const id in this._tree) yield this._tree[id];
		} else {
			for(const s of this.tree()) {
				yield s;
				yield* s.tree(true);
			}
		}
	}

	public static *tree(a: boolean = false): Generator<typeof Scene> {
		if(!a) {
			for(const id in this._TREE) yield this._TREE[id];
		} else {
			for(const s of this.tree()) {
				yield s;
				yield* s.tree(true);
			}
		}
	}


	public *getTreeOf<T extends typeof Scene>(T: T): Generator<getInstanceOf<T>> {
		for(const i of this.tree(true)) {
			if(i instanceof T) yield i as getInstanceOf<T>;
		}
	}
}
