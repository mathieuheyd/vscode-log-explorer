import * as vscode from 'vscode';
import { Command, path } from './command';

export async function cutCommand(fieldIndex: number, fileUri?: vscode.Uri): Promise<Command> {
    var args =  [
        '-d',
        " ",
        `-f${fieldIndex}`
    ];
    if (fileUri !== undefined)
        args.push(await path(fileUri));

    return {
        tool: 'cut',
        args: args
    };
}
