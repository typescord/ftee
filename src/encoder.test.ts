import { test } from 'tap';
import { encode, Packable } from '.';
import { Encoder } from './encoder';

function testEncode(data: Packable, expected: Buffer) {
	return encode(data, expected.length).equals(expected);
}

test('string with null byte', (t) => {
	t.plan(1);
	const expected = Buffer.from([131, 109, 0, 0, 0, 12, 104, 101, 108, 108, 111, 0, 32, 119, 111, 114, 108, 100]);
	t.ok(testEncode('hello\u0000 world', expected));
});

test('string without null byte', (t) => {
	t.plan(1);
	const expected = Buffer.from([131, 109, 0, 0, 0, 11, 104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]);
	t.ok(testEncode('hello world', expected));
});

test('dictionary', (t) => {
	t.plan(1);
	const expected = Buffer.from([
		131, 116, 0, 0, 0, 3, 109, 0, 0, 0, 1, 50, 97, 2, 109, 0, 0, 0, 1, 51, 108, 0, 0, 0, 3, 97, 1, 97, 2, 97, 3, 106,
		109, 0, 0, 0, 1, 97, 97, 1,
	]);
	t.ok(testEncode({ a: 1, '2': 2, '3': [1, 2, 3] }, expected));
});

test('false', (t) => {
	t.plan(1);
	const expected = Buffer.from([131, 119, 5, 102, 97, 108, 115, 101]);
	t.ok(testEncode(false, expected));
});

test('true', (t) => {
	t.plan(1);
	const expected = Buffer.from([131, 119, 4, 116, 114, 117, 101]);
	t.ok(testEncode(true, expected));
});

test('null and undefined are nil atom', (t) => {
	t.plan(2);
	const expected = Buffer.from([131, 119, 3, 110, 105, 108]);
	// eslint-disable-next-line unicorn/no-null
	t.ok(testEncode(null, expected));
	t.ok(testEncode(undefined, expected));
});

test('floats as new floats', (t) => {
	t.plan(2);
	const expected1 = Buffer.from([131, 70, 64, 4, 0, 0, 0, 0, 0, 0]);
	t.ok(testEncode(2.5, expected1));
	const expected2 = Buffer.from([131, 70, 66, 199, 108, 204, 235, 237, 105, 40]);
	t.ok(testEncode(51512123841234.31, expected2));
});

test('small int', (t) => {
	t.plan(256);
	for (let i = 0; i < 256; i++) {
		const expected = Buffer.from([131, 97, i]);
		t.ok(testEncode(i, expected));
	}
});

test('int32', (t) => {
	t.plan(3);
	const expected1 = Buffer.from([131, 98, 0, 0, 4, 0]);
	t.ok(testEncode(1024, expected1));
	const expected2 = Buffer.from([131, 98, 128, 0, 0, 0]);
	t.ok(testEncode(1 << 31, expected2));
	const expected3 = Buffer.from([131, 98, 127, 255, 255, 255]);
	t.ok(testEncode(-(1 << 31) - 1, expected3));
});

test('big ints', (t) => {
	t.plan(6);
	const expected1 = Buffer.from([131, 110, 4, 0, 0, 0, 0, 128]);
	t.ok(testEncode(2 ** 31, expected1));
	const expected2 = Buffer.from([131, 110, 4, 1, 1, 0, 0, 128]);
	t.ok(testEncode(-1 - 2 ** 31, expected2));
	const expected3 = Buffer.from([131, 110, 4, 1, 1, 2, 3, 4]);
	t.ok(testEncode(-67305985n, expected3));
	const expected4 = Buffer.from([131, 110, 4, 0, 1, 2, 3, 4]);
	t.ok(testEncode(67305985n, expected4));
	const expected5 = Buffer.from([131, 110, 8, 1, 1, 2, 3, 4, 5, 6, 7, 8]);
	t.ok(testEncode(-578437695752307201n, expected5));
	const expected6 = Buffer.from([131, 110, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8]);
	t.ok(testEncode(578437695752307201n, expected6));
});

test('large big ints', (t) => {
	t.plan(2);
	const expected = Buffer.from([
		131, 111, 0, 0, 1, 0, 0, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199,
		113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113,
		28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28,
		199, 113, 28, 199, 113, 28, 199, 113, 22, 163, 161, 231, 18, 130, 10, 140, 88, 232, 79, 41, 99, 87, 160, 31, 239,
		212, 9, 5, 208, 206, 87, 81, 246, 53, 178, 215, 172, 140, 169, 180, 33, 82, 13, 69, 8, 242, 141, 255, 96, 221, 202,
		68, 140, 189, 213, 98, 4, 49, 253, 0, 197, 202, 104, 209, 131, 150, 170, 19, 94, 212, 245, 195, 220, 229, 139, 107,
		230, 29, 60, 56, 237, 150, 126, 12, 44, 208, 207, 249, 80, 146, 221, 125, 152, 15, 39, 124, 20, 199, 180, 178, 209,
		155, 138, 97, 145, 61, 252, 128, 215, 20, 37, 196, 3, 126, 19, 0, 255, 1, 88, 136, 207, 38, 78, 46, 46, 145, 149,
		228, 150, 44, 20, 72, 9, 57, 165, 193, 69, 132, 207, 89, 254, 121, 28, 3, 31, 151, 8, 119, 77, 187, 226, 242, 129,
		144, 212, 140, 1, 94, 91, 227, 101, 4, 64, 45, 96, 102, 81, 218, 17, 160, 136, 47, 63, 204, 120, 202, 146, 67, 172,
		167, 189, 251, 227, 28, 87, 4, 88,
	]);
	t.ok(testEncode(BigInt('1'.repeat(617)), expected));
	expected.writeUInt8(1, 6); // sign -
	t.ok(testEncode(-BigInt('1'.repeat(617)), expected));
});

test('list', (t) => {
	t.plan(1);
	const expected = Buffer.from([
		131, 108, 0, 0, 0, 4, 97, 1, 109, 0, 0, 0, 3, 116, 119, 111, 70, 64, 8, 204, 204, 204, 204, 204, 205, 109, 0, 0, 0,
		4, 102, 111, 117, 114, 106,
	]);
	t.ok(testEncode([1, 'two', 3.1, 'four'], expected));
});

test('empty list', (t) => {
	t.plan(1);
	t.ok(testEncode([], Buffer.from([131, 106])));
});

test('without defaultBufferSize', (t) => {
	t.plan(1);
	const encoder = new Encoder();
	encoder.encode([]);
	// @ts-expect-error for testing purposes only
	t.equal(encoder.buffer.length, Encoder.DEFAULT_BUFFER_SIZE);
});

test('invalid type', (t) => {
	t.plan(1);
	// @ts-expect-error for testing purposes only
	t.throws(() => encode(() => 1, 1), new Error(`Unsupported value type (function).`));
});
