export type Vector2_t = Vector2 | number[] | { 0: number, 1: number };


type cb = (vec: Vector2) => unknown;
type mat = { a: number, b: number, c: number, d: number, e?: number, f?: number };

export class Vector2 {
	public readonly length: number = 2;

	public 0: number = 0;
	public 1: number = 0;

	readonly #cb: cb | null = null;

	constructor();
	constructor(x: number, y: number);
	constructor(x: number, y: number, cb: cb | null);
	constructor(...args: any[]) {
		this[0] = args[0] || 0; this[1] = args[1] || 0;
		this.#cb = args[2] || null;

		Object.defineProperty(this, 'length', { writable: false, enumerable: false, configurable: true });
	}

	public apply(): this;
	public apply(v: Vector2_t): this;
	public apply(x: number, y?: number): this;
	public apply(...args: any[]): this {
		if(args.length === 1) {
			if(typeof args[0] === 'object') { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] = args[0][i]; }
			else { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] = args[0]; }
		} else { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] = Number(args[i]) || 0; }

		return this;
	}


	public get x(): number { return this[0]; }
	public set x(v: number) {
		this[0] = v;
		this.#cb?.(this);
	}
	public get y(): number { return this[1]; }
	public set y(v: number) {
		this[1] = v;
		this.#cb?.(this);
	}

	/** @deprecated use Vector2.new() */
	public buf(): Vector2 { return new Vector2(this[0], this[1]); }

	public new(cb: cb | null = null): Vector2 { return new Vector2(this[0], this[1], cb); }

	public set(): this;
	public set(v: Vector2_t): this;
	public set(x: number, y?: number): this;
	public set(...args: any[]): this {
		if(args.length === 1) {
			if(typeof args[0] === 'object') { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] = args[0][i]; }
			else { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] = args[0]; }
		} else { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] = Number(args[i]) || 0; }

		this.#cb?.(this);
		return this;
	}

	public add(v: Vector2_t): this;
	public add(x: number, y?: number): this;
	public add(...args: any[]): this {
		if(args.length === 1) {
			if(typeof args[0] === 'object') { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] += args[0][i]; }
			else { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] += args[0]; }
		} else { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] += Number(args[i]) || 0; }

		this.#cb?.(this);
		return this;
	}

	public sub(v: Vector2_t): this;
	public sub(x: number, y?: number): this;
	public sub(...args: any[]): this {
		if(args.length === 1) {
			if(typeof args[0] === 'object') { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] -= args[0][i]; }
			else { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] -= args[0]; }
		} else { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] -= Number(args[i]) || 0; }

		this.#cb?.(this);
		return this;
	}

	public inc(v: Vector2_t): this;
	public inc(x: number, y?: number): this;
	public inc(...args: any[]): this {
		if(args.length === 1) {
			if(typeof args[0] === 'object') { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] *= args[0][i]; }
			else { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] *= args[0]; }
		} else { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] *= Number(args[i]) ?? 1; }

		this.#cb?.(this);
		return this;
	}

	public div(v: Vector2_t): this;
	public div(x: number, y?: number): this;
	public div(...args: any[]): this {
		if(args.length === 1) {
			if(typeof args[0] === 'object') { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] /= args[0][i]; }
			else { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] /= args[0]; }
		} else { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] /= Number(args[i]) ?? 1; }

		this.#cb?.(this);
		return this;
	}

	public pow(v: Vector2_t): this;
	public pow(x: number, y?: number): this;
	public pow(...args: any[]): this {
		if(args.length === 1) {
			if(typeof args[0] === 'object') { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] **= args[0][i]; }
			else { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] **= args[0]; }
		} else { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] **= Number(args[i]) ?? 1; }

		this.#cb?.(this);
		return this;
	}

	public mod(v: Vector2_t): this;
	public mod(x: number, y?: number): this;
	public mod(...args: any[]): this {
		if(args.length === 1) {
			if(typeof args[0] === 'object') { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] %= args[0][i]; }
			else { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] %= args[0]; }
		} else { for(let i = 0; i < this.length; ++i) this[i as 0 | 1] %= Number(args[i]) ?? 1; }

		this.#cb?.(this);
		return this;
	}

	public abs(): this {
		for(let i = 0; i < this.length; ++i) this[i as 0 | 1] = Math.abs(this[i as 0 | 1]);

		this.#cb?.(this);
		return this;
	}

	public sign(): this {
		for(let i = 0; i < this.length; ++i) this[i as 0 | 1] = Math.sign(this[i as 0 | 1]);

		this.#cb?.(this);
		return this;
	}

	public invert(): this {
		for(let i = 0; i < this.length; ++i) this[i as 0 | 1] = -this[i as 0 | 1];

		this.#cb?.(this);
		return this;
	}

	public inverse(a: number = 1): this {
		for(let i = 0; i < this.length; ++i) this[i as 0 | 1] = a/this[i as 0 | 1];

		this.#cb?.(this);
		return this;
	}

	public floor(a: number = 1): this {
		for(let i = 0; i < this.length; ++i) this[i as 0 | 1] = Math.floor(this[i as 0 | 1]*a)/a;

		this.#cb?.(this);
		return this;
	}

	public round(a: number = 1): this {
		for(let i = 0; i < this.length; ++i) this[i as 0 | 1] = Math.round(this[i as 0 | 1]*a)/a;

		this.#cb?.(this);
		return this;
	}

	public ceil(a: number = 1): this {
		for(let i = 0; i < this.length; ++i) this[i as 0 | 1] = Math.ceil(this[i as 0 | 1]*a)/a;

		this.#cb?.(this);
		return this;
	}

	public floorToZero(a: number = 1): this {
		for(let i = 0; i < this.length; ++i) {
			this[i as 0 | 1] = Math.floor(Math.abs(this[i as 0 | 1] * a)) * Math.sign(this[i as 0 | 1]) / a;
		}

		this.#cb?.(this);
		return this;
	}

	public ceilToZero(a: number = 1): this {
		for(let i = 0; i < this.length; ++i) {
			this[i as 0 | 1] = Math.ceil(Math.abs(this[i as 0 | 1] * a)) * Math.sign(this[i as 0 | 1]) / a;
		}

		this.#cb?.(this);
		return this;
	}

	public isSame(v: Vector2_t): boolean {
		for(let i = 0; i < this.length; ++i) {
			if(this[i as 0 | 1] !== v[i as 0 | 1]) return false;
		}
		return true;
	}

	public isNaN(): boolean {
		for(let i = 0; i < this.length; ++i) {
			if(Number.isNaN(this[i as 0 | 1])) return false;
		}
		return true;
	}

	public isFinite(): boolean {
		for(let i = 0; i < this.length; ++i) {
			if(Number.isFinite(this[i as 0 | 1])) return false;
		}
		return true;
	}

	public rotate(a: number): this {
		const cos = Math.cos(a), sin = Math.sin(a);
		const x = this[0]*cos - this[1]*sin;
		this[1] = this[0]*sin + this[1]*cos;
		this[0] = x;

		this.#cb?.(this);
		return this;
	}

	public set angle(a: number) { this.rotate(a - this.angle); }
	public get angle(): number { return Math.atan2(this[1], this[0]); }
	public get module(): number { return Math.sqrt(this.moduleSq); }
	public set module(v: number) { this.normalize(v); }
	public get moduleSq(): number { return this[0]*this[0] + this[1]*this[1]; }

	public dot(v: Vector2_t): number { return this[0]*v[0] + this[1]*v[1]; }
	public cross(v: Vector2_t): number { return this[0]*v[1] - this[1]*v[0]; }

	public projectOnto(v: Vector2_t): this {
		const c: number = (this[0]*v[0] + this[1]*v[1]) / (v[0]*v[0] + v[1]*v[1]);
		this[0] = v[0]*c; this[1] = v[1]*c;

		this.#cb?.(this);
		return this;
	}

	public normalize(a: number = 1): number {
		if(this.isSame(Vector2.ZERO)) return 0;

		const module = this.module;
		const l: number = module/a;
		for(let i = 0; i < this.length; ++i) this[i as 0 | 1] /= l;

		this.#cb?.(this);
		return module;
	}

	public normal(dir: number = 1): this {
		const x = this[1] * (dir > 0 ? -1 : 1);
		this[1] = this[0] * (dir < 0 ? -1 : 1);
		this[0] = x;

		this.#cb?.(this);
		return this;
	}

	public transform(mat: mat): this;
	public transform(a: number, b: number, c: number, d: number, e?: number, f?: number): this;
	public transform(a: number | mat, b?: number, c?: number, d?: number, e?: number, f?: number): this {
		if(typeof a === 'object') {
			this[0] = this[0]*a.a + this[1]*a.b + (a.e || 0);
			this[1] = this[0]*a.c + this[1]*a.d + (a.f || 0);
		} else {
			this[0] = this[0]*a! + this[1]*b! + (e! || 0);
			this[1] = this[0]*c! + this[1]*d! + (f! || 0);
		}

		this.#cb?.(this);
		return this;
	}

	public getDistance(v: Vector2_t): number { return Math.sqrt((v[0]-this[0]) ** 2 + (v[1]-this[1]) ** 2); }
	public getAngleRelative(v: Vector2_t): number { return Math.atan2(v[1]-this[1], v[0]-this[0]); }

	public moveAngle(mv: number = 0, a: number = 0): this {
		this[0] += mv*Math.cos(a);
		this[1] += mv*Math.sin(a);

		this.#cb?.(this);
		return this;
	}

	public moveTo(v: Vector2_t, mv: number = 1, t: boolean = true): this {
		const a = this.getAngleRelative(v);
		const mvx = Math.cos(a)*mv, mvy = Math.sin(a)*mv;
		this[0] += (t ? (mvx > Math.abs(v[0]-this[0]) ? v[0]-this[0]: mvx): mvx);
		this[1] += (t ? (mvy > Math.abs(v[1]-this[1]) ? v[1]-this[1]: mvy): mvy);

		this.#cb?.(this);
		return this;
	}

	public moveTime(v: Vector2_t, tx: number = 1, ty = tx): this {
		this[0] += (v[0]-this[0]) / (tx!==0 ? ty:1);
		this[1] += (v[1]-this[1]) / (ty!==0 ? tx:1);

		this.#cb?.(this);
		return this;
	}

	public isDynamicRectIntersect(a: [Vector2_t, Vector2_t, Vector2_t, Vector2_t]) {
		let d = false;
		for(let c = a.length-1, n = 0; n < a.length; c = n++) {
			a[n][1] > this[1] != a[c][1] > this[1]
			&& this[0] < (a[c][0] - a[n][0]) * (this[1]-a[n][1]) / (a[c][1] - a[n][1]) + a[n][0]
			&& (d = !d);
		}
		return d;
	}

	public isStaticRectIntersect({ x, y, w, h }: { x: number, y: number, w: number, h: number }): boolean {
		return this.x > x && this.x < x+w && this.y > y && this.y < y+h;
	}


	public static from(v: { x: number, y: number } | Vector2_t, cb: cb | null = null): Vector2 {
		//@ts-ignore
		return new Vector2(v.x ?? v[0], v.y ?? v[1], cb);
	}

	public static zero() { return new Vector2(); }
	public static one() { return new Vector2(1, 1); }

	public static left() { return new Vector2(-1, 0); }
	public static right() { return new Vector2(1, 0); }
	public static up() { return new Vector2(0, -1); }
	public static down() { return new Vector2(0, 1); }

	public static readonly ZERO = Object.freeze(new Vector2()) as Vector2;
	public static readonly ONE = Object.freeze(new Vector2(1, 1)) as Vector2;

	public static readonly LEFT = Object.freeze(new Vector2(-1, 0)) as Vector2;
	public static readonly RIGHT = Object.freeze(new Vector2(1, 0)) as Vector2;
	public static readonly UP = Object.freeze(new Vector2(0, -1)) as Vector2;
	public static readonly DOWN = Object.freeze(new Vector2(0, 1)) as Vector2;

	public static isNaN(v: Vector2_t) { return Number.isNaN(v[0]) || Number.isNaN(v[1]); }
	public static isFinite(v: Vector2_t) { return Number.isFinite(v[0]) || Number.isFinite(v[1]); }

	public toString(fractionDigits: number = 2, min = true): string {
		return `${min ? '':'Vector2('}${this[0].toFixed(fractionDigits)}, ${this[1].toFixed(fractionDigits)}${min ? '' : ')'}`;
	}

	public *[Symbol.iterator](): Generator<number, void, void> {
		for(let i = 0; i < this.length; i++) yield this[i as 0 | 1];
	}

	public get [Symbol.toStringTag]() { return 'Vector2'; }
	public [Symbol.toPrimitive](): string { return this.toString(); }
}


export const vec2: {
	(): Vector2;
	(x: number, y: number): Vector2;
	(x: number, y: number, cb: cb | null): Vector2;
} = (...args: []): Vector2 => new Vector2(...args);


export class Vector2Cached extends Vector2 {
	private _a_angle: boolean = true;
	private _angle: number = super.angle;
	public override get angle() { return this._a_angle ? this._angle : this._angle = super.angle; }

	private _a_module: boolean = true;
	private _module: number = super.module;
	public override get module() { return this._a_module ? this._module : this._module = super.module; }

	constructor();
	constructor(x: number, y: number);
	constructor(x: number, y: number, cb: cb | null);
	constructor(x: number = 0, y: number = 0, cb: cb | null = null) {
		super(x, y, vec => {
			this._a_angle = this._a_module = false;
			return cb?.(vec);
		});
	}
}
