export class CustomSet<T> {
    private items: T[] = [];
    private readonly hash: (item: T) => number;

    constructor(hash: (item: T) => number) {
        this.hash = hash;
    }

    add(item: T): void {
        const key = this.hash(item);
        if (!this.items.some(existing => this.hash(existing) === key)) {
            this.items.push(item);
        }
    }

    has(item: T): boolean {
        return this.items.some(existing => this.hash(existing) === this.hash(item));
    }

    values(): T[] {
        return [...this.items];
    }
}