import { Primitive, regexp, tag } from './helpers';


declare namespace Pattern {
	export type T<T extends Pattern<any>> = T extends Pattern<infer R> ? R : never;
}
type Item = Primitive | RegExp | Pattern<any> | (Primitive | RegExp | Pattern<any>)[];


export class Pattern<T> {
	public then: <A>(tratsform: (res: T, end: number) => A) => Pattern<A>;

	constructor(public exec: (str: string, pos?: number) => { res: T, end: number } | void) {
		this.then = transform => new Pattern((str, pos) => {
			const r = exec(str, pos);
			return r && { res: transform(r.res, r.end), end: r.end };
		});
	}
}


export const txt = <T extends string>(text: T) => new Pattern<T>((str, pos = 0) => {
	if(!str.startsWith(text, pos)) return;
	return { res: text, end: pos + text.length };
});
export const rgx = (regexp: RegExp) => new Pattern((str, pos = 0) => {
	regexp.lastIndex = 0;
	const data = regexp.exec(str.slice(pos));
	if(!data || data.index !== 0) return;

	return { res: data, end: pos + data[0].length };
});

export const opt = <T>(pattern: Pattern<T>) => new Pattern<T | void>((str, pos = 0) => {
	return pattern.exec(str, pos) || { res: void 0, end: pos };
});
export const exc = <T>(pattern: Pattern<T>, except: Pattern<any>) => new Pattern<T>((str, pos = 0) => {
	if(!except.exec(str, pos)) return pattern.exec(str, pos);
});
export const any = <T extends Pattern<any>[]>(...patterns: T) => new Pattern<Pattern.T<T[number]>>((str, pos = 0) => {
	let r: any;
	for(const pattern of patterns) {
		if(r = pattern.exec(str, pos)) return r;
	}
});
export type con<T extends Pattern<any>[]> = ({ [K in keyof T]: Pattern.T<T[K]>; });
export const seq = <T extends Pattern<any>[]>(...patterns: T) => new Pattern<con<T>>((str, pos = 0) => {
	let r, res: any[] = [], end = pos;

	for(const pattern of patterns) {
		r = pattern.exec(str, end);
		if(!r) return;
		res.push(r.res);
		end = r.end;
	}

	return { res, end } as any;
});
export const rep = <T extends Pattern<any>>(pattern: T, separator?: Pattern<any>) => {
	const separated: Pattern<T> = !separator ? pattern : seq(separator, pattern).then(r => r[1]);

	return new Pattern<Pattern.T<T>[]>((str, pos = 0) => {
		let res: Pattern.T<T>[] = [], end = pos, r = pattern.exec(str, end);

		while(r && r.end > end) {
			res.push(r.res);
			end = r.end;
			r = separated.exec(str, end);
		}

		return { res, end };
	});
};

export const toPattern = (a: any) => {
	if(a instanceof Pattern) return a;
	if(a instanceof RegExp) return rgx(a);
	return txt(String(a));
};

export const tagParseToArr = (str: TemplateStringsArray, ...args: Item[]) => {
	const arr: Pattern<any>[] = [];

	if(str[0]) arr.push(txt(str[0]));

	for(let i = 0; i < args.length; i++) {
		const arg = args[i];

		if(Array.isArray(arg)) for(const a of arg) arr.push(toPattern(a));
		else arr.push(toPattern(arg));

		if(str[i+1]) arr.push(txt(str[i+1]));
	}

	return arr;
};


export const tags = {
	txt: (str: TemplateStringsArray, ...args: any[]) => txt(tag.str(str, ...args)),
	rgx: (str: TemplateStringsArray, ...args: any[]) => rgx(regexp(str, ...args)('gy')),
	seq: <Args extends any[]>(str: TemplateStringsArray, ...args: Args) => seq(...tagParseToArr(str, ...args))
};



interface IDataPairBase extends Array<string> {
	input: string;
	indices: [number, number][];
	q: string; p: string;
	done: boolean;
}
interface IDataPairDone extends IDataPairBase {
	done: true;
}
interface IDataPairNext extends IDataPairBase {
	done: false;
	next: (next: string) => IDataPairBase | void;
}
type IDataPair = IDataPairDone | IDataPairNext;


