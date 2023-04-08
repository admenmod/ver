import { Vector2 } from './Vector2';
import { EventDispatcher, Event } from './events';
import { loadImage } from './helpers';


const GObject = Object;


export class MapParser extends EventDispatcher {
	private static _instance: MapParser;

	public '@load:map' = new Event<MapParser, [map: MapParser.Map]>(this);
	public '@load:tileset' = new Event<MapParser, [tileset: MapParser.Tileset]>(this);

	protected constructor() {
		super();

		if(MapParser._instance) MapParser._instance = this;
	}

	public static instance(): MapParser { return MapParser._instance || new MapParser(); }

	public loadMap(this: MapParser, src: string): Promise<MapParser.Map> {
		return fetch(src).then(data => data.json()).then((_map: MapParser.Map) => {
			for(let i = 0; i < _map.layers.length; i++) {
				if(_map.layers[i].type === 'tilelayer') {
					//@ts-ignore
					_map.layers[i].data = new Uint16Array(_map.layers[i].data);
				}
			}

			const map = new MapParser.Map(_map);


			const proms: Promise<void>[] = [];

			for(let i = 0; i < map.tilesets.length; i++) {
				const tileset = map.tilesets[i];
				const imagedata = tileset.properties.find(i => i.name === 'imagedata');

				if(!imagedata) return Promise.reject(new Error('error: imagedata'));

				const prom = loadImage(MapParser.BASE64 + imagedata.value, tileset.imagewidth, tileset.imageheight).then(img => {
					img.name = tileset.image;

					tileset.imagedata = img;

					this.emit('load:tileset', tileset);
				});

				proms.push(prom);
			}


			return Promise.all(proms).then(data => {
				this.emit('load:map', map);

				return map;
			});
		});
	}
}


export namespace MapParser {
	export const BASE64 = 'data:image/png;base64,';

	export interface IProperty {
		readonly name: string;
		readonly type: string;
		readonly value: string;
	}

	export interface IBaseLayer {
		readonly id: number;
		readonly name: string;
		readonly type: string;

		readonly visible: boolean;
		readonly opacity: number;

		readonly offsetx: number;
		readonly offsety: number;
	}


	export interface ITile {
		readonly id: number;
		readonly properties: IProperty[];
	}

	export interface ITileLayer extends IBaseLayer {
		readonly type: 'tilelayer';

		readonly data: Uint8Array | Uint16Array | Uint32Array;

		readonly x: number;
		readonly y: number;

		readonly width: number;
		readonly height: number;

		readonly properties: IProperty[];
	}


	export interface IObject {
		readonly id: number;
		readonly name: string;
		readonly type: string;

		readonly visible: boolean;

		readonly rotation: number;

		readonly x: number;
		readonly y: number;

		readonly width: number;
		readonly height: number;

		readonly properties: IProperty[];
	}

	export interface IObjectGroup extends IBaseLayer {
		readonly type: 'objectgroup';

		readonly draworder: string;

		readonly objects: IObject[];
	}


	export interface ITileset {
		readonly name: string;

		readonly image: string;
		readonly imagewidth: number;
		readonly imageheight: number;

		readonly columns: number;
		readonly firstgid: number;
		readonly margin: number;
		readonly spacing: number;

		readonly tilecount: number;
		readonly tilewidth: number;
		readonly tileheight: number;

		readonly tiles: ITile[];

		readonly properties: IProperty[];
	}

	export interface IMap {
		readonly version: number;
		readonly type: string;

		readonly width: number;
		readonly height: number;

		readonly nextlayerid: number;
		readonly nextobjectid: number;
		readonly infinite: boolean;
		readonly orientation: string;
		readonly renderorder: string;

		readonly tiledversion: string;
		readonly tilewidth: number;
		readonly tileheight: number;

		readonly layers: (ITileLayer | IObjectGroup)[];
		readonly tilesets: ITileset[];
		readonly properties: IProperty[];
	}



	export class Property extends EventDispatcher implements IProperty {
		public readonly name: string;
		public readonly type: string;
		public readonly value: string;

		constructor(o: IProperty) {
			super();

			this.name = o.name;
			this.type = o.type;
			this.value = o.value;
		}
	}

	export class BaseLayer extends EventDispatcher implements IBaseLayer {
		public readonly id: number;
		public readonly name: string;
		public readonly type: string;

		public readonly visible: boolean;
		public readonly opacity: number;

		public readonly offsetx: number;
		public readonly offsety: number;
		public readonly offset: Readonly<Vector2>;


		constructor(o: IBaseLayer) {
			super();

			this.id = o.id;
			this.name = o.name;
			this.type = o.type;

			this.visible = o.visible;
			this.opacity = o.opacity;

			this.offsetx = o.offsetx;
			this.offsety = o.offsety;
			this.offset = GObject.freeze(new Vector2(this.offsetx, this.offsety));
		}
	}


	export class Tile extends EventDispatcher implements ITile {
		public readonly id: number;
		public readonly properties: Property[] = [];

		constructor(o: ITile) {
			super();

			this.id = o.id;

			for(let i = 0; i < o.properties.length; i++) {
				this.properties[i] = new Property(o.properties[i]);
			}
		}
	}

	export class TileLayer extends BaseLayer implements ITileLayer {
		public readonly data: Uint8Array | Uint16Array | Uint32Array;

		public readonly type: 'tilelayer';

		public readonly x: number;
		public readonly y: number;
		public readonly pos: Readonly<Vector2>;

