
/**
 * <!DOCTYPE top [
 * <!ELEMENT top (#PCDATA | b)>
 * <!ELEMENT b (#PCDATA)>
 * <!ATTLIST top x CDATA "" y CDATA ""> 
 * ]>
 * <top x="1" y="2>
 *     Hello <b>JSON</b> world
 * </top>
 * 
 * {
 *      "element": "top",
 *      "attributes": {
 *          "x": "1",
 *          "y": "2"
 *      },
 *      "content": [
 *          "Hello ",
 *          {
 *              "element": "b",
 *              "attributes": {},
 *              "content": [ "JSON" ]
 *          },
 *          " World"
 *      ]
 * }
 * 
 * {
 *      "definitions": {
 *          "top": {
 *              "$id": "top",
 *              "type": "object",
 *              "properties": {
 *                  "element": { "fixed" : "top"},
 *                  "attributes": {
 *                      "type": "object",
 *                      "properties": {
 *                          "x": { "type": "string"},
 *                          "y": { "type": "string"},
 *                      },
 *                      "required": [];
 *                  },
 *                  "content": {
 *                      "type": "array",
 *                      "items": {
 *                          "oneOf": [
 *                              { "type": "string"}
 *                              { "$ref": "b" }
 *                          ]
 *                      }  
 *                  }
 *              }
 *          },
 *          "b": {
 *              "$id": "b",
 *              "type": "object",
 *              "properties": {
 *                  "element": { "fixed": "b" },
 *                  "attributes": {},
 *                  "content": {
 *                      "type": "string"
 *                  }
 *          }
 *      }
 *      "$ref": "top"
 * }
 * 
 */

const jsonGenerator  = require('./generator.js');
const xml  = require('./xmlinjson.js');

class DTDgenerator {

    constructor(dtdSchema) {
        this.dtdSchema = dtdSchema;
        this.parseDtd();
    }

    /**
     * Instances of this DTD
     */
    *instances() {
        const jsonSchema = this.getJsonSchema();

        for(const json of jsonGenerator.instances( jsonSchema ) ) 
            yield xml.serialize(json);
    }

    /**
     * Instances of this DTD
     */
     *nonInstances() {
        const jsonSchema = this.getJsonSchema();

        for(const json of jsonGenerator.instances( jsonSchema ) ) 
            yield xml.serialize(json);
    }

    /**
     * Convert this DTD to a JSON Schem defintion
     */
    getJsonSchema() {
        const jsonSchema = { 
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            // "$id": "https://www.dcc.fc.up.pt/product.schema.json",

            "title": "JSON from DTD",
            "description": "JSON Schema generated from a DTD",
            "definitions": this.definitions 
        } 

        if(this.root) 
            jsonSchema.$ref = this.root;

        return jsonSchema;
    }

    parseDtd() {

        // TODO process parametric entities

        const found = this.dtdSchema.match(
            /<!DOCTYPE\s+(\w+)\s+(?:SYSTEM\s+(\w*)|PUBLIC\s(\w*)\s(\w*))?\s*(\[.*\])?>/ms);
    
        if(found) { 
            const [ _ , root, systemUrl, identifier, publicUrl, definitions ] = found;

            this.root     = root;

            if(systemUrl) 
                throw new Error("SYSTEM URLs not implemented yet");
            if(publicUrl) 
                throw new Error("PUBLIC URLs not implemented yet");

            this.parseTypes(definitions);
        } else
            this.parseTypes(this.dtdSchema);
    }

    /**
     * Parse DTD <!ELEMENT> and <!ATTLIST> and return JSON Schema defintions
     *  
     * @param {*} defs 
     */
    parseTypes(defs) {
        const elMatch = [ ...defs.matchAll(/<!ELEMENT\s+(\w+)\s+([^>]*)>/g) ];
        const atMatch = [ ...defs.matchAll(/<!ATTLIST\s+(\w+)\s+([^>]*)>/g) ];
        
        this.definitions = {};

        elMatch.forEach( (ele => this.processElement(ele)));

        atMatch.forEach( (att => this.processAttributes(att)));

    }

    /**
     * Process element name and model and add it to the definitions field
     * 
     * @param [name, model] element data  
     */
    processElement([ , name, model ]) {

        this.definitions[name] = {
            "$id": name,
            "title": `Type for ${name}`,
            "description": `Generated from model: ${model}`,
            "type": "object",
            "properties": {
                "element": { "const":  name },
                "attributes": {
                    "type": "object",
                    "properties": {},
                    "required": [],
                    "maxProperties": 0
                },
                "content": this.parseModel(model),                    
            },
            "required": [ "element" ]
        }
    }


    processAttributes([ , element, attlistdef ]) {
        const attlist = attlistdef.split(/\s+/);
        const definition = this.definitions[element];
        const attributes = definition.properties.attributes; 

        if(attlist.length > 0)
            definition.required.push("attributes");

        for( const [ attribute, type, ommit ] of attlist) {
            const schema = this.parseAttributeType(type);
            
            switch(ommit) {
                case "#REQUIRED":
                    attributes.required.push(attribute);
                    break;
                case "#IMPLIED":
                    // No default provided, not reqquired
                    break;
                default:
                    // JSON Schema validators do nothing with this 
                    schema.default = ommit;
            }
            attributes.properties[attribute] = schema;
            attributes.maxProperties++;
        }
    }

