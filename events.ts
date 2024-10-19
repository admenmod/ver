import type { Fn } from './helpers.js';


type tag = string | symbol;

export const DEFAULT_TAG = Symbol('DEFAULT_TAG');
const sort = (a: EventListener, b: EventListener) => a.priority - b.priority;


export interface EventAsFunction<This, Args extends any[]> {
	(...args: Args): void;
	on(fn: Fn<This, Args>, priority?: number, tag?: tag, once?: boolean, shift?: boolean): typeof fn;
	once(fn: Fn<This, Args>, priority?: number, tag?: tag, once?: boolean, shift?: boolean): typeof fn;
	off(): Fn<This, Args>[];
	off(tag: tag): Fn<This, Args>[];
	off(fn: Fn<This, Args>): Fn<This, Args>[];

	emit(...args: Args): void;
	async(...args: Args): Promise<void>;
	await(...args: Args): Promise<void>;
	[Symbol.iterator](): Generator<EventListener<This, Args>, void, void>;
}

export const EventAsFunction = function<This = any, Args extends any[] = any[]>(
	_this: This,
	on: ON_HANDLER<This, Args> | null = null,
	off: OFF_HANDLER<This, Args> | null = null
) {
	if(!new.target) throw new Error(`Class constructor EventAsFunction connot be invoked without 'new'`);

	const listeners: EventListener<This, Args>[] = [];

	const event: EventAsFunction<This, Args> = (...args: Args): void => event.emit(...args);

	event.emit = (...args: Args): void => {
		for(let i = listeners.length-1; i >= 0; --i) {
			const l = listeners[i];
			l.fn.apply(l.ctx, args);
			if(l.once) event.off(l.fn);
		}
	};

	event.async = async (...args: Args): Promise<void> => {
		const arr: Promise<unknown>[] = [];

		for(let i = listeners.length-1; i >= 0; --i) {
			const l = listeners[i];
			arr.push(l.fn.apply(l.ctx, args));
			if(l.once) event.off(l.fn);
		}

		await Promise.all(arr);
	};

	event.await = async (...args: Args): Promise<void> => {
		for(let i = listeners.length-1; i >= 0; --i) {
			const l = listeners[i];
			await l.fn.apply(l.ctx, args);
			if(l.once) event.off(l.fn);
		}
	};

	event.on = (fn: Fn<This, Args>, priority: number = 0, tag: tag = DEFAULT_TAG, once = false, shift = false): typeof fn => {
		const listener = new EventListener(fn, _this, priority, tag, once) as EventListener;

		if(!shift) listeners.unshift(listener);
		else listeners.push(listener);

		listeners.sort(sort);

		on?.call(event, fn, priority, tag, once, shift);

		return fn;
	};

	event.once = (fn: Fn<This, Args>, priority: number = 0, tag: tag = DEFAULT_TAG, once = true, shift = false): typeof fn => {
		return event.on(fn, priority, tag, once, shift);
	};

	event.off = (tag?: Fn<This, Args> | tag) => {
		let removed: EventListener<This, Args>[] = [];

		if(tag) {
			if(typeof tag === 'function') {
				for(let i = listeners.length-1; i >= 0; --i) {
					if(listeners[i].fn === tag) removed.push(listeners.splice(i, 1)[0]);
				}
			} else {
				for(let i = listeners.length-1; i >= 0; --i) {
					if(listeners[i].tag === tag) removed.push(listeners.splice(i, 1)[0]);
				}
			}
		} else {
			for(let i = listeners.length-1; i >= 0; --i) removed.push(listeners[i]);
			listeners.length = 0;
		}

		off?.call(event, tag, removed);

		return removed.map(it => it.fn);
	};

	event[Symbol.iterator] = function*(): Generator<EventListener<This, Args>, void, void> {
		for(let i = listeners.length-1; i >= 0; --i) yield listeners[i];
	};

	return event;
} as unknown as new <
	This = any, Args extends any[] = any[]
>(_this: This, on?: ON_HANDLER<This, Args> | null, off?: OFF_HANDLER<This, Args> | null) => EventAsFunction<This, Args>;


