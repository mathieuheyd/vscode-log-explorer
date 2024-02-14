import * as vscode from 'vscode';

export interface LogExplorerConfig {
    id: string;

    // URI of the log file
    fileUri: vscode.Uri;

    // Maximum number of lines to display at all time
    maxLinesCount: number;

    // Filtered services
    // undefined if services have not been fetched from the file
    filteredServices: FilteredService[] | undefined;

    // Patterns to filter lines
    // a line matching any of the pattern is kept
    matches: string[];

    // Filter logs between test start and end
    filteredTest: FilteredTest | undefined;
}

interface FilteredService {
    serviceName: string;
    selected: boolean;
}

interface FilteredTest {
    suiteName: string;
    testName: string;
}
