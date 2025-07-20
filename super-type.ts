import { type list, type Err } from './helpers.js';


export type ID = typeof ID;
export const ID = Symbol('SuperType<ID>');

export const REF = Symbol('SuperType<REF>');
export type REF = typeof REF;

export const META = Symbol('SuperType<META>');
export type META = typeof META;

export type _OP = typeof _OP;
export const _OP = Symbol('SuperType<_OP>');


export namespace st {
	export const Ref = <T extends () => any, K extends keyof ReturnType<T>>(scope: T, id: K): Ref<T, K> => ({ scope, id, [REF]: REF });
	export type Ref<T extends () => any = any, K extends keyof ReturnType<T> = any> = { scope: T, id: K, [REF]: REF };


	export type AnyST = { [ID]: any };

	export type TypeGuard<T = any> = (data: any) => data is T;
	export declare namespace TypeGuard {
		export type T<T extends TypeGuard> = T extends TypeGuard<infer R> ? R : never;
		export type resolve<T extends TypeGuard> = T extends TypeGuard<infer R> ? ResolveTypeArgs<OpGroup<'and', [R]>> : never;
	}

	export type toST<T, D = T> = T extends { [ID]: infer R } ? R : D;
	export type inferTfromTypeGuards<T extends TypeGuard[]> = { [K in keyof T]: TypeGuard.T<T[K]>; };

	export type OP<op extends keyof GlobalSuperTypesRegister, T extends any[], id> =
		id extends keyof GlobalSuperTypesRegister[op] ? _ReturnType<GlobalSuperTypesRegister<T>[op][id]> : Err<[`${op}<id> is not found`, id]>;
	type _ReturnType<T> = T extends (...args: any) => any ? ReturnType<T> : Err<['ReturnType error', T]>;

	export type OpGroup<op extends keyof GlobalSuperTypesRegister = any, T extends any[] = any> = { [_OP]: op, T: T };

	type getTypes<T extends any[], Acc extends any[] = []> =
		T extends [infer v, ...infer __] ? getTypes<__, list.pushToSet<Acc, toST<v, never>>> : Acc;

	export type OpSTArgs<op extends keyof GlobalSuperTypesRegister, T extends any[], Acc extends any[] = [], Ids extends any[] = getTypes<T>> =
		Ids extends [infer id, ...infer __] ? OpSTArgs<op,
			list.splitByCondition<T, { [ID]: id }>[1],
			[...Acc, OP<op, list.splitByCondition<T, { [ID]: id }>[0], id>],
		__> : OpGroup<op, [...Acc, ...T]>;

	export type ResolveTypeArgsAnd<T extends any[]> =
	//@ts-expect-error HACK: :)
	list.AND<{ [K in keyof T]:
		T[K] extends { [ID]: infer id } ? OP<'resolve', [T[K]], id>[0] :
		T[K] extends OpGroup ? ResolveTypeArgs<T[K]> :
		T[K];
	}>;

	export type ResolveTypeArgsOr<T extends any[]> =
	//@ts-expect-error HACK: :)
	list.OR<{ [K in keyof T]:
		T[K] extends { [ID]: infer id } ? OP<'resolve', [T[K]], id>[0] :
		T[K] extends OpGroup ? ResolveTypeArgs<T[K]> :
		T[K];
	}>;

	export type ResolveTypeArgs<T extends OpGroup> = T extends OpGroup<infer m, infer M> ?
		m extends 'or' ? ResolveTypeArgsOr<M> :
		m extends 'and' ? ResolveTypeArgsAnd<M> :
		Err<['ResolveTypeArgs::op is not found']> :
	Err<['ResolveTypeArgs::T is not OpGroup']>;


	export type ResolveObject<T> = { [K in keyof T]: Resolve<T[K]>; };

	export type Resolve<T> =
		T extends Ref ? Resolve<ReturnType<T['scope']>[T['id']]> :
		T extends TypeGuard ? TypeGuard.resolve<T> :
		T extends object ? ResolveObject<T> :
		Err<['sm::Resolve', 'Unknown type', T]>;


	export const or = <T extends st.TypeGuard[]>(...args: T) => (data: any): data is st.OpSTArgs<'or', {
		[K in keyof T]: st.TypeGuard.T<T[K]>;
	}> => {
		for(const tg of args) if(tg(data)) return true;
		return false;
	};

	export const and = <T extends st.TypeGuard[]>(...args: T) => (data: any): data is st.OpSTArgs<'and', {
		[K in keyof T]: st.TypeGuard.T<T[K]>;
	}> => {
		for(const tg of args) if(!tg(data)) return false;
		return true;
	};


	export const parse = <T extends TypeGuard>(type: T, data: any): data is TypeGuard.resolve<T> => {
		return type(data);
	};

	export function meta(type: TypeGuard): GlobalSuperTypesRegister['META'];
	export function meta<T extends TypeGuard>(type: T, meta: Partial<GlobalSuperTypesRegister['META']>): T;
	export function meta<T extends TypeGuard>(type: T, meta?: Partial<GlobalSuperTypesRegister['META']>): T | GlobalSuperTypesRegister['META'] {
		const tg: typeof type & { [META]: object } = type as any;
		let m: any;

		if(!(META in type)) tg[META] = Object.create(null);
		m = tg[META];

		if(!meta) return m;

		Object.assign(m, meta);

		return type;
	}


	export type infer<T> = Resolve<T>;
}

//@ts-ignore
st[Symbol.toStringTag] = 'st';

declare global {
	namespace GlobalSuperTypesRegister {
		interface META {}

		interface and<T extends any[]> {}
		interface or<T extends any[]> {}
		interface resolve<T extends any[]> {}
	}

	interface GlobalSuperTypesRegister<T extends any[] = any> {
		META: GlobalSuperTypesRegister.META;

		and: GlobalSuperTypesRegister.and<T>;
		or: GlobalSuperTypesRegister.or<T>;
		resolve: GlobalSuperTypesRegister.resolve<T>;
	}
}
