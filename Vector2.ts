export type Vector2_t = Vector2 | number[] | { 0: number, 1: number };


const isVector2_t = (v: any): v is Vector2_t => v[0] !== null && v[0] !== undefined && v[1] !== null && v[1] !== undefined;


export class Vector2 {
	public '0': number = 0;
	public '1': number = 0;
	public readonly length: number = 2;


	constructor();
	constructor(v: Vector2_t);
	constructor(x: number, y: number);
	constructor(...args: any[]) {
		if(args.length === 1) {
			if(typeof args[0] === 'object') { for(let i = 0; i < this.length; ++i) (this as any)[i] = args[0][i]; }
			else { for(let i = 0; i < this.length; ++i) (this as any)[i] = args[0]; }
		} else { for(let i = 0; i < this.length; ++i) (this as any)[i] = args[i] || 0; }
		return this;
	}

	public set x(v: number) { this[0] = v; }
	public get x(): number { return this[0]; }
	public set y(v: number) { this[1] = v; }
	public get y(): number { return this[1]; }

	public buf(): Vector2 { return new Vector2(this); }

	public set(): this;
	public set(v: Vector2_t): this;
	public set(x: number, y?: number): this;
	public set(...args: any[]): this {
		if(args.length === 1) {
			if(typeof args[0] === 'object') { for(let i = 0; i < this.length; ++i) (this as any)[i] = args[0][i]; }
			else { for(let i = 0; i < this.length; ++i) (this as any)[i] = args[0]; }
		} else { for(let i = 0; i < this.length; ++i) (this as any)[i] = args[i] || 0; }
		return this;
	}

	public add(v: Vector2_t): this;
	public add(x: number, y?: number): this;
	public add(...args: any[]): this {
		if(args.length === 1) {
			if(typeof args[0] === 'object') { for(let i = 0; i < this.length; ++i) (this as any)[i] += args[0][i]; }
			else { for(let i = 0; i < this.length; ++i) (this as any)[i] += args[0]; }
		} else { for(let i = 0; i < this.length; ++i) (this as any)[i] += args[i] || 0; }
		return this;
	}

	public sub(v: Vector2_t): this;
	public sub(x: number, y?: number): this;
	public sub(...args: any[]): this {
		if(args.length === 1) {
			if(typeof args[0] === 'object') { for(let i = 0; i < this.length; ++i) (this as any)[i] -= args[0][i]; }
			else { for(let i = 0; i < this.length; ++i) (this as any)[i] -= args[0]; }
		} else { for(let i = 0; i < this.length; ++i) (this as any)[i] -= args[i] || 0; }
		return this;
	}

	public inc(v: Vector2_t): this;
	public inc(x: number, y?: number): this;
	public inc(...args: any[]): this {
		if(args.length === 1) {
			if(typeof args[0] === 'object') { for(let i = 0; i < this.length; ++i) (this as any)[i] *= args[0][i]; }
			else { for(let i = 0; i < this.length; ++i) (this as any)[i] *= args[0]; }
		} else { for(let i = 0; i < this.length; ++i) (this as any)[i] *= args[i] || 1; }
		return this;
	}

	public div(v: Vector2_t): this;
	public div(x: number, y?: number): this;
	public div(...args: any[]): this {
		if(args.length === 1) {
			if(typeof args[0] === 'object') { for(let i = 0; i < this.length; ++i) (this as any)[i] /= args[0][i]; }
			else { for(let i = 0; i < this.length; ++i) (this as any)[i] /= args[0]; }
		} else { for(let i = 0; i < this.length; ++i) (this as any)[i] /= args[i] || 1; }
		return this;
	}

	public pow(v: Vector2_t): this;
	public pow(x: number, y?: number): this;
	public pow(...args: any[]): this {
		if(args.length === 1) {
			if(typeof args[0] === 'object') { for(let i = 0; i < this.length; ++i) (this as any)[i] **= args[0][i]; }
			else { for(let i = 0; i < this.length; ++i) (this as any)[i] **= args[0]; }
		} else { for(let i = 0; i < this.length; ++i) (this as any)[i] **= args[i] || 1; }
		return this;
	}

	public mod(v: Vector2_t): this;
	public mod(x: number, y?: number): this;
	public mod(...args: any[]): this {
		if(args.length === 1) {
			if(typeof args[0] === 'object') { for(let i = 0; i < this.length; ++i) (this as any)[i] %= args[0][i]; }
			else { for(let i = 0; i < this.length; ++i) (this as any)[i] %= args[0]; }
		} else { for(let i = 0; i < this.length; ++i) (this as any)[i] %= args[i] || 0; }
		return this;
	}

	public abs(): this {
		for(let i = 0; i < this.length; ++i) (this as any)[i] = Math.abs((this as any)[i]);
		return this;
	}

