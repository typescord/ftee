import { Packable, WithPackCustom, TypedArray, pack as packSync, unpack as unpackSync } from '.';

export function pack(data?: Packable | WithPackCustom): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		try {
			resolve(packSync(data));
		} catch (error) {
			reject(error);
		}
	});
}

export function unpack<T extends Exclude<Packable, WithPackCustom> = Exclude<Packable, WithPackCustom>>(
	data: TypedArray | Buffer,
): Promise<T> {
	return new Promise((resolve, reject) => {
		try {
			resolve(unpackSync<T>(data));
		} catch (error) {
			reject(error);
		}
	});
}
