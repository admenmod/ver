export type getInstanceOf<T extends new(...args: any) => object> =
	T extends new(...args: any[]) => infer R ? R : never;

export const isInstanceOf = <T extends new(...args: any) => object>
	(a: object, Class: T): a is getInstanceOf<T> => a instanceof Class;
