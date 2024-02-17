import { LogExplorerConfig } from "../config/logExplorerConfig";
import { catCommand } from "../shell/catCommand";
import { Command } from "../shell/command";
import { grepCommand } from "../shell/grepCommand";
import { sedCommand } from "../shell/sedCommand";

export async function allMatchingLines(config: LogExplorerConfig): Promise<Command[]> {
    var commands: Command[] = [];
    commands.push(await catCommand(config.fileUri));

    if (config.filteredTest !== undefined) {
        const fullTestName = `${config.filteredTest.suiteName} - ${config.filteredTest.testName}`;
        commands.push(await sedCommand(`Starting test: ${fullTestName}`, `Ending test: ${fullTestName}`));
    }

    if (config.matches.length > 0) {
        commands.push(await grepCommand(config.matches));
    }

    return commands;
}
