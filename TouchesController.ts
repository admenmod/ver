import { Vector2 } from './Vector2';


export class TouchesController {
	public active: number[] = [];
	public touches: Touch[] = [];

	constructor(el: HTMLElement, filter = (e: TouchEvent) => true) {
		el.addEventListener('touchstart', e => {
			if(!filter(e)) return;

			if(e.touches.length > this.touches.length) this.touches.push(new Touch(this.touches.length));

			for(let i = 0; i < e.touches.length; i++) {
				let id = e.touches[i].identifier;
				if(this.active.includes(id)) continue;

				let tTouch = this.touches[id];
				let eTouch = e.touches[i];

				tTouch.down = true;

				tTouch.fD = true;
				tTouch.fP = true;

				tTouch.bx = tTouch.x = eTouch.clientX;
				tTouch.by = tTouch.y = eTouch.clientY;

				this.active.push(id);
			};
		}, { passive: true });

		el.addEventListener('touchend', e => {
			if(!filter(e)) return;

			for(let k = 0; k < this.active.length; k++) {
				let c = false;
				for(let i = 0; i < e.touches.length; i++) {
					if(this.active[k] === e.touches[i].identifier) c = true;
				};
				if(c) continue;

				let tTouch = this.touches[this.active[k]];

				tTouch.fU = true;
				tTouch.fD = false;

				tTouch.down = false;
				tTouch.downTime = 0;

				this.active.splice(k, 1);
			};
		}, { passive: true });

		el.addEventListener('touchmove', e => {
			if(!filter(e)) return;

			for(let i = 0; i < e.touches.length; i++) {
				let id = e.touches[i].identifier;
				let tTouch = this.touches[id];
				let eTouch = e.touches[i];

				if(tTouch && tTouch.x !== eTouch.clientX && tTouch.y !== eTouch.clientY) {
					tTouch.x = eTouch.clientX;
					tTouch.y = eTouch.clientY;

					tTouch.fM = true;
					tTouch.down = false;
					tTouch.downTime = 0;

					tTouch.sx = tTouch.x-tTouch.px;
					tTouch.sy = tTouch.y-tTouch.py;
					tTouch.px = tTouch.x;
					tTouch.py = tTouch.y;
				};
			};
		}, { passive: true });
	}

	isDown() { return this.touches.some(i => i.isDown()); }
	isPress() { return this.touches.some(i => i.isPress()); }
	isUp() { return this.touches.some(i => i.isUp()); }
	isMove() { return this.touches.some(i => i.isMove()); }
	isTimeDown(time: number) { return this.touches.some(i => i.isTimeDown(time)); }

	findTouch(cb = (touch: Touch) => true) { return this.touches.find(t => t.isPress() && cb(t)) || null; }
	isStaticRectIntersect(a: Parameters<typeof Touch.prototype.isStaticRectIntersect>[0]) {
		return this.touches.some(i => i.isStaticRectIntersect(a));
	}
	nullify() { for(let i = 0; i < this.touches.length; i++) this.touches[i].nullify(); }
}


export class Touch extends Vector2 {
	public id: number;

	public sx = 0;
	public sy = 0; // speed
	public px = 0;
	public py = 0; // fixPrevPosition
	public bx = 0;
	public by = 0; // fixStartPosition

	public fD: boolean = false;
	public fP: boolean = false;
	public fU: boolean = false;
	public fM: boolean = false;
	public fC: boolean = false;
	public fdbC: boolean = false;

	public downTime: number = 0;
	public down: boolean = false;

	constructor(id: number) {
		super();

		this.id = id;
	}

	public get speed() { return Math.sqrt(this.sx**2 + this.sy**2); }
	public get dx() { return this.x-this.bx; }
	public get dy() { return this.y-this.by; }
	public get beeline() { return Math.sqrt(this.dx**2 + this.dy**2); }

	public isDown() { return this.fD; }
	public isPress() { return this.fP; }
	public isUp() { return this.fU; }
	public isMove() { return this.fM; }

	public isTimeDown(time: number = 300) {
		if(this.down && this.downTime >= time) {
			this.down = false;
			this.downTime = 0;
			return true;
		};
		return false;
	}

	public nullify(dt: number = 10) {
		this.fP = this.fU = this.fC = this.fM = this.fdbC = false;
		if(this.down) this.downTime += dt;
	}
}