// TODO: make y pos
export const pair = (q: string, p = q, lazy = true, flags = '') => {
	if(q.length !== 1 || p.length !== 1) throw new Error('qp');

	const g = flags.includes('g');
	const y = flags.includes('y');

	let pc: number = -1;
	const arr: string[] = [];
	const indices: [number, number][] = [[-1, -1]];

	return {
		lastIndex: 0,

		exec(string: string) {
			if(y && string[this.lastIndex] !== q) return;

			if(q === p) {
				for(let i = this.lastIndex; i < string.length; i++) {
					if(string[i] === q) {
						if(indices[0][0] === -1) {
							let c = 0;
							for(let j = i-1; j >= 0; j--) { if(string[j] === '\\') c++; else break; }
							if(c % 2) continue;

							indices[0][0] = i;
						} else {
							let c = 0;
							for(let j = i-1; j >= 0; j--) { if(string[j] === '\\') c++; else break; }
							if(c % 2) continue;

							indices[0][1] = i;
							indices[0] = [indices[0][0], indices[0][1]];
							arr[0] = string.slice(indices[0][0]+1, indices[0][1]);

							if(g) this.lastIndex = i+1;
							if(lazy) break;
						}
					}
				}
			} else {
				for(let i = this.lastIndex; i < string.length; i++) {
					if(string[i] === q) {
						indices[++pc] = [-1, -1];

						let c = 0;
						for(let j = i; j >= 0; j--) { if(string[j] === '\\') c++; else break; }
						if(c % 2) continue;

						indices[pc][0] = i;
						if(g) this.lastIndex = i+1;
					} else if(string[i] === p) {
						let c = 0;
						for(let j = i; j >= 0; j--) { if(string[j] === '\\') c++; else break; }
						if(c % 2) continue;

						indices[pc][1] = i;
						arr[pc] = string.slice(indices[pc][0]+1, indices[pc][1]);

						if(g) this.lastIndex = i+1;

						pc--;
						if(!~pc) break;
					}
				}
			}

			const data: IDataPair = Object.assign([], arr, {
				input: string,
				indices: indices.map<[number, number]>(([q, p]) => ([q, p])),
				q, p,
				done: indices.every(([, p]) => ~p)
			}) satisfies IDataPairBase as any;

			if(data.done) {
				arr.length = 0;
				indices.length = 0;
			} else data.next = (next: string) => this.exec(string+next);

			return data;
		}
	};
};

export const parseString = (flags = '') => {
	const g = flags.includes('g');
	const y = flags.includes('y');

	const arr: string[] = [];
	const indices: [number, number][] = [[-1, -1]];

	return {
		lastIndex: 0,

		exec(string: string) {
			const w = ["'", '"'] ;
			let q = -1, p = -1;

			if(y && w.includes(string[this.lastIndex])) return null;

			main: for(let i = this.lastIndex; i < string.length; i++) {
				if(w.includes(string[i])) {
					if(q === -1) {
						for(let c = 0, j = i-1; j >= 0; j--) if(string[j] !== '\\' && ++c % 2) continue main;

						q = i;
					} else {
						for(let c = 0, j = i-1; j >= 0; j--) if(string[j] !== '\\' && ++c % 2) continue main;

						p = i;
						arr[0] = string.slice(indices[0][0]+1, indices[0][1]);
						arr[1] = string.slice(indices[0][0], indices[0][1]-1);

						if(g) this.lastIndex = i+1;
					}
				}
			}

			const data = Object.assign([], arr, {
				input: string,
				q, p,
				done: ~p
			});

			if(data.done) {
				arr.length = 0;
			} else throw new Error('done false');

			return data;
		}
	};
};



export const literal_string = new Pattern<string>((str: string, pos = 0) => {
	const string = str.slice(pos);

	if(!["'", '"'].includes(string[0])) return;

	let q = -1, p = -1;
	const w = string[0];

	main: for(let i = 0; i < string.length; i++) {
		if(string[i] === w) {
			if(q === -1) {
				for(let c = 0, j = i-1; j >= 0; j--, c++) {
					if(string[j] !== '\\') {
						if(c % 2) continue main;
						else break;
					}
				}
				q = i;
			} else {
				for(let c = 0, j = i-1; j >= 0; j--, c++) {
					if(string[j] !== '\\') {
						if(c % 2) continue main;
						else break;
					}
				}
				p = i;

				return { res: string.slice(q+1, p), end: pos+p+1 };
			}
		}
	}

	return;
});
