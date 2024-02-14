import { Memento } from "vscode";
import { LogExplorerConfig } from "./logExplorerConfig";
import { CachedServices } from "../provider/servicesFilterProvider";
import { CachedTests } from "../provider/testsFilterProvider";

abstract class Cache<T> {
    abstract suffix: string;

    private memento: Memento;

    constructor(memento: Memento) {
        this.memento = memento;
    }

    private keyWithSuffix(key: string) {
        return `${key}.${this.suffix}`;
    }

    get(key: string): T | undefined {
        return this.memento.get(this.keyWithSuffix(key));
    }

    update(key: string, value: T) {
        this.memento.update(this.keyWithSuffix(key), value);
    }

    delete(key: string) {
        this.memento.update(this.keyWithSuffix(key), undefined);
    }
}

abstract class MemotyCache<T> {
    abstract suffix: string;

    private values: Map<string, T>;

    constructor() {
        this.values = new Map<string, T>();
    }

    private keyWithSuffix(key: string) {
        return `${key}.${this.suffix}`;
    }

    get(key: string): T | undefined {
        return this.values.get(this.keyWithSuffix(key));
    }

    update(key: string, value: T) {
        this.values.set(this.keyWithSuffix(key), value);
    }

    delete(key: string) {
        this.values.delete(this.keyWithSuffix(key));
    }
}

export class ConfigCache extends Cache<LogExplorerConfig> {
    suffix = "config";
}

export class ServicesCache extends MemotyCache<CachedServices> {
    suffix = "services";
}

export class TestsCache extends MemotyCache<CachedTests> {
    suffix = "tests";
}
