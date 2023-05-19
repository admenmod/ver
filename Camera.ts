import { Vector2 } from './Vector2';
import { EventDispatcher } from './events';


export class Camera extends EventDispatcher {
	public readonly position = new Vector2();
	public readonly scale = new Vector2(1, 1);

	protected _rotation: number = 0;
	public get rotation(): number { return this._rotation; }
	public set rotation(v: number) { this._rotation = v; }

	constructor(public readonly size: Vector2) {
		super();
	}

	public use(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
		ctx.scale(this.scale.x, this.scale.y);
		ctx.translate(-(this.position.x - this.size.x/2/this.scale.x), -(this.position.y - this.size.y/2/this.scale.y));

		ctx.translate(this.position.x, this.position.y);
		ctx.rotate(-this.rotation);
		ctx.translate(-this.position.x, -this.position.y);

		return ctx;
	}

	public get vw() { return this.size.x / 100; }
	public get vh() { return this.size.y / 100; }
	public get vwh() { return this.size.x / this.size.y; }
	public get vhw() { return this.size.y / this.size.x; }
	public get vmax() { return Math.max(this.size.x, this.size.y) / 100; }
	public get vmin() { return Math.min(this.size.x, this.size.y) / 100; }
}
