# Erlpack

Erlpack is a fast encoder and decoder for the Erlang Term Format (version 131) for JavaScript.

# JavaScript

## Things that can be packed:

- [x] Null
- [x] Booleans
- [x] Strings
- [ ] Atoms
- [x] Unicode Strings
- [x] Floats
- [x] Integers
- [ ] Longs
- [ ] Longs over 64 bits
- [x] Objects
- [x] Arrays
- [ ] Tuples
- [ ] PIDs
- [ ] Ports
- [ ] Exports
- [ ] References

## How to pack:

```js
const erlpack = require('@typescord/erlpack');

const packed = erlpack.pack({ a: true, list: ['of', 3, 'things', 'to', 'pack'] });
```

## How to unpack:

Note: Unpacking requires the binary data be a Uint8Array or Buffer.

```js
const erlpack = require('@typescord/erlpack');

const packed = Buffer.from('', 'binary');
let unpacked;
try {
	unpacked = erlpack.unpack(packed);
} catch (e) {
	// got an exception parsing
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
