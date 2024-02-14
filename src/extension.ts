import * as vscode from 'vscode';
import { LogExplorerProvider } from './provider/logExplorerProvider';
import { ConfigProvider } from './config/configProvider';
import { ServicesFilterProvider } from './provider/servicesFilterProvider';
import { GeneralConfigProvider } from './provider/generalConfigProvider';
import { MatchesFilterProvider } from './provider/matchesFilterProvider';
import { ConfigUpdater } from './config/configUpdater';
import { logexUri } from './logexUri';
import { TestsFilterProvider } from './provider/testsFilterProvider';
import { ConfigCache, ServicesCache, TestsCache } from './config/cache';

export function activate(context: vscode.ExtensionContext) {
	const configCache = new ConfigCache(context.workspaceState);
	const servicesCache = new ServicesCache();
	const testsCache = new TestsCache();

	const configProvider = new ConfigProvider(configCache);
	const logExplorerProvider = new LogExplorerProvider(configProvider);
	const configUpdater = new ConfigUpdater(configProvider, (uri) => {
		logExplorerProvider.onDidChangeEmitter.fire(uri);
	}, async (id) => {
		servicesFilterProvider.refreshCount(id);
	});

	// register views
	const generalConfigProvider = new GeneralConfigProvider(configUpdater);
	vscode.window.registerTreeDataProvider('logExplorerGeneral', generalConfigProvider);

	const matchFilterProvider = new MatchesFilterProvider(configUpdater);
	vscode.window.registerTreeDataProvider('logExplorerMatches', matchFilterProvider);

	const servicesFilterProvider = new ServicesFilterProvider(configUpdater, servicesCache, (total) => {
		servicesFilterView.message = `${total.toLocaleString()} matching log lines`
	});
	const servicesFilterView = vscode.window.createTreeView('logExplorerServices', { treeDataProvider: servicesFilterProvider });
	servicesFilterView.onDidChangeCheckboxState(event => {
		servicesFilterProvider.updateSelection(event.items[0][0] as any);
	});

	const testFilterProvider = new TestsFilterProvider(configUpdater, testsCache);
	const testsFilterView = vscode.window.createTreeView('logExplorerTests', { treeDataProvider: testFilterProvider });
	testsFilterView.onDidChangeCheckboxState(event => {
		testFilterProvider.updateSelection(event.items[0][0] as any);
	});

	// register context change
	const logexContext = vscode.window.onDidChangeActiveTextEditor((editor) => {
		const isLogexUri = editor?.document.uri.scheme === "logex";
		vscode.commands.executeCommand('setContext', 'logex:activeLogEditor', isLogexUri);

		if (isLogexUri) {
			generalConfigProvider.refresh();
			matchFilterProvider.refresh();
			servicesFilterProvider.refresh();
			testFilterProvider.refresh();
			vscode.commands.executeCommand("logExplorerGeneral.focus");
		}
	});

	vscode.workspace.onDidCloseTextDocument((document) => {
		const isLogexUri = document.uri.scheme === "logex";
		if (isLogexUri) {
			// clean all document storages
			const logexKey = document.uri.authority;
			configCache.delete(logexKey);
			servicesCache.delete(logexKey);
			testsCache.delete(logexKey);
		}
	});

	// register content provider
	vscode.workspace.registerTextDocumentContentProvider('logex', logExplorerProvider);

	const openLogFile = vscode.commands.registerCommand('log-explorer.openLogFile', async () => {
		// let user choose file
		const selectedFile = await selectFile();
		if (selectedFile == undefined)
			return;

		// create new context
		const id = configProvider.create(selectedFile);

		// open provider in new read-only document
		const doc = await vscode.workspace.openTextDocument(logexUri(id, selectedFile));
    	await vscode.window.showTextDocument(doc, { preview: false });
		vscode.commands.executeCommand("logExplorerGeneral.focus");
	});

	const editConfig = vscode.commands.registerCommand('log-explorer.editConfig', async (configItem: any) => {
		const currentValue = generalConfigProvider.getConfigValue(configItem);

		const newValue = await vscode.window.showInputBox({
			value: currentValue,
			prompt: "Edit Value"
		});

		if (newValue === undefined)
			return;

		generalConfigProvider.updateConfigValue(configItem, newValue);
	});

	const addMatch = vscode.commands.registerCommand('log-explorer.addMatch', async () => {
		const newMatch = await vscode.window.showInputBox({
			placeHolder: "Match",
			prompt: "Add Match"
		});

		if (newMatch === undefined)
			return;

		matchFilterProvider.addMatch(newMatch);
	});

	const removeMatch = vscode.commands.registerCommand('log-explorer.removeMatch', async (matchFilter: any) => {
		matchFilterProvider.removeMatch(matchFilter);
	});

	const selectSingleService = vscode.commands.registerCommand('log-explorer.selectSingleService', async (serviceFilter: any) => {
		servicesFilterProvider.selectSingle(serviceFilter);
	});

	context.subscriptions.push(
		logexContext,
		openLogFile,
		editConfig,
		addMatch,
		removeMatch,
		selectSingleService);
}

// This method is called when your extension is deactivated
export function deactivate() {}

export async function selectFile(): Promise<vscode.Uri | undefined>  {
	return vscode.window.showOpenDialog({
		canSelectFiles: true,
		canSelectFolders: false,
		canSelectMany: false
	}).then((files: vscode.Uri[] | undefined) => {
		if (files && files.length > 0)
			return files[0];
		else
			return undefined;
	});
}
