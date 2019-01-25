import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import MathML from './mathml';
import WirisEdition from './wirisedition';

import Core from './core/src/core.src.js';
import Parser from './core/src/parser.js';
import Util from './core/src/util.js';
import Image from './core/src/image.js';
import Configuration from './core/src/configuration.js';
import Listeners from './core/src/listeners';
import backwardsLib from './core/src/backwardslib.js';
import polyfills from './core/src/polyfills.js';
import IntegrationModel from './core/src/integrationmodel.js';
import CoreMathML from './core/src/mathml.js';
import Latex from './core/src/latex';

// Expose WirisPlugin variable to the window.
window.WirisPlugin = {
    Core: Core,
    Parser: Parser,
    Image: Image,
    MathML: CoreMathML,
    Util: Util,
    Configuration: Configuration,
    Listeners: Listeners,
    IntegrationModel: IntegrationModel,
    Latex: Latex
}

export default class Wiris extends Plugin {
    
    static get requires() {
        return [ MathML, WirisEdition ];
    }

    static get pluginName() {
        return 'Wiris';
    }

}