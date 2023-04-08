export const VectorN = 'Error';
/*
export class VectorN extends Array {
	constructor(...args) {
		super();
		let arr = VectorN.parseArgs(args);
		for(let i = 0; i < arr.length; i++) this[i] = arr[i];
	}
	get x()	 { return this[0]; }
	set x(v) { this[0] = v; }
	get y()  { return this[1]; }
	set y(v) { this[1] = v; }
	get z()  { return this[2]; }
	set z(v) { this[2] = v; }
	get w()  { return this[3]; }
	set w(v) { this[3] = v; }

	add(...vecs) { return VectorN.operation.call(this, (n, i) => this[i] += n||0, vecs); }
	sub(...vecs) { return VectorN.operation.call(this, (n, i) => this[i] -= n||0, vecs); }
	inc(...vecs) { return VectorN.operation.call(this, (n, i) => this[i] *= n||1, vecs); }
	div(...vecs) { return VectorN.operation.call(this, (n, i) => this[i] /= n||1, vecs); }
	mod(...vecs) { return VectorN.operation.call(this, (n, i) => this[i] %= n, vecs); }
	set(...vecs) { return VectorN.operation.call(this, (n, i) => this[i] = n, vecs); }
	abs() {
		for(let i = 0; i < this.length; i++) this[i] = Math.abs(this[i]);
		return this;
	}
	inverse(a = 1) {
		for(let i = 0; i < this.length; i++) this[i] = a/this[i];
		return this;
	}
	invert() {
		for(let i = 0; i < this.length; i++) this[i] = -this[i];
		return this;
	}
	floor(n = 1) {
		for(let i = 0; i < this.length; i++) this[i] = Math.floor(this[i]*n)/n;
		return this;
	}
	buf() { return new VectorN(this); }
	normalize(a = 1) {
		let l = this.module/a;
		for(let i = 0; i < this.length; i++) this[i] /= l;
		return this;
	}
	get moduleSq() {
		let x = 0;
		for(let i = 0; i < this.length; i++) x += this[i]**2;
		return x;
	}
	get module() { return Math.sqrt(this.moduleSq); }
	set module(v) { return this.normalize(v); }
	isSame(v) {
		if(this.length !== v.length) return false;
		for(let i = 0; i < this.length; i++) if(this[i] !== v[i]) return false;
		return true;
	}

	static parseArgs(args) {
		let arr = [];
		for(let i = 0; i < args.length; i++) {
			if(Array.isArray(args[i])) arr = arr.concat(args[i]);
			else arr.push(args[i]);
		};
		return arr;
	}
	static operation(operation, vecs) {
		let oneArg = vecs.length === 1 && typeof vecs[0] === 'number';
		let arr = oneArg ? vecs[0] : VectorN.parseArgs(vecs);
		for(let i = 0; i < this.length && (oneArg || i < arr.length); i++) arr[i] !== null && operation(oneArg ? arr : arr[i], i);
		return this;
	}
};
setToStringTeg(VectorN, 'VectorN');

export const vecN = (...args) => new VectorN(...args);
setHiddenProperty(VectorN.prototype, 'plus', VectorN.prototype.add);
setHiddenProperty(VectorN.prototype, 'minus', VectorN.prototype.sub);
*/
