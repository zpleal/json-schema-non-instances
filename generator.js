/********************************************************************\
 *  Generator of both instances and non instances of JSON Schemas   *
 *                                                                  *
 *  An instance of a JSON Schema is a valid JSON in that schema.    *
 *  A non-instance is invalid and should be as small possible.      *
 *  Non-instances are useful for JSON Schema validation in          *
 *  automated assessment.                                           *
 *                                                                  *
 *  This module exposes 2 functions to generate:                    *
 *     * instances                                                  *
 *     * non-instances                                              *
 * from given JSON schema                                           *
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
const DEFAULT_MAX_ITEMS = 5;
/**
 * Default minimum for numbers
 */
const DEFAULT_MINIMUM = 0;
/**
 * Default maximum for numbers
 */
const DEFAULT_MAXIMUM = 5;
/**
 * Names of JSON types.
 * Thers is a generator funtion for each of them.
 */

const BASIC_SCHEMATA = [ "type", "enum", "const", "$ref", "allOf", "oneOf", "anyOf", "not" ]

const JSON_TYPES = ["null", "boolean", "number", "string", "array", "object"];

class JSONGenerator {

    constructor(jsonSchema) {
        this.jsonSchema = jsonSchema;
    }

    jsonValidator(jsonSchema, instance) {
        switch (typeof jsonSchema) {
            case "boolean":
                return jsonSchema;
            case "object":
                if(Array.isArray(jsonSchema))
                    throw new Error(`Invalid JSON Schema (array): ${JSON.stringify(jsonSchema)}`);

                const property  = BASIC_SCHEMATA.filter( (k) => k in jsonSchema)[0];
                const method    = this[property+"Validator"];
                const validator = method ? method.bind(this) : this.anyValidator.bind(this);

                return validator(jsonSchema, instance);

            default:

                throw new Error(`Invalid JSON Schema: ${JSON.stringify(jsonSchema)}`);
        }
    }


    *instances() {
        yield* this.jsonGenerator(this.jsonSchema);
    }

    *nonInstances() {
        yield* this.jsonGenerator(this.jsonSchema, true);
    }

    *jsonGenerator(jsonSchema, non) {
        switch (typeof jsonSchema) {
            case "boolean":
                yield* this.anyGenerator(jsonSchema, !jsonSchema || non);
                break;
            case "object":
                if(Array.isArray(jsonSchema))
                    throw new Error(`Invalid JSON Schema (array): ${JSON.stringify(jsonSchema)}`);


                const property  = BASIC_SCHEMATA.filter( (k) => k in jsonSchema)[0];
                const method    = this[property+"Generator"];
                const generator = method ? method.bind(this) : this.anyGenerator.bind(this);

                yield* generator(jsonSchema, non);
                break;
            default:

                throw new Error(`Invalid JSON Schema: ${JSON.stringify(jsonSchema)}`);
        }
    }

    /**
     * Generate (non)-instances for given JSON Schema
     * @param {*} jsonSchema
     * @param {*} non
     */
    *$refGenerator(jsonSchema, non) {
        yield* this.jsonGenerator(this.getDefinition(jsonSchema.$ref), non);

    }

    /**
     * Definition in this JSON Schema with given $ref
     * @param {*} ref of intended definition
     * @returns definiton
     */
    getDefinition(ref) {
        const { url, pointer } = JSONGenerator.parseRef(ref);
        const schema = url === "" ? this.jsonSchema : this.getSchemaFromURL(url);

        if (pointer == "")
            throw new Error("Not implemented yet");
        else if (pointer[0] === "/")
            return JSONGenerator.getPathDefinition(pointer,schema);
        else
            return JSONGenerator.getIdDefinition(pointer,schema);
    }

    /**
     * Parse a reference into a url and a pointer
     * @param {*} ref string
     * @returns object with url and pointer as properties
     */
    static parseRef(ref) {
        let url = "";
        let pointer = "";

        if(ref.includes("#"))
            [ url, pointer ] = ref.split("#");
        else
            pointer = ref;

        return { url, pointer };
    }

    /**
     * Definition with given pathname in given JSON schema
     * @param {*} pathname of definition
     * @param {*} schema containing definiton
     * @returns definition
     */
    static getPathDefinition(pathname,schema) {
        const path = pathname.substring(1).split("/");
        let node = schema;

        path.forEach(property => {
            if (property in node)
                node = node[property];
            else
                 throw new Error(`invalid path "${property}" in "${pathname}"`);
        });
        return node;
    }

