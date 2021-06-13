import { Packable, Unpackable } from './constants';
import { Decoder } from './decoder';
import { Encoder } from './encoder';

export * from './constants';

export function encode(value: Packable, defaultBufferSize?: number): Buffer {
	return new Encoder(defaultBufferSize).encode(value);
}

export function decode<T extends Unpackable = Unpackable>(data: Buffer): T {
	return new Decoder(data).decode() as T;
}
