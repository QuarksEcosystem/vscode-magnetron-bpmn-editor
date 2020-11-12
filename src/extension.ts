import * as vscode from 'vscode';
import { BPMNEditorProvider } from './bpmnEditor';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom editor providers
	context.subscriptions.push(BPMNEditorProvider.register(context));

}