import * as vscode from 'vscode';
import { Command, path } from './command';

export async function sedCommand(startPattern: string, endPattern: string, fileUri?: vscode.Uri): Promise<Command> {
    var args =  [
        '-n',
        `/${startPattern}/,/${endPattern}/p`,
    ];
    if (fileUri !== undefined)
        args.push(await path(fileUri));

    return {
        tool: 'sed',
        args: args
    };
}
