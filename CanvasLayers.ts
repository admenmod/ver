import { Vector2 } from './Vector2.js';
import { Event, EventDispatcher, FunctionIsEvent } from './events.js';


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

	constructor(public id: string, size: { width: number, height: number } | Vector2, zIndex: number = 0) {
		super();

		this.zIndex = zIndex;

		if(size instanceof Vector2) this.canvas = new OffscreenCanvas(size.x, size.y);
		else this.canvas = new OffscreenCanvas(size.width, size.height);

		this.size = new Vector2(this.canvas.width, this.canvas.height, vec => {
			this.canvas.width = vec.x;
			this.canvas.height = vec.y;
		});
	}
}


export class CanvasLayers extends EventDispatcher {
	public '@init' = new Event<CanvasLayers, [canvas: HTMLCanvasElement, pixelRatio: number]>(this);
	public '@destroy' = new Event<CanvasLayers, []>(this);
	public '@destroyed' = new Event<CanvasLayers, []>(this);

	public '@resize' = new Event<CanvasLayers, [size: Vector2, pixelRatio: number]>(this);
	public '@PreRender' = new Event<CanvasLayers, [ctx: CanvasRenderingContext2D]>(this);
	public '@PostRender' = new Event<CanvasLayers, [ctx: CanvasRenderingContext2D]>(this);

	public '@create' = new Event<CanvasLayers, [layer: ShadowLayer]>(this);
	public '@remove' = new Event<CanvasLayers, [layer: ShadowLayer]>(this);
	public '@move' = new Event<CanvasLayers, [layer: ShadowLayer]>(this);

	public autoclear: boolean = true;
	public autoresize: boolean = true;

	public layers: ShadowLayer[] = [];

	public resizeobserver!: ResizeObserver;

	public canvas!: HTMLCanvasElement;
	public ctx: CanvasRenderingContext2D | null = null;

	constructor(getContext = (canvas: HTMLCanvasElement, pixelRatio: number) => canvas.getContext('2d')) {
		super();

		this['@init'].on((canvas, pixelRatio) => this.ctx = getContext(canvas, pixelRatio));

		const _sort = () => this.layers.sort(sort);
		_sort();

		this['@create'].on(layer => layer.on('change%zIndex', _sort));
		this['@remove'].on(layer => layer.off('change%zIndex', _sort));
	}

	protected _isInited: boolean = false;
	public isInited() { return this._isInited; }

	public init(canvas: HTMLCanvasElement, pixelRatio: number = window.devicePixelRatio || 1): this {
		if(this._isInited) return this;
		this._isInited = true;

		this.#pixelRatio = pixelRatio;

		this.canvas = canvas;

		const box = this.canvas.getBoundingClientRect();
		this.#box_width	= box.width || 1; this.#box_height = box.height || 1;

		this.resizeobserver = new ResizeObserver(e => {
			const rect = e[0].contentRect;
			this.#box_width = rect.width || 1;
			this.#box_height = rect.height || 1;
			if(!this.autoresize) return;
			this.sizeUpdate();
		});
		this.resizeobserver.observe(this.canvas);

		this['@init'].emit(canvas, pixelRatio);

		return this;
	}

	public destroy(): this {
		if(!this._isInited) return this;
		this._isInited = false;

		this['@destroy'].emit();

		this.resizeobserver.unobserve(this.canvas);

		this['@destroyed'].emit();

		return this;
	}

	#pixelRatio: number = 1;
	#width: number = 1;
	#height: number = 1;

	public set pixelRatio(v) {
		this.#pixelRatio = v;
		this.sizeUpdate();
	}
	public get pixelRatio() { return this.#pixelRatio; }

	#box_width!: number;
	public get width() { return this.#width; }
	public get box_width() { return this.#box_width; }

	#box_height!: number;
	public get height() { return this.#height; }
	public get box_height() { return this.#box_height; }

	public get vw() { return this.#box_width / 100; }
	public get vh() { return this.#box_height / 100; }
	public get vwh() { return this.#box_width / this.#box_height; }
	public get vhw() { return this.#box_height / this.#box_width; }
	public get vmax() { return Math.max(this.#box_width, this.#box_height) / 100; }
	public get vmin() { return Math.min(this.#box_width, this.#box_height) / 100; }
	public get size() { return new Vector2(this.#box_width, this.#box_height); }

	public resize: FunctionIsEvent<this, [size: Vector2, pixelRatio: number],
	(size: Vector2, pixelRatio?: number) => void> = new FunctionIsEvent(this, (size, pixelRatio) => {
		this.autoresize = false;

		this.#box_width = size.x;
		this.#box_height = size.y;
		this.#pixelRatio = pixelRatio ?? this.#pixelRatio;

		this.sizeUpdate();
	});

	public sizeUpdate(): void {
		this.#width = this.#box_width * this.#pixelRatio;
		this.#height = this.#box_height * this.#pixelRatio;

		this.canvas.width = this.#width;
		this.canvas.height = this.#height;

		for(const layer of this.layers) {
			layer.canvas.width = this.#width;
			layer.canvas.height = this.#height;
		}

		this.resize.emit(this.size, this.pixelRatio);
		this['@resize'].emit(this.size, this.pixelRatio);
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

	public render(this: CanvasLayers, ctx: CanvasRenderingContext2D | null = this.ctx) {
		if(!ctx) throw new Error('CanvasRenderingContext is null');

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
