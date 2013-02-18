/**
 * @overview Understand NEF-specific JSdoc 
 * @module plugins/nef
 * @author Job van Achterberg
 */

var conf = env.conf.nef;
var Token = Packages.org.mozilla.javascript.Token;
var apiMethods = {};

exports.handlers = {};
exports.nodeVisitor = { visitNode: nodeProcessor };

function nodeProcessor (node, e, parser, currentSourceName) {
    if (!node || !node.parent || !node.type)
        return;

    // skip functions inside apimethod declarations
    if (node.type === Token.FUNCTION && node.parent.hashCode() in apiMethods) {
        e.event = "symbolFound";
        return e.preventDefault = true;
    }

    if (node.type !== Token.CALL)
        return;

    var target = node.getTarget();

    if (!(target && target.left && target.right))
       return;

    var left  = String(target.left.toSource());
    var right = String(target.right.toSource());

    if (!(left === 'worker' && right === 'apiMethod'))
        return;

    var name = String(node.arguments.get(0).value);
    apiMethods[node.hashCode()] = true;

    var data = currentSourceName.match(/(atomic|compound)Workers\/(\w+)\//);
    var workerType = ( data && data[1] ) || 'unknown'; 
    var workerName = ( data && data[2] ) || 'unknown'; 

    e.id = 'astnode' + node.hashCode(); 
    e.comment = String(node.jsDoc || '');
    e.lineno = node.getLineno();
    e.filename = currentSourceName;
    e.path = '/root';
    e.astnode = node;
    e.kind = 'function';
    e.event = 'symbolFound';
    e.finishers = [parser.addDocletRef];
    e.code = {
        id : e.id,
        name: name,
        kind : 'function',
        node: node,
        file : e.filename,
    };
    e.nef = {
        worker : workerName,
        workerType : workerType,
        type   : 'apimethod',
        longname: workerType+'.'+workerName+'.'+name,
    };
}

exports.handlers.beforeParse = function (e) {
    e.source = e.source.replace(/#!\/usr\/bin\/node/,'');
};

exports.defineTags = function (dictionary) {
    dictionary.defineTag('structure', {
        isNamespace : true,
        onTagged : function(doclet, tag) {
console.log(require('util').inspect(doclet));
            var data = doclet.meta.path.match(/(atomic|compound)Workers\/(\w+)\/?/);
            var workerType = ( data && data[1]) || 'unknown';
            var workerName = ( data && data[2]) || 'unknown';
            var name = tag.text.match(/^([A-Za-z]+)(?:\s.*)?$/)[1];
            doclet.addTag('kind', 'structure');
            doclet.addTag('scope', 'inner');
            doclet.addTag('name', name);
            doclet.meta.nef = {
                worker     : workerName,
                workerType : workerType,
                longname   : workerType+'.'+workerName+'.'+name,
                type       : 'structure'
            };
        }
    });
};
