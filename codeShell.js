function codeShell(code, env = Object.create(null), p = {}) {
	if(p.insulate ?? true) {
		env = new Proxy(env, {
			has: () => true,
			get: (target, key, receiver) => key === Symbol.unscopables ? void 0 : Reflect.get(target, key, receiver)
		});
	}

	return eval(`with(env) { (${p.async ? 'async ':''}function${p.generator ? '* ':''}(${p.arguments?.join(', ') || ''}) { 'use strict'; ${code} }); } //# sourceURL=${p.source || 'code'}`);
}

codeShell.from = code => code.toString().replace(/^function.+?\{(.*)\}$/s, '$1');
