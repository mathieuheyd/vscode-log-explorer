import * as vscode from 'vscode';
import { ConfigUpdater } from '../config/configUpdater';

const maxLinesCountKey:string = "max-lines"; 

export class GeneralConfigProvider implements vscode.TreeDataProvider<GeneralConfigItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<GeneralConfigItem | undefined | void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    configUpdater: ConfigUpdater;

    constructor(configUpdater: ConfigUpdater) {
        this.configUpdater = configUpdater;
    }

    refresh(): void {
		this._onDidChangeTreeData.fire();
	}

    getTreeItem(element: GeneralConfigItem): GeneralConfigItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): GeneralConfigItem[] {
        if (element !== undefined)
            return [];

        const config = this.configUpdater.current();

        if (config === undefined)
            return [];
        
        return [
            new GeneralConfigItem(maxLinesCountKey, "Max Lines", config.maxLinesCount.toString())
        ];
    }

    getConfigValue(configItem: GeneralConfigItem): string | undefined {
        const config = this.configUpdater.current();

        if (config === undefined)
            return undefined;

        if (configItem.configKey === maxLinesCountKey)
            return config.maxLinesCount.toString();

        return undefined;
    }

    updateConfigValue(configItem: GeneralConfigItem, newValue: string) {
        const config = this.configUpdater.current();

        if (config === undefined)
            return;

        if (configItem.configKey === maxLinesCountKey) {
            const numberValue = Number(newValue);
            if (Number.isNaN(numberValue) && !Number.isInteger(numberValue) && numberValue <= 0)
            {
                vscode.window.showInformationMessage('Invalid value');
                return;
            }
            config.maxLinesCount = numberValue;
            this.configUpdater.update(config);
            this.refresh();
        }
    }
}

class GeneralConfigItem extends vscode.TreeItem {
    configKey: string;

    constructor(configKey: string, label: string, value: string) {
        super(label);
        this.description = value;
        this.configKey = configKey;
    }
}
