// Refs: https://github.com/discord/erlpack/blob/master/js/__tests__/decoder-test.js

import { test } from 'tap';
import { decode } from '.';

const helloWorldList = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
const helloWorldListWithNull = Buffer.from([1, 2, 3, 4, 5, 0, 6, 7, 8, 9, 10, 11]);

test('short list via string with null byte', (t) => {
	t.plan(1);
	const unpacked = decode<Buffer>(Buffer.from([131, 107, 0, 12, ...helloWorldListWithNull]));
	t.ok(unpacked.equals(helloWorldListWithNull));
});

test('short list via string without null byte', (t) => {
	t.plan(1);
	const unpacked = decode<Buffer>(Buffer.from([131, 107, 0, 11, ...helloWorldList]));
	t.ok(unpacked.equals(helloWorldList));
});

test('binary with null byte', (t) => {
	t.plan(1);
	t.equal(
		decode(Buffer.from([131, 109, 0, 0, 0, 12, 104, 101, 108, 108, 111, 0, 32, 119, 111, 114, 108, 100])),
		'hello\u0000 world',
	);
});

test('binary without null byte', (t) => {
	t.plan(1);
	const unpacked = decode(Buffer.from([131, 109, 0, 0, 0, 11, 104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]));
	t.equal(unpacked, 'hello world');
});

test('dictionary', (t) => {
	t.plan(1);
	const data = Buffer.from([
		131, 116, 0, 0, 0, 3, 97, 2, 97, 2, 97, 3, 108, 0, 0, 0, 3, 97, 1, 97, 2, 97, 3, 106, 109, 0, 0, 0, 1, 97, 97, 1,
	]);
	t.same(decode(data), { a: 1, 2: 2, 3: [1, 2, 3] });
});

test('false', (t) => {
	t.plan(1);
	t.ok(decode(Buffer.from([131, 115, 5, 102, 97, 108, 115, 101])) === false);
});

test('true', (t) => {
	t.plan(1);
	t.ok(decode(Buffer.from([131, 115, 4, 116, 114, 117, 101])) === true);
});

test('nil token is array', (t) => {
	t.plan(1);
	t.strictSame(decode(Buffer.from([131, 106])), []);
});

test('nil atom is null', (t) => {
	t.plan(1);
	t.ok(decode(Buffer.from([131, 115, 3, 110, 105, 108])) === null);
});

test('null is null', (t) => {
	t.plan(1);
	t.ok(decode(Buffer.from([131, 115, 4, 110, 117, 108, 108])) === null);
});

test('floats', (t) => {
	t.plan(2);
	const data1 = Buffer.from([
		131, 99, 50, 46, 53, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 101, 43, 48, 48, 0,
		0, 0, 0, 0,
	]);
	t.equal(decode(data1), 2.5);

	const data2 = Buffer.from([
		131, 99, 53, 46, 49, 53, 49, 50, 49, 50, 51, 56, 52, 49, 50, 51, 52, 51, 49, 50, 53, 48, 48, 48, 101, 43, 49, 51, 0,
		0, 0, 0, 0,
	]);
	t.equal(decode(data2), 51512123841234.31);
});

test('new floats', (t) => {
	t.plan(2);
	t.equal(decode(Buffer.from([131, 70, 64, 4, 0, 0, 0, 0, 0, 0])), 2.5);
	const unpacked = decode(Buffer.from([131, 70, 66, 199, 108, 204, 235, 237, 105, 40]));
	t.equal(unpacked, 51512123841234.31);
});

test('small int', (t) => {
	t.plan(256);
	for (let i = 0; i < 256; i++) {
		const unpacked = decode(Buffer.from([131, 97, i]));
		t.equal(unpacked, i, undefined, { diagnostic: true });
	}
});

test('int32', (t) => {
	t.plan(3);
	t.equal(decode(Buffer.from([131, 98, 0, 0, 4, 0])), 1024);
	t.equal(decode(Buffer.from([131, 98, 128, 0, 0, 0])), -2147483648);
	t.equal(decode(Buffer.from([131, 98, 127, 255, 255, 255])), 2147483647);
});

test('small big ints', (t) => {
	t.plan(3);
	t.equal(decode(Buffer.from([131, 110, 4, 1, 1, 2, 3, 4])), '-67305985');
	t.equal(decode(Buffer.from([131, 110, 4, 0, 1, 2, 3, 4])), '67305985');
	t.equal(decode(Buffer.from([131, 110, 10, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])), '47390263963055590408705');
});

test('large big ints', (t) => {
	t.plan(2);
	const data = Buffer.from([
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
	t.equal(decode(data), '1'.repeat(617));
	data.writeUInt8(1, 6); // sign -
	t.equal(decode(data), `-${'1'.repeat(617)}`);
});

test('atoms', (t) => {
	t.plan(1);
	t.equal(
		decode(Buffer.from([131, 100, 0, 13, 103, 117, 105, 108, 100, 32, 109, 101, 109, 98, 101, 114, 115])),
		'guild members',
	);
});

test('tuples', (t) => {
	t.plan(2);
	const unpacked1 = decode(Buffer.from([131, 104, 3, 109, 0, 0, 0, 6, 118, 97, 110, 105, 115, 104, 97, 1, 97, 4]));
	t.strictSame(unpacked1, ['vanish', 1, 4]);
	const unpacked2 = decode(
		Buffer.from([131, 105, 0, 0, 0, 3, 109, 0, 0, 0, 6, 118, 97, 110, 105, 115, 104, 97, 1, 97, 4]),
	);
	t.strictSame(unpacked2, ['vanish', 1, 4]);
});

test('malformed token', (t) => {
	t.plan(2);
	const data = Buffer.from([
		131, 113, 0, 0, 0, 3, 97, 2, 97, 2, 97, 3, 108, 0, 0, 0, 3, 97, 1, 97, 2, 97, 3, 106, 109, 0, 0, 0, 1, 97, 97, 1,
	]);
	t.throws(() => decode(data), new Error('Unsupported tag (113).'));
	t.throws(
		() => decode(Buffer.from([131, 107, 0])),
		new Error('The value of "offset" is out of range. It must be >= 0 and <= 1. Received 2'),
	);
});

test('malformed array', (t) => {
	t.plan(1);
	t.throws(
		() => decode(Buffer.from([131, 116, 0, 0, 0, 3, 97, 2, 97, 2, 97, 3])),
		new Error('The value of "offset" is out of range. It must be >= 0 and <= 11. Received 12'),
	);
});

test('wrong version', (t) => {
	t.plan(1);
	t.throws(() => decode(Buffer.from([130])), new Error('The version 130 is unsupported.'));
});
