export default class Bitfield<FlagType> {
	constructor(public raw: number) {}

	has(bit: FlagType): boolean {
		return (
			(this.raw & (bit as unknown as number)) === (bit as unknown as number)
		);
	}

	hasAll(bits: FlagType[]): boolean {
		return bits.every((bit) => this.has(bit));
	}

	apply(bits: FlagType[]): this {
		this.raw |= bits.reduce((a, b) => {
			return a | (b as unknown as number);
		}, 0);
		return this;
	}
}
