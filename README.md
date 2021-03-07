# Erlpack

Erlpack is a fast encoder and decoder for the Erlang Term Format (version 131) for JavaScript.

### Things that can be packed:

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

### How to pack:

```js
const erlpack = require('@typescord/erlpack');

const packed = erlpack.pack({ a: true, list: ['of', 3, 'things', 'to', 'pack'] });
console.log(packed);
```

### How to unpack:

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

## How to make custom types packable.

```js
const { packCustom } = require('@typescord/erlpack');

class User {
	constructor(name, age) {
		this.name = name;
		this.age = age;
	}

	[packCustom]() {
		return {
			name: this.name,
			age: this.age,
		};
	}
}
const user = new User('Jake', 23);
const packed = pack(user);
```
