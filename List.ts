export class List<T> {
	public prev: List<T> | null = null;
	public next: List<T> | null = null;

	constructor(public value: T) {}

	public head(): List<T> {
		let p: List<T> | null = this;
		while(p.prev) p = p.prev;
		return p;
	}

	public last(): List<T> {
		let p: List<T> | null = this;
		while(p.next) p = p.next;
		return p;
	}

	public *tail(): Generator<List<T>> {
		let p: List<T> | null = this;
		while(p = p.next) yield p;
	}

	public *apex(): Generator<List<T>> {
		let p: List<T> | null = this;
		while(p = p.prev) yield p;
	}

	public *[Symbol.iterator](): Generator<List<T>> {
		let p: List<T> | null = this.head();
		yield p;
		while(p = p.next) yield p;
	}


	public valueOf(): T { return this.value; }
	public toString(): T { return this.value; }
	public [Symbol.toPrimitive](): T { return this.value; }


	public move(a: number, t: true): List<T>;
	public move(a: number, t?: false): List<T> | null;
	public move(a: number, t: boolean = false): List<T> | null {
		if(!this) return null;

		let list: List<T> | null = this;

		if(a < 0) {
			while(a && list) {
				if(t && !list.next) break;

				list = list.next;
				a += 1;
			}
		} else if(a > 0) {
			while(a && list) {
				if(t && !list.prev) break;

				list = list.next;
				a -= 1;
			}
		}

		return list;
	}


	public insert(this: List<T> | null, ...args: T[]): List<T> | null {
		let prev: List<T> | null = this;
		let next: List<T> | null = this?.next || null;

		let main: List<T> | null = this;
		let list: List<T> | null = null;

		for(const i of args) {
			list = new List(i);
			list.prev = prev;
			list.next = next;

			if(prev) prev.next = list;

			prev = list;

			if(!main) main = prev;
		}

		return main;
	}

	public append(this: List<T> | null, ...args: T[]): List<T> | null {
		let prev: List<T> | null = this;
		let next: List<T> | null = this?.next || null;

		let list: List<T> | null = null;

		for(const i of args) {
			list = new List(i);
			list.prev = prev;
			list.next = next;

			if(prev) prev.next = list;

			prev = list;
		}

		return prev;
	}


	public attach(list: List<T> | null): List<T> | null;
	public attach(head: List<T>, last: List<T>): List<T>;
	public attach(list_head: List<T> | null, list_last?: List<T>): List<T> | null {
		let head: List<T>;
		let last: List<T>;

		if(!list_last) {
			if(!list_head) return this;

			head = list_head.head();
			last = list_head.last();
		} else if(!list_head) {
			throw new Error('invalid arguments');
		} else {
			head = list_head;
			last = list_last;
		}

		this.next = head;
		head.prev = this;

		this.next.prev = last;
		last.next = this.next;

		return last;
	}

	public detach(head: List<T> = this, last: List<T> = head): List<T> | null {
		if(!this) return null;

		const head_split = head.prev;
		const last_split = last.next;

		head.prev = null;
		last.next = null;

		if(head_split) head_split.next = last_split;
		if(last_split) last_split.prev = head_split;

		return head_split || last_split;
	}


	public static from<T>(o: T[] | IterableIterator<T>): List<T> | null {
		return List.insert<T>(null, ...o);
	}

	public static copy<T>(list: List<T> | null): List<T> | null {
		if(!list) return null;

		return List.from([...list].map(i => i.value));
	}


	public static insert<T>(self: List<T> | null, ...args: T[]): List<T> | null {
		return (List.prototype as List<T>).insert.call(self, ...args);
	}

	public static append<T>(self: List<T> | null, ...args: T[]): List<T> | null {
		return (List.prototype as List<T>).append.call(self, ...args);
	}

	//@ts-ignore
	public static attach<T>(self: List<T> | null, list: List<T> | null): List<T> | null;
	public static attach<T>(self: List<T> | null, head: List<T>, last: List<T>): List<T>;
	public static attach<T>(self: List<T> | null, ...args: Parameters<List<T>['attach']>): List<T> | null {
		return (List.prototype as List<T>).attach.apply(self, args);
	}

	public static detach<T>(self: List<T> | null, ...args: Parameters<List<T>['detach']>): List<T> | null {
		return (List.prototype as List<T>).detach.apply(self, args);
	}


	public static readonly NULL = null;
	public static readonly ZERO = null;
}