    /**
     * Definition in this JSON schema with given ID
     * @param {*} id of intended definition
     * @param {*} schema containing definiton
     * @returns definition
     */
    static getIdDefinition(id,schema) {
        const definitions = schema.definitions;

        if (definitions) {
            const withId = [];

            for(const name in definitions) {
                const definition = definitions[name];

                if("$id" in definition && definition.$id === id)
                    withId.push(definition);
            }

            switch(withId.length) {
                case 0: throw new Error(`$id not found: ${id}`);
                case 1: return withId[0];
                default: throw new Error(`Multiple definitions with $id: ${id}`);
            }
        } else
            throw new Error("definitions not found in JSON schema");
    }

    getSchemaFromURL(url) {
        throw new Error("Not implemented yet");
    }


    /**
     * Validate a constant
     *
     * @param {*} jsonSchema width a constant
     * @param {*} instance  with a contant
     * @returns true if valid; false otherwise
     */
    constValidator(jsonSchema, instance) {
        const label = jsonSchema.const;

        return label === instance;
    }

    /**
     * Generates (non) instances constants
     *
     * @param {*} jsonSchema width a constant
     * @param {*} non is a non constant
     */
    *constGenerator(jsonSchema, non) {
        const label = jsonSchema.const;

        while(true)
            if(non) {
                if(label.length > 0) {
                    for (const char of label)
                        yield label.replace(char, '');
                } else {
                    for (const char of "label")
                        yield char;
                }
            } else
                yield label;
    }

    /**
     * Validates an enumeration
     *
     * @param {*} jsonSchema with enumeration
     * @param {*} value in enumeration
     * @returns true if valid; false otherwise
     */
    enumValidator(jsonSchema, value) {

        return jsonSchema.enum.includes(value);
    }

    /**
     * Generates (non) instances from enumeration
     */
    *enumGenerator(jsonSchema, non) {
        while (true)
            for (const value of jsonSchema.enum)
                if (non) {
                    for (const char of value) {
                        const wrong = value.replace(char, '');
                        if (!jsonSchema.enum.includes(wrong))
                            yield wrong;
                    }
                } else
                    yield value;
    }

    /**
     * Validates instances of JSON schema with a type property
     *
     * @param {*} jsonSchema with a type
     * @param {*} value to validate
     * @returns true if valid; false otherwise
     */
    typeValidator(jsonSchema,value) {
        if (JSON_TYPES.includes(jsonSchema.type)) {
            const validator = this[jsonSchema.type + "Validator"].bind(this);

            return validator(jsonSchema,value);
        } else
            throw new Error(`Invalid JSON type ${jsonSchema.type}`);

    }

    /**
     * Generate (non-)instances of given schema with a type property
     *
     * @param {*} jsonSchema with a type property
     * @param {*} non true to generate non instances; false otherwise
     */
    *typeGenerator(jsonSchema, non) {
        if (JSON_TYPES.includes(jsonSchema.type)) {
            const generator = this[jsonSchema.type + "Generator"].bind(this);

            if (non) {
                const other = JSON_TYPES
                    .filter((n) => n !== jsonSchema.type)
                    .map(n => this[n + "Generator"].call(this));

                if (generator)
                    other.unshift(generator(jsonSchema, non));

                yield* this.combine(other);
            } else
                yield* generator(jsonSchema);
        } else
            throw new Error(`Invalid JSON type ${jsonSchema.type}`);
    }

    /**
     * Create a generator that yields the next value of the
     * array of generators received as input, one at the time.
     * Repeats forever, unless none  of the generator yield results
     * @param {*} generators
     */
    *combine(generators) {
        let hasAtLeatOne = true;

        while (hasAtLeatOne) {
            hasAtLeatOne = false;

            for (const generator of generators) {
                const next = generator.next();

                if (!next.done)  {
                    hasAtLeatOne = true
                    yield next.value;
                }
            }
        }
    }


    /**
     * Generates (non) JSON instances for null (no restrictions)
     *
     * @param {*} jsonSchema a JSON Schema object (ignored for null)
     * @param {*} non if true generates a non instance
     */
    *anyGenerator(_, non) {
        if (non) {
            // no JSON object
        } else
            yield* this.combine(
                JSON_TYPES.map(n => this[n + "Generator"].bind(this)()));
    }

