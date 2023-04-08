import { Vector2 } from './Vector2';
import { EventDispatcher } from './events';


export class Camera extends EventDispatcher {
	public readonly position = new Vector2();
	public readonly scale = new Vector2(1, 1);

	protected _rotation: number = 0;
	public get rotation(): number { return this._rotation; }
	public set rotation(v: number) { this._rotation = v; }

	constructor(
		public readonly size: Vector2,
		public pixelDensity: number = 20
	) {
		super();
	}

	public getDrawPosition(): Vector2 {
		return this.position.buf()
			.inc(this.scale)
			.inc(this.pixelDensity)
			.sub(this.size.buf().div(2));
	}

	public get vw() { return this.size.x / 100; }
	public get vh() { return this.size.y / 100; }
	public get vwh() { return this.size.x / this.size.y; }
	public get vhw() { return this.size.y / this.size.x; }
	public get vmax() { return Math.max(this.size.x, this.size.y) / 100; }
	public get vmin() { return Math.min(this.size.x, this.size.y) / 100; }
}
