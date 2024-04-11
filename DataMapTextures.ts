import { math as Math } from './helpers.js';


export class DataMapTextures<
	Width extends number,
	Height extends number,
	Maps extends Record<string, new (size: number) => any>
> {
	public maps: ({ [id in keyof Maps]: InstanceType<Maps[id]> });

	constructor(
		public readonly width: Width,
		public readonly height: Height,
		maps: Maps
	) {
		const size = width * height;

		//@ts-ignore
		this.maps = {};

		for(const id in maps) this.maps[id] = new maps[id](size);
	}

	public hasCoord(i: number): boolean { return !(i < 0 || i > this.width * this.height); }
	public hasIndex(x: number, y: number): boolean { return !(x < 0 || x > this.width) && !(y < 0 || y > this.height); }

	public getCoord(i: number): [number, number] { return [i % this.width, Math.floor(i / this.width)]; }
	public getIndex(x: number, y: number): number { return x + y * this.width; }

	public getClampedCoord(i: number): [number, number] {
		i = Math.clamp(0, i, this.width * this.height - 1);
		return [i % this.width, Math.floor(i / this.width)];
	}
	public getClampedIndex(x: number, y: number): number {
		return Math.clamp(0, x, this.width) + Math.clamp(0, y, this.height) * this.width;
	}
}
