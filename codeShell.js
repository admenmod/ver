function codeShell(code, env = Object.create(null), p = {}) {
    if (p.insulate ?? true) {
        env = new Proxy(env, {
            has: () => true,
            get: (target, key, receiver) => key === Symbol.unscopables ? void 0 : Reflect.get(target, key, receiver)
        });
    }

    return function () { eval(`with(env) {${code}}; //# sourceURL=${p.source || 'code'}`); };
}

codeShell.from = code => code.toString().replace(/^function.+?\{(.*)\}$/s, '$1');
