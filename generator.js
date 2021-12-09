/********************************************************************\
 *  Generator of both instances and non instances of JSON Schemas   *
 *                                                                  *
 *  An instance of a JSON Schema is a valid JSON in that schema.    *
 *  A non-instance is invalid and should be as small possible.      *
 *  Non-instances are useful for JSON Schema validation in          *
 *  automated assessment.                                           *
 *                                                                  *
 *  This module exposes a function with 2 arguments:                *
 *     * a JSON Schema to generate instances                        *
 *     * a boolean - when true generates a non-instance             *
 *                                                                  *
 *  It either generates an infinite cyclical sequence               *
 *  of (non)instances or nothing at all, if none exists.            *
 *                                                                  *  
 *                                         José Paulo Leal          *
 *                                         December 2021            *   
\********************************************************************/

/**
 * Default maxLength for strings
 */
const DEFAULT_MAX_LENGTH = 2;
/**
 * Default maxItems for arrays
 */  
const DEFAULT_MAX_ITEMS  = 5;
/**
 * Default minimum for numbers
 */
const DEFAULT_MINIMUM    = 0;
/**
 * Default maximum for numbers
 */
const DEFAULT_MAXIMUM    = 5;
/**
 * Names of JSON types.
 * Thers is a generator funtion for each of them.
 */
const JSON_TYPES = [ "null", "boolean","number", "string", "array", "object" ];   



class JSONGenerator {

    constructor(jsonSchema) {
        this.jsonSchema = jsonSchema;
    }

    *instances() {
        yield* this.jsonGenerator(this.jsonSchema);
    }

    *nonInstances() {
        yield* this.jsonGenerator(this.jsonSchema,true);
    }

    *jsonGenerator(jsonSchema,non) {
         switch(typeof jsonSchema) {
            case "boolean": 
                yield* this.anyGenerator(jsonSchema, !jsonSchema || non);
                break;
            case "object":
                if(jsonSchema === null)
                    yield* this.anyGenerator(jsonSchema,non);
                else if("type" in jsonSchema)
                    yield* this.generateFromType(jsonSchema,non);
                else if("enum" in jsonSchema)
                    yield* this.generateFromEnum(jsonSchema,non);
                else if("$ref" in jsonSchema)
                    yield* this.generateFromRef(jsonSchema,non);
                else
                    yield* this.anyGenerator(jsonSchema, non);
            }
    }

    *generateFromRef(jsonSchema,non) {
        yield* this.jsonGenerator(this.getDefinition(jsonSchema.$ref),non);

    }

    getDefinition(ref) {
        const [ url , pointer ]  = ref.split("#");
        const schema = url === "" ? this.jsonSchem : this.getSchemaFromURL(url);
        
        if(pointer == "")
            throw new Error("Not implemented yet");
        else if(pointer[0] === "/") {
            const path = pointer.split("/");
            let node = schema;

            path.forEach(property => {
                if(property in node)
                    node = node[property];
                else
                    throw(`invalid path "${property}" in "${ref}"`);
            });
            return node;
        } else {
            throw new Error("Not implemented yet");
        }
    }

    getSchemaFromURL(url) {
        throw new Error("Not implemented yet");
    }

   
    /**
     * Generates (non) instances from enumeration
     */
    *generateFromEnum(jsonSchema,non) {
        while(true)
            for(const value of jsonSchema.enum)
                if(non) { 
                    for(const char of value) {
                        const wrong = value.replace(char,'');
                        if(! jsonSchema.enum.includes(wrong))
                            yield wrong;
                    }
                } else
                    yield value;
    }

    *generateFromType(jsonSchema,non) {
        if(JSON_TYPES.includes(jsonSchema.type)) {
            const generator = this[jsonSchema.type+"Generator"].bind(this);

            if(non) {
                const other = JSON_TYPES
                    .filter((n) => n !== jsonSchema.type)
                    .map(n => this[n+"Generator"].call(this));
        
                if(generator)
                    other.unshift(generator(jsonSchema,non));
        
                yield* this.combine(other);
            } else 
                yield* generator(jsonSchema);
        } else 
            throw new Error(`Invalid JSON type ${jsonSchema.type}`);
    }

    /**
     * Create a generator that yields the next value of the
     * array of generators received as input, one at the time *   
     * @param {*} generators 
     */
    *combine(generators) {
        while(true)
            for(const generator of generators) {
                const next = generator.next();
            
                if(!next.done)
                    yield next.value;  
            }
    }


    /**
     * Generates (non) JSON instances for null (no restrictions)
     * 
     * @param {*} jsonSchema a JSON Schema object (ignored for null)
     * @param {*} non if true generates a non instance   
     */
    *anyGenerator(_,non) {
        if(non) {
            // no JSON object
        } else
            yield* this.combine(
                JSON_TYPES.map(n => this[n+"Generator"].bind(this)()));
    }

    /**
     * Generates (non) instance objects of given JSON Schema 
     * 
     * @param {*} jsonSchema a JSON Schema object (ignored for booleans)
     * @param {*} non if true generates a non instance   
     */
    *nullGenerator(_,non) {
        if(non)
            this.anyGenerator();
        else
            while(true) 
                yield null;
    } 

