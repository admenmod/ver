import { Vector2 } from './Vector2.js';
import { Event, EventDispatcher } from './events.js';

export const config = {
	DOWN_TIME: 300,
	CLICK_TIME: 300,
	CLICK_GAP: 300
};

export class TouchesController extends EventDispatcher {
	public active: number[] = [];
	public touches: Touch[] = [];

	public '@touchstart' = new Event<TouchesController, [
		touch: Touch, e_touch: globalThis.Touch, touches: TouchesController, e: TouchEvent]>(this);
	public '@touchend' = new Event<TouchesController, [
		touch: Touch, touches: TouchesController, e: TouchEvent]>(this);
	public '@touchmove' = new Event<TouchesController, [
		touch: Touch, e_touch: globalThis.Touch, touches: TouchesController, e: TouchEvent]>(this);

	public '@touchclick' = new Event<TouchesController, [
		touch: Touch, touches: TouchesController, e: TouchEvent]>(this);
	public '@touchdblclick' = new Event<TouchesController, [
		touch: Touch, touches: TouchesController, e: TouchEvent]>(this);

	constructor(el: HTMLElement, filter = (e: TouchEvent) => true) {
		super();

		const box = el.getBoundingClientRect();

		el.addEventListener('touchstart', e => {
			if(!filter(e)) return;

			if(e.touches.length > this.touches.length) this.touches.push(new Touch(this.touches.length));

			for(let i = 0; i < e.touches.length; i++) {
				let id = e.touches[i].identifier;
				if(this.active.includes(id)) continue;

				let tTouch = this.touches[id];
				let eTouch = e.touches[i];

				tTouch.up = false;
				tTouch.down = true;

				tTouch.downTime = 0;

				tTouch.moved = false;

				tTouch.fD = true;
				tTouch.fP = true;

				tTouch.b.x = tTouch.x = eTouch.pageX - box.left;
				tTouch.b.y = tTouch.y = eTouch.pageY - box.top;

				tTouch.isActive = true;
				this.active.push(id);

				tTouch['@start'].emit(tTouch, eTouch, this, e);

				this['@touchstart'].emit(tTouch, eTouch, this, e);
			}
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

				tTouch.up = true;
				tTouch.down = false;

				tTouch.upTime = 0;

				if(!tTouch.moved) tTouch.fC = true;

				tTouch.isActive = false;
				this.active.splice(k, 1);

				if(tTouch.fC && tTouch.downTime <= config.CLICK_TIME && tTouch.upTime <= config.CLICK_GAP) {
					tTouch.clickCount++;
				} else tTouch.clickCount = 0;

				tTouch['@end'].emit(tTouch, this, e);
				if(tTouch.clickCount) tTouch['@click'].emit(tTouch, this, e);
				if(tTouch.clickCount === 2) tTouch['@dblclick'].emit(tTouch, this, e);

				this['@touchend'].emit(tTouch, this, e);
				if(tTouch.clickCount) this['@touchclick'].emit(tTouch, this, e);
				if(tTouch.clickCount === 2) this['@touchdblclick'].emit(tTouch, this, e);
			}
		}, { passive: true });

		el.addEventListener('touchmove', e => {
			if(!filter(e)) return;

			for(let i = 0; i < e.touches.length; i++) {
				let id = e.touches[i].identifier;
				let tTouch = this.touches[id];
				let eTouch = e.touches[i];

				const x = eTouch.pageX - box.left;
				const y = eTouch.pageY - box.top;

				if(tTouch && tTouch.x !== x && tTouch.y !== y) {
					tTouch.x = x;
					tTouch.y = y;

					tTouch.fM = true;

					tTouch.moved = true;

					tTouch.s.x = tTouch.x-tTouch.p.x;
					tTouch.s.y = tTouch.y-tTouch.p.y;
					tTouch.p.x = tTouch.x;
					tTouch.p.y = tTouch.y;

					tTouch['@move'].emit(tTouch, eTouch, this, e);

					this['@touchmove'].emit(tTouch, eTouch, this, e);
				}
			}
		}, { passive: true });
	}

	public isDown() { return this.touches.some(i => i.isDown()); }
	public isPress() { return this.touches.some(i => i.isPress()); }
	public isUp() { return this.touches.some(i => i.isUp()); }
	public isMove() { return this.touches.some(i => i.isMove()); }
	public isClick(time: number = config.CLICK_TIME, gap: number = config.CLICK_GAP) {
		return this.touches.some(i => i.isClick(time, gap));
	}
	public isdblClick() { return this.touches.some(i => i.isdblClick()); }
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

	public '@start' = new Event<Touch, [
		touch: Touch, e_touch: globalThis.Touch, touches: TouchesController, e: TouchEvent]>(this);
	public '@end' = new Event<Touch, [
		t: Touch, touches: TouchesController, e: TouchEvent]>(this);
	public '@move' = new Event<Touch, [
		touch: Touch, e_touch: globalThis.Touch, touches: TouchesController, e: TouchEvent]>(this);

	public '@click' = new Event<Touch, [touch: Touch, touches: TouchesController, e: TouchEvent]>(this);
	public '@dblclick' = new Event<Touch, [touch: Touch, touches: TouchesController, e: TouchEvent]>(this);

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

	/** flag down */
	public fD: boolean = false;
	/** flag press */
	public fP: boolean = false;
	/** flag up */
	public fU: boolean = false;
	/** flag move */
	public fM: boolean = false;
	/** flag click */
	public fC: boolean = false;

	public clickCount: number = 0;

	public up: boolean = true;
	public upTime: number = 0;

	public down: boolean = false;
	public downTime: number = 0;

	public moved: boolean = false;

	constructor(id: number) {
		super();

		this.id = id;
	}

	public get speed() { return this.s.module; }
	/** relative position */
	public get d() { return this.pos.buf().sub(this.b); }
	public get dx() { return this.pos.x-this.b.x; }
	public get dy() { return this.pos.y-this.b.y; }
	public get beeline() { return Math.sqrt(this.dx**2 + this.dy**2); }

	public isMoved() { return this.moved; }

	public isDown() { return this.fD; }
	public isPress() { return this.fP; }
	public isUp() { return this.fU; }
	public isMove() { return this.fM; }

	public isClick(time: number = config.CLICK_TIME, gap: number = config.CLICK_GAP) {
		return this.fC && this.downTime <= time && this.upTime <= gap;
	}
	public isdblClick() { return this.clickCount === 2; }

	public isTimeDown(time: number = config.DOWN_TIME) { return !this.moved && this.down && this.downTime >= time; }

	public nullify(dt: number) {
		if(this.up) this.upTime += dt;
		if(this.down) this.downTime += dt;

		if(this.downTime > config.CLICK_TIME || this.upTime > config.CLICK_GAP) this.clickCount = 0;
		this.fP = this.fU = this.fM = this.fC = false;
	}


	public destroy() {
		this.events_off(true);
	}
}
