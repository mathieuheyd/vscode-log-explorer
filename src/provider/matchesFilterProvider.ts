import * as vscode from 'vscode';
import { ConfigUpdater } from '../config/configUpdater';

export class MatchesFilterProvider implements vscode.TreeDataProvider<MatchFilter> {
    private _onDidChangeTreeData = new vscode.EventEmitter<MatchFilter | undefined | void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    configUpdater: ConfigUpdater;

    constructor(configUpdater: ConfigUpdater) {
        this.configUpdater = configUpdater;
    }

    getTreeItem(element: MatchFilter): vscode.TreeItem {
        return element;
    }

    getChildren(element?: MatchFilter): MatchFilter[] {
        if (element !== undefined)
            return [];

        const config = this.configUpdater.current();

        if (config === undefined)
            return [];


        return config.matches.map((m, i) => new MatchFilter(i, m));
    }

    addMatch(match: string): void {
        const config = this.configUpdater.current();
        if (config === undefined)
            return;
        config.matches.push(match);
        this.configUpdater.update(config);
        this.refresh();
    }

    removeMatch(matchFilter: MatchFilter): void {
        const config = this.configUpdater.current();
        if (config === undefined)
            return;
        config.matches.splice(matchFilter.index, 1);
        this.configUpdater.update(config);
        this.refresh();
    }

    refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

class MatchFilter extends vscode.TreeItem {
    index: number;

    constructor(index: number, matchPattern: string) {
        super(matchPattern);
        this.index = index;
    }
}
