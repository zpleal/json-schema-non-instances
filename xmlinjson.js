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
const { serialize } = require('v8');

const BUFFER_SIZE = 1024;

class Serializer {


    constructor() {
        this.BUILDER = Buffer.alloc(BUFFER_SIZE);
        this.offset = 0;
    }

    serialize(json) {

        this.offset = 0;
        this.makeNode(json);
        return this.BUILDER.toString('utf-8',0,this.offset);
    }

    /**
     * Write value to buffer
     * @param {*} value 
     */
    write(value) {
        const text   = typeof value === "string" ? value : value.toString();
    
        if(text.length + this.offset > BUFFER_SIZE)
            throw new Error("Buffer size exceeeded");
        
        this.BUILDER.write(text,this.offset);
        this.offset += text.length;
    }

    makeNode(node) {

        switch(typeof node) { 
            case "object":
                if("element" in node)
                    this.makeElement(node);
                else if("comment" in node)
                    this.makeComment(node);
                else if("processingInstruction" in node)
                    this.makeProcessingInstruction(node);
                else if("dtdDeclaration" in node)
                    this.makeDTDDeclaration(node);
                else
                    throw new Error(`Invalid node type (missing "element"?) in ${JSON.stringify(node)}`);    
                break;
            default:
                this.write(node);
                break;
        }
    }

    makeElement({element,attributes,content}) {
        const empty = content ? content.length == 0 : true;
    
        this.makeTag(element,attributes, empty ? 'EMPTY': 'START');
        if(content) {
            if(Array.isArray(content))
                content.forEach( (child) => this.makeNode(child) );
            else
                throw new Error(`Content must be an array; cannot be: ${content}`);
        }
        if(!empty)
            this.makeTag(element,null, 'END');
    }

    makeComment({comment}) {
        this.write(`<!--${comment}-->`);
    }
    
    makeProcessingInstruction({processingInstruction,attributes}) {
        this.write(`<?xml-${processingInstruction}`);
        this.makeAttributes(attributes);
        this.write(`?>`);
    }

    makeDTDDeclaration(dtdDeclaration) {
        this.write(dtdDeclaration);
    }

    makeTag(name,attributes,kind) {
        this.write(`<${kind == 'END' ? '/' : ''}${name}`);
        this.makeAttributes(attributes);
        this.write(`${kind == 'EMPTY' ? '/' : ''}>`);
    }

    /**
     * 
     * @param {*} attributes 
     */
    makeAttributes(attributes) {
        if(attributes) {
            if(typeof attributes === "object") {
                for(const name in attributes) {
                    const value = attributes[name];
                    const sep   = this.bestDelimiter(value);
                    this.write(` ${name}=${sep}${value}${sep}`);
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
    bestDelimiter(value) {
        const text = typeof value === "string" ? value : value.toString();
        const pos  = text.indexOf('\"');

        return (pos > -1 && text[pos-1] != '\\') ? '\'' : '\"' ;
    }    
}




// ----------

class Parser {

    /**
     * 
     * @param {string} text to parse 
     */
    constructor(text) {
        this.text = text;
    }

    parse() {
        this.current = 0;
        this.lineCount = 0;
        const content = this.parseContent();

        switch(content.length) {
            case 0:
                this.error('empty document');
            case 1:
                return content[0];
            default: // document with declaration and/or preamble
                this.error('not implemented yet');
        }
    }

    parseContent(name) {
        const content = [];
        let token;

        while(token = this.nextToken()) {
            switch(token.kind) {
                case 'STRING':
                    content.push(token.text);
                    break;
                case 'EMPTY':
                    const node = { element: token.name };
                    if(token.attributes)
                        node.attributes = token.attributes;
                    content.push(node); 
                    break;
                case 'START':
                    const parsedContent = this.parseContent(token.name);
                    const element = { element: token.name };

                    if(token.attributes)
                        element.attributes = token.attributes
                    if(parsedContent.length > 0)
                        element.content = parsedContent;

                    content.push(element);

                    break;
                case 'END':
                    if(token.name === name)
                        return content;
                    else 
                        this.error(`invalid close tag </${token.name}>, expected </${name}>`);
                case 'EXCLAMATION':
                    const found = token.text.match(/<!--(.*)-->/s);
                    
                    if(found) 
                        content.push({ comment: found[1] });
                    else
                        content.push({ dtdDeclaration: token.text });
                    break;

                case 'QUESTION':

                    if(token.name === 'xml') {
                        if(this.current - token.text.length > 0)
                            this.error(`XML declaration must start the document`);
                        else
                            content.push({xmlDeclaration: '', attributes: token.attributes });        
                    } else if (token.name.statsWith('xml-'))
                        content.push({ 
                            processingInstruction: token.name,
                            attributes: token.attributes
                        });
                    else
                        this.error(`invalid processing instruction ${token.text}`);
                    break;
                default:
                    this.error(`non implemented token ${token.kind}`);
            }
        }
        return content;
    }

    /**
     * 
     * @returns next token in text, or null if none
     */
    nextToken() {
        if(this.current == this.text.length)
            return null;

        const pos = this.text.indexOf('<',this.current);
        
        if(pos == this.current) {
            const end = this.text.indexOf('>',this.current);

            if(end == -1)
                this.error('expected >');
            
            const text = this.consume(this.current,end+1);
            return this.makeToken(text);

        } else {
            const end = pos > 0 ? pos : undefined ;
            const text = this.consume(this.current,end);

            return { kind: 'STRING', text };
        } 
    }

    /**
     * The name of the tag with given text
     * @param {string} text 
     * @returns name of tag
     */
    makeToken(text) {
        const found = text.match(/<([\?\/\!]?)([^\s\/\>]+)([^\/>]*)(\/?)>/m);

        if(found) {
            const kind  = this.makeKind(found[1],found[4]);
            const name  = found[2];
            const token = { kind, name, text };
            
            if(found[3]) {
                token.attributes = {};

                for(const [_all,name,_del,value] of found[3].matchAll(
                    /\s*([\w:_]*)\s*=\s*(?<d>"|')(.+?)(\k<d>)/gs)) 
                        token.attributes[name] = value; 
            }
            return token;
        } else
            return null;
    }
    
    /**
     * Decide on kind of tag based on left and right 
     * special characters:  / ? !
     * @param {string} left 
     * @param {string} right 
     * @returns 
     */
    makeKind(left,right) {
        const LEFT = {
            '/': 'END',
            '?': 'QUESTION',
            '!': 'EXCLAMATION'
        }

        const RIGHT = {
            '/': 'EMPTY'
        };
    
        if(left != '') {
            if(right != '')
                this.error(`invalid tag: ${text}`);
            else
                return LEFT[left];
        } else {
            if(right != '')
                return RIGHT[right];
            else
                return 'START';
        }
    }

    /**
     * Number of newlines in text
     * @param {string} text with newlines 
     * @returns count 
     */
    consume(start,end) {
        const consumed = this.text.substring(start,end);

        this.lineCount += consumed.match(/\n/g)?.length ?? 0;
        this.current = end;

        return consumed;
    }

    /**
     * Throws an error with with message 
     * and line number were it occured
     *  
     * @param {string} message 
     */
    error(message) {
        throw new Error(`Error in line ${this.lineCount}: ${message}`);
    }

}

module.exports = { 

    parse: function(dtd) {
        const parser = new Parser(dtd);

        return parser.parse();
    }, 

    serialize: function(json) {
        const serializer = new Serializer();

        return serializer.serialize(json);
    }
};