export interface FunctionIsEvent<This, Args extends any[], F extends Fn<any, any, any>> {
	(this: Fn.T<F>, ...args: Fn.A<F>): Fn.R<F>;
	on: EventAsFunction<This, Args>['on'];
	once: EventAsFunction<This, Args>['once'];
	off: EventAsFunction<This, Args>['off'];
	emit: EventAsFunction<This, Args>['emit'];
	async: EventAsFunction<This, Args>['async'];
	await: EventAsFunction<This, Args>['await'];
	[Symbol.iterator]: EventAsFunction<This, Args>[typeof Symbol.iterator];
}

export const FunctionIsEvent = function<
	This = null, Args extends any[] = [],
	F extends Fn<any, any, any> = Fn<null, [], void>
>(_this: This, fn: F, on: ON_HANDLER<This, Args> | null = null, off: OFF_HANDLER<This, Args> | null = null) {
	if(!new.target) throw new Error(`Class constructor FunctionIsEvent connot be invoked without 'new'`);

	const event = new EventAsFunction<This, Args>(_this, on, off);
	const fn_event: FunctionIsEvent<This, Args, F> = (...args: Fn.A<F>): Fn.R<F> => fn.apply(event, args);

	fn_event.on = event.on;
	fn_event.once = event.once;
	fn_event.off = event.off;
	fn_event.emit = event.emit;
	fn_event.async = event.async;
	fn_event.await = event.await;
	fn_event[Symbol.iterator] = event[Symbol.iterator];

	return fn_event;
} as unknown as new <
	This = null, Args extends any[] = [],
	F extends Fn<any, any, any> = Fn<null, [], void>
>(_this: This, fn: F, on?: ON_HANDLER<This, Args> | null, off?: OFF_HANDLER<This, Args> | null) => FunctionIsEvent<This, Args, F>;


export class EventListener<This = any, Args extends any[] = any[]> {
	constructor(
		public fn: Fn<This, Args>,
		public ctx: This,
		public priority: number = 0,
		public tag: tag = DEFAULT_TAG,
		public once: boolean = false
	) {}

	public get [Symbol.toStringTag]() { return 'EventListener'; }
}

export type ON_HANDLER<This, Args extends any[]> =
	<T extends This>(fn: Fn<T, Args>, priority: number, tag: tag, once: boolean, shift: boolean) => unknown;
export type OFF_HANDLER<This, Args extends any[]> =
	<T extends This>(tag: Fn<T, Args> | tag | void, listeners: EventListener<This, Args>[]) => unknown;

export declare namespace Event {
	export type name<T extends string = string> = `@${T}`;

	export type getKeysOf<T> = ({
		[K in keyof T]: K extends name ? T[K] extends Event ? K : never : never
	})[keyof T];

	export type KeysOf<T> = ConvertDel<{
		[K in keyof T]: K extends name ? T[K] extends Event ? K : never : never
	}[keyof T]>;

	export type getArgs<T, K extends getKeysOf<T>> =
		T[K] extends Event<any, infer A> ? A : never;

	export type ConvertDel<U extends name> = U extends name<infer R> ? R : never;
	export type ConvertAdd<U extends string> = name<U>;

	export type Args<T, Type extends ConvertDel<getKeysOf<T>>> =
		getArgs<T, ConvertAdd<Type> extends getKeysOf<T> ? ConvertAdd<Type> : never>;
}

export class Event<This = any, Args extends any[] = any[]> {
	#on: ON_HANDLER<This, Args> | null = null;
	#off: OFF_HANDLER<This, Args> | null = null;

	#this: This;
	#listeners: EventListener<This, Args>[] = [];

	constructor(_this: This, on: ON_HANDLER<This, Args> | null = null, off: OFF_HANDLER<This, Args> | null = null) {
		this.#this = _this;
		this.#on = on;
		this.#off = off;
	}

