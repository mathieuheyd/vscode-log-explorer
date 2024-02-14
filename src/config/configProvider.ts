import * as vscode from 'vscode';
import {v4 as uuidv4} from 'uuid';
import { LogExplorerConfig } from './logExplorerConfig';
import { ConfigCache } from './cache';

export class ConfigProvider {
    state: ConfigCache;

    constructor(state: ConfigCache) {
        this.state = state;
    }

    create(fileUri: vscode.Uri): string {
        const id = uuidv4();
        const config = {
            id: id,
            fileUri: fileUri,
            maxLinesCount: 100,
            filteredServices: undefined,
            matches: [],
            filteredTest: undefined
        };
        this.state.update(id, config);
        return id;
    }

    update(config: LogExplorerConfig) {
        this.state.update(config.id, config);
    }

    get(id: string): LogExplorerConfig | undefined {
        return this.state.get(id);
    }
}
