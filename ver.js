globalThis.Ver = globalThis.ver = {};

(function(ver) {
	'use strict';
	
	// helpers
	let u = a => a !== undefined;
	let setConstantProperty = (o, p, v) => Object.defineProperty(o, p, { value: v, enumerable: true });
	let setHiddenProperty = (o, p, v) => Object.defineProperty(o, p, { value: v, writable: true, configurable: true });
	let setToStringTeg = (o, v) => Object.defineProperty(o, Symbol.toStringTag, { value: v, configurable: true });
	let setGetter = (o, p, getter) => Object.defineProperty(o, p, { get: getter, enumerable: true, configurable: true });
	let injectingEventEmitterMethods = o => {
		for(let i of ['on', 'once', 'off', 'emit']) o[i] = EventEmitter.prototype[i];
	};
	
	
	let random = (a, b) =>  Math.floor(Math.random()*(1+b-a)+a);
	let JSONcopy = data => JSON.parse(JSON.stringify(data));
	
	
	let createPrivileges = (privileges = {}) => {
		let register = {
			present: {},
			default: privileges
		};
		
		for(let i in register.default) register.present[i] = register.default[i];
		
		register.addPrivilege = (cb, privileges = {}) => function() {
			for(let i in privileges) i in register.present && (register.present[i] = privileges[i]);
			cb.apply(this, arguments);
			for(let i in privileges) i in register.present && (register.present[i] = register.default[i]);
		};
		
		return register;
	};
	
	
	let generateImage = (w, h, cb) => new Promise((res, rej) => {
		let cvs = generateImage.canvas || (generateImage.canvas = document.createElement('canvas'));
		let ctx = cvs.getContext('2d');
		cvs.width = w; cvs.height = h;
		
		cb(ctx, vec2(w, h));
		
		let img = new Image(w, h);
		img.src = cvs.toDataURL();
		img.onload = e => res(img);
		img.onerror = e => rej(e);
	});
	
	let loadImage = (src, w, h) => new Promise((res, rej) => {
		let el = new Image(w, h);
		el.src = src;
		el.onload = e => res(el);
		el.onerror = e => rej(e);
	});
	
	let loadScript = (src, p = {}) => new Promise((res, rej) => {
		let parent = p.parent || document.querySelector('head');
		
		let script = document.createElement('script');
		script.type = 'text/javascript';
		script.async = p.async||false;
		script.src = src
		
		parent.append(script);
		
		script.onload = e => res(e);
		script.onerror = e => rej(e);
	});
	
	let loader = { loadImage, loadScript, cache: new WeakMap() };
	
	
	class EventEmitter {
		constructor() {
			Object.defineProperty(this, '_events', { value: {} });
		}
		
		once(type, handler) { return this.on(type, handler, 1); }
		on(type, handler, once = 0) {
			if(typeof handler !== 'function') return Error('Invalid argument "handler"');
			
			if(!this._events[type]) {
				this._events[type] = [];
				Object.defineProperty(this._events[type], 'store', { value: {} });
				Object.defineProperty(this._events[type], 'once', { value: [] });
				
				let store = this._events[type].store;
				store.type = type;
				store.self = store.emitter = this;
			};
			
			this._events[type].push(handler);
			this._events[type].once.push(once);
			
			return this;
		}
		
		off(type, handler) {
			if(!type) for(let i in this._events) delete this._events[i];
			if(!this._events[type]) return this;
			if(!handler) delete this._events[type];
			else {
				let l = this._events[type].indexOf(handler);
				if(~l) {
					this._events[type].splice(l, 1);
					this._events[type].once.splice(l, 1);
				};
			};
			return this;
		}
		
		emit(type, ...args) {
			if(!this._events[type]) return false;
			
			for(let i = 0; i < this._events[type].length; i++) {
				this._events[type][i].apply(this._events[type].store, args);
				
				if(this._events[type].once[i]) {
					this._events[type].splice(i, 1);
					this._events[type].once.splice(i, 1);
				};
			};
			return true;
		}
	};
	setToStringTeg(EventEmitter, 'EventEmitter');
	EventEmitter.prototype.remove = EventEmitter.prototype.off;
	
	
	class Scene {
		constructor(scene, name) {
			this.name = name;
			this._scene = scene;
			this.proms = [];
			
			this.isInitialized = this.isLoaded = this.isActived = false;
			
			this._api = new EventEmitter();
			this._api.preload = (...proms) => this.proms = this.proms.concat(proms);
			
			this._api.init = this._api.load = this._api.exit = this._api.update = null;
			
			setGetter(this._api, 'name', () => this.name);
			setGetter(this._api, 'isLoaded', () => this.isLoaded);
			setGetter(this._api, 'isActived', () => this.isActived);
		}
		
		run() {
			if(!this.isInitialized) {
				this.isInitialized = true;
				this._scene.call(this._api, this._api);
			};
			
			this.init();
		}
		
		load() {
			return Promise.all(this.proms).then(() => {
				if(this.isLoaded) return;
				
				this._api.load?.();
				this._api.emit('load');
				this.isLoaded = true;
			});
		}
		
		init() {
			if(this.isActived) return;
			
			this.load().then(() => {
				this._activateScene();
				this.isActived = true;
				this._api.init?.();
				this._api.emit('init');
			});
		}
		exit() {
			if(!this.isActived) return;
			this.isActived = false;
			
			this._deactivateScene();
			this._api.exit?.();
			this._api.emit('exit');
		}
		
		update(dt) {
			this._api.update?.(dt);
			this._api.emit('update', dt);
		}
		
		remove() {
			this.exit();
			this._api.off();
			delete Scene.scenes[this.name];
		}
		
		_activateScene() { Scene.active_scenes.push(this); }
		_deactivateScene() {
			let l = Scene.active_scenes.indexOf(this);
			if(~l) Scene.active_scenes.splice(l, 1);
		}
		
		static scenes = {};
		static active_scenes = [];
		
		static update(dt) {
			for(let i = 0; i < this.active_scenes.length; i++) {
				this.active_scenes[i].update(dt);
			};
		}
		
		static create(name, constructor) { return this.scenes[name] = new Scene(constructor, name); }
		static remove(name) { return this.scenes[name].remove(); }
		
		static get(name) { return this.scenes[name]; }
		static run(name) { return this.scenes[name].run(); }
		static exit(name) { return this.scenes[name].exit(); }
	};
	setToStringTeg(Scene, 'Scene');
	
	
	class Child extends EventEmitter {
		constructor() {
			super();
			this._parent = null;
			this._children = [];
		}
		
		getParent() { return this._parent; }
		getChildren() { return [...this._children]; };
		getRootNode() {
			let arr = this.getChainParent();
			return arr[arr.length-1] || this;
		}
		
		getChainParent() {
			let arr = [];
			let pr = this._parent;
			for(let i = 0; pr && i < Child.MAX_CHILDREN; i++) {
				arr.push(pr);
				pr = pr._parent;
			};
			return arr;
		}
		
		appendChild(node) {
			if(node._parent !== null) return Error('This node already has a parent');
			if(this._children.includes(node)) console.warn('This node already is child');
			
			let root = this.getRootNode();
			if(root === node) console.warn('This node is root node of current tree');
			
			node._parent = this;
			this._children.push(node);
			
			node.emit('append_node', node, this, root);
			node.emit('append_node:node', node, this, root);
			
			this.emit('append_node', node, this, root);
			this.emit('append_node:this', node, this, root);
			
			root.emit('append_node', node, this, root);
			root.emit('append_node:root', node, this, root);
			
			return node;
		}
		
		removeChild(node) {
			let root = this.getRootNode();
			
			let l = this._children.indexOf(node);
			if(!~l) return Error('This node is not child of current node');
			this._children.splice(l, 1)[0]._parent = null;
			
			node.emit('remove_node', node, this, root);
			node.emit('remove_node:node', node, this, root);
			
			this.emit('remove_node', node, this, root);
			this.emit('remove_node:this', node, this, root);
			
			root.emit('remove_node', node, this, root);
			root.emit('remove_node:root', node, this, root);
			
			return node;
		}
		
		static MAX_CHILDREN = 100;
	};
	setToStringTeg(Child, 'Child');
	
	
	class VectorN extends Array {
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
		floor(i = 1) {
			for(let i = 0; i < this.length; i++) this[i] = Math.floor(this[i]*i)/i;
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
	
	let vecN = (...args) => new VectorN(...args);
	setHiddenProperty(VectorN.prototype, 'plus', VectorN.prototype.add);
	setHiddenProperty(VectorN.prototype, 'minus', VectorN.prototype.sub);
	
	
	class Vector2 {
		constructor(x = 0, y = 0) {
			this.x = this.y = 0;
			this.set(x, y);
		}
		add(x, y) {
			if(u(x.x) && u(x.y)) { this.x += x.x; this.y += x.y; }
			else if(u(x[0]) && u(x[1])) { this.x += x[0]; this.y += x[1]; }
			else { this.x += x||0; this.y += u(y) ? y : x||0; };
			return this;
		}
		sub(x, y) {
			if(u(x.x) && u(x.y)) { this.x -= x.x; this.y -= x.y; }
			else if(u(x[0]) && u(x[1])) { this.x -= x[0]; this.y -= x[1]; }
			else { this.x -= x||0; this.y -= u(y) ? y : x||0; };
			return this;
		}
		inc(x, y) {
			if(u(x.x) && u(x.y)) { this.x *= x.x; this.y *= x.y; }
			else if(u(x[0]) && u(x[1])) { this.x *= x[0]; this.y *= x[1]; }
			else { this.x *= x||0; this.y *= u(y) ? y : x||0; };
			return this;
		}
		div(x, y) {
			if(u(x.x) && u(x.y)) { this.x /= x.x; this.y /= x.y; }
			else if(u(x[0]) && u(x[1])) { this.x /= x[0]; this.y /= x[1]; }
			else { this.x /= x||0; this.y /= u(y) ? y : x||0; };
			return this;
		}
		pow(x, y) {
			if(u(x.x) && u(x.y)) { this.x **= x.x; this.y **= x.y; }
			else if(u(x[0]) && u(x[1])) { this.x **= x[0]; this.y **= x[1]; }
			else { this.x **= x||0; this.y **= u(y) ? y : x||0; };
			return this;
		}
		mod(x, y) {
			if(u(x.x) && u(x.y)) { this.x %= x.x; this.y %= x.y; }
			else if(u(x[0]) && u(x[1])) { this.x %= x[0]; this.y %= x[1]; }
			else { this.x %= x||0; this.y %= u(y) ? y : x||0; };
			return this;
		}
		abs() {
			this.x = Math.abs(this.x); this.y = Math.abs(this.y);
			return this;
		}
		invert() {
			this.x = -this.x; this.y = -this.y;
			return this;
		}
		inverse(a = 1) {
			this.x = a/this.x; this.y = a/this.y;
		}
		floor(i = 1) {
			this.x = Math.floor(this.x*i)/i; this.y = Math.floor(this.y*i)/i;
			return this;
		}
		set(x, y) {
			if(u(x.x) && u(x.y)) { this.x = x.x; this.y = x.y; }
			else if(u(x[0]) && u(x[1])) { this.x = x[0]; this.y = x[1]; }
			else { this.x = x||0; this.y = u(y) ? y : x||0; };
			return this;
		}
		buf(x, y) { return new Vector2(u(x) || this.x, u(y) || this.y); }
		getDistance(v) { return Math.sqrt((v.x-this.x) ** 2 + (v.y-this.y) ** 2); }
		
		moveAngle(mv = 0, a = 0) {
			this.x += mv*Math.cos(a);
			this.y += mv*Math.sin(a);
			return this;
		}
		moveTo(v, mv = 1, t = true) {
			let a = this.getAngleRelative(v);
			let mvx = Math.cos(a)*mv, mvy = Math.sin(a)*mv;
			this.x += (t ? (mvx > Math.abs(v.x-this.x) ? v.x-this.x: mvx): mvx);
			this.y += (t ? (mvy > Math.abs(v.y-this.y) ? v.y-this.y: mvy): mvy);
			return this;
		}
		moveTime(v, t = 1) {
			this.x += (v.x-this.x) / (t!==0 ? t:1);
			this.y += (v.y-this.y) / (t!==0 ? t:1);
			return this;
		}
		isSame(v) { return this.x === v.x && this.y === v.y; }
		
		isDynamicRectIntersect(a) {
			let d = 0;
			for(let c = a.length-1, n = 0; n < a.length; c = n++) {
				a[n].y > this.y != a[c].y > this.y
				&& this.x < (a[c].x - a[n].x) * (this.y-a[n].y) / (a[c].y - a[n].y) + a[n].x
				&& (d = !d);
			};
			return d;
		}
		isStaticRectIntersect({x, y, w, h}) { return this.x > x && this.x < x+w && this.y > y && this.y < y+h; }
		
		getAngleRelative(v = Vector2.ZERO) { return Math.atan2(v.y-this.y, v.x-this.x); }
		set angle(a) {
			let cos = Math.cos(a), sin = Math.sin(a);
			let x = this.x*cos - this.y*sin;
			this.y = this.x*sin + this.y*cos;
			this.x = x;
		}
		get angle() { return Math.atan2(this.y, this.x); }
		get module() { return Math.sqrt(this.moduleSq); }
		get moduleSq() { return this.x*this.x + this.y*this.y; }
		
		dot(v) { return this.x*v.x + this.y*v.y; }
		cross(v) { return this.x*v.y - this.y*v.x; }
		projectOnto(v) {
			let c = (this.x*v.x + this.y*v.y) / (v.x*v.x + v.y*v.y);
			this.x = v.x*c; this.y = v.y*c;
			return this;
		}
		normalize(a = 1) {
			let l = this.module/a;
			this.x /= l; this.y /= l;
			return this;
		}
		
		toString() { return `Vector2(${this.x}, ${this.y})`; }
		[Symbol.toPrimitive](type) { return type === 'string' ? `Vector2(${this.x}, ${this.y})` : true; }
	};
	setToStringTeg(Vector2, 'Vector2');
	setConstantProperty(Vector2, 'ZERO', Object.freeze(new Vector2()));
	
	let vec2 = (x, y) => new Vector2(x, y);
	setHiddenProperty(Vector2.prototype, 'plus', Vector2.prototype.add);
	setHiddenProperty(Vector2.prototype, 'minus', Vector2.prototype.sub);
	//======================================================================//
	
	class CameraImitationCanvas {
		constructor(ctx) {
			this.ctx = ctx;
			this.camera = new Vector2();
		}
		get canvas() { return this.ctx.canvas; }
		get globalAlpha() { return this.ctx.globalAlpha; }
		set globalAlpha(v) { this.ctx.globalAlpha = v; }
		get globalCompositeOperation() { return this.ctx.globalCompositeOperation; }
		set globalCompositeOperation(v) { this.ctx.globalCompositeOperation = v; }
		get filter() { return this.ctx.filter; }
		set filter(v) { this.ctx.filter = v; }
		get imageSmoothingEnabled() { return this.ctx.imageSmoothingEnabled; }
		set imageSmoothingEnabled(v) { this.ctx.imageSmoothingEnabled = v; }
		get imageSmoothingQuality() { return this.ctx.imageSmoothingQuality; }
		set imageSmoothingQuality(v) { this.ctx.imageSmoothingQuality = v; }
		get strokeStyle() { return this.ctx.strokeStyle; }
		set strokeStyle(v) { this.ctx.strokeStyle = v; }
		get fillStyle() { return this.ctx.fillStyle; }
		set fillStyle(v) { this.ctx.fillStyle = v; }
		get shadowOffsetX() { return this.ctx.shadowOffsetX; }
		set shadowOffsetX(v) { this.ctx.shadowOffsetX = v; }
		get shadowOffsetY() { return this.ctx.shadowOffsetY; }
		set shadowOffsetY(v) { this.ctx.shadowOffsetY = v; }
		get shadowBlur() { return this.ctx.shadowBlur; }
		set shadowBlur(v) { this.ctx.shadowBlur = v; }
		get shadowColor() { return this.ctx.shadowColor; }
		set shadowColor(v) { this.ctx.shadowColor = v; }
		get lineWidth() { return this.ctx.lineWidth; }
		set lineWidth(v) { this.ctx.lineWidth = v; }
		get lineCap() { return this.ctx.lineCap; }
		set lineCap(v) { this.ctx.lineCap = v; }
		get lineJoin() { return this.ctx.lineJoin; }
		set lineJoin(v) { this.ctx.lineJoin = v; }
		get miterLimit() { return this.ctx.miterLimit; }
		set miterLimit(v) { this.ctx.miterLimit = v; }
		get lineDashOffset() { return this.ctx.lineDashOffset; }
		set lineDashOffset(v) { this.ctx.lineDashOffset = v; }
		get font() { return this.ctx.font; }
		set font(v) { this.ctx.font = v; }
		get textAlign() { return this.ctx.textAlign; }
		set textAlign(v) { this.ctx.textAlign = v; }
		get textBaseline() { return this.ctx.textBaseline; }
		set textBaseline(v) { this.ctx.textBaseline = v; }
		get direction() { return ctx.direction; }
		set direction(v) { ctx.direction = v; }
		save() { return this.ctx.save(); }
		restore() { return this.ctx.restore(); }
		scale(x, y) { return this.ctx.scale(x, y); }
		rotate(a) { return this.ctx.rotate(a); }
		translate(x, y) { return this.ctx.translate(x-this.camera.x, y-this.camera.y); }
		translateInv(x, y) { return this.ctx.translate(-(x-this.camera.x), -(y-this.camera.y)); }
		rotateOffset(a, v = Vector2.ZERO) {
			this.translate(v.x, v.y);
			this.rotate(a);
			this.translateInv(v.x, v.y);
		}
		transform(...args) { return this.ctx.transform(...args); }
		setTransform(...args) { return this.ctx.setTransform(...args); }
		getTransform() { return this.ctx.getTransform(); }
		resetTransform() { return this.ctx.resetTransform(); }
		createLinearGradient(x0, y0, x1, y1) { return this.ctx.createLinearGradient(x0-this.camera.x, y0-this.camera.y, x1-this.camera.x, y1-this.camera.y); }
		createRadialGradient(x0, y0, r0, x1, y1, r1) { return this.ctx.createRadialGradient(x0-this.camera.x, y0-this.camera.y, r0, x1-this.camera.x, y1-this.camera.y, r1); }
		createPattern(...args) { return this.ctx.createPattern(...args); }
		clearRect(x, y, w, h) { return this.ctx.clearRect(x-this.camera.x, y-this.camera.y, w, h); }
		fillRect(x, y, w, h) { return this.ctx.fillRect(x-this.camera.x, y-this.camera.y, w, h); }
		strokeRect(x, y, w, h) { return this.ctx.strokeRect(x-this.camera.x, y-this.camera.y, w, h); }
		beginPath() { return this.ctx.beginPath(); }
		fill(...args) { return this.ctx.fill(...args); }
		stroke(...args) { return this.ctx.stroke(...args); }
		clip(...args) { return this.ctx.clip(...args); }
		drawFocusIfNeeded(...args) { return this.ctx.drawFocusIfNeeded(...args); }
		isPointInPath(...args) { return this.ctx.isPointInPath(...args); }
		isPointInStroke(...args) { return this.ctx.isPointInStroke(...args); }
		fillText(text, x, y, w) { return this.ctx.fillText(text, x-this.camera.x, y-this.camera.y, w); } ////
		strokeText(text, x, y, w) { return this.ctx.strokeText(text, x-this.camera.x, y-this.camera.y, w); } ////
		measureText(v) { return this.ctx.measureText(v); }
		drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) {
			if (dx !== undefined) return this.ctx.drawImage(img, sx, sy, sw, sh, dx-this.camera.x, dy-this.camera.y, dw, dh);
			else return this.ctx.drawImage(img, sx-this.camera.x, sy-this.camera.y, sw, sh);
		}
		getImageData(x, y, w, h) { return this.ctx.getImageData(x-this.camera.x, y-this.camera.y, w, h); }
		putImageData(img, x, y) { return this.ctx.putImageData(img, x-this.camera.x, y-this.camera.y); }
		createImageData(...args) { return this.ctx.createImageData(...args); }
		getContextAttributes() { return this.ctx.getContextAttributes(); }
		setLineDash(v) { return this.ctx.setLineDash(v); }
		getLineDash() { return this.ctx.getLineDash(); }
		closePath() { return this.ctx.closePath(); }
		moveTo(x, y) { return this.ctx.moveTo(x-this.camera.x, y-this.camera.y); }
		lineTo(x, y) { return this.ctx.lineTo(x-this.camera.x, y-this.camera.y); }
		quadraticCurveTo(x1, y1, x, y) { return this.ctx.quadraticCurveTo(x1-this.camera.x, y1-this.camera.y, x-this.camera.x, y-this.camera.y); }
		bezierCurveTo(x1, y1, x2, y2, x, y) { return this.ctx.bezierCurveTo(x1-this.camera.x, y1-this.camera.y, x2-this.camera.x, y2-this.camera.y, x-this.camera.x, y-this.camera.y); }
		arcTo(x1, y1, x2, y2, r) { return this.ctx.arcTo(x1-this.camera.x, y1-this.camera.y, x2-this.camera.x, y2-this.camera.y, r); }
		rect(x, y, w, h) { return this.ctx.rect(x-this.camera.x, y-this.camera.y, w, h); }
		arc(x, y, r, n, m, t) { return this.ctx.arc(x-this.camera.x, y-this.camera.y, r, n, m, t); }
		ellipse(x, y, w, h, n, m, t) { return this.ctx.ellipse(x-this.camera.x, y - this.camera.y, w, h, n, m, t); }
	};
	setToStringTeg(CameraImitationCanvas, 'CameraImitationCanvas');
	
	
	class CanvasLayer extends HTMLElement {
		constructor() {
			super();
			Object.defineProperty(this, '_events', { value: {} });
			
			let root = this.attachShadow({ mode: 'open' });
			let layers = this.getAttribute('layers')?.split(/\s+/).reverse()||['back', 'main'];
			
			this._pixelScale = +this.getAttribute('pixel-scale') || 1;
			
			let box = this.getBoundingClientRect();
			this._width = box.width;
			this._height = box.height;
			
			this.canvas = {};
			this.context = {};
			this.cameraImitationCanvas = {};
			
			this.style.display = 'grid';
			this.style.alignItems = 'center';
			this.style.justifyItems = 'center';
			
			let tmp = document.createElement('template');
			let el = '';
			
			for(let i of layers) el += `<canvas style="width:100%; height:100%; grid-area:1/1/1/1;" id="${i}"></canvas>`;
			el += `<div class="slot" style="z-index: 10; width:100%; height:100%; overflow: auto; grid-area:1/1/1/1; align-self:${this.getAttribute('align-slot')||'center'}; justify-self:${this.getAttribute('justify-slot')||'center'};"><slot></slot></div>`;
			
			tmp.innerHTML += el;
			root.append(tmp.content.cloneNode(true));
			
			for(let i of layers) {
				this.canvas[i] = root.getElementById(i);
				this.context[i] = this.canvas[i].getContext('2d');
				this.cameraImitationCanvas[i] = new CameraImitationCanvas(this.context[i]);
			};
			
			this.slotElement = root.querySelector('.slot');
			
			this._sizeUpdate();
			window.addEventListener('resize', e => {
				this._sizeUpdate();
				this.emit('resize', e);
			});
		}
		
		set pixelScale(v) {
			this._pixelScale = v;
			this._update();
		}
		get pixelScale() { return this._pixelScale; }
		
		set width(v) {
			this._width = v*this._pixelScale;
			for(let i in this.canvas) this.canvas[i].width = this._width;
		}
		get width() { return this._width; }
		
		set height(v) {
			this._height = v*this._pixelScale;
			for(let i in this.canvas) this.canvas[i].height = this._height;
		}
		get height() { return this._height; }
		
		get vw() { return this._width/100; }
		get vh() { return this._height/100; }
		get vwh() { return this._width/this._height; }
		get vhw() { return this._height/this._width; }
		get vmax() { return Math.max(this._width, this._height) / 100; }
		get vmin() { return Math.min(this._width, this._height) / 100; }
		get size() { return new Vector2(this._width, this._height); }
		
		_sizeUpdate() {
			let b = this.getBoundingClientRect();
			this._width = b.width*this._pixelScale;
			this._height = b.height*this._pixelScale;
			
			for(let i in this.canvas) {
				this.canvas[i].width = this._width;
				this.canvas[i].height = this._height;
			};
		}
	};
	setToStringTeg(CanvasLayer, 'CanvasLayer');
	
	injectingEventEmitterMethods(CanvasLayer.prototype);
	
	customElements.define('canvas-layer', CanvasLayer);
	//======================================================================//
	
	
	Object.assign(ver, {
		version: '1.2.2',
		
		createPrivileges, random, JSONcopy,
		loader, loadImage, loadScript, generateImage,
		EventEmitter, Scene, Child,
		Vector2, vec2, VectorN, vecN,
		CameraImitationCanvas, CanvasLayer
	});
})(globalThis.ver);


(function(ver) {
	function codeShell(code = '', useAPI = {}, p = {}) {
		let API = useAPI;
		if(p.insulatedShell ?? true) {
			API = new Proxy(useAPI, {
				has: () => true,
				get: (target, key, receiver) => key === Symbol.unscopables ? undefined : Reflect.get(target, key, receiver)
			});
		};
		
		if(typeof code !== 'string') code = code.toString().replace(/^function.+?\{(.*)\}$/s, '$1');
		return function() { eval(`with(API) {${code}}; //# sourceURL=${p.source || 'code'}`); };
	};
	
	ver.codeShell = codeShell;
})(globalThis.ver);
