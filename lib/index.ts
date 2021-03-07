/* eslint-disable  @typescript-eslint/no-var-requires */
import { join } from 'path';
import { find } from '@mapbox/node-pre-gyp';
const erlpack = require(find(join(__dirname, '../package.json')));

const kPackSymbol = Symbol('erlpack.pack.custom');

export const packCustom = kPackSymbol;
type Packable =
	| string
	| number
	| bigint
	| null
	| undefined
	| boolean
	| Packable[]
	| { [P in string | number]: Packable };
type WithPackCustom = { [kPackSymbol]: () => Packable };

export function pack(data?: Packable | WithPackCustom): Buffer {
	if (data && typeof data === 'object' && kPackSymbol in data) {
		return erlpack.pack((data as WithPackCustom)[kPackSymbol]());
	}
	return erlpack.pack(data);
}

type TypedArray =
	| Int8Array
	| Uint8Array
	| Uint8ClampedArray
	| Int16Array
	| Uint16Array
	| Int32Array
	| Uint32Array
	| BigInt64Array
	| BigUint64Array
	| Float32Array
	| Float64Array;

export function unpack<T extends Packable = Packable>(data: TypedArray | Buffer): T {
	return erlpack.unpack(data);
}
