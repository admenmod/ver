import { EventDispatcher, Event } from './events.js';


const METAKEYS = {
	Shift: 'Shift',
	Control: 'Control',
	Alt: 'Alt',
	Meta: 'Meta'
} as const;

type METAKEYS = typeof METAKEYS[keyof typeof METAKEYS];


interface NameSpaceKeys {
	[K: string]: boolean
}


interface EventData {
	type: string;
	key: string;
	code: number;
	data: string;
	inputType?: string;
	shift: boolean;
	ctrl: boolean;
	alt: boolean
	meta: boolean;
	isMetaKey: boolean;
	pressed: NameSpaceKeys;
	event: any;
	preventDefault: () => void;
	input: HTMLInputElement | HTMLTextAreaElement;
}


export namespace KeyboardInputInterceptor {
	export type Event = EventData;
}


export class KeyboardInputInterceptor extends EventDispatcher {
	public '@init' = new Event<KeyboardInputInterceptor, [input: HTMLInputElement | HTMLTextAreaElement]>(this);
	public '@destroy' = new Event<KeyboardInputInterceptor, [input: HTMLInputElement | HTMLTextAreaElement]>(this);

	public '@input' = new Event<KeyboardInputInterceptor, [e: EventData]>(this);
	public '@keyup:input' = new Event<KeyboardInputInterceptor, [e: EventData]>(this);
	public '@keydown:input' = new Event<KeyboardInputInterceptor, [e: EventData]>(this);
	public '@key:all' = new Event<KeyboardInputInterceptor, [e: EventData]>(this);
	public '@metakey' = new Event<KeyboardInputInterceptor, [e: EventData]>(this);
	public '@Unidentified' = new Event<KeyboardInputInterceptor, [e: EventData]>(this);

	public '@focus' = new Event<KeyboardInputInterceptor, [input: HTMLInputElement | HTMLTextAreaElement]>(this);
	public '@blur' = new Event<KeyboardInputInterceptor, [input: HTMLInputElement | HTMLTextAreaElement]>(this);


	private pressed: NameSpaceKeys = Object.create(null);
	private handler: any;

	protected _isInited: boolean = false;
	public get isInited() {	return this._isInited; }

	#input: HTMLInputElement | HTMLTextAreaElement | null = null;
	public get input() { return this.#input; }

	constructor(p: { preventDefault?: boolean } = {}) {
		super();

		this.handler = (e: any) => {
			if(!this.#input || !this._isInited || this.#input !== e.currentTarget) return;

			if(p.preventDefault) e.preventDefault();

			const data: EventData = {
				shift: false,
				ctrl: false,
				alt: false,
				meta: false,
				isMetaKey: false,
			} as EventData;

			data.type = e.type;
			data.event = e;
			data.preventDefault = () => e.preventDefault();
			data.input = this.#input;

			if(e.key in METAKEYS) return (this as KeyboardInputInterceptor).emit('metakey', data);

			if(e.key === 'Unidentified' && e.keyCode === 229) {
				return (this as KeyboardInputInterceptor).emit('Unidentified', data);
			}

			if(e.type === 'keydown' || e.type === 'keyup') {
				data.key = data.data = e.key;
				data.code = e.keyCode;

				if(e.type === 'keydown') this.pressed[e.key] = true;

				data.shift = e.shiftKey || this.pressed['Shift'] || false;
				data.ctrl = e.ctrlKey || this.pressed['Control'] || false;
				data.alt = e.altKey || this.pressed['Alt'] || false;
				data.meta = e.metaKey || this.pressed['Meta'] || false;

				data.isMetaKey = data.shift || data.ctrl || data.alt || data.meta;

				if(e.type === 'keyup') this.pressed[e.key] = false;
			} else if(e.type === 'beforeinput') {
				data.data = e.data;

				data.key = e.data?.[0] || e.data;

				data.inputType = e.inputType;
			}


			if(e.type === 'beforeinput' && e.inputType === 'insertText') {
				(this as KeyboardInputInterceptor).emit('input', data);
			}
			if(e.type === 'keydown' || e.type === 'beforeinput') {
				(this as KeyboardInputInterceptor).emit('keydown:input', data);
			}
			if(e.type === 'keyup' || e.type === 'beforeinput') {
				(this as KeyboardInputInterceptor).emit('keyup:input', data);
			}

			(this as KeyboardInputInterceptor).emit('key:all', data);
		};
	}

	public isFocus: boolean = false;
	private focus_handler = (e: any) => {
		if(e.type === 'blur' && this.isFocus) return this.focus();
		(this as KeyboardInputInterceptor).emit(e.type as 'focus' | 'blur', this.#input!);
	};

	public init(input: HTMLInputElement | HTMLTextAreaElement): this {
		if(this._isInited && this.#input !== input) throw new Error('destroy method not called');
		if(this._isInited) return this;
		this.#input = input;

		this.#input.addEventListener('keyup', this.handler);
		this.#input.addEventListener('keydown', this.handler);
		this.#input.addEventListener('beforeinput', this.handler);

		this.#input.addEventListener('focus', this.focus_handler);
		this.#input.addEventListener('blur', this.focus_handler);

		this['@init'].emit(this.#input);

		this._isInited = true;

		return this;
	}

	public destroy(): this {
		if(!this._isInited || !this.#input) return this;

		this.#input.removeEventListener('keyup', this.handler);
		this.#input.removeEventListener('keydown', this.handler);
		this.#input.removeEventListener('beforeinput', this.handler);

		this.#input.removeEventListener('focus', this.focus_handler);
		this.#input.removeEventListener('blur', this.focus_handler);

		const input = this.#input;
		this.#input = null;

		this['@destroy'].emit(input);

		this._isInited = false;

		return this;
	}

	public focus(): void {
		if(!this._isInited || !this.#input) return;
		this.isFocus = true;
		this.#input.focus();
	}
	public blur(): void {
		if(!this._isInited || !this.#input) return;
		this.isFocus = false;
		this.#input.blur();
	}

	public toggleFocus(force?: boolean): void {
		if(typeof force === 'undefined') this.isFocus ? this.blur() : this.focus();
		else this.isFocus === !force ? this.blur() : this.focus();
	}

	public override get [Symbol.toStringTag]() { return 'KeyboardInputInterceptor'; }
}
