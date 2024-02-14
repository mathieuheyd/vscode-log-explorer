import * as vscode from 'vscode';

export function logexUri(id: string, logUri: vscode.Uri): vscode.Uri {
    return vscode.Uri.parse('logex://' + id + '/' + logUri.fsPath);
}
