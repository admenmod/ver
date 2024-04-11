export type VectorN_t = VectorN | Array<number | null>;

export type Args = number | null | VectorN_t;

export class VectorN extends Array<number> {
	constructor(length: number) {
		super();
		for(let i = 0; i < length; i++) this[i] = 0;
	}
	public get x()	 { return this[0]; }
	public set x(v) { this[0] = v; }
	public get y()  { return this[1]; }
	public set y(v) { this[1] = v; }
	public get z()  { return this[2]; }
	public set z(v) { this[2] = v; }
	public get w()  { return this[3]; }
	public set w(v) { this[3] = v; }

	public new() { return new VectorN(this.length).set(this); }

	public add(...args: Args[]) { return VectorN.operation.call(this, (n, i) => this[i] += n ?? 0, args); }
	public sub(...args: Args[]) { return VectorN.operation.call(this, (n, i) => this[i] -= n ?? 0, args); }
	public inc(...args: Args[]) { return VectorN.operation.call(this, (n, i) => this[i] *= n || 1, args); }
	public div(...args: Args[]) { return VectorN.operation.call(this, (n, i) => this[i] /= n || 1, args); }
	public mod(...args: Args[]) { return VectorN.operation.call(this, (n, i) => this[i] %= n ?? this[i], args); }
	public set(...args: Args[]) { return VectorN.operation.call(this, (n, i) => this[i] = n ?? this[i], args); }
	public abs() {
		for(let i = 0; i < this.length; i++) this[i] = Math.abs(this[i]);
		return this;
	}
	public inverse(a = 1) {
		for(let i = 0; i < this.length; i++) this[i] = a/this[i];
		return this;
	}
	public invert() {
		for(let i = 0; i < this.length; i++) this[i] = -this[i];
		return this;
	}
	public floor(n = 1) {
		for(let i = 0; i < this.length; i++) this[i] = Math.floor(this[i]*n)/n;
		return this;
	}
	// public normalize(a = 1) {
	// 	let l = this.module/a;
	// 	for(let i = 0; i < this.length; i++) this[i] /= l;
	// 	return this;
	// }
	// public get moduleSq() {
	// 	let x = 0;
	// 	for(let i = 0; i < this.length; i++) x += this[i]**2;
	// 	return x;
	// }
	// public set module(v) { this.normalize(v); }
	// public get module() { return Math.sqrt(this.moduleSq); }

	public isSame(v: VectorN_t) {
		if(this.length !== v.length) return false;
		for(let i = 0; i < this.length; i++) if(this[i] !== v[i]) return false;
		return true;
	}

	public static operation(this: VectorN, operation: (n: number | null, i: number) => number, args: Args[]) {
		if(args.length === 1 && typeof args[0] === 'number') {
			const n = args[0];
			for(let i = 0; i < this.length; i++) operation(n, i);
		} else {
			const arr = args.flat();
			for(let i = 0; i < this.length && i < arr.length; i++) arr[i] !== null && operation(arr[i], i);
		}

		return this;
	}
};

export const vecN = (length: number) => new VectorN(length);
