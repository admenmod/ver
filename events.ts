import type { Fn } from './helpers';


export const EventAsFunction = <This, Args extends any[]>(_this: This) => {
	const listeners: EventListener<This, Args>[] = [];

	type fn = Fn<This, Args>;

	interface event {
		(...args: Args): void;
		on(fn: fn, priority?: number, once?: boolean, shift?: boolean): void;
		once(fn: fn, priority?: number, once?: boolean, shift?: boolean): void;
		off(fn?: fn): void;
	}

	const event: event = (...args: Args): void => {
		for(let i = 0; i < listeners.length; ++i) {
			const l = listeners[i];
			l.fn.apply(l.ctx, args);
			if(l.once) event.off(l.fn);
		}
	};

	event.on = (fn: fn, priority: number = 0, once = false, shift = false): void => {
		const listener = new EventListener(fn, _this, priority, once) as EventListener;

		if(!shift) listeners.push(listener);
		else listeners.unshift(listener);

		listeners.sort((a, b) => a.zindex - b.zindex);
	}

	event.once = (fn: fn, priority: number = 0, once = true, shift = false): void => {
		event.on(fn, priority, once, shift);
	}

	event.off = (fn?: fn) => {
		if(fn) {
			const i: number = listeners.findIndex(l => l.fn === fn);
			if(~i) return;
			listeners.splice(i, 1);
		}
		else listeners.length = 0;
	};

	return event;
}


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


export declare namespace Event {
	export type name<T extends string = string> = `@${T}`;

	export type KeysOf<T extends object> = ({
		[K in keyof T]: K extends name ? T[K] extends Event ? K : never : never
	})[keyof T];

	export type getArgs<T extends object, K extends KeysOf<T>> =
		T[K] extends Event<any, infer A> ? A : never;

	export type ConvertDel<U extends name> = U extends name<infer R> ? R : never;
	export type ConvertAdd<U extends string> = name<U>;

	export type Args<T extends object, Type extends ConvertDel<KeysOf<T>>> =
		getArgs<T, ConvertAdd<Type> extends KeysOf<T> ? ConvertAdd<Type> : never>;
}

export class Event<This = any, Args extends any[] = any[]> {
	private _listeners: EventListener<This, Args>[] = [];
	protected readonly _this: This;

	constructor(_this: This) { this._this = _this; }

	public on<T extends This>(fn: Fn<T, Args>, priority: number = 0, once = false, shift = false): typeof fn {
		const listener = new EventListener(fn, this._this as any, priority, once) as EventListener;

		if(!shift) this._listeners.push(listener);
		else this._listeners.unshift(listener);

		this._listeners.sort((a, b) => a.zindex - b.zindex);

		return fn;
	}

