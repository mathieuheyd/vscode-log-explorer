import * as vscode from 'vscode';
import { Command, path } from './command';

export async function headCommand(maxLinesCount: number, fileUri?: vscode.Uri): Promise<Command> {
    var args =  [
        `-${maxLinesCount}`
    ];
    if (fileUri !== undefined)
        args.push(await path(fileUri));

    return {
        tool: 'head',
        args: args
    };
}
