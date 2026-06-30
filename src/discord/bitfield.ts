export default class Bitfield<FlagType> {
	constructor(public raw: bigint) {}

	has(bit: FlagType): boolean {
		const b = BigInt(bit as number);
		return (this.raw & b) === b;
	}

	hasAll(bits: FlagType[]): boolean {
		return bits.every((bit) => this.has(bit));
	}

	apply(bits: FlagType[]): this {
		this.raw |= bits.reduce((a, b) => {
			return a | BigInt(b as number);
		}, 0n);
		return this;
	}
}
