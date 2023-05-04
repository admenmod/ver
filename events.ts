const isOnceSymbol = Symbol('isOnceSymbol');

type FnOnce<This = any, Args extends any[] = any[]> = ((this: This, ...args: Args) => any) & { [isOnceSymbol]?: boolean };


export class Event<This = any, Args extends any[] = any[]> {
	private _handlers: FnOnce<This, Args>[] = [];
	protected readonly _this: This;

	constructor(_this: This) { this._this = _this; }

	public on<T extends This>(fn: FnOnce<T, Args>): void {
		//@ts-ignore
		this._handlers.push(fn);
	}

	public once<T extends This>(fn: FnOnce<T, Args>): void {
		fn[isOnceSymbol] = true;
		//@ts-ignore
		this._handlers.push(fn);
	}

	public off<T extends This>(fn?: FnOnce<T, Args>): void {
		if(fn) {
			//@ts-ignore
			const l: number = this._handlers.indexOf(fn);
			if(~l) return;
			this._handlers.splice(l, 1);
		}
		else this._handlers.length = 0;
	}

	public emit(...args: Args): void {
		for(let i = 0; i < this._handlers.length; ++i) {
			const fn = this._handlers[i];
			fn.apply(this._this, args);
			if(fn[isOnceSymbol]) this.off(fn);
		}
	}
}


type event_name<T extends string = string> = `@${T}`;

type KeysEvents<T extends object> = ({
	[K in keyof T]: K extends event_name ? T[K] extends Event ? K : never : never
})[keyof T];

type getEventArgs<T extends object, K extends KeysEvents<T>> =
	T[K] extends Event<any, infer A> ? A : never;

type ConvertDel<U extends event_name> = U extends event_name<infer R> ? R : never;
type ConvertAdd<U extends string> = event_name<U>;


type ArgsEvent<T extends object, Type extends ConvertDel<KeysEvents<T>>> =
	getEventArgs<T, ConvertAdd<Type> extends KeysEvents<T> ? ConvertAdd<Type> : never>;


export class EventDispatcher {
	public static on<This extends typeof EventDispatcher,
		Type extends ConvertDel<KeysEvents<This>>,
		//@ts-ignore
		ThisFn extends This[event_name<Type>]['_this'],
		Args extends ArgsEvent<This, Type>
	>(this: This, type: Type, fn: (this: ThisFn, ...args: Args) => any): void {
		//@ts-ignore
		return this[`@${type}`].on(fn);
	}

	public static once<This extends typeof EventDispatcher,
		Type extends ConvertDel<KeysEvents<This>>,
		//@ts-ignore
		ThisFn extends This[event_name<Type>]['_this'],
		Args extends ArgsEvent<This, Type>
	>(this: This, type: Type, fn: (this: ThisFn, ...args: Args) => any): void {
		//@ts-ignore
		return this[`@${type}`].once(fn);
	}

	public static off<This extends typeof EventDispatcher,
		Type extends ConvertDel<KeysEvents<This>>,
		//@ts-ignore
		ThisFn extends This[event_name<Type>]['_this'],
		Args extends ArgsEvent<This, Type>
	>(this: This, type: Type, fn?: (this: ThisFn, ...args: Args) => any): void {
		//@ts-ignore
		return this[`@${type}`].off(fn);
	}

	public static emit<This extends typeof EventDispatcher,
		Type extends ConvertDel<KeysEvents<This>>,
		Args extends ArgsEvent<This, Type>
	>(this: This, type: Type, ...args: Args): void {
		//@ts-ignore
		return this[`@${type}`].emit(...args);
	}


	public on<This extends EventDispatcher,
		Type extends ConvertDel<KeysEvents<This>>,
		//@ts-ignore
		ThisFn extends This[event_name<Type>]['_this'],
		Args extends ArgsEvent<This, Type>
	>(this: This, type: Type, fn: (this: ThisFn, ...args: Args) => any): void {
		//@ts-ignore
		return this[`@${type}`].on(fn);
	}

