export type getInstanceOf<T extends new(...args: any) => any> =
	T extends new(...args: any[]) => infer R ? R : never;

export const isInstanceOf = <T extends new(...args: any) => any>
	(a: object, Class: T): a is getInstanceOf<T> => a instanceof Class;
