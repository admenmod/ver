export class Path extends String {
	private constructor(...args: Parameters<typeof String>) {
		super(...args);
	}

	static dirExp = /\/+/;
	static fileExp = /\.(?!.*\.)/;

	public static isAbsolute(src: Path): boolean {
		return String.prototype.startsWith.call(src, '/');
	}
	public static isRelative(src: Path): boolean {
		return String.prototype.startsWith.call(src, './') || String.prototype.startsWith.call(src, '../');
	}
	public static isDefault(src: Path): boolean {
		return !(this.isAbsolute(src) || this.isRelative(src));
	}
	public static isPassive = this.isDefault;

	public static isDirectory(src: Path): boolean { return String.prototype.endsWith.call(src, '/'); }

	public static toSource(path: string[]): string {
		return typeof path === 'string' ? path : path.join('/');
	}

	public static toArray(src: Path | string[]): string[] {
		//@ts-ignore
		if(typeof src !== 'string') return src;

		return src === '/' ? [''] : src.split(this.dirExp);
	}

	public static normalize(src: Path, d: boolean = true) {
		const path = this.toArray(src);
		const normalized = [];

		for(const i of path) {
			if(i === '..') normalized.pop();
			else if(i === '.') continue;
			else normalized.push(i);
		}

		if(Path.isAbsolute(src) && normalized[0]) normalized.unshift('');
		if(d && Path.isDirectory(src)) normalized.pop();

		return this.toSource(normalized);
	}

	public static relative(src: Path, dir?: Path, d: boolean = true) {
		const dira: string[] = dir ? this.toArray(dir) : [];

		const path = this.isAbsolute(src) ? [...this.toArray(src)] : [...this.toArray(dira), ...this.toArray(src)];

		return this.normalize(this.toSource(path), d);
	}

	public static file(src: Path) {
		//@ts-ignore
		const data: { filename: string, name: string, exp: string, dir: string, src: string } = {};
		const path = this.toArray(src);

		data.filename = path.pop() || '';
		data.dir = path.length ? this.toSource(path)+'/' : '';
		data.src = data.dir+data.filename;

		const [name = '', exp = ''] = data.filename.split(this.fileExp);
		data.name = name;
		data.exp = exp;

		return data;
	}
}