	public invert(): this {
		for(let i = 0; i < this.length; ++i) (this as any)[i] = -(this as any)[i];
		return this;
	}

	public inverse(a: number = 1): this {
		for(let i = 0; i < this.length; ++i) (this as any)[i] = a/(this as any)[i];
		return this;
	}

	public floor(a: number = 1): this {
		for(let i = 0; i < this.length; ++i) (this as any)[i] = Math.floor((this as any)[i]*a)/a;
		return this;
	}

	public isSame(v: Vector2_t): boolean {
		for(let i = 0; i < this.length; ++i) {
			if((this as any)[i] !== (v as any)[i]) return false;
		}
		return true;
	}

	public set angle(a: number) {
		let cos = Math.cos(a), sin = Math.sin(a);
		let x = this[0]*cos - this[1]*sin;
		this[1] = this[0]*sin + this[1]*cos;
		this[0] = x;
	}
	public get angle(): number { return Math.atan2(this[1], this[0]); }
	public get module(): number { return Math.sqrt(this.moduleSq); }
	public get moduleSq(): number { return this[0]*this[0] + this[1]*this[1]; }

	public dot(v: Vector2_t): number { return this[0]*v[0] + this[1]*v[1]; }
	public cross(v: Vector2_t): number { return this[0]*v[1] - this[1]*v[0]; }

	public projectOnto(v: Vector2_t): this {
		const c: number = (this[0]*v[0] + this[1]*v[1]) / (v[0]*v[0] + v[1]*v[1]);
		this[0] = v[0]*c; this[1] = v[1]*c;
		return this;
	}

	public normalize(a: number = 1): this {
		const l: number = this.module/a;
		for(let i = 0; i < this.length; ++i) (this as any)[i] /= l;
		return this;
	}

	public getDistance(v: Vector2_t): number { return Math.sqrt((v[0]-this[0]) ** 2 + (v[1]-this[1]) ** 2); }
	public getAngleRelative(v: Vector2_t): number { return Math.atan2(v[1]-this[1], v[0]-this[0]); }

	public moveAngle(mv: number = 0, a: number = 0): this {
		this[0] += mv*Math.cos(a);
		this[1] += mv*Math.sin(a);
		return this;
	}

	public moveTo(v: Vector2_t, mv: number = 1, t: boolean = true): this {
		let a = this.getAngleRelative(v);
		let mvx = Math.cos(a)*mv, mvy = Math.sin(a)*mv;
		this[0] += (t ? (mvx > Math.abs(v[0]-this[0]) ? v[0]-this[0]: mvx): mvx);
		this[1] += (t ? (mvy > Math.abs(v[1]-this[1]) ? v[1]-this[1]: mvy): mvy);
		return this;
	}

	public moveTime(v: Vector2_t, t: number = 1): this {
		this[0] += (v[0]-this[0]) / (t!==0 ? t:1);
		this[1] += (v[1]-this[1]) / (t!==0 ? t:1);
		return this;
	}

	public isDynamicRectIntersect(a: [Vector2_t, Vector2_t, Vector2_t, Vector2_t]) {
		let d = false;
		for(let c = a.length-1, n = 0; n < a.length; c = n++) {
			a[n][1] > this[1] != a[c][1] > this[1]
			&& this[0] < (a[c][0] - a[n][0]) * (this[1]-a[n][1]) / (a[c][1] - a[n][1]) + a[n][0]
			&& (d = !d);
		};
		return d;
	}

	public isStaticRectIntersect({ x, y, w, h }: { x: number, y: number, w: number, h: number }): boolean {
		return this.x > x && this.x < x+w && this.y > y && this.y < y+h;
	}


	public static from(v: { x: number, y: number } | Vector2_t): Vector2 {
		//@ts-ignore
		return new Vector2(v.x ?? v[0], v.y ?? v[1]);
	}


	public static readonly ZERO: Vector2 = Object.freeze(new Vector2());
	public static readonly ONE: Vector2 = Object.freeze(new Vector2(1, 1));

	public static readonly LEFT: Vector2 = Object.freeze(new Vector2(-1, 0));
	public static readonly RIGHT: Vector2 = Object.freeze(new Vector2(1, 0));
	public static readonly UP: Vector2 = Object.freeze(new Vector2(0, -1));
	public static readonly DOWN: Vector2 = Object.freeze(new Vector2(0, 1));


	public toString(): string { return `Vector2(${this[0]}, ${this[1]})`; }
	public [Symbol.toPrimitive](): string { return this.toString(); }

	public static [Symbol.toStringTag]: string = 'Vector2';
}

export const vec2: {
	(): Vector2;
	(v: Vector2_t): Vector2;
	(x: number, y: number): Vector2;
} = (...args: any[]): Vector2 => new Vector2(args);
