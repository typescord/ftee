/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-namespace, import/export, no-redeclare */
import { join } from 'path';
import { find } from '@mapbox/node-pre-gyp';
const erlpack = require(find(join(__dirname, '../package.json')));

const kPackCustom = Symbol.for('erlpack.pack.custom');

export interface WithPackCustom {
	[kPackCustom](): Packable;
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
	return erlpack.pack(data, kPackCustom);
}
pack['custom'] = kPackCustom;
export declare namespace pack {
	const custom: typeof kPackCustom;
}

/**
 * @param decodeBigint If it's `false`, bigs will be decoded as strings
 */
export function unpack<T extends Exclude<Packable, WithPackCustom> = Exclude<Packable, WithPackCustom>>(
	data: Uint8Array | Uint8ClampedArray | Buffer,
	decodeBigint = false,
): T {
	return erlpack.unpack(data, decodeBigint);
}

export * as promises from './promises';
