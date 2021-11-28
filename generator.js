
const DEFAULT_MAX_LENGTH = 2; // default maxLength for strings  
const DEFAULT_MAX_ITEMS  = 5; // default maxItems for arrays

const GENERATORS = {
    "null":     anyGenerator,
    "boolean":  booleanGenerator,
    "number":   numberGenerator,
    "string":   stringGenerator,
    "array":    arrayGenerator,
    "object":   objectGenerator
}

function* jsonGenerator(jsonSchema,non) {

    switch(typeof jsonSchema) {
        case "boolean": 
            yield* anyGenerator(_, !jsonSchema || non);
            break;
        case "object":
            if("type" in jsonSchema)
                yield* generateFromType(jsonSchema,non);
            else if("enum" in jsonSchema)
                yield* generateFromEnum(jsonSchema,non);
            else
                yield* anyGenerator(jsonSchema, non);
    }
}

/**
 * Generates (non) instances ffrom enumeration
 
 */
function* generateFromEnum(jsonSchema,non) {
    
    for(const value of jsonSchema.enum)
        if(non) { 
            if(value.length > 0)
                yield value.replace(value[0],'');
        } else
            yield value;
}

function* generateFromType(jsonSchema,non) {
    const generator = GENERATORS[jsonSchema.type];

    if(non) {
        const other = Object.keys(GENERATORS)
        .filter((n) => n !== jsonSchema.type)
        .map(n => GENERATORS[n]());

        if(generator)
            other.push(generator(jsonSchema,non));

        return combine(other);
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
        yield* combine(Object.keys(GENERATORS).map(n => GENERATORS[n]()));
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
        items: null,
        ...jsonSchema
    };

    const instances = jsonGenerator(schema.items);
    
    while(true) {
        const array = [];
    
        for(let c = 0; c <= schema.maxItems; c++) {
            if(c < schema.minItems) {
                if(non)
                    yield array;
            } else if(c > schema.maxItems) {
                if(non)
                    yield array;
            } else if(non) {
                // check other kinds of array restrictions (e.g. uniqueElements)
            } else {
                yield array;
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
    const iterators  = {};

    for(const p in properties)
        iterators[p] = jsonGenerator(properties[p]);

    while(true) {
        const value = {};
        let count   = 0;
        let still = required; 
        for(const p in properties) {
            value[p] = iterators[p].next().value;
            count++;
            still = require.filter((s) => s !== p);
            
            if(count < minProperties) {
                if(non)
                    yield value;
            } else if(count > maxProperties) {
                if(non)
                    yield value;
            } else if(still.length > 0) {
                if(non)
                    yield value;
            } else if(non) {
                //TODO check other objects restrictions (e.g. propertyNames)
            } else {
                yield value;
            } 
        }    
    }
}

module.exports = jsonGenerator;
