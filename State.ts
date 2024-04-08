import { FunctionIsEvent } from './events.js';


export interface State<T> extends FunctionIsEvent<null, [last: T, prev: T], (value: T) => void> { last: T; prev: T; }

export declare namespace State {
	export type T<T> = T extends State<infer R> ? R : never;
}
export const State = function<T>(value: T) {
	if(!new.target) throw new Error(`Class constructor State connot be invoked without 'new'`);

	const state = new FunctionIsEvent(null, (value: T) => {
		if(value === state.last) return;

		state.prev = state.last;
		state.last = value;

		state.emit(state.last, state.prev);
	}) as State<T>;

	state.prev = value;
	state.last = value;


	return state;
} as any as new <T>(value: T) => State<T>;
