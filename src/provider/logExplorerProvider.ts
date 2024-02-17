import * as vscode from 'vscode';
import { ConfigProvider } from '../config/configProvider';
import { execute } from '../shell/command';
import { allMatchingLines } from './logExplorerCommand';
import { headCommand } from '../shell/headCommand';
import { grepCommand } from '../shell/grepCommand';

export class LogExplorerProvider implements vscode.TextDocumentContentProvider {
    onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this.onDidChangeEmitter.event;

    configProvider: ConfigProvider;

    constructor(configProvider: ConfigProvider) {
        this.configProvider = configProvider;
    }

    async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
        const config = this.configProvider.get(uri.authority);

        if (config === undefined)
            return Promise.resolve('An unexpected error occured');

        var commands = await allMatchingLines(config);
        // filter services
        if (config.filteredServices !== undefined && config.filteredServices.some(s => !s.selected)) {
            const selectedServices = config.filteredServices?.filter(s => s.selected).map(s => s.serviceName) ?? [];
            commands.push(await grepCommand(selectedServices));
        }
        // limit number of lines
        commands.push(await headCommand(config.maxLinesCount));

        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            cancellable: false,
            title: 'Fetching logs'
        }, async progress => {
            return execute(commands);
        });
    }
}
