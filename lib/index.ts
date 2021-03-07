/* eslint-disable  @typescript-eslint/no-var-requires */
import { join } from 'path';
import { find } from '@mapbox/node-pre-gyp';
const { pack: _pack, unpack: _unpack } = require(find(join(__dirname, '../package.json')));

const kPackSymbol = Symbol('erlpack.pack.custom');

export const packCustom = kPackSymbol;

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export function pack(data: any): Buffer {
	if (data?.[kPackSymbol]) {
		return _pack(data[kPackSymbol]());
	}
	return _pack(data);
}
export function unpack<T>(data: WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>): T {
	if (typeof data !== 'object') {
		throw new Error('Attempting to unpack a non-object.');
	}
	return _unpack(data);
}
