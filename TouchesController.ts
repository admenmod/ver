import { Vector2 } from './Vector2';
import { Event, EventDispatcher } from './events';


export class TouchesController extends EventDispatcher {
	public active: number[] = [];
	public touches: Touch[] = [];

	public '@touchstart' = new Event<TouchesController, [touches: TouchesController, e: TouchEvent]>(this);
	public '@touchend' = new Event<TouchesController, [touches: TouchesController, e: TouchEvent]>(this);
	public '@touchmove' = new Event<TouchesController, [touches: TouchesController, e: TouchEvent]>(this);


	constructor(el: HTMLElement, filter = (e: TouchEvent) => true) {
		super();

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

				tTouch.b.x = tTouch.x = eTouch.clientX;
				tTouch.b.y = tTouch.y = eTouch.clientY;

				tTouch.isActive = true;
				this.active.push(id);

				tTouch['@start'].emit(tTouch, eTouch);
			}

			this['@touchstart'].emit(this, e);
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

				tTouch.isActive = false;
				this.active.splice(k, 1);

				tTouch['@end'].emit(tTouch);
			}

			this['@touchend'].emit(this, e);
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

					tTouch.s.x = tTouch.x-tTouch.p.x;
					tTouch.s.y = tTouch.y-tTouch.p.y;
					tTouch.p.x = tTouch.x;
					tTouch.p.y = tTouch.y;

					tTouch['@move'].emit(tTouch, eTouch);
				}
			}

			this['@touchmove'].emit(this, e);
		}, { passive: true });
	}

	public isDown() { return this.touches.some(i => i.isDown()); }
	public isPress() { return this.touches.some(i => i.isPress()); }
	public isUp() { return this.touches.some(i => i.isUp()); }
	public isMove() { return this.touches.some(i => i.isMove()); }
	public isTimeDown(time: number) { return this.touches.some(i => i.isTimeDown(time)); }

	public findTouch(cb = (touch: Touch) => true) { return this.touches.find(t => t.isPress() && cb(t)) || null; }
	public nullify(dt: number) { for(let i = 0; i < this.touches.length; i++) this.touches[i].nullify(dt); }


	public destroy() {
		for(let i = 0; i < this.touches.length; i++) this.touches[i].destroy();
		this.events_off(true);
	}
}


export class Touch extends EventDispatcher {
	public id: number;
	public isActive: boolean = false;

	public '@start' = new Event<Touch, [touch: Touch, eTouch: globalThis.Touch]>(this);
	public '@end' = new Event<Touch, [touch: Touch]>(this);
	public '@move' = new Event<Touch, [touch: Touch, eTouch: globalThis.Touch]>(this);

	public pos = new Vector2();
	public get x() { return this.pos.x; }
	public set x(v) { this.pos.x = v; }
	public get y() { return this.pos.y; }
	public set y(v) { this.pos.y = v; }
	public get 0() { return this.pos.x; }
	public set 0(v) { this.pos.x = v; }
	public get 1() { return this.pos.y; }
	public set 1(v) { this.pos.y = v; }

	/** speed */
	public s = new Vector2();
	/** fix prev position */
	public p = new Vector2();
	/** fix start position */
	public b = new Vector2();

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

	public get speed() { return this.s.module; }
	public get d() { return this.pos.buf().sub(this.b); }
	public get dx() { return this.pos.x-this.b.x; }
	public get dy() { return this.pos.y-this.b.y; }
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
		}
		return false;
	}

	public nullify(dt: number) {
		this.fP = this.fU = this.fC = this.fM = this.fdbC = false;
		if(this.down) this.downTime += dt;
	}


	public destroy() {
		this.events_off(true);
	}
}
