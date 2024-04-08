import * as vscode from 'vscode';
import { LogExplorerConfig } from "../config/logExplorerConfig";
import { catCommand } from "../shell/catCommand";
import { Command } from "../shell/command";
import { grepCommand } from "../shell/grepCommand";
import { sedCommand } from "../shell/sedCommand";

export async function allMatchingLines(config: LogExplorerConfig): Promise<Command[]> {
    var commands: Command[] = [];
    commands.push(await catCommand(config.fileUri));

    if (config.filteredTest !== undefined) {
        const startPattern = buildStartTestPattern(config.filteredTest.suiteName, config.filteredTest.testName);
        const endPattern = buildEndTestPattern(config.filteredTest.suiteName, config.filteredTest.testName);
        if (startPattern !== undefined && endPattern !== undefined)
            commands.push(await sedCommand(startPattern, endPattern));
    }

    if (config.matches.length > 0) {
        commands.push(await grepCommand(config.matches));
    }

    return commands;
}

function buildStartTestPattern(suiteName: string, testName: string): string | undefined {
    const startPattern = vscode.workspace.getConfiguration('logExplorer').get<string>('tests.testStartPattern');
    if (startPattern === undefined)
        return undefined;
    return startPattern.replace("{suiteName}", suiteName).replace("{testName}", testName);
}

function buildEndTestPattern(suiteName: string, testName: string): string | undefined {
    const startPattern = vscode.workspace.getConfiguration('logExplorer').get<string>('tests.testEndPattern');
    if (startPattern === undefined)
        return undefined;
    return startPattern.replace("{suiteName}", suiteName).replace("{testName}", testName);
}
