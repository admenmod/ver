import { Event } from './events';
import { Vector2 } from './Vector2';

export type CanvasList = Record<string, HTMLCanvasElement>;
export type LayersList = Record<string, CanvasRenderingContext2D>;


const resize = Symbol('resize');

export class CanvasLayer extends HTMLElement {
	public '@connectedCallback' = new Event<CanvasLayer, []>(this);
	public '@disconnectedCallback' = new Event<CanvasLayer, []>(this);

	public '@resize' = new Event<CanvasLayer, [size: Vector2]>(this);
	public '@create' = new Event<CanvasLayer, [layer: CanvasList[string]]>(this);
	public '@move' = new Event<CanvasLayer, [layer: CanvasList[string]]>(this);
	public '@remove' = new Event<CanvasLayer, [layer_id: string]>(this);

	private _pixelScale: number;
	private _width!: number;
	private _height!: number;

	public layers: CanvasList = {};

	public slotWrapper: HTMLDivElement;
	public layersWrapper: HTMLDivElement;

	private [resize] = () => this.sizeUpdate();
	public connectedCallback() {
		this['@connectedCallback'].emit();
		this.sizeUpdate();
		window.addEventListener('resize', this[resize]);
	}

	public disconnectedCallback() {
		this['@disconnectedCallback'].emit();
		window.removeEventListener('resize', this[resize]);
	}

	constructor(p: {
		layers?: string;
		pixelScale?: number;
	} = {}) {
		super();
		const root = this.attachShadow({ mode: 'open' });
		const paramlayers = (p.layers || this.getAttribute('layers') || 'main back').split(/\s+/).reverse();

		this._pixelScale = p.pixelScale || Number(this.getAttribute('pixel-scale')) || 1;

		this.layers = {};

		this.style.cssText = `display: grid; align-items: center; justify-items: center;`;

		root.innerHTML +=
`<div class="layers" style="
display: grid;
width: 100%; height: 100%;
overflow: auto;
grid-area: 1/1/1/1;
align-self: center;
justify-self: center;
"></div>
<div class="slot" style="
display: grid;
width: 100%; height: 100%;
overflow: auto;
grid-area: 1/1/1/1;
align-self: ${this.getAttribute('align-slot') || 'center'};
justify-self: ${this.getAttribute('justify-slot') || 'center'};
"><slot></slot></div>`;

		this.slotWrapper = root.querySelector<HTMLDivElement>('.slot')!;
		this.layersWrapper = root.querySelector<HTMLDivElement>('.layers')!;

		for(let id of paramlayers) this.createLayer(id);
	}

	public set pixelScale(v) {
		this._pixelScale = v;
		this.sizeUpdate();
	}
	public get pixelScale() { return this._pixelScale; }

	public set width(v) {
		this._width = v * this._pixelScale;
		for(let id in this.layers) this.layers[id].width = this._width;
	}
	public get width() { return this._width; }

	public set height(v) {
		this._height = v * this._pixelScale;
		for(let id in this.layers) this.layers[id].height = this._height;
	}
	public get height() { return this._height; }

	public get vw() { return this._width / 100; }
	public get vh() { return this._height / 100; }
	public get vwh() { return this._width / this._height; }
	public get vhw() { return this._height / this._width; }
	public get vmax() { return Math.max(this._width, this._height) / 100; }
	public get vmin() { return Math.min(this._width, this._height) / 100; }
	public get size() { return new Vector2(this._width, this._height); }

	public sizeUpdate() {
		let b = this.getBoundingClientRect();
		this._width = b.width * this._pixelScale;
		this._height = b.height * this._pixelScale;

		for(let id in this.layers) {
			this.layers[id].width = this._width;
			this.layers[id].height = this._height;
		}

		this['@resize'].emit(this.size);
	}

	public getLayer(id: number) { return this.layers[id]; }
	public getLayers() { return this.layers; }

	public createLayer(id: string, pos: number | 'main' | 'back' | 'start' | 'end' | 'afterBegin' | 'beforeEnd' = 'beforeEnd'): HTMLCanvasElement {
		let layer = document.createElement('canvas');
		layer.id = id;
		layer.style.cssText += `width:100%; height:100%; grid-area:1/1/1/1;`;

		layer.width = this._width;
		layer.height = this._height;

		let idLayers: any = [...this.layersWrapper.querySelectorAll<HTMLCanvasElement>('canvas') as any].map(i => i.id);

		if(pos === 'back' || pos === 'start' || pos === 'afterBegin') {
			this.layersWrapper.insertBefore(layer, this.layers[idLayers[0]]);
		} else if(typeof pos === 'number' && !isNaN(pos)) {
			this.layersWrapper.insertBefore(layer, this.layers[idLayers[pos]]);
		} else if(pos === 'main' || pos === 'end' || pos === 'beforeEnd' || true) this.layersWrapper.append(layer);

		this.layers[id] = this.layersWrapper.querySelector<HTMLCanvasElement>(`#${id}`)!;

		this['@create'].emit(this.layers[id]);

		return this.layers[id];
	}

	public removeLayer(id: string) {
		this.layers[id].remove();
		delete this.layers[id];

		this['@remove'].emit(id);

		return id;
	}

	public moveLayer(layerId: string, targetId: string) {
		if(layerId === targetId) return;

		let { [layerId]: layer, [targetId]: target = null } = this.layers;

		this.layersWrapper.insertBefore(layer, target);

		this['@move'].emit(layer);

		return layer;
	}

	public static get observedAttributes() {
		return ['width', 'height', 'pixelScale', 'justifyItems', 'alignItems'];
	}

	public attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if(oldValue === newValue) return;

		if(['width', 'height', 'pixelScale'].includes(name)) (this as any)[name] = newValue;
		else if(['justifyItems', 'alignItems'].includes(name)) (this.slotWrapper.style as any)[name] = newValue;
	}
}


customElements.define('canvas-layer', CanvasLayer);
