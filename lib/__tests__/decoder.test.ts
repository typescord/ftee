import * as erlpack from '../index';

const helloWorldList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const helloWorldBinary = '\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009\u000A\u000B';

const helloWorldListWithNull = [1, 2, 3, 4, 5, 0, 6, 7, 8, 9, 10, 11];
const helloWorldBinaryWithNull = '\u0001\u0002\u0003\u0004\u0005\u0000\u0006\u0007\u0008\u0009\u000A\u000B';

describe('unpacks', () => {
	it('short list via string with null byte', () => {
		expect(erlpack.unpack(Buffer.from('\u0083k\u0000\u000C' + helloWorldBinaryWithNull, 'binary'))).toEqual(
			helloWorldListWithNull,
		);
	});

	it('short list via string without byte', () => {
		expect(erlpack.unpack(Buffer.from('\u0083k\u0000\u000B' + helloWorldBinary, 'binary'))).toEqual(helloWorldList);
	});

	it('binary with null byte', () => {
		expect(erlpack.unpack(Buffer.from('\u0083m\u0000\u0000\u0000\u000Chello\u0000 world', 'binary'))).toBe(
			'hello\u0000 world',
		);
	});

	it('binary without null byte', () => {
		expect(erlpack.unpack(Buffer.from('\u0083m\u0000\u0000\u0000\u000Bhello world', 'binary'))).toBe('hello world');
	});

	it('dictionary', () => {
		const data = Buffer.from(
			'\u0083t\u0000\u0000\u0000\u0003a\u0002a\u0002a\u0003l\u0000\u0000\u0000\u0003a\u0001a\u0002a\u0003jm\u0000\u0000\u0000\u0001aa\u0001',
			'binary',
		);
		const unpacked = erlpack.unpack(data);
		expect({ a: 1, 2: 2, 3: [1, 2, 3] }).toEqual(unpacked);
	});

	it('false', () => {
		expect(erlpack.unpack(Buffer.from('\u0083s\u0005false', 'binary'))).toBe(false);
	});

	it('true', () => {
		expect(erlpack.unpack(Buffer.from('\u0083s\u0004true', 'binary'))).toBe(true);
	});

	it('nil token is array', () => {
		expect(erlpack.unpack(Buffer.from('\u0083j', 'binary'))).toEqual([]);
	});

	it('nil atom is null', () => {
		expect(erlpack.unpack(Buffer.from('\u0083s\u0003nil', 'binary'))).toBeNull();
	});

	it('null is null', () => {
		expect(erlpack.unpack(Buffer.from('\u0083s\u0004null', 'binary'))).toBeNull();
	});

	it('floats', () => {
		expect(
			erlpack.unpack(Buffer.from('\u0083c2.50000000000000000000e+00\u0000\u0000\u0000\u0000\u0000', 'binary')),
		).toBe(2.5);
		expect(
			erlpack.unpack(Buffer.from('\u0083c5.15121238412343125000e+13\u0000\u0000\u0000\u0000\u0000', 'binary')),
		).toBe(51512123841234.31423412341435123412341342);
	});

	it('new floats', () => {
		expect(erlpack.unpack(Buffer.from('\u0083F\u0040\u0004\u0000\u0000\u0000\u0000\u0000\u0000', 'binary'))).toBe(2.5);
		expect(erlpack.unpack(Buffer.from('\u0083F\u0042\u00C7\u006C\u00CC\u00EB\u00ED\u0069\u0028', 'binary'))).toBe(
			51512123841234.31423412341435123412341342,
		);
	});

	it('small int', () => {
		for (let index = 0; index < 256; ++index) {
			const expected = Buffer.alloc(3);
			expected.write('\u0083a', 0, 2, 'binary');
			expected.writeUInt8(index, 2);
			expect(erlpack.unpack(expected)).toBe(index);
		}
	});

	it('int32', () => {
		expect(erlpack.unpack(Buffer.from('\u0083b\u0000\u0000\u0004\u0000', 'binary'))).toBe(1024);
		expect(erlpack.unpack(Buffer.from('\u0083b\u0080\u0000\u0000\u0000', 'binary'))).toBe(-2147483648);
		expect(erlpack.unpack(Buffer.from('\u0083b\u007F\u00FF\u00FF\u00FF', 'binary'))).toBe(2147483647);
	});

	it('small big ints', () => {
		expect(erlpack.unpack(Buffer.from('\u0083n\u0004\u0001\u0001\u0002\u0003\u0004', 'binary'))).toBe(-67305985);
		expect(erlpack.unpack(Buffer.from('\u0083n\u0004\u0000\u0001\u0002\u0003\u0004', 'binary'))).toBe(67305985);
		expect(() =>
			erlpack.unpack(
				Buffer.from('\u0083n\u000A\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009\u000A', 'binary'),
			),
		).toThrow(new Error('Unable to decode big ints larger than 8 bytes'));
	});

	it('big ints', () => {
		expect(
			erlpack.unpack(
				Buffer.from('\u0083o\u0000\u0000\u0000\u0008\u0001\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008', 'binary'),
				true,
			),
		).toBe(-578437695752307201n);
		expect(
			erlpack.unpack(
				Buffer.from('\u0083o\u0000\u0000\u0000\u0008\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008', 'binary'),
				true,
			),
		).toBe(578437695752307201n);
		expect(() =>
			erlpack.unpack(
				Buffer.from(
					'\u0083o\u0000\u0000\u0000\u000A\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009\u000A',
					'binary',
				),
				true,
			),
		).toThrow(new Error('Unable to decode big ints larger than 8 bytes'));
	});

	it('atoms', () => {
		expect(erlpack.unpack(Buffer.from('\u0083d\u0000\u000Dguild members', 'binary'))).toBe('guild members');
	});

	it('tuples', () => {
		expect(
			erlpack.unpack(Buffer.from('\u0083h\u0003m\u0000\u0000\u0000\u0006vanisha\u0001a\u0004', 'binary')),
		).toEqual(['vanish', 1, 4]);
		expect(
			erlpack.unpack(
				Buffer.from('\u0083i\u0000\u0000\u0000\u0003m\u0000\u0000\u0000\u0006vanisha\u0001a\u0004', 'binary'),
			),
		).toEqual(['vanish', 1, 4]);
	});

	it('compressed', () => {
		const expected = [2, [...Buffer.from("it's getting hot in here.")]];
		expect(
			erlpack.unpack(
				Buffer.from("\u0083l\u0000\u0000\u0000\u0002a\u0002k\u0000\u0019it's getting hot in here.j", 'binary'),
			),
		).toEqual(expected);
		expect(
			erlpack.unpack(
				Buffer.from(
					'\u0083P\u0000\u0000\u0000\u0024\u0078\u009C\u00CB\u0061\u0060\u0060\u0060\u004A\u0064\u00CA\u0066\u0090\u00CC\u002C\u0051\u002F\u0056\u0048\u004F\u002D\u0029\u00C9\u00CC\u004B\u0057\u00C8\u00C8\u002F\u0051\u00C8\u00CC\u0053\u00C8\u0048\u002D\u004A\u00D5\u00CB\u0002\u0000\u00A8\u00A8\u000A\u009D',
					'binary',
				),
			),
		).toEqual(expected);
	});

	it('nested compressed', () => {
		const expected = [[2, [...Buffer.from("it's getting hot in here.")]], 3];
		expect(
			erlpack.unpack(
				Buffer.from(
					"\u0083l\u0000\u0000\u0000\u0002l\u0000\u0000\u0000\u0002a\u0002k\u0000\u0019it's getting hot in here.ja\u0003j",
					'binary',
				),
			),
		).toEqual(expected);
		expect(
			erlpack.unpack(
				Buffer.from(
					'\u0083P\u0000\u0000\u0000\u002C\u0078\u009C\u00CB\u0061\u0060\u0060\u0060\u00CA\u0001\u0011\u0089\u004C\u00D9\u000C\u0092\u0099\u0025\u00EA\u00C5\u000A\u00E9\u00A9\u0025\u0025\u0099\u0079\u00E9\u000A\u0019\u00F9\u0025\u000A\u0099\u0079\u000A\u0019\u00A9\u0045\u00A9\u007A\u0059\u0089\u00CC\u0059\u0000\u00DC\u00F7\u000B\u00D9',
					'binary',
				),
			),
		).toEqual(expected);
	});

	it('references', () => {
		let reference = {
			node: 'Hello',
			id: [1245],
			creation: 1,
		};
		expect(
			erlpack.unpack(Buffer.from('\u0083em\u0000\u0000\u0000\u0005Hello\u0000\u0000\u0004\u00DD\u0001', 'binary')),
		).toEqual(reference);

		reference = {
			node: 'Hello',
			id: [10, 15, 1245],
			creation: 1,
		};
		expect(
			erlpack.unpack(
				Buffer.from(
					'\u0083r\u0000\u0003m\u0000\u0000\u0000\u0005Hello\u0001\u0000\u0000\u0000\u000A\u0000\u0000\u0000\u000F\u0000\u0000\u0004\u00DD',
					'binary',
				),
			),
		).toEqual(reference);
	});

	it('port', () => {
		const port = {
			node: 'Hello',
			id: 1245,
			creation: 1,
		};
		expect(
			erlpack.unpack(Buffer.from('\u0083fm\u0000\u0000\u0000\u0005Hello\u0000\u0000\u0004\u00DD\u0001', 'binary')),
		).toEqual(port);
	});

	it('pid', () => {
		const pid = {
			node: 'Hello',
			id: 1245,
			serial: 123456,
			creation: 1,
		};
		expect(
			erlpack.unpack(
				Buffer.from(
					'\u0083gm\u0000\u0000\u0000\u0005Hello\u0000\u0000\u0004\u00DD\u0000\u0001\u00E2\u0040\u0001',
					'binary',
				),
			),
		).toEqual(pid);
	});

	it('export', () => {
		const exp = {
			mod: 'guild_members',
			fun: 'append',
			arity: 1,
		};
		expect(
			erlpack.unpack(Buffer.from('\u0083qd\u0000\u000Dguild_membersd\u0000\u0006appenda\u0001', 'binary')),
		).toEqual(exp);
	});

	it('can unpack from TypedArray', () => {
		const data = Buffer.from('\u0083k\u0000\u000B' + helloWorldBinary, 'binary');
		const byteBuffer = new Uint8Array(data.length);
		for (const [index, datum] of data.entries()) {
			byteBuffer[index] = datum;
		}
		expect(erlpack.unpack(byteBuffer)).toEqual(helloWorldList);
	});

	it('excepts from malformed token', () => {
		const data = Buffer.from(
			'\u0083q\u0000\u0000\u0000\u0003a\u0002a\u0002a\u0003l\u0000\u0000\u0000\u0003a\u0001a\u0002a\u0003jm\u0000\u0000\u0000\u0001aa\u0001',
			'binary',
		);
		expect(() => erlpack.unpack(data)).toThrow(new Error('Unsupported erlang term type identifier found'));
		expect(() => erlpack.unpack(Buffer.from('\u0083k\u0000', 'binary'))).toThrow(
			new Error('Reading two bytes passes the end of the buffer.'),
		);
	});

	it('excepts from malformed array', () => {
		expect(() => erlpack.unpack(Buffer.from('\u0083t\u0000\u0000\u0000\u0003a\u0002a\u0002a\u0003', 'binary'))).toThrow(
			new Error('Unpacking beyond the end of the buffer'),
		);
	});

	it('excepts from malformed object', () => {
		const data = Buffer.from(
			'\u0083t\u0000\u0000\u0000\u0004a\u0002a\u0002a\u0003l\u0000\u0000\u0000\u0003a\u0001a\u0002a\u0003jm\u0000\u0000\u0000\u0001aa\u0001',
			'binary',
		);
		expect(() => erlpack.unpack(data)).toThrow(new Error('Unpacking beyond the end of the buffer'));
	});

	it('excepts from malformed atom', () => {
		expect(() => erlpack.unpack(Buffer.from('\u0083s\u0009true', 'binary'))).toThrow(
			new Error('Reading sequence past the end of the buffer.'),
		);
	});

	it('excepts from malformed integer', () => {
		expect(() => erlpack.unpack(Buffer.from('\u0083b\u0000\u0000\u0004', 'binary'))).toThrow(
			new Error('Reading three bytes passes the end of the buffer.'),
		);
	});

	it('excepts from malformed float', () => {
		expect(() =>
			erlpack.unpack(Buffer.from('\u0083c2.500000000000000e+00\u0000\u0000\u0000\u0000\u0000', 'binary')),
		).toThrow(new Error('Reading sequence past the end of the buffer.'));
	});

	it('excepts from malformed string', () => {
		expect(() => erlpack.unpack(Buffer.from('\u0083k\u0000\u000Bworld', 'binary'))).toThrow(
			new Error('Reading sequence past the end of the buffer.'),
		);
	});

	it('excepts from malformed binary', () => {
		expect(() => erlpack.unpack(Buffer.from('\u0083m\u0000\u0000\u0000\u000Chel', 'binary'))).toThrow(
			new Error('Reading sequence past the end of the buffer.'),
		);
	});

	it('non-buffer', () => {
		// @ts-expect-error just for unit test
		expect(() => erlpack.unpack('foo')).toThrow(new TypeError('Data must be a Buffer or a typed array.'));
	});

	it('promise', async () => {
		expect(await erlpack.promises.unpack(Buffer.from('\u0083n\u0004\u0000\u0001\u0002\u0003\u0004', 'binary'))).toBe(
			67305985,
		);

		expect(erlpack.promises.unpack(Buffer.from('\u0083m\u0000\u0000\u0000\u000Chel', 'binary'))).rejects.toEqual(
			new Error('Reading sequence past the end of the buffer.'),
		);
	});

	it('should respect decodeBigint', () => {
		const big = Buffer.from('\u0083n\u0008\u0000\u00A2\u0030\u00D2\u00B2\u00F4\u0010\u0022\u0011', 'binary');

		expect(erlpack.unpack(big, true)).toBe(1234567891011121314n);
		expect(erlpack.unpack(big, false)).toBe('1234567891011121314');
		expect(erlpack.unpack(big)).toBe('1234567891011121314');
	});
});
