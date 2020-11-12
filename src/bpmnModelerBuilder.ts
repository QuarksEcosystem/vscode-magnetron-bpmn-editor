'use strict';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class BpmnModelerBuilder {
  contents: string;
  resources: any;

  public constructor(contents: string, resources: any) {
    this.contents = contents;
    this.resources = resources;
  }

  private removeNewLines(contents: string): string {
    return contents.replace(/(\r\n|\n|\r)/gm, ' ');
  }

  public buildModelerView(): string {
    this.contents = this.removeNewLines(this.contents);

    const head = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />

          <title>Magnetron Feature Modeler</title>

          <!-- modeler distro -->
          <script src="${this.resources.modelerDistro}"></script>
          <script src="${this.resources.propertyPanel}"></script>
          <script src="${this.resources.propertyProvider}"></script>

          <!-- required modeler styles -->
          <link rel="stylesheet" href="${this.resources.diagramStyles}">
          <link rel="stylesheet" href="${this.resources.bpmnFont}">

          <link rel="stylesheet" href="${this.resources.modelerStyles}">
          <link rel="stylesheet" href="${this.resources.propertyStyles}">

          <style>
            /*
             * Will be otherwise overridden by VSCode default styles
             */
            .djs-context-pad,
            .djs-popup {
              color: black;
            }
          </style>
        </head>`;

    const body = `
      <body>
        <div class="content">
          <div id="canvas"></div>
          <div id="properties"></div>
        </div>

        <div class="buttons">
          <div class="spinner"></div>
        </div>

        <script>

          const vscode = acquireVsCodeApi();

          // (1) persist web view state
          vscode.setState({ resourcePath: '${this.resources.resourceUri}'});

          // (2) react on messages from outside
          window.addEventListener('message', (event) => {
            const message = event.data;

            switch(message) {
              case 'saveFile': saveChanges(); break;
            }
          })

          // (3) bootstrap modeler instance
          const bpmnModeler = new BpmnJS({
            container: '#canvas',
            keyboard: { bindTo: document },
            additionalModules: [
              PropertyPanel,
              PropertyProvider
            ],
            propertiesPanel: {
              parent: '#properties'
            },
            elementTemplates: ${JSON.stringify(this.resources.processTemplate)},
            moddleExtensions: {
              camunda: ${JSON.stringify(this.resources.camundaModdleDescriptor)}
            }
          });

          keyboardBindings();

          /**
           * Open diagram in our modeler instance.
           *
           * @param {String} bpmnXML diagram to display
           */
          async function openDiagram(bpmnXML) {

            bpmnModeler.importXML(bpmnXML, function(err) {
              if (err) {
                console.log('could not import BPMN 2.0 diagram', err, warning);
              } else {
                const canvas = bpmnModeler.get('canvas');
                canvas.zoom('fit-viewport');

                listenChanges();
              }
            });
          }

          function saveDiagramChanges() {
            try {
              return bpmnModeler.saveXML({ format: true }, (err, xml) => {
                vscode.postMessage({
                  command: 'saveContent',
                  content: xml
                });
              });
            } catch (err) {
              console.error('could not save BPMN 2.0 diagram', err);
            }
          }

          function saveChanges() {
            const spinner = document.getElementsByClassName("spinner")[0];
            spinner.classList.add("active");

            saveDiagramChanges();

            setTimeout(function() {
              spinner.classList.remove("active");
            }, 1000);
          }

          function keyboardBindings() {
            const keyboard = bpmnModeler.get('keyboard');

            keyboard.addListener(function(context) {

              const event = context.keyEvent;

              if (keyboard.isKey(['s', 'S'], event) && keyboard.isCmd(event)) {
                saveChanges();
                return true;
              }
            });
          }

          function listenChanges() {
            const eventBus = bpmnModeler.get('eventBus');
            eventBus.on('commandStack.changed', function() {
              vscode.postMessage({
                command: 'contentChanged',
                content: ''
              });
            });
          }

          // open diagram
          openDiagram('${this.contents}');
        </script>
      </body>
    `;

    const tail = ['</html>'].join('\n');

    const final = head + body + tail;

    return final;
  }
}


export class EditingProvider {

  public constructor(private _context: vscode.ExtensionContext) { }

  private getUri(webview: vscode.Webview, ...p: string[]): vscode.Uri {
    const fileUri = vscode.Uri.file(path.join(this._context.extensionPath, ...p));

    return webview.asWebviewUri(fileUri);
  }

  public provideTextDocumentContent(localResource: vscode.Uri, webview: vscode.Webview): string {

    const localDocumentPath = localResource.fsPath;

    const contents = fs.readFileSync(localDocumentPath, { encoding: 'utf8' });

    const builder = new BpmnModelerBuilder(contents, {
      propertyPanel: this.getUri(webview, 'out', 'propertyPanel.js'),
      propertyProvider: this.getUri(webview, 'out', 'propertyProvider.js'),
      modelerDistro: this.getUri(webview, 'node_modules', 'bpmn-js', 'dist', 'bpmn-modeler.development.js'),
      diagramStyles: this.getUri(webview, 'node_modules', 'bpmn-js', 'dist', 'assets', 'diagram-js.css'),
      bpmnFont: this.getUri(webview, 'node_modules', 'bpmn-js', 'dist', 'assets', 'bpmn-font', 'css', 'bpmn.css'),
      modelerStyles: this.getUri(webview, 'out', 'assets', 'modeler.css'),
      propertyStyles: this.getUri(webview, 'out', 'assets', 'bpmn-js-properties-panel.css'),
      camundaModdleDescriptor: this.getUri(webview, 'node_modules', 'camunda-bpmn-moddle', 'resources', 'camunda.json'),
      processTemplate: this.getUri(webview, 'out', 'assets', 'processTemplate.json'),
      resourceUri: localResource
    });

    return builder.buildModelerView();
  }
}
