export class CustomMap<K, V> {
    private map = new Map<number, V>();
    private readonly hash: (key: K) => number;

    constructor(hash: (key: K) => number) {
        this.hash = hash;
    }

    add(key: K, value: V): void {
        this.map.set(this.hash(key), value);
    }

    has(key: K): boolean {
        return this.map.has(this.hash(key));
    }

    get(key: K): V | undefined {
        return this.map.get(this.hash(key));
    }

    delete(key: K): boolean {
        return this.map.delete(this.hash(key));
    }

    values(): V[] {
        return Array.from(this.map.values());
    }
}