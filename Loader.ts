import { EventDispatcher, Event } from './events';


export class Loader extends EventDispatcher {
	private static _instance: Loader;

	protected constructor() {
		super();

		if(Loader._instance) Loader._instance = this;
	}

	public static instance(): Loader { return Loader._instance || new Loader(); }
}
