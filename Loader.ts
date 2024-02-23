import { EventDispatcher, Event } from './events.js';
import { loadImage } from './helpers.js';


export class Loader extends EventDispatcher {
	private static _instance: Loader;
	protected constructor() {
		super();
		return Loader._instance || this;
	}
	public static instance(): Loader { return new Loader(); }


	protected _cache_images: Record<string, HTMLImageElement> = {};

	public async loadImage(src: string, w?: number, h?: number) {
		return this._cache_images[src] || (this._cache_images[src] = await loadImage(src, w, h));
	}
}