    parseAttributeType(type) {
        const jsonType = {};
        const enumeration = this.getEnumeration(type);

        if(enumeration)
            jsonType.enum = enumeration;
        else
            jsonType.type = "string";

        switch(type) {
            case "CDATA":
                break;
            case "ID":
            case "IDREF":
            case "NMTOKEN":
            case "ENTITY":
                // This is too simples, doesn't cover all valid chars
                jsonType.pattern = "[a-zA-Z_:]([a-zA-Z0-9_:.])*";
                break;
            case "IDREFS":
            case "NMTOKENS":
            case "ENTITIES":
                // This is too simples, doesn't cover all valid chars
                jsonType.pattern = "([a-zA-Z_:]([a-zA-Z0-9_:.])*\s+)+";
                break;
            default:
                throw new Error(`Invalid attribute type: ${type}`);
        }

        return jsonType;
    }

    /**
     * An array with an enumeration of null, it non exists
     * @param {*} type of attribute
     * @returns enumeration
     */
    getEnumeration(type) {
        const found = type.match(/\((.*)\)/);

        if(found) 
            return found[1].split(/\s*\|\s*/)
        else
            return;
    }   

    /**
     * Parse a model, as either
     *  - basic
     *  - mixed content
     *  - expression
     * 
     * The type for content is always an array
     * and the type for its items depends on the model
     * 
     * @param {string} model 
     * @returns type content
     */
    parseModel(model) {
        const schema = { 
            "type": "array",
            "title": "Type for element model",
            "description": `generated from ${model}`
        };
        
        schema.items =
                this.parseBasic(model,schema)    ??
                this.parseMixedContent(model)    ?? 
                this.parseExpression(model);

        if(schema.items == null) // may be false
            throw new Error(`Invalid model: ${model}`);

        return schema;
    }

    /**
     * Parse given model as basic and return a type for items
     * The schema itself is passed, to add other properties, if needed
     * @param {string} model to parse
     * @param {*} schema where the items are integrated (extra attributes)
     * @returns type for items or null if not basic 
     */
    parseBasic(model,schema) {
        switch(model) {
            case 'EMPTY':
                schema.maxContains = 0;
                return false;
            case 'ANY':
                return true;
            case '(#PCDATA)':
                schema.maxContains = 1;
                return { "type": "string" };
            case '(#RCDATA)':
                throw new Error("Avoid using raw character data");
            default:
                return null;
        }
    }

    /**
     * Parses given model as mixed content
     * 
     * @param {string} model to parse 
     * @returns type for items or null if not mixed content
     */
    parseMixedContent(model) {
        const found = model.match(/\(\s*(#PCDATA(?:\s*\|\s*\w+)+)\s*\)\*/m);
        
        if(found) {
            const types = found[1]
                .split(/\s*\|\s*/)
                .map( (t) => t === "#PCDATA" ? { "type": "string" } : { "$ref": t } );
         
            return { "anyOf": types};
        } else  
            return null;
    }

    /**
     * Parse model as expression
     * 
     * @param {string} expression to parse
     * @returns schema of null if not an expression
     */
    parseExpression(expression) {
        return this.parseParentesis(expression) ?? this.parseSingle(expression);
    }

    /**
     * Parses an expression with parentesis
     * @param {string} expression with, or withoyt, parentesis
     * @returns schema for given expression or null
     */
    parseParentesis(expression) {
        const found = expression.match(/\((.*)\)([\+\*\?]?)/m);

        if(found) {
            const [ body, repetitionOperator ] = found;
            return this.parseGroup(body,repetitionOperator);
        } else
            return null;
    }

    /**
     * Parses a single expression (without parentesis).
     * @param {string} expression ro parse
     * @returns schema for given expression or null if not a sigle expression
     */
    parseSingle(expression) {
        const found = expression.match(/(.*)([\+\*\?]?)/m);

        if(found) {
            const [ , body, repetitionOperator ] = found;
            
            return this.makeExpressionSchema('$ref', body, repetitionOperator);
        } else
            return null;
    }

    /**
     * Parses a group with ',' or '|'
     * @param {string} expression that might have ',' or '|' 
     * @param {string} repetitionOperator 
     * @returns a squema for this expression or null
     */
    parseGroup(expression,repetitionOperator) {
        const found = expression.match(/[\,\|]/);

        if(found) {
            const operator = found[0];
            const parts    = expression.split(new RegExp(`\s*${operator}\s*`));
            const type     = ',' ? 'sequence' : 'anyOf' ;
            const items    = parts.map( e => this.parseExpression(e) );

            return this.makeExpressionSchema(type, items, repetitionOperator);
        } else 
            null;
    }

    /**
     * Make a schema with  with given items and repetition
     * @param {*} kind   { 'sequence', 'oneOf' or '$ref' }
     * @param {*} value 
     * @param {*} repetitionOperator { '+', '*', '?' } 
     * @returns schema
     */
    makeExpressionSchema(kind,value,repetitionOperator) {
        const minOccurs = repetitionOperator == '+' ? 1 : 0 ;
        const maxOccurs = repetitionOperator == '?' ? 1 : "unbounded" ;
        const group = { minOccurs, maxOccurs };

        group[kind] = value;

        return group;
    }
}

module.exports = {

    getJsonSchema: function(dtd) {
        const generator = new DTDgenerator(dtd);

        return generator.getJsonSchema();
    },

    validate: function(dtd,xmlDoc) {
        const jsonDoc    = xml.parse(xmlDoc)
        const generator  = new DTDgenerator(dtd);
        const jsonSchema = generator.getJsonSchema();
                        
        return jsonGenerator.validate(jsonSchema,jsonDoc);
    },

    instances: function*(dtd) {
        const generator = new DTDgenerator(dtd);

        yield* generator.instances();
    },

    nonInstances: function*(dtd) {
        const generator = new DTDgenerator(dtd);

        yield* generator.nonInstances();
    }

}