    /**
     * Generates (non) instance objects of given JSON Schema 
     * 
     * @param {*} jsonSchema a JSON Schema object (ignored for booleans)
     * @param {*} non if true generates a non instance   
     */
    *booleanGenerator(_,non) {
        if(non)
            return;
        else
            while(true) {
                yield true;
                yield false;
            }
    } 


    /**
     * Generates (non) instance numbers of given JSON Schema
     * 
     * @param {*} jsonSchema a JSON Schema object
     * @param {*} non if true generates a non-instance
     */
    *numberGenerator(jsonSchema,non) {
        const schema = {
            ...jsonSchema
        };

        if(non) { // just 2 examples, if limits where define
            const less = schema.minimum || schema.minimumExclusive;
            const more = schema.maximum || schema.maximum;

            if(typeof less === "number")
                yield minimum - 2;
            if(typeof more === "number")
                yield maximum + 2

        } else {
            const start = schema.minimumExclusive + 1 || schema.minimum || DEFAULT_MINIMUM
            const stop  = schema.maximumExclusive - 1 || schema.maximum || DEFAULT_MAXIMUM ;
            const step  = schema.multiple || 1;

            while(true)
                for(let value = start; value <= stop; value += step)
                    yield value;
        }
    }

    /**
     * Generates (non) instance string for given JSON Schema
     * 
     * @param {*} jsonSchema a JSON Schema object
     * @param {*} non if true generates a non-instance
     */
    *stringGenerator (jsonSchema,non) {
        const schema = {
            minLength: 0,
            maxLength: DEFAULT_MAX_LENGTH,
            pattern:   "",
            ...jsonSchema
        }

        while(true) {
            let value = ""

            for(let c=0; c <= schema.maxLength; c++) {
                if(c < schema.minLength) {
                    if(non)
                        yield value;
                } else if(c > schema.maxLength) {
                    if(non)
                        yield value;
                } else if(non) {
                    // check other string constraints (e.g. pattern)
                } else 
                    yield value;

                value += "a";
            }
        }
    }

    /**
     * Generates (non) instance arrays for given JSON Schema
     * 
     * @param {*} jsonSchema a JSON Schema object
     * @param {*} non if true generates a non-instance
     */
    *arrayGenerator(jsonSchema,non) {
        const schema    = {
            minItems: 0,
            maxItems: DEFAULT_MAX_ITEMS,
            ...jsonSchema
        };
        const items = schema.items || ( non  ? null : true ) ; 

        if (items) {
            const instances = items ? this.jsonGenerator(items) : null;

            while (true) {
                const array = [];

                for (let c = 0; c <= schema.maxItems; c++) {
                    if (c < schema.minItems) {
                        if (non)
                            yield JSONGenerator.clone(array);
                    } else if (c > schema.maxItems) {
                        if (non)
                            yield JSONGenerator.clone(array);
                    } else if (non) {
                        // check other kinds of array restrictions (e.g. uniqueElements)
                    } else {
                        yield JSONGenerator.clone(array);
                    }

                    array.push(instances.next().value);
                }
            }
        }
    }

    
    /**
    * Generates (non) instance objects for given JSON Schema
    * 
    * @param {*} jsonSchema a JSON Schema object
    * @param {*} non if true generates a non-instance
    */
    *objectGenerator(jsonSchema,non) {
        const schema    = {
            minProperties: 0,
            maxProperties: Number.MAX_VALUE,
            required: [],
            ...jsonSchema,
        };
        const properties =  schema.properties || ( non ? null : [] );

        if( properties) {

            const iterators = {};

            for (const p in properties)
                iterators[p] = this.jsonGenerator(properties[p]);

            while (true) {
                const value = {};
                let count = 0;
                let still = schema.required;

                for (const p in properties) {
                    value[p] = iterators[p].next().value;
                    count++;
                    still = still.filter((s) => s !== p);

                    if (count < schema.minProperties) {
                        if (non)
                            yield JSONGenerator.clone(value);
                    } else if (count > schema.maxProperties) {
                        if (non)
                            yield value;
                    } else if (still.length > 0) {
                        if (non)
                            yield JSONGenerator.clone(value);
                    } else if (non) {
                        //TODO check other objects restrictions (e.g. propertyNames)
                    } else {
                        yield JSONGenerator.clone(value);
                    }
                }
            }
        }
    }

    /**
     * 
     * Objects and arrays must be cloned (deep copied) before being yield, 
     * since they are used for the creation of several instances.
     * @param {*} value to clone
     * @returns a clone (deep copy)
     */
    static clone(value) {
        // TODO replace this implementation for a more efficient one
        return JSON.parse(JSON.stringify(value));
    }

    /**
     *  JSON type of given object
     * 
     * @param {*} value 
     * @returns 
     */
     static jsonTypeOf(value) {
        const baseType = typeof value;
 
        switch(baseType) {
            case "object":
                if(value === null)
                    return "null";
                else if(Array.isArray(value))
                    return "array";
                else
                    return "object";
            case "boolean":
            case "number":
            case "string":
                return baseType;
            default:
                throw new Error("Value without a JSON type:"+value);
        }
    }
}

module.exports = {
    jsonTypeOf: JSONGenerator.jsonTypeOf,

    instances: function*(schema) {
        const generator = new JSONGenerator(schema)

        yield* generator.instances();
    },

    nonInstances: function*(schema) {
        const generator = new JSONGenerator(schema)

        yield* generator.nonInstances();
    }
};
