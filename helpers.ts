export type Fn<T = any, A extends any[] = any[], R = any> = (this: T, ...args: A) => R;
export declare namespace Fn {
	type T<F extends Fn> = F extends Fn<infer T, any, any> ? T : never;
	type A<F extends Fn> = F extends Fn<any, infer A, any> ? A : never;
	type R<F extends Fn> = F extends Fn<any, any, infer R> ? R : never;
}


export const hasOwnProperty = Object.prototype.hasOwnProperty;
export const JSONcopy = <T extends object = object>(data: T): T => JSON.parse(JSON.stringify(data));


interface IMath extends Math {
	INF: number;
	TAU: number;
	degress(x: number): number;
	radians(x: number): number;
	randomInt(a: number, b: number): number;
	randomFloat(a: number, b: number): number;
	mod(x: number, min?: number, max?: number): number;
	clamped(min: number, x: number, max: number): number;
}

export const math: Readonly<IMath> = Object.create(null);

for(const id of Object.getOwnPropertyNames(Math)) (math as any)[id] = (Math as any)[id];

(math as IMath).INF = Infinity;
(math as IMath).TAU = math.PI*2;

(math as IMath).degress = (x: number) => 180 / math.PI * x;
(math as IMath).radians = (x: number) => math.PI / 180 * x;

(math as IMath).randomInt = (a: number, b: number): number => math.floor(math.random() * (1+b - a) + a);
(math as IMath).randomFloat = (a: number, b: number): number => math.random() * (b - a) + a;

(math as IMath).mod = (x: number, min: number = -math.PI, max: number = math.PI) => {
	const range = max - min;
	const offset = ((x - min) % range + range) % range;
	return min + offset;
};

(math as IMath).clamped = (min: number, x: number, max: number): number => x < min ? min : x > max ? max : x;

Object.freeze(math);


export function delay<F extends Fn>(this: Fn.T<F>, cb: F, time: number = 0, ...args: Fn.A<F>) {
	return new Promise<Fn.R<F>>(res => {
		const t = setTimeout(() => {
			clearTimeout(t);
			res(cb.call(this, ...args));
		}, time);
	});
}


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

type cb_t = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

type generateImage_t = ((w: number, h: number, cb: cb_t) => Promise<Image>) & {
	canvas?: HTMLCanvasElement;
};

export const generateImage: generateImage_t = (w, h, cb) => new Promise((res, rej) => {
	const cvs: HTMLCanvasElement = generateImage.canvas || (generateImage.canvas = document.createElement('canvas'));
	const ctx: CanvasRenderingContext2D = cvs.getContext('2d')!;
	cvs.width = w; cvs.height = h;

	cb(ctx, w, h);

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

export const loadScript = (src: string, p: {
	parent?: HTMLElement;
	async?: boolean;
	force?: boolean;
} = {}): Promise<void> => new Promise((res, rej) => {
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