    /**
     * Validate an instance against a null schema with type null
     * @param {*} jsonSchema  with type null
     * @param {*} value to validate
     * @returns true if valid; false otherwise
     */
    nullValidator(jsonSchema,value) {
        return JSONGenerator.jsonTypeOf(value) === "null";
    }

    /**
     * Generates (non) instance null objects of given JSON Schema
     *
     * @param {*} jsonSchema a JSON Schema object (ignored for booleans)
     * @param {*} non if true generates a non instance
     */
    *nullGenerator(_, non) {
        if (non)
            return;
        else
            while (true)
                yield null;
    }

    /**
     * Validates values with type boolean
     *
     * @param {*} jsonSchema with type boolean
     * @param {*} value to validate
     * @returns true if valid; false otherwise
     */
    booleanValidator(jsonSchema,value) {
        return typeof value === "boolean";
    }

    /**
     * Generates (non) instance booleans of given JSON Schema
     *
     * @param {*} jsonSchema a JSON Schema object (ignored for booleans)
     * @param {*} non if true generates a non instance
     */
    *booleanGenerator(_, non) {
        if (non)
            return;
        else
            while (true) {
                yield true;
                yield false;
            }
    }

    /**
     * Validates numeric values
     *
     * @param {*} jsonSchema with number type
     * @param {*} value to validate
     * @returns true if valid; false otherwise
     */
    numberValidator(jsonSchema,value) {

        if(JSONGenerator.jsonTypeOf(value) !==  "number")
            return false;

        if(jsonSchema.minimum && value < jsonSchema.minimum )
            return false;

        if(jsonSchema.minimumExclusive && value <= jsonSchema.minimumExclusive )
            return false;

        if(jsonSchema.maximum && value > jsonSchema.maximum )
            return false;

        if(jsonSchema.maximumExclusive && value >= jsonSchema.maximumExclusive )
            return false;

        if(jsonSchema.multiple) {
            const mult = jsonSchema.multiple;
            const rem  = value - Math.floor(value / mult)* mult;

            if(rem !== 0)
                return false;
        }

        return true;
    }

    /**
     * Generates (non) instance numbers of given JSON Schema
     *
     * @param {*} jsonSchema a JSON Schema object
     * @param {*} non if true generates a non-instance
     */
    *numberGenerator(jsonSchema, non) {
        const schema = {
            ...jsonSchema
        };

        if (non) { // just 2 examples, if limits where define
            const less = schema.minimum || schema.minimumExclusive;
            const more = schema.maximum || schema.maximum;

            if (typeof less === "number")
                yield less - 2;
            if (typeof more === "number")
                yield more + 2

        } else {
            const start = schema.minimumExclusive + 1 || schema.minimum || DEFAULT_MINIMUM
            const stop = schema.maximumExclusive - 1 || schema.maximum || DEFAULT_MAXIMUM;
            const step = schema.multiple || 1;

            while (true)
                for (let value = start; value <= stop; value += step)
                    yield value;
        }
    }

    /**
     * Validates string values
     *
     * @param {*} jsonSchema with a string
     * @param {*} value
     * @returns
     */
    stringValidator(jsonSchema, value) {
        if(JSONGenerator.jsonTypeOf(value) !== "string")
            return false;

        if(jsonSchema.minLength && value.length < jsonSchema.minLength)
            return false;

        if(jsonSchema.maxLength && value.length > jsonSchema.maxLength)
            return false;

        if(jsonSchema.pattern &&
            ! value.match(new RegExp(jsonSchema.pattern)))
            return false;

        return true;
    }


    /**
     * Generates (non) instance strings for given JSON Schema
     *
     * @param {*} jsonSchema a JSON Schema object
     * @param {*} non if true generates a non-instance
     */
    *stringGenerator(jsonSchema, non) {
        const schema = {
            pattern: "",
            ...jsonSchema
        }

        if (non && !(schema.minLength || schema.maxLength))
            return;
        else {
            const minLength = schema.minLength || 0
            const maxLength = schema.maxLength || DEFAULT_MAX_LENGTH;

            while (true) {
                let value = ""

                for (let c = 0; c <= maxLength + 1; c++) {
                    if (c < minLength) {
                        if (non)
                            yield value;
                    } else if (c > maxLength) {
                        if (non)
                            yield value;
                    } else if (non) {
                        // check other string constraints (e.g. pattern)
                    } else
                        yield value;

                    value += "a";
                }
            }
        }
    }

