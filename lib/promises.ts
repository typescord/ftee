/* eslint-disable @typescript-eslint/no-namespace, import/export, no-redeclare */
import { Packable, WithPackCustom, pack as packSync, unpack as unpackSync } from '.';

export type { Packable, WithPackCustom };

export function pack(data?: Packable | WithPackCustom): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		try {
			resolve(packSync(data));
		} catch (error) {
			reject(error);
		}
	});
}
pack['custom'] = packSync.custom;
export declare namespace pack {
	const custom: typeof packSync.custom;
}

export function unpack<T extends Exclude<Packable, WithPackCustom> = Exclude<Packable, WithPackCustom>>(
	data: Uint8Array | Uint8ClampedArray | Buffer,
): Promise<T> {
	return new Promise((resolve, reject) => {
		try {
			resolve(unpackSync<T>(data));
		} catch (error) {
			reject(error);
		}
	});
}