	public on<T extends This>(fn: Fn<T, Args>, priority: number = 0, tag: tag = DEFAULT_TAG, once = false, shift = false): typeof fn {
		const listener = new EventListener(fn, this.#this as any, priority, tag, once) as EventListener;

		if(!shift) this.#listeners.unshift(listener);
		else this.#listeners.push(listener);

		this.#listeners.sort(sort);

		//@ts-ignore
		this.#on?.call(this, fn, priority, tag, once, shift);

		return fn;
	}

	public once<T extends This>(fn: Fn<T, Args>, priority: number = 0, tag: tag = DEFAULT_TAG, once = true, shift = false): typeof fn {
		return this.on(fn, priority, tag, once, shift);
	}

	public off<T extends This>(): Fn<T, Args>[];
	public off<T extends This>(tag: tag): Fn<T, Args>[];
	public off<T extends This>(fn: Fn<T, Args>): Fn<T, Args>[];
	public off<T extends This>(tag?: Fn<T, Args> | tag): Fn<T, Args>[] {
		let removed: EventListener<This, Args>[] = [];

		if(tag) {
			if(typeof tag === 'function') {
				for(let i = this.#listeners.length-1; i >= 0; --i) {
					if(this.#listeners[i].fn === tag) removed.push(this.#listeners.splice(i, 1)[0]);
				}
			} else {
				for(let i = this.#listeners.length-1; i >= 0; --i) {
					if(this.#listeners[i].tag === tag) removed.push(this.#listeners.splice(i, 1)[0]);
				}
			}
		} else {
			for(let i = this.#listeners.length-1; i >= 0; --i) removed.push(this.#listeners[i]);
			this.#listeners.length = 0;
		}

		//@ts-ignore
		this.#off?.call(this, tag, removed);

		return removed.map(it => it.fn);
	}

	public emit(...args: Args): void {
		for(let i = this.#listeners.length-1; i >= 0; --i) {
			const l = this.#listeners[i];
			l.fn.apply(l.ctx, args);
			if(l.once) this.off(l.fn);
		}
	}

	public async async_emit(...args: Args): Promise<void> {
		const arr: Promise<unknown>[] = [];

		for(let i = this.#listeners.length-1; i >= 0; --i) {
			const l = this.#listeners[i];
			arr.push(l.fn.apply(l.ctx, args));
			if(l.once) this.off(l.fn);
		}

		await Promise.all(arr);
	}

	public async await_emit(...args: Args): Promise<void> {
		for(let i = this.#listeners.length-1; i >= 0; --i) {
			const l = this.#listeners[i];
			await l.fn.apply(l.ctx, args);
			if(l.once) this.off(l.fn);
		}
	}

	public *[Symbol.iterator](): Generator<EventListener<This, Args>, void, void> {
		for(let i = this.#listeners.length-1; i >= 0; --i) yield this.#listeners[i];
	}

	public get [Symbol.toStringTag]() { return 'Event'; }
}


export declare namespace Notification {
	export type Args<T extends Notification> = T extends Notification<any, infer A> ? A : never;

	export type static<T extends Notification> = (...args: Notification.Args<T>) => any;

	export type KeysOf<T extends object> = {
		[K in keyof T]: T[K] extends Notification ? K : never;
	}[keyof T];

	export type ArgsOf<T extends object, K extends KeysOf<T>> =
		//@ts-ignore
		T[K] extends Notification<infer Class, infer Name> ? Fn.A<Class[Name]> : never;

	export type Constants<T> = T[keyof {
		[K in keyof T as K extends `NOTIFICATION_${string}` ? K : never]: T[K];
	}];
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

	public get [Symbol.toStringTag]() { return 'Notification'; }
}


export class EventDispatcher {
	public get [Symbol.toStringTag]() { return 'EventDispatcher'; }

	public notify<This extends EventDispatcher,
		Name extends Notification.KeysOf<This>,
		Args extends Notification.ArgsOf<This, Name>
	//@ts-ignore
	>(this: This, name: Event.ConvertDel<Name>, ...args: Args): void {
		//@ts-ignore
		this[`@${name}`].notify(...args);
	}


	public static on<This extends typeof EventDispatcher,
		Type extends Event.KeysOf<This>,
		//@ts-ignore
		ThisFn extends This[Event.name<Type>]['_this'],
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, fn: Fn<ThisFn, Args>, priority: number = 0, tag: tag = DEFAULT_TAG, once = false, shift = false): typeof fn {
		//@ts-ignore
		return this[`@${type}`].on(fn, priority, tag, once, shift);
	}

	public static once<This extends typeof EventDispatcher,
		Type extends Event.KeysOf<This>,
		//@ts-ignore
		ThisFn extends This[Event.name<Type>]['_this'],
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, fn: Fn<ThisFn, Args>, priority: number = 0, tag: tag = DEFAULT_TAG): typeof fn {
		//@ts-ignore
		return this[`@${type}`].once(fn, priority, tag);
	}

	public static off<This extends typeof EventDispatcher, Type extends Event.KeysOf<This>>(this: This, type: Type): number;
	public static off<This extends typeof EventDispatcher, Type extends Event.KeysOf<This>>(this: This, type: Type, tag: tag): number;
	public static off<This extends typeof EventDispatcher,
		Type extends Event.KeysOf<This>,
		//@ts-ignore
		ThisFn extends This[Event.name<Type>]['_this'],
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, tag?: Fn<ThisFn, Args> | tag): number;

	public static off<This extends typeof EventDispatcher,
		Type extends Event.KeysOf<This>,
		//@ts-ignore
		ThisFn extends This[Event.name<Type>]['_this'],
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, tag?: Fn<ThisFn, Args> | tag): number {
		//@ts-ignore
		return this[`@${type}`].off(tag);
	}

	public static emit<This extends typeof EventDispatcher,
		Type extends Event.KeysOf<This>,
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, ...args: Args): void {
		//@ts-ignore
		return this[`@${type}`].emit(...args);
	}

