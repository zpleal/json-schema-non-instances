 
const DEFAULT_MAX_LENGTH = 2; // default maxLength for strings  
const DEFAULT_MAX_ITEMS  = 5; // default maxItems for arrays

const BASIC_GENERATORS = {
    "null":     nullGenerator,
    "boolean":  booleanGenerator,
    "number":   numberGenerator,
    "string":   stringGenerator,
    "array":    arrayGenerator,
    "object":   objectGenerator
}

function* jsonGenerator(jsonSchema,non) {

    switch(typeof jsonSchema) {
        case "boolean": 
            yield* anyGenerator(jsonSchema, !jsonSchema || non);
            break;
        case "object":
            if(jsonSchema === null)
                yield* anyGenerator(jsonSchema,non);
            else if("type" in jsonSchema)
                yield* generateFromType(jsonSchema,non);
            else if("enum" in jsonSchema)
                yield* generateFromEnum(jsonSchema,non);
            else
                yield* anyGenerator(jsonSchema, non);
    }
}

/**
 * Generates (non) instances from enumeration
 
 */
function* generateFromEnum(jsonSchema,non) {
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

function* generateFromType(jsonSchema,non) {
    const generator = BASIC_GENERATORS[jsonSchema.type];

    if(non) {
        const other = Object.keys(BASIC_GENERATORS)
        .filter((n) => n !== jsonSchema.type)
        .map(n => BASIC_GENERATORS[n]());

        if(generator)
            other.push(generator(jsonSchema,non));

        yield* combine(other);
    } else {
        if(generator)
            yield* generator(jsonSchema);
        else
        return;
    }
}

/**
 * Create a generator that yields the next value of the
 * array of generators received as input, one at the time *   
 * @param {*} generators 
 */
function* combine(generators) {
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
function* anyGenerator(_,non) {
    if(non) {
        // no JSON object
    } else
        yield* combine(Object.keys(BASIC_GENERATORS).map(n => BASIC_GENERATORS[n]()));
}

/**
  * Generates (non) instance objects of given JSON Schema 
 * 
 * @param {*} jsonSchema a JSON Schema object (ignored for booleans)
 * @param {*} non if true generates a non instance   
 */
 function* nullGenerator(_,non) {
    if(non)
        anyGenerator();
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
function* booleanGenerator(_,non) {
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
function* numberGenerator(jsonSchema,non) {
    const schema = {
        minimum:  0,
        maximum:  DEFAULT_MAX_ITEMS,
        multiple: 1,
        ...jsonSchema
    };
    const start = schema.minimumExclusive ? schema.minimumExclusive + 1 : schema.minimum;
    const stop  = schema.maximumExclusive ? schema.maximumExclusive - 1 : schema.maximum;
    const step  = schema.multiple || 1;

    if(non) { // just 2 examples
      yield start - 1;
      yield stop  + 1;  
    } else
        while(true)
           for(let value = start; value <= stop; value += step)
                yield value;
}

/**
 * Generates (non) instance string for given JSON Schema
 * 
 * @param {*} jsonSchema a JSON Schema object
 * @param {*} non if true generates a non-instance
 */
function* stringGenerator (jsonSchema,non) {
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
function* arrayGenerator(jsonSchema,non) {
    const schema    = {
        minItems: 0,
        maxItems: DEFAULT_MAX_ITEMS,
        items: true,
        ...jsonSchema
    };

    const instances = jsonGenerator(schema.items);
    
    while(true) {
        const array = [];
    
        for(let c = 0; c <= schema.maxItems; c++) {
            if(c < schema.minItems) {
                if(non)
                    yield clone(array);
            } else if(c > schema.maxItems) {
                if(non)
                    yield clone(array);
            } else if(non) {
                // check other kinds of array restrictions (e.g. uniqueElements)
            } else {
                yield clone(array);
            }

            array.push(instances.next().value);
        }
    }    
}

/**
 * Generates (non) instance objects for given JSON Schema
 * 
 * @param {*} jsonSchema a JSON Schema object
 * @param {*} non if true generates a non-instance
 */
function* objectGenerator(jsonSchema,non) {
    const schema    = {
        minProperties: 0,
        maxProperties: Number.MAX_VALUE,
        properties: {},
        required: [],
        ...jsonSchema,
    };

    if(Object.keys(schema.properties).length == 0) {
        // no properties defined -> generates the empty object
        // TODO: should property names be generated?
        while(true)
            yield {};

    } else {

        const iterators = {};

        for (const p in schema.properties)
            iterators[p] = jsonGenerator(schema.properties[p]);

        while (true) {
            const value = {};
            let count = 0;
            let still = schema.required;
            for (const p in schema.properties) {
                value[p] = iterators[p].next().value;
                count++;
                still = still.filter((s) => s !== p);

                if (count < schema.minProperties) {
                    if (non)
                        yield clone(value);
                } else if (count > schema.maxProperties) {
                    if (non)
                        yield value;
                } else if (still.length > 0) {
                    if (non)
                        yield clone(value);
                } else if (non) {
                    //TODO check other objects restrictions (e.g. propertyNames)
                } else {
                    yield clone(value);
                }
            }
        }
    }
}

/**
 * Objects and arrays must be cloned (deep copied) before being yield, 
 * since they are used for the creation of several instances.
 * @param {*} value to clone
 * @returns a clone (deep copy)
 */
function clone(value) {
    // TODO replace this implementation for a more efficient one
    return JSON.parse(JSON.stringify(value));
}

module.exports = jsonGenerator;
