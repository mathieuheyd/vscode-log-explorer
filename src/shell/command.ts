import * as vscode from 'vscode';
import { exec, spawn } from "child_process";
import * as readline from 'readline';
import { quote } from "shell-quote";

export interface Command {
    tool: string;
    args: string[];
}

export async function path(fileUri: vscode.Uri) : Promise<string> {
    return isWindows() ? await winPathToWsl(fileUri) : fileUri.fsPath;
}

export function execute(command: Command | Command[]) : Promise<string> {
    return isWindows() ? executeWsl(command) : executeUnix(command);
}

export function executeReadlines(command: Command | Command[]) : readline.Interface {
    return isWindows() ? executeReadLinesWsl(command) : executeReadLinesUnix(command);
}

function isWindows() {
    return process.platform == 'win32';
}

// wsl wslpath -a  c:\\Users\\mathieu\\all.log
function winPathToWsl(fileUri: vscode.Uri): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(
            `wsl wslpath -a "${fileUri.fsPath}"`,
            (err, stdout, stderr) => {
                if (err) {
                    return reject('Error: ' + stderr);
                }
                return resolve(stdout.slice(0, -1));
            }
        );
    });
}

// wsl --exec /bin/bash -c "grep workspace /mnt/c/Users/mathieu/all.log | head -100"
function executeWsl(command: Command | Command[]) : Promise<string>  {
    const pipedCommand = Array.isArray(command) ?
        command.map(c => quote([c.tool, ...c.args])).join(' | ') :
        quote([command.tool, ...command.args]);

    return new Promise((resolve, reject) => {
        exec(
            `wsl --exec /bin/bash -c "${pipedCommand}"`,
            (err, stdout, stderr) => {
                if (err) {
                    return reject('Error: ' + stderr);
                }
                return resolve(stdout.slice(0, -1));
            }
        );
    });
}

function executeReadLinesWsl(command: Command | Command[]): readline.Interface {
    const pipedCommand = Array.isArray(command) ?
        command.map(c => quote([c.tool, ...c.args])).join(' | ') :
        quote([command.tool, ...command.args]);

    const output = spawn(
        'wsl',
        ['--exec', '/bin/bash', '-c', pipedCommand],
    );
    return readline.createInterface({ input: output.stdout });
}

function executeUnix(command: Command | Command[]): Promise<string> {
    const pipedCommand = Array.isArray(command) ?
        command.map(c => quote([c.tool, ...c.args])).join(' | ') :
        quote([command.tool, ...command.args]);

    return new Promise((resolve, reject) => {
        exec(
            pipedCommand,
            (err, stdout, stderr) => {
                if (err) {
                    return reject('Error: ' + stderr);
                }
                return resolve(stdout);
            }
        );
    });
}

function executeReadLinesUnix(command: Command | Command[]): readline.Interface {
    const pipedCommand = Array.isArray(command) ?
        command.map(c => quote([c.tool, ...c.args])).join(' | ') :
        quote([command.tool, ...command.args]);

    const output = spawn(
        'sh',
        ['-c', pipedCommand],
    );
    return readline.createInterface({ input: output.stdout });
}
