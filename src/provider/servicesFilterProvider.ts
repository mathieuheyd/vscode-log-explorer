import * as vscode from 'vscode';
import { cutCommand } from '../shell/cutCommand';
import { ConfigUpdater } from '../config/configUpdater';
import { Command, executeReadlines } from '../shell/command';
import { ServicesCache } from '../config/cache';
import { LogExplorerConfig } from '../config/logExplorerConfig';
import { allMatchingLines } from './logExplorerCommand';
import { catCommand } from '../shell/catCommand';

export class ServicesFilterProvider implements vscode.TreeDataProvider<ServiceFilter> {
    private _onDidChangeTreeData = new vscode.EventEmitter<ServiceFilter | undefined | void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    
    configUpdater: ConfigUpdater;
    servicesCache: ServicesCache;
    onTotalLogsCountChange: (total: number) => void;

    constructor(configUpdater: ConfigUpdater, servicesCache: ServicesCache, onTotalLogsCountChange: (total: number) => void) {
        this.configUpdater = configUpdater;
        this.servicesCache = servicesCache;
        this.onTotalLogsCountChange = onTotalLogsCountChange;

    }

    getTreeItem(element: ServiceFilter): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ServiceFilter): Promise<ServiceFilter[]> {
        if (element !== undefined)
            return Promise.resolve([]);

        const config = this.configUpdater.current();

        if (config === undefined)
            return Promise.resolve([]);
        
        let servicesLogCount: ServiceLogCount[];
        if (config.filteredServices === undefined)
        {
            // load services from the file
            servicesLogCount = await this.fetchAllServices(config.fileUri);
            this.servicesCache.update(config.id, { servicesLogCount: servicesLogCount });

            // save default selection in config
            config.filteredServices = servicesLogCount.map(s => { return { serviceName: s.serviceName, selected: true } });
            this.configUpdater.update(config);
        } else {
            servicesLogCount = this.servicesCache.get(config.id)?.servicesLogCount ?? [];
        }
        
        const selectedServices = Object.fromEntries(config.filteredServices.map(s => [s.serviceName, s.selected]));

        var totalMatchingCount = servicesLogCount.reduce((acc, currentValue) => {
            return acc + (selectedServices[currentValue.serviceName] ? currentValue.logCount : 0);
        }, 0);
        this.onTotalLogsCountChange(totalMatchingCount);

        const sortedServices = servicesLogCount.sort((a, b) => b.logCount - a.logCount);
        return sortedServices.map(s => new ServiceFilter(s.serviceName, s.logCount, selectedServices[s.serviceName]));
    }

    refresh(): void {
		this._onDidChangeTreeData.fire();
	}

    refreshCount(id: string): void {
        const config = this.configUpdater.get(id);

        if (config === undefined)
            return;

        this.fetchMatchingLinesLogCount(config).then((value) => {
            this.servicesCache.update(id, { servicesLogCount: value });
            this._onDidChangeTreeData.fire();
        });
	}

    updateSelection(service: ServiceFilter): void {
        const config = this.configUpdater.current();
        if (config === undefined)
            return;

        if (config.filteredServices === undefined)
            return;

        const updatedService = config.filteredServices.find(s => s.serviceName == service.serviceName);

        if (updatedService === undefined)
            return;

        updatedService.selected = service.checkboxState === vscode.TreeItemCheckboxState.Checked;
        this.configUpdater.update(config);
    }

    async fetchAllServices(fileUri: vscode.Uri): Promise<ServiceLogCount[]> {
        const command = await catCommand(fileUri);
        return this.fetchServicesLogCount([command]);
    }

    async fetchMatchingLinesLogCount(config: LogExplorerConfig): Promise<ServiceLogCount[]> {
        const commands = await allMatchingLines(config);
        return this.fetchServicesLogCount(commands);
    }

    async fetchServicesLogCount(displayLinesCommand: Command[]): Promise<ServiceLogCount[]> {
        const fullCommand = [...displayLinesCommand, await cutCommand(1)];
        return new Promise(function (resolve, reject) {
            const rl = executeReadlines(fullCommand);

            const servicesLogCount = new Map<string, number>();
            rl.on('line', serviceName => {
                if (serviceName === "") return;
                const previousCount = servicesLogCount.get(serviceName);
                if (previousCount === undefined)
                    servicesLogCount.set(serviceName, 1);
                else
                    servicesLogCount.set(serviceName, previousCount + 1);
            });

            rl.on("close", () => {
                const serviceFilters = Array.from(servicesLogCount).map(e => { return {
                    serviceName: e[0],
                    logCount: e[1]
                }});
                resolve(serviceFilters);
             });
        });
    }
}

export interface CachedServices {
    servicesLogCount: ServiceLogCount[];
}

interface ServiceLogCount {
    serviceName: string,
    logCount: number
}

class ServiceFilter extends vscode.TreeItem {
    serviceName: string;
    logCount: number;

    constructor(serviceName: string, logCount: number, selected: boolean) {
        super(serviceName, vscode.TreeItemCollapsibleState.None);
        this.serviceName = serviceName;
        this.logCount = logCount;
        this.description = logCount.toLocaleString();
        this.checkboxState = selected ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked;
    }
}
