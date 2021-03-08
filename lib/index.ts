/* eslint-disable  @typescript-eslint/no-var-requires */
import { join } from 'path';
import { find } from '@mapbox/node-pre-gyp';
const erlpack = require(find(join(__dirname, '../package.json')));

const packCustom = Symbol('erlpack.pack.custom');

export type TypedArray =
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
export interface WithPackCustom {
	[packCustom](): Packable;
}

export type Packable =
	| string
	| number
	| bigint
	| null
	| undefined
	| boolean
	| WithPackCustom
	| Packable[]
	| { [P in string | number]: Packable };

export function pack(data?: Packable): Buffer {
	return erlpack.pack(data, packCustom);
}

export function unpack<T extends Exclude<Packable, WithPackCustom> = Exclude<Packable, WithPackCustom>>(
	data: TypedArray | Buffer,
): T {
	return erlpack.unpack(data);
}

export * as promises from './promises';
export { packCustom };
