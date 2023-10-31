import { Event, EventDispatcher } from './events';
import { Scene } from './Scene';


export class System<Item extends typeof Scene> extends EventDispatcher {
	public '@add' = new Event<System<Item>, [item: InstanceType<Item>]>(this);
	public '@removing' = new Event<System<Item>, [item: InstanceType<Item>]>(this);
	public '@removed' = new Event<System<Item>, [item: InstanceType<Item>]>(this);

	public '@watch' = new Event<System<Item>, [o: Scene]>(this);
	public '@unwatching' = new Event<System<Item>, [o: Scene]>(this);
	public '@unwatched' = new Event<System<Item>, [o: Scene]>(this);


	protected _isDestroyed: boolean = false;
	protected _observed: Scene[] = [];
	protected _items: InstanceType<Item>[] = [];

	constructor(public readonly Item: Item) { super(); }


	public add<T extends Scene>(item: T, r?: true): void;
	public add<T extends InstanceType<Item>>(item: T, r?: false): void;
	public add<T extends InstanceType<Item>>(item: T, r: boolean = true): void {
		if(this._isDestroyed) return;

		if(!r && item instanceof this.Item && !this._items.includes(item)) {
			this._items.push(item);
			this['@add'].emit(item);
		} else {
			if(item instanceof this.Item) this.add(item, false);

			for(const i of item.getChildrenOf(this.Item)) {
				this.add(i, false);
			}
		}
	}

	public remove<T extends Scene>(item: T, r?: true): void;
	public remove<T extends InstanceType<Item>>(item: T, r?: false): void;
	public remove<T extends InstanceType<Item>>(item: T, r: boolean = true): void {
		if(this._isDestroyed) return;

		if(!r && item instanceof this.Item && this._items.includes(item)) {
			this['@removing'].emit(item);

			const l = this._items.indexOf(item);
			if(!~l) return;
			this._items.splice(l, 1);

			this['@removed'].emit(item);
		} else {
			if(item instanceof this.Item) this.remove(item, false);

			for(const i of item.getChildrenOf(this.Item)) {
				this.remove(i, false);
			}
		}
	}


	public addRoot(root: Scene): void {
		if(this._isDestroyed) return;

		this.add(root);
		this.watch(root);
	}

	public removeRoot(root: Scene): void {
		if(this._isDestroyed) return;

		this.remove(root);
		this.unwatch(root);
	}


	protected _child_entered_tree = (child: Scene) => this.add(child);
	protected _child_exiting_tree = (child: Scene) => this.remove(child);

	public watch(o: Scene): void {
		if(this._observed.includes(o)) return;

		o.on('child_entered_tree', this._child_entered_tree);
		o.on('child_exiting_tree', this._child_exiting_tree);

		this._observed.push(o);

		this['@watch'].emit(o);
	}

	public unwatch(o: Scene): void {
		if(!this._observed.includes(o)) return;

		this['@unwatching'].emit(o);

		const l = this._observed.indexOf(o);
		if(!~l) return;

		o.off('child_entered_tree', this._child_entered_tree);
		o.off('child_exiting_tree', this._child_exiting_tree);

		this._observed.splice(l, 1);

		this['@unwatched'].emit(o);
	}


	public destroy(): boolean {
		if(this._isDestroyed) return false;

		for(let i = 0; i < this._observed.length; i++) {
			this.unwatch(this._observed[i]);
		}

		for(let i = 0; i < this._items.length; i++) {
			this.remove(this._items[i], false);
		}

		this.events_off(true);

		this._isDestroyed = true;

		return true;
	}
}
