export class AreaQPDB<T = number> {
	private _q!: T;
	private _p!: T;
	private _d!: T;
	private _b!: T;

	constructor(q: T, p: T, d: T, b: T) {
		this.q = q; this.p = p;
		this.d = d; this.b = b;
	}

	set q(v: T) { this._q = v; }
	get q(): T { return this._q; }
	set p(v: T) { this._p = v; }
	get p(): T { return this._p ?? this._q; }
	set d(v: T) { this._d = v; }
	get d(): T { return this._d ?? this._q; }
	set b(v: T) { this._b = v; }
	get b(): T { return this._b ?? this._d ?? this._p; }

	set x(v: T) { this.q = v; }
	get x(): T { return this.q; }
	set w(v: T) { this.p = v; }
	get w(): T { return this.p; }
	set y(v: T) { this.d = v; }
	get y(): T { return this.d; }
	set h(v: T) { this.b = v; }
	get h(): T { return this.b; }

	set x1(v: T) { this.q = v; }
	get x1(): T { return this.q; }
	set x2(v: T) { this.p = v; }
	get x2(): T { return this.p; }
	set y1(v: T) { this.d = v; }
	get y1(): T { return this.d; }
	set y2(v: T) { this.b = v; }
	get y2(): T { return this.b; }
}
