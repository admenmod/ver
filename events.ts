type Fn<T = any, A extends any[] = any[], R = any> = (this: T, ...args: A) => R;


export class EventListener<This = any, Args extends any[] = any[]> {
	public fn: Fn<This, Args>;
	public ctx: This;
	public zindex: number;
	public once: boolean;

	constructor(fn: Fn<This, Args>, ctx: This, priority: number = 0, once: boolean = false) {
		this.fn = fn;
		this.ctx = ctx;
		this.zindex = priority;
		this.once = once;
	}
}


export class Event<This = any, Args extends any[] = any[]> {
	private _listeners: EventListener<This, Args>[] = [];
	protected readonly _this: This;

	constructor(_this: This) { this._this = _this; }

	public on<T extends This>(fn: Fn<T, Args>, priority: number = 0, once = false, shift = false): void {
		const listener = new EventListener(fn, this._this as any, priority, once) as EventListener;

		if(!shift) this._listeners.push(listener);
		else this._listeners.unshift(listener);

		this._listeners.sort((a, b) => a.zindex - b.zindex);
	}

	public once<T extends This>(fn: Fn<T, Args>, priority: number = 0, once = true, shift = false): void {
		this.on(fn, priority, once);
	}

	public off<T extends This>(fn?: Fn<T, Args>): void {
		if(fn) {
			const i: number = this._listeners.findIndex(l => l.fn === fn);
			if(~i) return;
			this._listeners.splice(i, 1);
		}
		else this._listeners.length = 0;
	}

	public emit(...args: Args): void {
		for(let i = 0; i < this._listeners.length; ++i) {
			const l = this._listeners[i];
			l.fn.apply(l.ctx, args);
			if(l.once) this.off(l.fn);
		}
	}

	public *[Symbol.iterator]() {
		for(let i = 0; i < this._listeners.length; i++) {
			yield this._listeners[i];
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
	>(this: This, type: Type, fn: Fn<ThisFn, Args>, priority: number = 0, once = false, shift = false): void {
		//@ts-ignore
		return this[`@${type}`].on(fn, priority, once, shift);
	}

	public static once<This extends typeof EventDispatcher,
		Type extends ConvertDel<KeysEvents<This>>,
		//@ts-ignore
		ThisFn extends This[event_name<Type>]['_this'],
		Args extends ArgsEvent<This, Type>
	>(this: This, type: Type, fn: Fn<ThisFn, Args>, priority: number = 0): void {
		//@ts-ignore
		return this[`@${type}`].once(fn, priority);
	}

	public static off<This extends typeof EventDispatcher,
		Type extends ConvertDel<KeysEvents<This>>,
		//@ts-ignore
		ThisFn extends This[event_name<Type>]['_this'],
		Args extends ArgsEvent<This, Type>
	>(this: This, type: Type, fn?: Fn<ThisFn, Args>): void {
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
	>(this: This, type: Type, fn: Fn<ThisFn, Args>, priority: number = 0, once = false, shift = false): void {
		//@ts-ignore
		return this[`@${type}`].on(fn, priority, once, shift);
	}

	public once<This extends EventDispatcher,
		Type extends ConvertDel<KeysEvents<This>>,
		//@ts-ignore
		ThisFn extends This[event_name<Type>]['_this'],
		Args extends ArgsEvent<This, Type>
	>(this: This, type: Type, fn: Fn<ThisFn, Args>, priority: number = 0): void {
		//@ts-ignore
		return this[`@${type}`].once(fn, priority);
	}

	public off<This extends EventDispatcher,
		Type extends ConvertDel<KeysEvents<This>>,
		//@ts-ignore
		ThisFn extends This[event_name<Type>]['_this'],
		Args extends ArgsEvent<This, Type>
	>(this: This, type: Type, fn?: Fn<ThisFn, Args>): void {
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
