import * as vscode from 'vscode';
import { Command, path } from './command';

export async function grepCommand(matches: string[], maxLines?: number, fileUri?: vscode.Uri): Promise<Command> {
    const args = matches.length == 0 ?
        ['-E', '.'] :
        matches.flatMap(m => ['-e', m]);
    if (maxLines !== undefined) {
        args.push('-m');
        args.push(maxLines.toString());
    }
    if (fileUri !== undefined)
        args.push(await path(fileUri));

    return {
        tool: 'grep',
        args: args,
    };
}
