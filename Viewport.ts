import { Vector2 } from './Vector2';
import { Event, EventDispatcher } from './events';


export class Viewport extends EventDispatcher {
	public '@resize' = new Event<Viewport, [size: Vector2]>(this);


	public readonly position = new Vector2();
	public readonly scale = new Vector2(1, 1);

	protected _rotation: number = 0;
	public get rotation(): number { return this._rotation; }
	public set rotation(v: number) { this._rotation = v; }

	public readonly offset = new Vector2();
	public readonly pivot_offset = new Vector2();

	public readonly size: Vector2;

	public isCentered: boolean = true;

	constructor(public ctx: CanvasRenderingContext2D) {
		super();

		this.size = new Vector2(ctx.canvas.width, ctx.canvas.height, (x, y) => this['@resize'].emit(new Vector2(x, y)));
	}

	public transformToLocal(v: Vector2, isCentered = this.isCentered): Vector2 {
		if(isCentered) v.sub(this.offset.x + this.size.x/2, this.offset.y + this.size.y/2);

		return v;
	}
	public transformFromScreenToViewport(v: Vector2, isCentered = this.isCentered): Vector2 {
		if(isCentered) v.sub(this.offset.x + this.size.x/2, this.offset.y + this.size.y/2);

		v.div(this.scale);

		v.sub(this.pivot_offset);
		v.rotate(this.rotation);
		v.add(this.pivot_offset);

		v.add(this.position);

		return v;
	}
	public transformFromViewportToScreen(v: Vector2, isCentered = this.isCentered): Vector2 {
		if(isCentered) v.add(this.offset.x + this.size.x/2, this.offset.y + this.size.y/2);

		v.inc(this.scale);

		v.sub(this.pivot_offset);
		v.rotate(-this.rotation);
		v.add(this.pivot_offset);

		v.sub(this.position);

		return v;
	}

	public clear(): void {
		this.ctx.clearRect(this.offset.x, this.offset.y, this.size.x, this.size.y);
	}

	public use(pos = true, rot = true, scale = true, isCentered = this.isCentered): void {
		this.ctx.beginPath();
		this.ctx.rect(this.offset.x, this.offset.y, this.size.x, this.size.y);
		this.ctx.clip();

		this.ctx.translate(this.offset.x, this.offset.y);
		if(isCentered) this.ctx.translate(this.size.x/2, this.size.y/2);

		if(scale) this.ctx.scale(this.scale.x, this.scale.y);
		if(rot) {
			this.ctx.translate(this.pivot_offset.x, this.pivot_offset.y);
			this.ctx.rotate(-this.rotation);
			this.ctx.translate(-this.pivot_offset.x, -this.pivot_offset.y);
		}
		if(pos) this.ctx.translate(-this.position.x, -this.position.y);
	}

	public get vw() { return this.size.x / 100; }
	public get vh() { return this.size.y / 100; }
	public get vwh() { return this.size.x / this.size.y; }
	public get vhw() { return this.size.y / this.size.x; }
	public get vmax() { return Math.max(this.size.x, this.size.y) / 100; }
	public get vmin() { return Math.min(this.size.x, this.size.y) / 100; }
}
