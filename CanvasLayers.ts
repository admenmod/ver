import { Vector2 } from './Vector2.js';
import { Event, EventDispatcher } from './events.js';


const sort = (a: ShadowLayer, b: ShadowLayer) => a.zIndex - b.zIndex;


export class ShadowLayer extends EventDispatcher {
	public '@resize' = new Event<ShadowLayer, [size: Vector2]>(this);
	public '@PreRender' = new Event<ShadowLayer, [ctx: CanvasRenderingContext2D]>(this);
	public '@PostRender' = new Event<ShadowLayer, [ctx: CanvasRenderingContext2D]>(this);

	public '@change%zIndex' = new Event<ShadowLayer, [prev: number, next: number]>(this);


	public canvas: OffscreenCanvas;
	public size: Vector2;

	protected _zIndex: number = 0;
	public get zIndex() { return this._zIndex; }
	public set zIndex(v) {
		const prev = this._zIndex;
		this._zIndex = v;
		this['@change%zIndex'].emit(prev, this._zIndex);
	}

	constructor(public id: string, ref: { width: number, height: number } | Vector2, zIndex: number = 0) {
		super();

		this.zIndex = zIndex;

		if(ref instanceof Vector2) this.canvas = new OffscreenCanvas(ref.x, ref.y);
		else this.canvas = new OffscreenCanvas(ref.width, ref.height);

		this.size = new Vector2(this.canvas.width, this.canvas.height, (x, y) => {
			this.canvas.width = x;
			this.canvas.height = y;
		});
	}
}


export class CanvasLayers extends EventDispatcher {
	public '@resize' = new Event<CanvasLayers, [size: Vector2]>(this);
	public '@PreRender' = new Event<CanvasLayers, [ctx: CanvasRenderingContext2D]>(this);
	public '@PostRender' = new Event<CanvasLayers, [ctx: CanvasRenderingContext2D]>(this);

	public '@create' = new Event<CanvasLayers, [layer: ShadowLayer]>(this);
	public '@remove' = new Event<CanvasLayers, [layer: ShadowLayer]>(this);
	public '@move' = new Event<CanvasLayers, [layer: ShadowLayer]>(this);

	public autoclear: boolean = true;

	public layers: ShadowLayer[] = [];

	public resizeobserver: ResizeObserver;

	public ctx: CanvasRenderingContext2D;
	constructor(public canvas: HTMLCanvasElement) {
		super();

		const box = this.canvas.getBoundingClientRect();
		this.#box_width	= box.width || 1; this.#box_height = box.height || 1;

		this.ctx = this.canvas.getContext('2d')!;

		this.resizeobserver = new ResizeObserver(e => {
			const rect = e[0].contentRect;
			this.#box_width = rect.width || 1;
			this.#box_height = rect.height || 1;
			this.sizeUpdate();
		});
		this.resizeobserver.observe(canvas);

		const _sort = () => this.layers.sort(sort);
		_sort();

		this['@create'].on(layer => layer.on('change%zIndex', _sort));
		this['@remove'].on(layer => layer.off('change%zIndex', _sort));
	}

	#pixelScale: number = 1;
	#width: number = 1;
	#height: number = 1;

	public set pixelScale(v) {
		this.#pixelScale = v;
		this.sizeUpdate();
	}
	public get pixelScale() { return this.#pixelScale; }

	#box_width: number;
	public get width() { return this.#width; }
	public get box_width() { return this.#box_width; }

	#box_height: number;
	public get height() { return this.#height; }
	public get box_height() { return this.#box_height; }

	public get vw() { return this.#width / 100; }
	public get vh() { return this.#height / 100; }
	public get vwh() { return this.#width / this.#height; }
	public get vhw() { return this.#height / this.#width; }
	public get vmax() { return Math.max(this.#width, this.#height) / 100; }
	public get vmin() { return Math.min(this.#width, this.#height) / 100; }
	public get size() { return new Vector2(this.#width, this.#height); }

	public sizeUpdate() {
		this.#width = this.#box_width * this.#pixelScale;
		this.#height = this.#box_height * this.#pixelScale;

		this.canvas.width = this.#width;
		this.canvas.height = this.#height;

		for(const layer of this.layers) {
			layer.canvas.width = this.#width;
			layer.canvas.height = this.#height;
		}

		this['@resize'].emit(this.size);
	}


	public get(id: string) { return this.layers.find(i => i.id === id); }

	public create(id: string, zIndex: number = 0, shift: boolean = false): ShadowLayer {
		const layer = new ShadowLayer(id, this.canvas, zIndex);

		if(!shift) this.layers.push(layer);
		else this.layers.unshift(layer);

		this['@create'].emit(layer);

		return layer;
	}

	public remove(id: string): ShadowLayer {
		const l = this.layers.findIndex(i => i.id === id);
		if(!~l) throw new Error('shadow layer not found');

		this['@remove'].emit(this.layers[l]);

		return this.layers[l];
	}

	public render(this: CanvasLayers, ctx: CanvasRenderingContext2D = this.ctx) {
		if(this.autoclear) ctx.clearRect(0, 0, this.width, this.height);

		ctx.save();
		this.emit('PreRender', ctx);

		for(const layer of this.layers) {
			layer.emit('PreRender', ctx);
			ctx.drawImage(layer.canvas, 0, 0);
			layer.emit('PostRender', ctx);
		}

		this.emit('PostRender', ctx);
		ctx.restore();
	}
}