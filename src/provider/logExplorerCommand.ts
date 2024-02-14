import { LogExplorerConfig } from "../config/logExplorerConfig";
import { Command } from "../shell/command";
import { grepCommand } from "../shell/grepCommand";
import { sedCommand } from "../shell/sedCommand";

export async function allMatchingLines(config: LogExplorerConfig): Promise<Command[]> {
    var commands: Command[] = [];

    if (config.filteredTest !== undefined) {
        const fullTestName = `${config.filteredTest.suiteName} - ${config.filteredTest.testName}`;
        commands.push(await sedCommand(`Starting test: ${fullTestName}`, `Ending test: ${fullTestName}`, config.fileUri));
    }

    commands.push(await grepCommand(config.matches, undefined, commands.length === 0 ? config.fileUri : undefined));

    return commands;
}