    /**
     * Validates arrays values
     *
     * @param {*} jsonSchema with type array
     * @param {*} value expected to be array
     * @returns true if valida; false otherwise
     */
    arrayValidator(jsonSchema,value) {
        if(JSONGenerator.jsonTypeOf(value) != "array")
            return false;

        if(jsonSchema.minItems && value.length < jsonSchema.minItems)
            return false;

        if(jsonSchema.maxItems && value.length > jsonSchema.maxItems)
            return false;

        if(jsonSchema.items)
            for(const item of value)
                if(! this.jsonValidator(jsonSchema.items,item))
                    return false;
        return true;

    }

    /**
     * Generates (non) instance arrays for given JSON Schema
     *
     * @param {*} jsonSchema a JSON Schema object
     * @param {*} non if true generates a non-instance
     */
    *arrayGenerator(jsonSchema, non) {
        const schema = { ...jsonSchema };
        const generators = non ? [
                this.arrayGeneratorWrongStruncture(schema),
                this.arrayGeneratorWrongContent(schema)
            ] : [
                this.arrayGeneratorValid(schema)
            ];

        yield* this.combine(generators);
    }

    *arrayGeneratorValid(schema) {
        const items        = schema.items ?? true;
        const instances    = this.jsonGenerator(items);
        const minItems     = schema.minItems ?? 0;
        const maxItems     = schema.maxItems ?? Number.MAX_SAFE_INTEGER;

        while(true) {
            const array = [];
            for(let c = 0; c < maxItems; c++) {
                if(c >= minItems)
                    yield JSONGenerator.clone(array);

                array.push(instances.next().value);

            }
        }
    }

    /**
     * Generate arrays with wrong struture:
     *     - less items than minItems, or
     *     - more items than maxItems.
     *
     * Item values are correct
     * @param {*} schema with an array
     */
    *arrayGeneratorWrongStruncture(schema) {
        const items        = schema.items ?? true;
        const instances    = this.jsonGenerator(items);
        const minItems     = schema.minItems ?? 0;
        const maxItems     = schema.maxItems ?? Number.MAX_SAFE_INTEGER;

        if(minItems > 0 || maxItems < Number.MAX_SAFE_INTEGER)
            while (true) {
                const array = [];

                for (let c = 0; c < minItems; c++) {
                    yield JSONGenerator.clone(array);

                    array.push(instances.next().value);
                }

                if (maxItems < Number.MAX_SAFE_INTEGER) {
                    for (let c = minItems; c <= maxItems; c++)
                        array.push(instances.next().value)

                    for (let c = maxItems; c < Number.MAX_SAFE_INTEGER; c++) {
                        yield JSONGenerator.clone(array);

                        array.push(instances.next().value);
                    }
                }
            }
    }

    /**
     * Generates arrays with wrong content based on items.
     * It only yields results for
     *
     * @param {*} schema
     * @returns
     */
    *arrayGeneratorWrongContent(schema) {
        const items        = schema.items ?? true;
        const instances    = this.jsonGenerator(items);
        const nonInstances = this.jsonGenerator(items,true);
        const minItems     = Math.max(1, schema.minItems ?? 1);
        const maxItems     = schema.maxItems ?? Number.MAX_SAFE_INTEGER;

        if(nonInstances.next().done)
            return;

        while(true) {
            const array = [];
            for(let c = 0; c < maxItems; c++) {
                if(c >= minItems)
                    yield JSONGenerator.clone(array);

                if(c < minItems - 1)
                    array.push(instances.next().value);
                else
                    array.push(nonInstances.next().value)
            }
        }
    }

    /**
     * Validates a values in a jsonValue
     * @param {*} jsonSchema
     * @param {*} value
     * @returns
     */
    objectValidator(jsonSchema,value) {
        if(JSONGenerator.jsonTypeOf(value) !== "object")
            return false;

        const properties = Object.keys(value);

        if(jsonSchema.minProperties && properties.length < jsonSchema.minProperties)
            return false;

        if(jsonSchema.maxProperties && properties.length > jsonSchema.maxProperties)
            return false;

        if(jsonSchema.required)
            for(const property of jsonSchema.required)
                if(! properties.includes(property))
                    return false;

        for(const property of properties) {
            const schema = jsonSchema?.properties[property] ?? true;
            if(! this.jsonValidator(schema,value[property]))
                return false;
        }

        return true;
    }


