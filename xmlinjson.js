

function serialize(JSON) {
    const builder = "";

    makeNode(JSON,builder);
    return builder;
}

function makeNode(node,builder) {

    switch(typeof node) { 
        case "string":
            builder += node;
            break;
        case "object":
            if("element" in node)
                makeElement(node,builder);
            else if("comment" in node)
                makeComment(node,builder);
            else if("processingInstruction" in mode)
                makeProcessingInstruction(node,builder);
            else if("dtdDeclaration" in node)
                makeDTDDeclaration(node,builder);
            else
            throw new Error("Invalid XML node type in JSON");    
            break;
        default:
            throw new Error("Invalid XML in JSON");
    }
}

function makeElement({element,attributes,content},builder) {
    const empty = content.length == 0;

    makeTag(element,attributes, empty ? 'EMPTY': 'START',builder);
    if(content)
        content.forEach( (child) => makeNode(child) );
    if(!empty)
        makeTag(element,null, 'END',builder);
}

function makeComment({comment},builder) {
    builder += `<!--${comment}-->`
}

function makeProcessingInstruction({processingIntruction,attributes},builder) {
    builder += `<?${processingIntruction}`
    makeAttributes(attributes,builder);
    builder +=  `?>`
}


function makeTag(name,attributes,kind,builder) {
    builder += `<${kind == 'END' ? '/' : ''}${name}`
    makeAttributes(attributes,builder);
    builder += `${kind == 'EMPTY' ? '/' : ''}`
}

function makeAttributes(attributes,builder) {
    if(attributes) {
        for(const name in attributes)
            builder += ` ${name}="${value}"`
    }
}

modules.export = {

    parse: parse,

    serialize: serialize
};