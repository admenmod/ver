import { EventDispatcher, Event } from './events';


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
	event: any
}


export namespace KeyboardInputInterceptor {
	export type Event = EventData;
}


export class KeyboardInputInterceptor extends EventDispatcher {
	public '@init' = new Event<KeyboardInputInterceptor, []>(this);
	public '@destroy' = new Event<KeyboardInputInterceptor, []>(this);

	// public '@keyup' = new Event<KeyboardInputInterceptor, [EventData]>(this);
	// public '@keydown' = new Event<KeyboardInputInterceptor, [EventData]>(this);
	public '@input' = new Event<KeyboardInputInterceptor, [EventData]>(this);
	public '@keyup:input' = new Event<KeyboardInputInterceptor, [EventData]>(this);
	public '@keydown:input' = new Event<KeyboardInputInterceptor, [EventData]>(this);
	public '@key:all' = new Event<KeyboardInputInterceptor, [EventData]>(this);
	public '@metakey' = new Event<KeyboardInputInterceptor, [EventData]>(this);
	public '@Unidentified' = new Event<KeyboardInputInterceptor, [EventData]>(this);


	private pressed: NameSpaceKeys = Object.create(null);
	private handler: any;


	constructor(public input: HTMLInputElement | HTMLAreaElement, p: {
		notPreventDefault?: boolean
	} = {}) {
		super();

		this.handler = (e: any) => {
			if(!p.notPreventDefault) e.preventDefault();

			const data: EventData = {
				shift: false,
				ctrl: false,
				alt: false,
				meta: false,
				isMetaKey: false,
			} as EventData;

			data.type = e.type;
			data.event = e;

			//@ts-ignore
			if(e.key in METAKEYS) {
				// TODO:  <05-04-23, admenmod> //
				return (this as KeyboardInputInterceptor).emit('metakey', data);
			}

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

	public init(this: KeyboardInputInterceptor): void {
		this.input.addEventListener('keyup', this.handler);
		this.input.addEventListener('keydown', this.handler);
		this.input.addEventListener('beforeinput', this.handler);
		this.emit('init');
	}

	public destroy(this: KeyboardInputInterceptor): void {
		this.input.removeEventListener('keyup', this.handler);
		this.input.removeEventListener('keydown', this.handler);
		this.input.removeEventListener('beforeinput', this.handler);
		this.emit('destroy');
	}

	public blur(): void { this.input.blur(); }
	public focus(): void { this.input.focus(); }
}
