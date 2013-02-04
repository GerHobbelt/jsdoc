/**
 * @overview Understand NEF-specific JSdoc 
 * @module plugins/nef
 * @author Job van Achterberg
 */

var conf = env.conf.nef;
var Token = Packages.org.mozilla.javascript.Token;
var apiMethods = {};

exports.nodeVisitor = { visitNode: nodeProcessor };

function nodeProcessor (node, e, parser, currentSourceName) {
    if (!node.parent)
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

    var workerName = currentSourceName.match(/(\w+)Worker\.js$/);
    workerName = ( workerName && workerName[1] ) || 'unknown'; 

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
        type   : 'apimethod',
        longname: workerName+'.'+name,
    };
}

exports.defineTags = function (dictionary) {
    dictionary.defineTag('structure', {
        isNamespace : true,
        onTagged : function(doclet, tag) {
            var workerName = doclet.meta.filename.match(/^(\w+)Worker\.js$/)[1];
            var name = tag.text.match(/^([A-Za-z]+)(?:\s.*)?$/)[1];
            doclet.addTag('kind', 'structure');
            doclet.addTag('scope', 'inner');
            doclet.addTag('name', name);
            doclet.meta.nef = {
                worker   : workerName,
                longname : workerName+'.'+name,
                type     : 'structure'
            };
        }
    });
};
