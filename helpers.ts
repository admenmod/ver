export type Fn<T = any, A extends any[] | readonly any[] = any, R = any> = (this: T, ...args: A) => R;
export declare namespace Fn {
	type T<F extends Fn> = F extends Fn<infer T, any, any> ? T : never;
	type A<F extends Fn> = F extends Fn<any, infer A, any> ? A : never;
	type R<F extends Fn> = F extends Fn<any, any, infer R> ? R : never;
}

export type Primitive = string | number | boolean | bigint | symbol | null | undefined;


export const typeOf = <T = unknown>(a: T) => {
	let type = typeof a;

	if(a === null) return 'null';
	if(type === 'symbol') return 'symbol';
	if(type === 'string') return 'string';
	if(type === 'number') return 'number';
	if(type === 'boolean') return 'boolean';
	if(type === 'bigint') return 'bigint';
	if(Array.isArray(a)) return 'array';
	if(type === 'object') return 'object';
	if(type === 'function') return 'function';
	if(type === 'undefined') return 'undefined';

	throw new Error('unknown type');
}

export const type_of = <T = unknown>(a: T) => {
	let type = typeof a;

	if(a === null) return 'void/null';
	if(type === 'undefined') return 'void/undefined';
	if(type === 'symbol') return 'symbol';
	if(type === 'string') return 'string';
	if(type === 'number') {
		if(Number.isNaN(a)) return 'number/NaN';
		if(!Number.isFinite(a)) return 'number/infinity';
		if(Number.isInteger(a)) return 'number/integer';
		else return 'number/float';
	}
	if(type === 'boolean') return 'boolean';
	if(type === 'bigint') return 'number/bigint';
	if(Array.isArray(a)) return 'array/'+((a as any)?.[Symbol.toStringTag] || a.constructor.name) as `array/${string}`;
	if(type === 'object') return 'object/'+((a as any)?.[Symbol.toStringTag] || (a as any).constructor.name) as `object/${string}`;
	if(type === 'function') return 'function';

	throw new Error('unknown type');
}


export const hasOwnProperty = Object.prototype.hasOwnProperty;
export const JSONcopy = <T extends object = object>(data: T): T => JSON.parse(JSON.stringify(data));

export const regexp = (str: TemplateStringsArray, ...args: any) => {
	for(let i = 0; i < args.length; i++) (args[i] instanceof RegExp) && (args[i] = args[i].source);
	return (flags?: string) => RegExp(String.raw(str, ...args), flags);
};

export const tag = Object.freeze({
	raw: String.raw,
	str: (str: TemplateStringsArray, ...args: any[]) => {
		let r = str[0];
		for(let i = 0; i < args.length; i++) r += String(args[i])+str[i+1];
		return r;
	}
});

export const Fn = (fn: Fn) => {
	const name = fn.name;
	let str = fn.toString();

	const r = { fn, str, name, async: false, generator: false } as {
		fn: Fn;
		str: string;
		type: 'arrow' | 'method' | 'function';
		expname: string;
		name: string;
		code: string;
		async: boolean;
		generator: boolean;
		arguments: string;
	};

	r.async = str.startsWith('async ');
	if(r.async) str = str.replace(regexp`^async\s+`(), '');

	if(str.startsWith('function')) {
		r.type = 'function';

		const data = regexp`^function(\*?) ?(\w*?)\((.*?)\)\s*\{(.*)\}$`('s').exec(str)!;
		if(!data) throw new Error(`parse ${r.type} [${fn.toString()}]`);

		r.generator = Boolean(data[1]);
		r.expname = data[2];
		r.arguments = data[3];
		r.code = data[4];
	} else if(~str.search(fn.length === 1 ? regexp`^\(?\w+\)?`() : regexp`^\(.*?\)`())) {
		r.type = 'arrow';

		const data = regexp`^\(?(.*?)\)?\s*=>\s*\{?(.*?)\}?$`('s').exec(str)!;
		if(!data) throw new Error(`parse ${r.type} [${fn.toString()}]`);

		r.arguments = data[1];
		r.code = data[2];
	} else {
		r.type = 'method';

		const data = regexp`^(\*?)(.+)\((.*?)\)\s*\{(.*)\}$`('s').exec(str)!;
		if(!data) throw new Error(`parse ${r.type} [${fn.toString()}]`);

		r.generator = Boolean(data[1]);
		r.expname = data[2];
		r.arguments = data[3];
		r.code = data[4];
	}

	return r;
};


interface IMath extends Math {
	INF: number;
	TAU: number;
	degress(x: number): number;
	radians(x: number): number;
	randomInt(a: number, b: number): number;
	randomFloat(a: number, b: number): number;
	mod(x: number, min?: number, max?: number): number;
	clamp(min: number, x: number, max: number): number;
	floorToZero(x: number): number;
	ceilToZero(x: number): number;
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

(math as IMath).clamp = (min: number, x: number, max: number): number => x < min ? min : x > max ? max : x;

(math as IMath).floorToZero = (x: number) => math.floor(math.abs(x)) * Math.sign(x);
(math as IMath).ceilToZero = (x: number) => math.ceil(math.abs(x)) * Math.sign(x);

Object.freeze(math);


export function delay(time: number): Promise<void>;
export function delay<F extends Fn>(time: number, cb?: F, ctx?: Fn.T<F>, ...args: Fn.A<F>): Promise<Fn.R<F>>;
export function delay<F extends Fn>(time: number = 0, cb?: F, ctx?: Fn.T<F>, ...args: Fn.A<F>): Promise<Fn.R<F> | void> {
	return new Promise<Fn.R<F>>(res => {
		const t = setTimeout(() => {
			clearTimeout(t);
			res(cb?.call(ctx, ...args));
		}, time);
	});
}


export function* prototype_chain(o: any, to: any = null, incl: boolean = true): Generator<any> {
	let p = o;
	if(incl) while(p !== to && (p = Object.getPrototypeOf(p))) yield p;
	else while((p = Object.getPrototypeOf(p)) && p !== to) yield p;
}

export function* constructor_chain(o: any, to: any = null, incl: boolean = true): Generator<any> {
	if(!o?.constructor) return;

	for(const c of prototype_chain(o, to?.prototype || null, incl)) {
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

type cb_t = (ctx: OffscreenCanvasRenderingContext2D, w: number, h: number) => void;

type generateImage_t = ((w: number, h: number, cb: cb_t) => Promise<Image>) & {
	canvas?: OffscreenCanvas;
};

export const generateImage: generateImage_t = (w, h, cb, p?: ImageEncodeOptions) => new Promise(async (res, rej) => {
	const canvas: OffscreenCanvas = generateImage.canvas || (generateImage.canvas = new OffscreenCanvas(w, h));
	const ctx = canvas.getContext('2d')!;
	canvas.width = w; canvas.height = h;

	cb(ctx, w, h);

	const blob = await canvas.convertToBlob(p);
	const url = URL.createObjectURL(blob);

	const img = new Image(w, h);
	img.src = url;
	img.onload = () => {
		URL.revokeObjectURL(url);
		res(img);
	};
	img.onerror = e => {
		URL.revokeObjectURL(url);
		rej(e);
	};
});

export const loadImage = (src: string, w?: number, h?: number): Promise<Image> => new Promise((res, rej) => {
	const el = new Image(w, h);
	el.src = src;
	el.onload = () => res(el);
	el.onerror = () => rej(new Error(`Image loading error (${src})`));
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
