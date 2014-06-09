#!/usr/bin/env node

'use strict';

var fse = require('fs-extra');
var path = require('path');

var jsdocPath = path.resolve( path.join(__dirname, '..') );
var symlinkSrc = path.join( jsdocPath, 'lib', 'jsdoc' );
var symlinkDest = path.join( jsdocPath, 'node_modules', 'jsdoc' );


fse.removeSync(symlinkDest);

fse.mkdirsSync(symlinkDest);

fse.copySync(symlinkSrc, symlinkDest);
