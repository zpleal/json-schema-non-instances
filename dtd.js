
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

const jsonGenerator  = require('../generator.js');
const { serialize } = require('./xmlinjson.js');

class DTDgenerator {

    constructor(dtdSchema) {
        this.dtdSchema = dtdSchema;
    }

    /**
     * Instances of this DTD
     */
    *instances() {
        const jsonSchema = this.getJsonSchema();

        for(const json of jsonGenerator.instances( jsonSchema ) ) 
            yield serialize(json);
    }

    /**
     * Instances of this DTD
     */
     *nonInstances() {
        const jsonSchema = this.getJsonSchema();

        for(const json of jsonGenerator.instances( jsonSchema ) ) 
            yield serialize(json);
    }

    /**
     * Non instances of this DTD
     * 
     */
    getJsonSchema() {
        const { root, defs } = DTDgenerator.parseDocType(this.dtdSchema)
        const jsonSchema = {};

        if(root) 
            jsonSchema.$ref = root;

        // TODO process parametric entities

        jsonSchema.definition = DTDgenerator.parseElements(defs);
    }

    static parseDocType(dtdSchema) {
        const found = dtdSchema.match(/<!DOCTYPE (\w+) [(\.*)]>/)
    
        if(found) { 
            const [ root, defs] = found;
            return { root, defs };
        } else
            return { defs: dtdSchema};
    }

    static parseElements(defs) {
        const elMatch = [ ...defs.matchAll(/<!ELEMENT\s+(\w+)\s+([^>]*)>/g) ];
        const atMatch = [ ...defs.matchAll(/<!ATTLIST\s+(\w+)\s+([^>]*)>/g/g) ];
        const definitions = {};

        elMatch.forEach( (match => {
            const [ name, model ] = match;
            definitions[name] = {
                "$id": name,
                "type": "object",
                "properties": {
                    "name": { "const":  name },
                    "attributes": {
                        "type": "object",
                        "properties": {},
                        "required": []
                    },
                    "content": DTDgenerator.parseModel(model)                    
                } 
            }
        }));

        atMatch.forEach( (def => {
            const [ element, attlistdef ] = def;
            const attlist = attlistdef.split(/\s+/);
            const attributes = definitions[element].properties.attributes; 

            for( [ attribute, type, ommit ] of attlist) {
                const schema = DTDgenerator.parseAttributeType(type);
                
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
                    
            }
            }));
    }

    static parseAttributeType(type) {
        const jsonType = {};
        const enumeration = DTDgenerator.getEnumeration(type);

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
    static getEnumeration(type) {
        const found = type.match(/\((.*)\)/);

        if(found) 
            return found[1].split(/\s*\|\s*/)
        else
            return;
    }   

    static parseModel(model) {
        const jsonType = { "type": "array" };

        switch(model) {
            case 'EMPTY':
                jsonType.items = "false";
                jsonType.maxContains = 0;
                break;
            case 'ANY':
                jsonType.items = "true";
                break;
            case '(#PCDATA)':
                jsonType.items = "string";
                jsonType.maxContains = 1;
                break;
            case '(#RCDATA)':
                throw new Error("Avoid using raw character data");
            default:
                const found = model.match(/\(#PCDATA\s+(|\s*\w+)+\)\*/);
                if() 
                    json.items = parseMixedContent(model);
                else
                    json.items = parseExpression(model);
        }

        return jsonType;
    }
}