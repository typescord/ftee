import {
	INTEGER_EXT,
	LARGE_BIG_EXT,
	LIST_EXT,
	MAP_EXT,
	NEW_FLOAT_EXT,
	NIL_EXT,
	SMALL_ATOM_UTF8_EXT,
	SMALL_BIG_EXT,
	SMALL_INTEGER_EXT,
	BINARY_EXT,
	VERSION,
	Packable,
} from './constants';

export class Encoder {
	public static readonly DEFAULT_BUFFER_SIZE = 128;

	private buffer: Buffer;
	private offset = 1;

	public constructor(defaultBufferSize = Encoder.DEFAULT_BUFFER_SIZE) {
		this.buffer = Buffer.alloc(defaultBufferSize);
		this.buffer.writeUInt8(VERSION);
	}

	private ensure(size: number) {
		const capacity = this.buffer.length;
		const minCapacity = this.offset + size + 1;
		if (minCapacity > capacity) {
			this.buffer.copy((this.buffer = Buffer.alloc(Math.max(capacity * 2, minCapacity))));
		}
	}

	private append8(value: number) {
		this.buffer.writeUInt8(value, this.offset++);
	}

	private append32(value: number) {
		this.buffer.writeUInt32BE(value, this.offset);
		this.offset += 4;
	}

	public encode(value: Packable): Buffer {
		this.encodeValue(value);
		return this.buffer.slice(0, this.offset);
	}

	// eslint-disable-next-line sonarjs/cognitive-complexity
	private encodeValue(value: Packable) {
		if (value == null) {
			this.encodeAtom('nil');
			return;
		}

		switch (typeof value) {
			case 'object': {
				if (Array.isArray(value)) {
					if (value.length === 0) {
						this.ensure(1);
						this.append8(NIL_EXT);
						break;
					}

					this.ensure(1 + 4 + 1);
					this.append8(LIST_EXT);
					this.append32(value.length);
					// eslint-disable-next-line unicorn/no-for-loop
					for (let i = 0; i < value.length; i++) {
						this.encodeValue(value[i]);
					}
					this.append8(NIL_EXT);
					break;
				}

				this.ensure(1 + 4);
				this.append8(MAP_EXT);
				const keys = Object.keys(value);
				this.append32(keys.length);
				// eslint-disable-next-line unicorn/no-for-loop
				for (let i = 0; i < keys.length; i++) {
					this.encodeString(keys[i]); // the key is always a string
					this.encodeValue(value[keys[i]]);
				}
				break;
			}

			case 'string':
				this.encodeString(value);
				break;

			case 'number': {
				if (Number.isInteger(value)) {
					if (value > -1 && value < 1 << 8) {
						this.ensure(1 + 1);
						this.append8(SMALL_INTEGER_EXT);
						this.append8(value);
						break;
					}

					if (value >= 1 << 31 && value < -(1 << 31)) {
						this.ensure(1 + 4);
						this.append8(INTEGER_EXT);
						this.buffer.writeInt32BE(value, this.offset);
						this.offset += 4;
						break;
					}

					this.encodeBigInt(BigInt(value));
					break;
				}

				this.ensure(1 + 8);
				this.append8(NEW_FLOAT_EXT);
				this.buffer.writeDoubleBE(value, this.offset);
				this.offset += 8;
				break;
			}

			case 'boolean':
				this.encodeAtom(value ? 'true' : 'false');
				break;

			case 'bigint':
				this.encodeBigInt(value);
				break;

			default:
				throw new Error(`Unsupported value type (${typeof value}).`);
		}
	}

	private encodeString(string: string) {
		const stringLength = Buffer.byteLength(string);
		this.ensure(1 + 4 + stringLength);
		this.append8(BINARY_EXT);
		this.append32(stringLength);
		this.buffer.write(string, this.offset, stringLength);
		this.offset += stringLength;
	}

	private encodeAtom(atom: string) {
		this.ensure(1 + 1 + atom.length);
		this.append8(SMALL_ATOM_UTF8_EXT);
		this.append8(atom.length);
		// atom is always ASCII ('true', 'false', or 'nil').
		for (let i = 0; i < atom.length; i++) {
			this.buffer[this.offset++] = atom.charCodeAt(i);
		}
	}

	private encodeBigInt(value: bigint) {
		this.ensure(1 + 1 + 1);
		// assume that `value` is SMALL_BIG_EXT by default.
		this.append8(SMALL_BIG_EXT);
		const byteLengthIndex = this.offset++;
		this.append8(value < 0n ? 1 : 0);

		let ull = value < 0n ? -value : value;
		let byteLength = 0;
		while (ull > 0) {
			this.ensure(1);
			this.append8(Number(ull & 0xffn));
			ull >>= 8n;
			byteLength++;
		}

		if (byteLength < 256) {
			this.buffer.writeUInt8(byteLength, byteLengthIndex);
			return;
		}

		this.buffer.writeUInt8(LARGE_BIG_EXT, byteLengthIndex - 1);

		// shift values by 3.
		this.ensure(3);
		for (let i = this.offset; i >= byteLengthIndex; i--) {
			this.buffer[i + 3] = this.buffer[i];
		}
		this.offset += 3;

		this.buffer.writeUInt32BE(byteLength, byteLengthIndex);
	}
}
