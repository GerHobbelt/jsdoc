/**
    @module plugins/containment
    @author Ger Hobbelt <ger@hobbelt.com>
 */
'use strict';

var logger = require('jsdoc/util/logger');

var nestingLevel = 0;

exports.defineTags = function(dictionary) {
    dictionary.defineTag('{', {
        mustHaveValue: false,
        canHaveValue: true,
        canHaveType: false,
        canHaveName: false,
        onTagged: function(doclet, tag) {
            // console.log("STARTREGION: ", arguments);
            doclet.startRegion = tag;
            // hack to make it get through in unpatched JSDoc 
            // doclet.name = doclet.name || '~~~startregion~~~';
            doclet.kind = doclet.kind || '~~~regionmarker~~~';

            ++nestingLevel;
            doclet.regionNestingLevel = nestingLevel;
            
            // Do *not() push this one immediately as we want JSDoc to merge this one with the
            // next function / namespace / ... into a single doclet!
            // 
            //     doclet.pushImmediately = true;

            // try {
            //     throw new Error("kaboom!");
            // } catch (ex) {
            //     console.log("stack: ", ex.stack);
            // } 
        }
    });
    dictionary.defineTag('}', {
        mustHaveValue: false,
        canHaveValue: true,
        canHaveType: false,
        canHaveName: false,
        onTagged: function(doclet, tag) {
            // console.log("ENDREGION: ", arguments);
            doclet.endRegion = tag;
            // hack to make it get through in unpatched JSDoc 
            // doclet.name = doclet.name || '~~~endregion~~~';
            doclet.kind = doclet.kind || '~~~regionmarker~~~';
             
            // Push this doclet *immediately*: it stands on its own and will be filtered out
            // once the entire parse process (and our own doclet stream postprocessing) is done.
            doclet.pushImmediately = true;

            nestingLevel--;
            doclet.regionNestingLevel = nestingLevel;

            // try {
            //     throw new Error("kaboom!");
            // } catch (ex) {
            //     console.log("stack: ", ex.stack);
            // } 
        }
    });
};

exports.handlers = {
    /**
        Support `@{` and `@}` tags: everything within these two will be assigned a member of the
        given document node (namespace, class, ...) if they aren't already.
     */
    newDoclet: function(e) {
        // console.log("DOCLET: ", arguments);
        var tags = e.doclet.tags,
            tag,
            value;

        // any user-defined tags in this doclet?
        if (typeof tags !== 'undefined') {
            // only interested in the @source tags
            tags = tags.filter(function($) {
                return $.title === '{' || $.title === '}';
            });

            if (tags.length) {
                // console.log("region markers: ", tags);

                // // take the first one
                // tag = tags[0];

                // e.doclet.meta = e.doclet.meta || {};
                // e.doclet.meta.filename = value.filename || '';
                // e.doclet.meta.lineno = value.lineno || '';
            }
        }
    },

    fileComplete: function(e) {
        // console.log("fileComplete: ", arguments);
    }
};
