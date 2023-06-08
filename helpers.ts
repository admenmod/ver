import { Vector2 } from './Vector2';


export type Fn<T = any, A extends any[] = any[], R = any> = (this: T, ...args: A) => R;
export declare namespace Fn {
	type T<F extends Fn> = F extends Fn<infer T, any, any> ? T : never;
	type A<F extends Fn> = F extends Fn<any, infer A, any> ? A : never;
	type R<F extends Fn> = F extends Fn<any, any, infer R> ? R : never;
}


export const hasOwnProperty = Object.prototype.hasOwnProperty;
export const random = (a: number, b: number): number => Math.floor(Math.random()*(1+b-a)+a);
export const JSONcopy = <T extends object = object>(data: T): T => JSON.parse(JSON.stringify(data));

export const roundLoop = (value: number, min: number = -Math.PI, max: number = Math.PI) => {
	const range = max - min;
	const offset = ((value - min) % range + range) % range;
	return min + offset;
};


export function* prototype_chain(o: any, to: any = null, incl: boolean = true): Generator<any> {
	let p = o;
	if(incl) while(p !== to && (p = Object.getPrototypeOf(p))) yield p;
	else while(p = Object.getPrototypeOf(p)) {
		if(p === to) break;
		yield p;
	}
}

export function* constructor_chain(o: any, to: any = null, incl: boolean = true): Generator<any> {
	if(!o.constructor) return;

	for(const c of prototype_chain(o, to.prototype, incl)) {
		hasOwnProperty.call(c, 'constructor') ? yield c.constructor : null;
	}
}


export type namespace = Record<PropertyKey, any>;
export interface NameSpace {
	new (): namespace;
	new (namespace: namespace): namespace;
	(): namespace;
	(namespace: namespace): namespace;

	hasOwn: (o: any, k: PropertyKey) => boolean;
	getOwn: (o: any, k: PropertyKey) => any;
}
//@ts-ignore
export const NameSpace: NameSpace = function(namespace: namespace | null = null): namespace {
	return Object.create(namespace);
}

Object.defineProperty(NameSpace, 'hasOwn', {
	enumerable: true, configurable: true,
	value: (o: any, k: PropertyKey): any => hasOwnProperty.call(o, k)
});

Object.defineProperty(NameSpace, 'getOwn', {
	enumerable: true, configurable: true,
	value: (o: any, k: PropertyKey): any => hasOwnProperty.call(o, k) ? o[k] : void 0
});

Object.defineProperty(NameSpace, Symbol.hasInstance, {
	configurable: true,
	value: (o: namespace) => !(o instanceof Object)
});


export type symbolspace = Record<PropertyKey, symbol>;
type s = ((id: PropertyKey) => symbol) & { space: symbolspace };
export interface SymbolSpace {
	new (): s;
	new (symbolspace: symbolspace): s;
	(): s;
	(symbolspace: symbolspace): s;
}

//@ts-ignore
export const SymbolSpace: SymbolSpace = function(symbolspace: any = null) {
	const space: symbolspace = Object.create(symbolspace);
	const s = (id: PropertyKey) => space[id] || (space[id] = Symbol(id.toString()));
	s.space = space;
	return s;
}


type Image = HTMLImageElement;

type cb_t = (ctx: CanvasRenderingContext2D, size: Vector2) => void;

type loadScript_p_t = {
	parent?: HTMLElement;
	async?: boolean;
	force?: boolean;
};

type generateImage_t = ((w: number, h: number, cb: cb_t) => Promise<Image>) & {
	canvas?: HTMLCanvasElement;
};

export const generateImage: generateImage_t = (w, h, cb) => new Promise((res, rej) => {
	const cvs: HTMLCanvasElement = generateImage.canvas || (generateImage.canvas = document.createElement('canvas'));
	const ctx: CanvasRenderingContext2D = cvs.getContext('2d')!;
	cvs.width = w; cvs.height = h;

	cb(ctx, new Vector2(w, h));

	let img = new Image(w, h);
	img.src = cvs.toDataURL();
	img.onload = e => res(img);
	img.onerror = e => rej(e);
});

export const loadImage = (src: string, w?: number, h?: number): Promise<Image> => new Promise((res, rej) => {
	const el = new Image(w, h);
	el.src = src;
	el.onload = e => res(el);
	el.onerror = e => rej(e);
});

export const loadScript = (src: string, p: loadScript_p_t = {}): Promise<void> => new Promise((res, rej) => {
	const url = new URL(src, location.origin).href;
	if(!p.force && Array.prototype.some.call(document.querySelectorAll('script'), i => i.src === url)) return res();

	const parent: HTMLElement = p.parent || document.querySelector('head')!;

	const script = document.createElement('script');
	script.type = 'text/javascript';
	script.async = p.async || false;
	script.src = src;

	parent.append(script);

	script.onload = () => res();
	script.onerror = e => rej(e);
});

const loader = { loadImage, loadScript, cache: new WeakMap() };