	public once<This extends EventDispatcher,
		Type extends ConvertDel<KeysEvents<This>>,
		//@ts-ignore
		ThisFn extends This[event_name<Type>]['_this'],
		Args extends ArgsEvent<This, Type>
	>(this: This, type: Type, fn: (this: ThisFn, ...args: Args) => any): void {
		//@ts-ignore
		return this[`@${type}`].once(fn);
	}

	public off<This extends EventDispatcher,
		Type extends ConvertDel<KeysEvents<This>>,
		//@ts-ignore
		ThisFn extends This[event_name<Type>]['_this'],
		Args extends ArgsEvent<This, Type>
	>(this: This, type: Type, fn?: (this: ThisFn, ...args: Args) => any): void {
		//@ts-ignore
		return this[`@${type}`].off(fn);
	}

	public emit<This extends EventDispatcher,
		Type extends ConvertDel<KeysEvents<This>>,
		Args extends ArgsEvent<This, Type>
	>(this: This, type: Type, ...args: Args): void {
		//@ts-ignore
		return this[`@${type}`].emit(...args);
	}
}


export class EventEmitter {
	protected static _events: { [type: PropertyKey]: FnOnce[] & { store: any } };

	public static isUseStore: boolean = false

	public static once<args_t extends any[] = any[]>(type: PropertyKey, fn: FnOnce<any, args_t>) {
		fn[isOnceSymbol] = true;
		return this.on(type, fn);
	}

	public static on<args_t extends any[] = any[]>(type: PropertyKey, fn: FnOnce<any, args_t>) {
		if(!this._events[type]) {
			(this._events[type] as any) = [];

			Object.defineProperty(this._events[type], 'store', { value: {} });

			const store = this._events[type].store;
			store.type = type;
			store.self = store.emitter = this;
		}

		this._events[type].push(fn);

		return this;
	}

	public static off<args_t extends any[] = any[]>(type?: PropertyKey, fn?: FnOnce<any, args_t>) {
		if(!type) for(let i in this._events) delete this._events[i];
		else if(!this._events[type]) return this;
		else if(!fn) delete this._events[type];
		else {
			const l = this._events[type].indexOf(fn);
			if(~l) this._events[type].splice(l, 1);
		}

		return this;
	}

	public static emit<args_t extends any[] = any[]>(type: PropertyKey, ...args: args_t) {
		if(!this._events[type]) return false;

		for(let i = 0; i < this._events[type].length; i++) {
			this._events[type][i].apply(this.isUseStore ? this._events[type].store : this, args);
			if(this._events[type][i][isOnceSymbol]) this._events[type].splice(i, 1);
		}

		return true;
	}


	protected _events!: { [type: PropertyKey]: FnOnce[] & { store: any } };

	constructor(public isUseStore: boolean = false) {
		Object.defineProperty(this, '_events', { value: {} });
	}

	public once<args_t extends any[] = any[]>(type: PropertyKey, fn: FnOnce<any, args_t>) {
		fn[isOnceSymbol] = true;
		return this.on(type, fn);
	}

	public on<args_t extends any[] = any[]>(type: PropertyKey, fn: FnOnce<any, args_t>) {
		if(!this._events[type]) {
			(this._events[type] as any) = [];

			Object.defineProperty(this._events[type], 'store', { value: {} });

			const store = this._events[type].store;
			store.type = type;
			store.self = store.emitter = this;
		}

		this._events[type].push(fn);

		return this;
	}

	public off<args_t extends any[] = any[]>(type?: PropertyKey, fn?: FnOnce<any, args_t>) {
		if(!type) for(let i in this._events) delete this._events[i];
		else if(!this._events[type]) return this;
		else if(!fn) delete this._events[type];
		else {
			const l = this._events[type].indexOf(fn);
			if(~l) this._events[type].splice(l, 1);
		}

		return this;
	}

	public emit<args_t extends any[] = any[]>(type: PropertyKey, ...args: args_t) {
		if(!this._events[type]) return false;

		for(let i = 0; i < this._events[type].length; i++) {
			this._events[type][i].apply(this.isUseStore ? this._events[type].store : this, args);
			if(this._events[type][i][isOnceSymbol]) this._events[type].splice(i, 1);
		}

		return true;
	}
}

Object.defineProperty(EventEmitter, '_events', { value: {} });
