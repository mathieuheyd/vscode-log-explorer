import * as vscode from 'vscode';
import { ConfigProvider } from './configProvider';
import { LogExplorerConfig } from './logExplorerConfig';
import { logexUri } from '../logexUri';

export class ConfigUpdater {
    configProvider: ConfigProvider;

    onConfigUpdated: (logexUri: vscode.Uri) => void;
    onLogCountMaybeChanged: (logexUri: string) => void;

    constructor(configProvider: ConfigProvider, onConfigUpdated: (logexUri: vscode.Uri) => void, onLogCountMaybeChanged: (id: string) => void) {
        this.configProvider = configProvider;
        this.onConfigUpdated = onConfigUpdated;
        this.onLogCountMaybeChanged = onLogCountMaybeChanged;
    }

    currentLogexId() : string | undefined {
        const currentDocumentUri = vscode.window.activeTextEditor?.document.uri;
        
        if (currentDocumentUri === undefined)
            return undefined;

        if (currentDocumentUri.scheme !== "logex")
            return undefined;

        return currentDocumentUri.authority
    }

    current() : LogExplorerConfig | undefined {
        const currentId = this.currentLogexId();
        if (currentId === undefined)
            return undefined;

        const config = this.configProvider.get(currentId);
        const copy = JSON.parse(JSON.stringify(config));
        return copy;
    }

    get(id: string) : LogExplorerConfig | undefined {
        return this.configProvider.get(id);
    }

    update(config: LogExplorerConfig) {
        const previous = this.configProvider.get(config.id);
        if (previous === undefined)
            return;

        this.configProvider.update(config);

        const hasLogCountMaybeChanged = this.hasLogCountMaybeChanged(config, previous);

        if (hasLogCountMaybeChanged || this.hasConfigOnlyChanged(config, previous))
            this.onConfigUpdated(logexUri(config.id, config.fileUri));

        if (hasLogCountMaybeChanged)
            this.onLogCountMaybeChanged(config.id);
    }

    private hasConfigOnlyChanged(newConfig: LogExplorerConfig, previousConfig: LogExplorerConfig): boolean {
        if (newConfig.maxLinesCount != previousConfig.maxLinesCount)
            return true;

        const newHiddenServices = newConfig.filteredServices?.filter(s => !s.selected).map(s => s.serviceName) ?? [];
        const previousHiddenServices = previousConfig.filteredServices?.filter(s => !s.selected).map(s => s.serviceName) ?? [];
        if (!this.containSameElements(newHiddenServices, previousHiddenServices))
            return true;

        return false;
    }

    private hasLogCountMaybeChanged(newConfig: LogExplorerConfig, previousConfig: LogExplorerConfig): boolean {
        if (!this.containSameElements(newConfig.matches, previousConfig.matches))
            return true;

        if (newConfig.filteredTest?.suiteName !== previousConfig.filteredTest?.suiteName ||
            newConfig.filteredTest?.testName !== previousConfig.filteredTest?.testName)
            return true;

        return false;
    }

    private containSameElements(arr1: string[], arr2: string[]): boolean {
        if (arr1.length !== arr2.length)
            return false;

        const set1 = new Set(arr1);
        return arr2.every(e => set1.has(e));
    }
}
