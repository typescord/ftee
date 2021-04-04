# Erlpack

Erlpack is a fast encoder and decoder for the Erlang Term Format (version 131) for JavaScript.

### Packable things

- [x] Null
- [x] Booleans
- [x] Strings
- [ ] Atoms
- [x] Unicode Strings
- [x] Floats
- [x] Integers
- [x] Longs
- [ ] Longs over 64 bits
- [x] Objects
- [x] Arrays
- [ ] Tuples
- [ ] PIDs
- [ ] Ports
- [ ] Exports
- [ ] References

### How to pack

```js
const erlpack = require('@typescord/erlpack');

const packed = erlpack.pack({ a: true, list: ['of', 3, 'things', 'to', 'pack'] });
console.log(packed);
```

### How to unpack

Note: Unpacking requires the binary data be a `Buffer` or a typed array (e.g. `Uint8Array`).

```js
const erlpack = require('@typescord/erlpack');

const packed = Buffer.from('\u0083\u006d\u0000\u0000\u0000\u000bHello world', 'binary');
try {
	const unpacked = erlpack.unpack(packed);
	console.log(unpacked);
} catch (error) {
	console.error(error);
}
```

#### Decoding Bigs or not

```js
const erlpack = require('@typescord/erlpack');

const packed = erlpack.pack(1234567891011121314n);

console.log(erlpack.unpack(packed)); // 1234567891011121314n
console.log(erlpack.unpack(packed, true)); // 1234567891011121314n
console.log(erlpack.unpack(packed, false)); // "1234567891011121314"
```

### Promises

```js
const { promises: erlpack } = require('@typescord/erlpack');
// or
const erlpack = require('@typescord/erlpack/dist/promises');

erlpack
	.pack('\u0083\u006d\u0000\u0000\u0000\u000bHello world', 'binary')
	.then(erlpack.unpack)
	.then(console.log)
	.catch(console.error);

// in async context
const packed = await erlpack.pack('\u0083\u006d\u0000\u0000\u0000\u000bHello world', 'binary');
// ...
```

## How to make custom types packable

```js
const erlpack = require('@typescord/erlpack');

class User {
	constructor(name, age) {
		this.name = name;
		this.age = age;
	}

	[erlpack.pack.custom]() {
		return {
			name: this.name,
			age: this.age,
		};
	}
}

const jake = new User('Jake', 23);
const jack = new User('Jack', 60n ** 2n);
const packed = erlpack.pack({ data: [jake, 1, 2, jack, 'foo', { 4.8: [1n] }] });
```
