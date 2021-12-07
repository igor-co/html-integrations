const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
    entry: {
        app: './global.js'
    },
    output: {
        path: path.resolve(__dirname, ''),
        filename: './wiris.js'
    },
    // Set watch to true for dev purposes.
    watch: false,
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
            // These options prevent Terser from generating a LICENSE.txt file
            terserOptions: {
                format: {
                    comments: false,
                },
            },
            extractComments: false,
        })],
    },
    module: {
        rules: [
            {
                // Rule to translate ES5 javascript files to ES6.
                test: /\.js$/,
                exclude: /node_modules\/(?!(@wiris\/mathtype-html-integration-devkit)\/).*/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/env']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                // For the modal close, minimize, maximize icons
                // The following expresion, looks for all the svg files inside the devkit folder and subfolders
                // /mathtype-html-integration-devkit\/?(?:[^\/]+\/?)*.svg$/
                test: /mathtype-html-integration-devkit\/styles\/icons\/[^\/]+\/[^\/]+\.svg$/,
                type: 'asset/source'
            },
            {
                test: /\.(png|ttf|otf|eot|svg|woff(2)?)(.*)?$/,
                exclude: /mathtype-html-integration-devkit\/styles\/icons\/[^\/]+\/[^\/]+\.svg$/,
                type: 'asset'
            }
        ]
    },
    stats: {
        colors: true
    },
    mode: 'none'
};