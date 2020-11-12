/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
'use strict';

const path = require('path');
const webpack = require('webpack');
/**@type {import('webpack').Configuration}*/

module.exports = [{
	target: 'web', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

	entry: {
		propertyPanel: './node_modules/bpmn-js-properties-panel/index.js'
	}, // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
	output: { // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
		path: path.resolve(__dirname, 'out'),
		filename: '[name].js',
		library: 'PropertyPanel',
		libraryTarget: "var",
	},

}, {
	target: 'web', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

	entry: {
		propertyProvider: './node_modules/bpmn-js-properties-panel/lib/provider/camunda/index.js'
	}, // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
	output: { // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
		path: path.resolve(__dirname, 'out'),
		filename: '[name].js',
		library: 'PropertyProvider',
		libraryTarget: "var",
	},

}

];