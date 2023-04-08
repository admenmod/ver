import { Vector2 } from './Vector2';


export const random = (a: number, b: number): number => Math.floor(Math.random()*(1+b-a)+a);
export const JSONcopy = <T extends object = object>(data: T): T => JSON.parse(JSON.stringify(data));

export const roundLoop = (value: number, min: number, max: number) => {
	const range = max - min;
	const offset = ((value - min) % range + range) % range;
	return min + offset;
};


export type namespace = Record<PropertyKey, any>;
export const NameSpace = function(namespace: namespace | null = null): namespace {
	return Object.create(namespace);
}

Object.defineProperty(NameSpace, Symbol.hasInstance, {
	configurable: true,
	//@ts-ignore
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

export const loadScript = (src: string, p: loadScript_p_t = {}): Promise<Event> => new Promise((res, rej) => {
	const parent: HTMLElement = p.parent || document.querySelector('head')!;

	const script = document.createElement('script');
	script.type = 'text/javascript';
	script.async = p.async || false;
	script.src = src;

	parent.append(script);

	script.onload = e => res(e);
	script.onerror = e => rej(e);
});

let loader = { loadImage, loadScript, cache: new WeakMap() };