	public static async_emit<This extends typeof EventDispatcher,
		Type extends Event.KeysOf<This>,
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, ...args: Args): Promise<void> {
		//@ts-ignore
		return this[`@${type}`].async_emit(...args);
	}

	public static await_emit<This extends typeof EventDispatcher,
		Type extends Event.KeysOf<This>,
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, ...args: Args): Promise<void> {
		//@ts-ignore
		return this[`@${type}`].await_emit(...args);
	}


	public on<This extends EventDispatcher,
		Type extends Event.KeysOf<This>,
		//@ts-ignore
		ThisFn extends This[Event.name<Type>]['_this'],
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, fn: Fn<ThisFn, Args>, priority: number = 0, tag: tag = DEFAULT_TAG, once = false, shift = false): typeof fn {
		//@ts-ignore
		return this[`@${type}`].on(fn, priority, tag, once, shift);
	}

	public once<This extends EventDispatcher,
		Type extends Event.KeysOf<This>,
		//@ts-ignore
		ThisFn extends This[Event.name<Type>]['_this'],
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, fn: Fn<ThisFn, Args>, priority: number = 0, tag: tag = DEFAULT_TAG): typeof fn {
		//@ts-ignore
		return this[`@${type}`].once(fn, priority, tag);
	}

	public off<This extends EventDispatcher, Type extends Event.KeysOf<This>>(this: This, type: Type): number;
	public off<This extends EventDispatcher, Type extends Event.KeysOf<This>>(this: This, type: Type, tag: tag): number;
	public off<This extends EventDispatcher,
		Type extends Event.KeysOf<This>,
		//@ts-ignore
		ThisFn extends This[Event.name<Type>]['_this'],
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, tag?: Fn<ThisFn, Args> | tag): number;
	public off<This extends EventDispatcher,
		Type extends Event.KeysOf<This>,
		//@ts-ignore
		ThisFn extends This[Event.name<Type>]['_this'],
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, tag?: Fn<ThisFn, Args> | tag): number {
		//@ts-ignore
		return this[`@${type}`].off(tag);
	}

	public emit<This extends EventDispatcher,
		Type extends Event.KeysOf<This>,
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, ...args: Args): void {
		//@ts-ignore
		return this[`@${type}`].emit(...args);
	}

	public async_emit<This extends EventDispatcher,
		Type extends Event.KeysOf<This>,
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, ...args: Args): Promise<void> {
		//@ts-ignore
		return this[`@${type}`].async_emit(...args);
	}

	public await_emit<This extends EventDispatcher,
		Type extends Event.KeysOf<This>,
		Args extends Event.Args<This, Type>
	>(this: This, type: Type, ...args: Args): Promise<void> {
		//@ts-ignore
		return this[`@${type}`].await_emit(...args);
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
