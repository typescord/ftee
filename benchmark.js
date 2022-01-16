const { cpus } = require('os');
const Benchmark = require('benchmark');
const ftee = require('./build');

const parsedData = {
	a: 1,
	b: { c: [3, 4, 5], d: { c: [{ 1: 2 }, 3, 'é	><,péé~~😀😉😐😑😍🤩😑😪😴😓😲'] } },
	d: null,
	e: { g: [{ h: null, i: 'j' }, '147878194'], a__bb: '124', 124: 4, 9: [] },
	6: undefined,
};
parsedData.x = { ...parsedData };

const data = JSON.stringify(parsedData);
const encodedData = ftee.encode(parsedData);

console.log(`Results (Node.js ${process.version}, ${cpus()[0].model}):\n`);

new Benchmark.Suite()
	// only for reference
	.add('JSON.parse', () => JSON.parse(data))
	.add('JSON.stringify', () => JSON.stringify(parsedData))

	.add('ftee.decode', () => ftee.decode(encodedData))
	.add('ftee.encode', () => ftee.encode(parsedData))
	.add('ftee.encode bis', () => ftee.encode(parsedData, encodedData.length))

	.on('cycle', ({ target }) => console.log(`${target}`))
	.run({ async: true });

// Results (Node.js v15.14.0, Intel(R) Core(TM) i5-2410M CPU @ 2.30GHz):

// JSON.parse x 102,567 ops/sec ±5.11% (81 runs sampled)
// JSON.stringify x 81,680  ops/sec ±1.13% (84 runs sampled)
// ftee.decode x 26,859  ops/sec ±4.66% (74 runs sampled)
// ftee.encode x 24,475  ops/sec ±2.06% (81 runs sampled)
// ftee.encode bis x 29,520  ops/sec ±1.48% (84 runs sampled)
