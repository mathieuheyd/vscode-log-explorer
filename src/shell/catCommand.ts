import * as vscode from 'vscode';
import { Command, path } from './command';

export async function catCommand(fileUri?: vscode.Uri): Promise<Command> {
    var args =  [];
    if (fileUri !== undefined)
        args.push(await path(fileUri));

    return {
        tool: 'cat',
        args: args
    };
}
