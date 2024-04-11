const code = `(function() {
globalThis.codeShell = function(code, env = Object.create(null), p = {}) {
	if(p.insulate ?? true) {
		env = new Proxy(env, {
			has: () => true,
			get: (target, key, receiver) => key === Symbol.unscopables ? void 0 : Reflect.get(target, key, receiver)
		});
	}

	return eval(\`with(env) { (\${p.async ? 'async ':''}function\${p.generator ? '* ':''}(\${p.arguments || ''}) { \${p.strict ?? true ? "'use strict'; " : ''}\${code}
}); } //# sourceURL=\${p.source || 'code'}\`);
}
})();`;

let script: any = document.createElement('script');
script.textContent = code;
document.head.append(script);
script.remove();
script = null;


interface codeShell {
	<T extends (this: any, ...args: any[]) => any = () => void>(code: string, env?: object, p?: {
		strict?: boolean;
		async?: boolean;
		generator?: boolean;
		arguments?: string;
		insulate?: boolean;
		source?: string;
	}): T;
}

export let codeShell: codeShell = (globalThis as any).codeShell as codeShell;
delete (globalThis as any).codeShell;
