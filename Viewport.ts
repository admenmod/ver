import { Vector2 } from './Vector2.js';
import { Event, EventDispatcher } from './events.js';


export class Viewport<T extends CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D = OffscreenCanvasRenderingContext2D> extends EventDispatcher {
	public '@move' = new Event<Viewport<T>, [position: Vector2]>(this);
	public '@scale' = new Event<Viewport<T>, [scale: Vector2]>(this);
	public '@resize' = new Event<Viewport<T>, [size: Vector2]>(this);


	public readonly position = new Vector2(0, 0, vec => this['@move'].emit(vec));
	public readonly scale = new Vector2(1, 1, vec => {
		this.draw_distance = this.size.new().inc(this.scale).div(2).module;
		this['@scale'].emit(vec);
	});
	public readonly size = new Vector2(1, 1, vec => {
		this.draw_distance = this.size.new().inc(this.scale).div(2).module;
		if(this.auto_scale_pixel_ratio) this.scalePixelRatio();
		this['@resize'].emit(vec);
	});

	protected _rotation: number = 0;
	public get rotation(): number { return this._rotation; }
	public set rotation(v: number) { this._rotation = v; }

	public readonly offset = new Vector2();
	public readonly pivot_offset = new Vector2();

	public draw_distance: number = 0;
	public isCentered: boolean = true;
	public auto_scale_pixel_ratio: boolean = true;

	constructor(public ctx: T, public pixelRatio: number = window.devicePixelRatio || 1) {
		super();

		this.size.set(this.ctx.canvas.width, this.ctx.canvas.height);
	}

	public isInViewport(position: Vector2, draw_distance: number): boolean {
		return this.position.getDistance(position) < this.draw_distance + draw_distance;
	}

	public transformToLocal(v: Vector2, isCentered = this.isCentered): Vector2 {
		if(isCentered) v.sub(this.offset.x + this.size.x/2, this.offset.y + this.size.y/2);

		return v;
	}
	public transformFromScreenToViewport(v: Vector2, isCentered = this.isCentered): Vector2 {
		if(isCentered) v.sub(this.offset.x + this.size.x/2, this.offset.y + this.size.y/2);

		v.inc(this.scale);

		v.sub(this.pivot_offset);
		v.rotate(this.rotation);
		v.add(this.pivot_offset);

		v.add(this.position);

		return v;
	}
	public transformFromViewportToScreen(v: Vector2, isCentered = this.isCentered): Vector2 {
		if(isCentered) v.add(this.offset.x + this.size.x/2, this.offset.y + this.size.y/2);

		v.div(this.scale);

		v.sub(this.pivot_offset);
		v.rotate(-this.rotation);
		v.add(this.pivot_offset);

		v.sub(this.position);

		return v;
	}

	public scalePixelRatio(): void {
		this.ctx.resetTransform();
		this.ctx.scale(this.pixelRatio, this.pixelRatio);
	}

	public clear(): void {
		this.ctx.clearRect(this.offset.x, this.offset.y, this.size.x, this.size.y);
	}

	public use(isCentered = this.isCentered): void {
		this.ctx.beginPath();
		this.ctx.rect(this.offset.x, this.offset.y, this.size.x, this.size.y);
		this.ctx.clip();

		this.ctx.translate(this.offset.x, this.offset.y);
		if(isCentered) this.ctx.translate(this.size.x/2, this.size.y/2);

		this.ctx.scale(1/this.scale.x, 1/this.scale.y);

		this.ctx.translate(this.pivot_offset.x, this.pivot_offset.y);
		this.ctx.rotate(-this.rotation);
		this.ctx.translate(-this.pivot_offset.x, -this.pivot_offset.y);

		this.ctx.translate(-this.position.x, -this.position.y);
	}

	public get vw() { return this.size.x / 100; }
	public get vh() { return this.size.y / 100; }
	public get vwh() { return this.size.x / this.size.y; }
	public get vhw() { return this.size.y / this.size.x; }
	public get vmax() { return Math.max(this.size.x, this.size.y) / 100; }
	public get vmin() { return Math.min(this.size.x, this.size.y) / 100; }

	public override get [Symbol.toStringTag]() { return 'Viewport'; }
}