	public once<T extends This>(fn: Fn<T, Args>, priority: number = 0, once = true, shift = false): typeof fn {
		return this.on(fn, priority, once, shift);
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


export declare namespace Notification {
	export type Args<T extends Notification> = T extends Notification<any, infer A> ? A : never;

	export type static<T extends Notification> = (...args: Notification.Args<T>) => any;

	export type KeysOf<T extends object> = ({
		[K in keyof T]: T[K] extends Notification ? K : never;
	})[keyof T];

	export type getArgs<T extends object, K extends KeysOf<T>> =
		//@ts-ignore
		T[K] extends Notification<infer Class, infer Name> ? Fn.A<Class[Name]> : never;
}

export class Notification<
	Class extends object = any,
	Name extends string = any,
	//@ts-ignore
	This extends Fn.T<Class[Name]> = any
> {
	constructor(
		protected readonly Class: Class,
		public readonly name: Name,
		protected _this: This,
		public reverse: boolean = false
	) {}

	//@ts-ignore
	public notify(...args: Fn.A<Class[Name]>): void {
		if(!this.name) return;

		const reverse = this.reverse;
		const arr: any[] = [this.constructor];


		let c = this.constructor;
		while(c !== this.Class && (c = Object.getPrototypeOf(c.prototype)?.constructor)) {
			arr.push(Object.prototype.hasOwnProperty.call(c, this.name) ? c : null);
		}

		if(reverse) {
			for(let i = 0; i < arr.length; i++) arr[i]?.[this.name].apply(this._this, args);
		} else {
			for(let i = arr.length-1; i >= 0; i--) arr[i]?.[this.name].apply(this._this, args);
		}
	}
}


export class EventDispatcher {
	public notify<This extends EventDispatcher,
		Name extends Notification.KeysOf<This>,
		Args extends Notification.getArgs<This, Name>
	//@ts-ignore
	>(this: This, name: Event.ConvertDel<Name>, ...args: Args): void {
		//@ts-ignore
		this[`@${name}`].notify(...args);
	}


	public static on<This extends typeof EventDispatcher,
		Type extends Event.ConvertDel<Event.KeysOf<This>>,
		//@ts-ignore
		ThisFn extends This[Event.name<Type>]['_this'],
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, fn: Fn<ThisFn, Args>, priority: number = 0, once = false, shift = false): typeof fn {
		//@ts-ignore
		return this[`@${type}`].on(fn, priority, once, shift);
	}

	public static once<This extends typeof EventDispatcher,
		Type extends Event.ConvertDel<Event.KeysOf<This>>,
		//@ts-ignore
		ThisFn extends This[Event.name<Type>]['_this'],
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, fn: Fn<ThisFn, Args>, priority: number = 0): typeof fn {
		//@ts-ignore
		return this[`@${type}`].once(fn, priority);
	}

	public static off<This extends typeof EventDispatcher,
		Type extends Event.ConvertDel<Event.KeysOf<This>>,
		//@ts-ignore
		ThisFn extends This[Event.name<Type>]['_this'],
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, fn?: Fn<ThisFn, Args>): void {
		//@ts-ignore
		return this[`@${type}`].off(fn);
	}

	public static emit<This extends typeof EventDispatcher,
		Type extends Event.ConvertDel<Event.KeysOf<This>>,
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, ...args: Args): void {
		//@ts-ignore
		return this[`@${type}`].emit(...args);
	}


	public on<This extends EventDispatcher,
		Type extends Event.ConvertDel<Event.KeysOf<This>>,
		//@ts-ignore
		ThisFn extends This[Event.name<Type>]['_this'],
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, fn: Fn<ThisFn, Args>, priority: number = 0, once = false, shift = false): typeof fn {
		//@ts-ignore
		return this[`@${type}`].on(fn, priority, once, shift);
	}

	public once<This extends EventDispatcher,
		Type extends Event.ConvertDel<Event.KeysOf<This>>,
		//@ts-ignore
		ThisFn extends This[Event.name<Type>]['_this'],
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, fn: Fn<ThisFn, Args>, priority: number = 0): typeof fn {
		//@ts-ignore
		return this[`@${type}`].once(fn, priority);
	}

	public off<This extends EventDispatcher,
		Type extends Event.ConvertDel<Event.KeysOf<This>>,
		//@ts-ignore
		ThisFn extends This[Event.name<Type>]['_this'],
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, fn?: Fn<ThisFn, Args>): void {
		//@ts-ignore
		return this[`@${type}`].off(fn);
	}

	public emit<This extends EventDispatcher,
		Type extends Event.ConvertDel<Event.KeysOf<This>>,
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, ...args: Args): void {
		//@ts-ignore
		return this[`@${type}`].emit(...args);
	}


	public events_off(a: boolean = false): void {
		for(const e of this.events(a)) e.off();
	}

	public static events_off(a: boolean = false): void {
		for(const e of this.events(a)) e.off();
	}


	public *events(a: boolean = false): Generator<Event> {
		for(const id in this) {
			//@ts-ignore
			if((a || id[0] === '@') && this[id] instanceof Event) yield this[id];
		}
	}

	public static *events(a: boolean = false): Generator<Event> {
		for(const id in this) {
			//@ts-ignore
			if((a || id[0] === '@') && this[id] instanceof Event) yield this[id];
		}
	}
}
