import * as vscode from 'vscode';
import { ConfigUpdater } from '../config/configUpdater';
import { executeReadlines } from '../shell/command';
import { grepCommand } from '../shell/grepCommand';
import { TestsCache } from '../config/cache';

export class TestsFilterProvider implements vscode.TreeDataProvider<TestFilter> {
    private _onDidChangeTreeData = new vscode.EventEmitter<TestFilter | undefined | void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    
    configUpdater: ConfigUpdater;
    testsCache: TestsCache;

    constructor(configUpdater: ConfigUpdater, testsCache: TestsCache) {
        this.configUpdater = configUpdater;
        this.testsCache = testsCache;
    }

    getTreeItem(element: TestFilter): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TestFilter): Promise<TestFilter[]> {
        if (element !== undefined)
            return Promise.resolve(element.children ?? []);

        const config = this.configUpdater.current();

        if (config === undefined)
            return Promise.resolve([]);

        const cachedTests = this.testsCache.get(config.id);
        let testSuites: TestSuite[];
        if (cachedTests === undefined) {
            testSuites = await this.fetchAllTests(config.fileUri);
            this.testsCache.update(config.id, { suites: testSuites });
        } else {
            testSuites = cachedTests.suites;
        }
        
        return testSuites.map(s => new TestFilter(
            s.suiteName,
            undefined,
            s.tests.map(t => new TestFilter(s.suiteName, t, undefined, s.suiteName == config.filteredTest?.suiteName && t == config.filteredTest.testName))
        ));
    }

    refresh(): void {
		this._onDidChangeTreeData.fire();
	}

    updateSelection(testFilter: TestFilter): void {
        const config = this.configUpdater.current();
        if (config === undefined)
            return;

        if (testFilter.checkboxState === vscode.TreeItemCheckboxState.Checked) {
            config.filteredTest = {
                suiteName: testFilter.suiteName,
                testName: testFilter.testName!
            };
        } else {
            config.filteredTest = undefined;
        }
        this.configUpdater.update(config);
        this.refresh();
    }

    async fetchAllTests(fileUri: vscode.Uri): Promise<TestSuite[]> {
        const command = await grepCommand(['WorkspaceService.DebugTool.Controllers.DebugInternalController|Starting test: '], fileUri);
        return new Promise(function (resolve, reject) {
            const rl = executeReadlines(command);

            const testSuites = new Map<string, string[]>();
            const testSuitesOrder: string[] = [];

            rl.on('line', line => {
                if (line === "") return;
                const fullTestName = line.slice(line.indexOf('Starting test: ') + 'Starting test: '.length, -1);
                const split = fullTestName.split(' - ');
                const testSuite = split[0];
                const testName = split[1];
                let tests = testSuites.get(testSuite);
                if (tests === undefined) {
                    tests = [];
                    testSuites.set(testSuite, tests);
                    testSuitesOrder.push(testSuite);
                }
                tests.push(testName);
            });

            rl.on("close", () => {
                const suites = testSuitesOrder.map(s => { return { suiteName: s, tests: testSuites.get(s)! } });
                resolve(suites);
             });
        });
    }
}

class TestFilter extends vscode.TreeItem {
    suiteName: string;
    testName: string | undefined;
    children: TestFilter[] | undefined;

    constructor(suiteName: string, testName: string | undefined, children: TestFilter[] | undefined, selected?: boolean) {
        super(testName ?? suiteName, children !== undefined ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
        this.suiteName = suiteName;
        this.testName = testName;
        this.children = children;
        if (children !== undefined)
            this.description = children.length.toString();
        if (selected !== undefined)
            this.checkboxState = selected ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked;
    }
}

interface TestSuite {
    suiteName: string;
    tests: string[];
}

export interface CachedTests {
    suites: TestSuite[];
}