		public readonly width: number;
		public readonly height: number;
		public readonly size: Readonly<Vector2>;

		public readonly properties: Property[] = [];


		constructor(o: ITileLayer) {
			super(o);

			this.type = 'tilelayer';

			this.data = o.data;

			this.x = o.x;
			this.y = o.y;
			this.pos = GObject.freeze(new Vector2(this.x, this.y));

			this.width = o.width;
			this.height = o.height;
			this.size = GObject.freeze(new Vector2(this.width, this.height));

			for(let i = 0; i < o.properties.length; i++) {
				this.properties[i] = new Property(o.properties[i]);
			}
		}
	}


	export class Object extends EventDispatcher implements IObject {
		public readonly id: number;
		public readonly name: string;
		public readonly type: string;

		public readonly visible: boolean;

		public readonly rotation: number;

		public readonly x: number;
		public readonly y: number;
		public readonly pos: Readonly<Vector2>;

		public readonly width: number;
		public readonly height: number;
		public readonly size: Readonly<Vector2>;

		public readonly properties: IProperty[] = [];


		constructor(o: IObject) {
			super();

			this.id = o.id;
			this.name = o.name;
			this.type = o.type;

			this.visible = o.visible;

			this.rotation = o.rotation;

			this.x = o.x;
			this.y = o.y;
			this.pos = GObject.freeze(new Vector2(this.x, this.y));

			this.width = o.width;
			this.height = o.height;
			this.size = GObject.freeze(new Vector2(this.width, this.height));

			for(let i = 0; i < o.properties.length; i++) {
				this.properties[i] = new Property(o.properties[i]);
			}
		}
	}

	export class ObjectGroup extends BaseLayer implements IObjectGroup {
		public readonly type: 'objectgroup';

		public readonly draworder: string;

		public readonly objects: IObject[] = [];

		constructor(o: IObjectGroup) {
			super(o);

			this.type = o.type;

			this.draworder = o.draworder;

			for(let i = 0; i < o.objects.length; i++) {
				this.objects[i] = new Object(o.objects[i]);
			}
		}
	}


	export class Tileset extends EventDispatcher implements ITileset {
		public imagedata!: HTMLImageElement;

		public readonly name: string;

		public readonly image: string;
		public readonly imagewidth: number;
		public readonly imageheight: number;
		public readonly image_size: Readonly<Vector2>;

		public readonly columns: number;
		public readonly firstgid: number;
		public readonly margin: number;
		public readonly spacing: number;

		public readonly tilecount: number;
		public readonly tilewidth: number;
		public readonly tileheight: number;
		public readonly tile_size: Readonly<Vector2>;

		public readonly tiles: Tile[] = [];
		public readonly properties: Property[] = [];

		constructor(o: ITileset) {
			super();

			this.name = o.name;

			this.image = o.image;
			this.imagewidth = o.imagewidth;
			this.imageheight = o.imageheight;
			this.image_size = GObject.freeze(new Vector2(this.imagewidth, this.imageheight));

			this.columns = o.columns;
			this.firstgid = o.firstgid;
			this.margin = o.margin;
			this.spacing = o.spacing;

			this.tilecount = o.tilecount;
			this.tilewidth = o.tilewidth;
			this.tileheight = o.tileheight;
			this.tile_size = GObject.freeze(new Vector2(this.tilewidth, this.tileheight));

			for(let i = 0; i < o.tiles.length; i++) {
				this.tiles[i] = new Tile(o.tiles[i]);
			}

			for(let i = 0; i < o.properties.length; i++) {
				this.properties[i] = new Property(o.properties[i]);
			}
		}
	}

	export class Map extends EventDispatcher implements IMap {
		public readonly version: number;
		public readonly type: string;

		public readonly width: number;
		public readonly height: number;
		public readonly size: Readonly<Vector2>;

		public readonly nextlayerid: number;
		public readonly nextobjectid: number;
		public readonly infinite: boolean;
		public readonly orientation: string;
		public readonly renderorder: string;

		public readonly tiledversion: string;
		public readonly tilewidth: number;
		public readonly tileheight: number;
		public readonly tile_size: Readonly<Vector2>;

		public readonly layers: (TileLayer | ObjectGroup)[] = [];
		public readonly tilesets: Tileset[] = [];
		public readonly properties: Property[] = [];

		constructor(o: IMap) {
			super();

			this.version = o.version;
			this.type = o.type;

			this.width = o.width;
			this.height = o.height;
			this.size = GObject.freeze(new Vector2(this.width, this.height));

			this.nextlayerid = o.nextlayerid;
			this.nextobjectid = o.nextobjectid;
			this.infinite = o.infinite;
			this.orientation = o.orientation;
			this.renderorder = o.renderorder;

			this.tiledversion = o.tiledversion;
			this.tilewidth = o.tilewidth;
			this.tileheight = o.tileheight;
			this.tile_size = GObject.freeze(new Vector2(this.tilewidth, this.tileheight));


			for(let i = 0; i < o.layers.length; i++) {
				const layer = o.layers[i];
				if(layer.type === 'tilelayer') this.layers[i] = new TileLayer(layer);
				else if(layer.type === 'objectgroup') this.layers[i] = new ObjectGroup(layer);
				else console.log(layer);
			}

			for(let i = 0; i < o.tilesets.length; i++) {
				this.tilesets[i] = new Tileset(o.tilesets[i]);
			}

			for(let i = 0; i < o.properties.length; i++) {
				this.properties[i] = new Property(o.properties[i]);
			}
		}
	}
}
