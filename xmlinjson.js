/********************************************************************\
 *  XML in JSON (XiJ or xij) is a JSON representation of XML        * 
 *                                                                  *
 * It intends to represent XML documents in JSON to processed       *
 * them in JavaScript, including XML features such as:              *
 *                                                                  *
 *   - mixed content                    V                           *
 *   - namespaces                       X                           *
 *   - different node types                                         *
 *           text                       V                           *
 *           element                    V
 *           comment,                   V
 *           processing instruction     V
 *
 *                                                                  *        
 * Document in XIJ are in general larger than their XML conterparts.*     
 * That's a feture, not a bug.                                      *                                                   
 *                                                                  +
 *                                                                  *  
 *                                         José Paulo Leal          * 
 *                                         December 2021            *   
\********************************************************************/

const { Buffer } = require('buffer');

function serialize(json) {

    offset = 0;
    makeNode(json);
    return BUILDER.toString('utf-8',0,offset);
}

const BUFFER_SIZE = 1024;
const BUILDER = Buffer.alloc(BUFFER_SIZE);
let offset = 0;

function write(value) {
    const text   = typeof value === "string" ? value : value.toString();
    const length = text.length;

    if(text.length + offset > BUFFER_SIZE)
        throw new Error("Buffer size exceeeded");
    
    BUILDER.write(text,offset);
    offset += text.length;
}

function makeNode(node) {

    switch(typeof node) { 
        case "object":
            if("element" in node)
                makeElement(node);
            else if("comment" in node)
                makeComment(node);
            else if("processingInstruction" in node)
                makeProcessingInstruction(node);
            else if("dtdDeclaration" in node)
                makeDTDDeclaration(node);
            else
                throw new Error(`Invalid node type (missing "element"?) in ${JSON.stringify(node)}`);    
            break;
        default:
            write(node);
            break;
    }
}

function makeElement({element,attributes,content}) {
    const empty = content ? content.length == 0 : true;

    makeTag(element,attributes, empty ? 'EMPTY': 'START');
    if(content) {
        if(Array.isArray(content))
            content.forEach( (child) => makeNode(child) );
        else
            throw new Error(`Content must be an array; cannot be: ${content}`);
    }
    if(!empty)
        makeTag(element,null, 'END');
}

function makeComment({comment}) {
    write(`<!--${comment}-->`);
}

function makeProcessingInstruction({processingInstruction,attributes}) {
    write(`<?xml-${processingInstruction}`);
    makeAttributes(attributes);
    write(`?>`);
}


function makeTag(name,attributes,kind) {
    write(`<${kind == 'END' ? '/' : ''}${name}`);
    makeAttributes(attributes);
    write(`${kind == 'EMPTY' ? '/' : ''}>`);
}

/**
 * 
 * @param {*} attributes 
 */
function makeAttributes(attributes) {
    if(attributes) {
        if(typeof attributes === "object") {
            for(const name in attributes) {
                const value = attributes[name];
                const sep   = bestDelimiter(value);
                write(` ${name}=${sep}${value}${sep}`);
            }
        } else {
            throw new Error(`Attributes must be an object, cannot be: ${attributes}`)
        }
    }
}

/**
 * Choose the best delimiter for an attribute, depending on its content 
 * Should be improved
 * 
 * @param {*} value of attribute
 * @returns either a double quote (default) or a single quote
 */
function bestDelimiter(value) {
    const text = typeof value === "string" ? value : value.toString();
    const pos  = text.indexOf('\"');

    return (pos > -1 && text[pos-1] != '\\') ? '\'' : '\"' ;
}



// parse: parse,

module.exports = {

    serialize: serialize
};