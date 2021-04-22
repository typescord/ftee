/* eslint-disable @typescript-eslint/no-namespace, import/export, no-redeclare */
import { Packable, WithPackCustom, pack as packSync, unpack as unpackSync } from '.';

export type { Packable, WithPackCustom };

/**
 * Pack data to ETF
 *
 * @param data - Data to ETF pack
 * @returns the ETF packed data
 */
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

/**
 * Unpack ETF packed data
 *
 * @param data - The ETF packed buffer data to unpack
 * @param [decodeBigint=false] - If big ints should be decoded as strings (`false`, by default) or BigInts (`true`)
 * @returns the unpacked data
 */
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
