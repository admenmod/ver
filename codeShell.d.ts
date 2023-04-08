declare function codeShell(code: string, env?: object, p?: {
	insulate?: boolean;
	source?: string;
}): () => void;

declare namespace codeShell {
	var from: (code: (...args: any[]) => any) => string;
}