    /**
    * Generates (non) instance objects for given JSON Schema
    *
    * @param {*} jsonSchema a JSON Schema object
    * @param {*} non if true generates a non-instance
    */
    *objectGenerator(jsonSchema, non) {
        const schema = {
            minProperties: 0,
            maxProperties: Number.MAX_VALUE,
            required: [],
            ...jsonSchema,
        };
        const properties = schema.properties || (non ? null : []);

        if (properties) {

            const iterators = {};

            for (const p in properties)
                iterators[p] = this.jsonGenerator(properties[p],non);

            while (true) {
                const value = {};
                let count = 0;
                let still = schema.required;

                if (properties.length === 0 && still.length === 0)
                    yield value;
                else {
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
                            
                        } else {
                            //TODO check other objects restrictions (e.g. propertyNames)

                            yield JSONGenerator.clone(value);
                        }
                    }
                }
            }
        }
    }

    *objectGeneratorWrongStruncture(schema) { 


    }

    *objectGeneratorWrongContent(schema) { }


    /**
     * Generate a value that is valid in any of the given schemata
     *
     * @param {*} jsonSchema
     * @param {*} non
     */
    *anyOfGenerator(jsonSchema, non) {
        const collection = jsonSchema.anyOf;

        if(Array.isArray(collection)) {
            const iterators = [];

            for(const schema of collection)
                iterators.push( this.jsonGenerator(schema,non) );
            // combine ??
            while (true)
                for(const iterator of iterators)
                    yield iterator.next().value;

        } else
            throw new Error(`Expected array in anyOf and not ${JSON.stringify(collection)}`);
    }

    /**
     * Generate a value that is valid in just one of given schemata
     *
     * @param {*} jsonSchema
     * @param {*} non
     */
    *oneOfGenerator(jsonSchema, non) {
        const collection = jsonSchema.oneOf;

        if(Array.isArray(collection)) {
            const iterators = [];

            for(const schema of collection)
                iterators.push( this.jsonGenerator(schema,non) );

            while (true) {

                for(const s in collection) {
                    const value = iterators[s].next().value;
                    const check = collection
                        .filter( (_,i) => i != s )
                        .every(schema => ! this.jsonValidator(schema,value) );

                    if(check)
                        yield value;
                };

            }

        } else
            throw new Error(`Expected array in oneOf and not ${JSON.stringify(collection)}`);
    }


    /**
     * Generate a value that is valid in all given schemata
     *
     * @param {*} jsonSchema
     * @param {*} non
     */
    *allOfGenerator(jsonSchema, non) {
        const collection = jsonSchema.allOf;

        if(Array.isArray(collection)) {
            const iterators = [];

            for(const schema of collection)
                iterators.push( this.jsonGenerator(schema,non) );

            while (true) {

                for(const s in collection) {
                    const value = iterators[s].next().value;
                    const check = collection
                        .filter( (_,i) => i != s )
                        .every(schema => this.jsonValidator(schema,value) );

                    if(check)
                        yield value;
                };
            }

        } else
            throw new Error(`Expected array in allOf and not ${JSON.stringify(collection)}`);
    }

    notValidator(jsonSchema,value) {
        const not = jsonSchema.not;

        return ! this.jsonValidator(not,value);
    }

    /**
     * Generate a value that is valid if invalid in given schema
     *
     * @param {*} jsonSchema
     * @param {*} non
     */
      *notGenerator(jsonSchema, non) {
        const not = jsonSchema.not;

        yield* this.jsonGenerator(not, ! non);
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

        switch (baseType) {
            case "object":
                if (value === null)
                    return "null";
                else if (Array.isArray(value))
                    return "array";
                else
                    return "object";
            case "boolean":
            case "number":
            case "string":
                return baseType;
            default:
                throw new Error("Value without a JSON type:" + value);
        }
    }
}

module.exports = {
    jsonTypeOf: JSONGenerator.jsonTypeOf,

    validate: function(schema,value) {
        const validator = new JSONGenerator(schema);

        return validator.jsonValidator(schema,value);
    },

    instances: function* (schema) {
        const generator = new JSONGenerator(schema);

        yield* generator.instances();
    },

    nonInstances: function* (schema) {
        const generator = new JSONGenerator(schema);

        yield* generator.nonInstances();
    }
};
