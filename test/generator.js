const assert = require('assert');
const { jsonTypeOf, validate, instances, nonInstances }  = require('../generator.js');

/**
 * default number of test repetions
 */
const repetions= 10;

describe('Static methods',() => {
    describe('JSON type', () => {
        for( let {value, type} of [ 
            { value: null,   type: "null"   }, 
            { value: true,   type: "boolean"}, 
            { value: false,  type: "boolean"},
            { value: 0,      type: "number" },
            { value: 1,      type: "number" },
            { value: 1.1,    type: "number" },
            { value: -2,     type: "number" },
            { value: "",     type: "string" },
            { value: "a",    type: "string" },
            { value: "aa",   type: "string" },
            { value: "aa",   type: "string" },
            { value: [],     type: "array"  },
            { value: [true], type: "array"  },
            { value: [1,2,3],type: "array"  },
            { value: [{}],   type: "array"  },
            { value: [{a:1}],type: "array"  },
            { value: {}     ,type: "object" },
            { value: {a:1}  ,type: "object" },
            { value: {a:[]} ,type: "object" }
        ])
            it(`check if "${type}" is the type of ${JSON.stringify(value)}`, (done) =>  {
                assert.equal(jsonTypeOf(value),type);
                done();
            });
    });
});

describe('Const', function() {
    const labels = [ "const", "Hello world", "e", "" ];

    describe('Validate constants',() => {
        for(const label of labels)
            it(`validate constant '${label}'`,(done) => {
                assert(validate({ "const": label}, label ));
                done();
            });
    });

    describe('Invalide constants',() => {
        for(const label of labels)
            for(const c of label) {
                const wrong = label.replace(c,'');

                it(`Invalidate constant '${wrong}'`,(done) => {
                    assert(! validate({ "const": label}, wrong ));
                    done();
                });
            }
    });

    describe('Generate instances of constants',() => {
        for(const label of labels)
            it(`generate constant '${label}'`,(done) => {
                checkWith(instances({ "const": label}), (value) => value === label );
                done();
            });
    });

    describe('Generate noninstances of constants ',() => {
        for(const label of labels)
            it(`generate constant '${label}'`,(done) => {
                checkWith(nonInstances({ "const": label}), (value) => value !== label );
                done();
            });
    });

    describe('Validate generated instances of constants',() => {
        for(const label of labels)
            instancesValidate({ "const": label});
    });

    describe('Validate generated onn-instances of constants',() => {
        for(const label of labels)
            nonInstancesInvalidate({ "const": label});
    });

});

describe('Enum', function() {
    const enumerations = [  
            [ "a", "b", "c"] ,
            [ "", "Hello", "World"]
    ];

    for(const enumeration of enumerations) {
        const schema = { "enum": enumeration };

        for(const value of enumeration)
            it(``,(done) => { validate(schema,value); done() });

        checkWith(instances(schema), (v) => enumeration.includes(v));

        checkWith(nonInstances(schema), (v) => ! enumeration.includes(v));

        instancesValidate(schema);

        nonInstancesInvalidate(schema);
    }
});


describe('All or nothing',function() {
    describe('with true anything is valid',() => anythingGoes(instances(true)) );

    describe('with false nothing is valid',() => nothingGoes(instances(false)) );

    describe('with {} anything is valid',() => anythingGoes(instances({})) );
    
    describe('Nothing is a non instace of {}',() => nothingGoes(nonInstances({})) );

});

describe('Null', function() {
    const schema = { "type": "null"};

    for(const value of [ null ]) {
       it(`validate ${value}`, (done) => { assert(validate(schema,value)); done(); });
    }

   describe('null value', () => checkWith(instances(schema), 
    (value) => value === null ));

   describe('non null', () => checkWith(nonInstances({ "type": "null" }), (v) => v !== null ) );

   instancesValidate(schema);

   nonInstancesInvalidate(schema);
});

describe('Booleans', function() {
    const schema = { "type": "boolean"};

    for(const value of [ true , false ]) {
       it(`validate ${value}`, (done) => { assert(validate(schema,value)); done(); });
    }

   describe('all boolean values', () => checkWith(instances(schema), 
    (value) => value === true || value === false ));

   describe('non booleans', () => nothingWithType(nonInstances({ "type": "boolean" }),"boolean") );

   instancesValidate(schema);

   nonInstancesInvalidate(schema);
});

describe('Numbers', function() {
    const examples = [
        { 
            description: "numbers from 5 to 10",
            schema : { 
                "type": "number",
                "minimum": 5,
                "maximum": 10,
                "multiple": 1,
            },
            values:    [ 5, 6, 7, 8, 9, 10],
            nonValues: [ 2, 3, 4, 11, 12]
        },
        {
            description: "event numbers less than 10",
            schema: { 
                "type": "number",
                "minimum": 0,
                "maximum": 10,
                "multiple": 2,
            },
            values: [ 0, 2, 4, 6, 8, 10],
            nonValues: [ 1, 3, 5, 7, 9, 11, 13 ]
        }
    ];

    for(const example of examples) {

        for(let value of example.values)
            it(`validate ${value} as ${example.description}`, 
                (done) => { assert(validate(example.schema,value)); done(); });

        for(let value of example.nonValues)
            it(`invalidate ${value} as ${example.description}`, 
                (done) => { assert(! validate(example.schema,value)); done(); });

        describe(`generate instances as ${example.description}`, 
            () => theseWillGo(instances(example.schema),example.values));

        describe(`generate non instances as ${example.description}`, 
            () => checkWith(nonInstances(example.schema),(v) => ! example.values.includes(v) ));

        instancesValidate(example.schema);

        nonInstancesInvalidate(example.schema);
    }

    
    describe('non numbers', () => nothingWithType(nonInstances({ "type": "number" }),"number") );
    
    describe('anything but numbers between 2 and 4', () => checkWith(nonInstances({
         "type": "number",
         "minimum": 2,
         "maximum": 4
        }), (value) => (typeof value === "number" ? (value < 2 || value > 4) : true)));
});


describe('Strings', function() {
    const schema = {
        simple: {"type": "string"},
        withPattern: {"type": "string", "pattern": "^a*ba+$"},
        less3: { "type": "string", "maxLength": 3 }
    }

    for(const value of [ "", "hello", "Hello World"])
        if(`validate string '${value}'`, 
            (done) => { assert(validate(schema.simple,value)); done(); });
    
    for(const value of [ "ba", "aba", "aabaa", "aaabaaa"])
        if(`validate with pattern ^a*ba+ $string '${value}'`, 
            (done) => { assert(validate(schema.withPattern,value)); done(); });

    for(const value of [ "", "b", "abba", "aab", "baba"])
            if(`invalidate with pattern ^a*ba+ $string '${value}'`, 
                (done) => { assert(! validate(schema.withPattern,value)); done(); });

    describe('Simple strings (with default maxLength=2)',() => theseWillGo(instances(
        {"type": "string"}), 
        [ "", "a", "aa", "", "a", "aa", "", ] ));

    describe('Strings with less than 3 chars',
        () => theseWillGo(instances(schema.less3), [ "", "a", "aa", "aaa", "", "a"] ));

    describe('Strings with betwwen 4 and 7 chars',() => theseWillGo(instances(
            { 
                "type": "string",
                "minLength": 4,
                "maxLength": 7
            }), [ "aaaa", "aaaaa", "aaaaaa", "aaaaaaa", 
                  "aaaa", "aaaaa", "aaaaaa", "aaaaaaa"] ));

     describe('non strings', () => nothingWithType(nonInstances({ "type": "string" }),"string") );

     // Generator is not yet using pattern, altough validate is
     // for(const kind in schema)
     //    instancesValidate(schema[kind]);
});


describe('Arrays', function() {
    const examples = [
        {
            description: "arrays with less than 4 booleans",
            schema: { 
                "type": "array",
                "items": { "type": "boolean" },  
                "maxItems": 4
                },
            values: [ [], [true], [true,false] ]
        }, {
            description: "multiples of 3 smaller or equal to 10",
            schema: { 
                "type": "array",
                "items": { 
                    "type": "number",
                    "minimum": 3,
                    "maximum": 10,
                    "multiple": 3
                 },
                    "minItems": 1
            },
            values: [ [3], [3,6], [3,6,9] ]
        }
    ];

    for(const example of examples) {
        for(const value of example.values)
            if(`validate ${value} in ${example.description}`, 
                (done) => { assert(validate(example.schema,value))});

        describe(`check validate with ${example.description}`,
            () => theseWillGo(instances(example.schema), example.values ));

        instancesValidate(example.schema);

        nonInstancesInvalidate(example.schema);
    }

     describe('non arrays', () => nothingWithType(nonInstances({ "type": "array" }),"array") );
});

describe('Tuples (arrays with itemPrefixes)', () => {
    const examples = [
        {
            description: 'Simple tuple',
            schema: {
                type: "array",
                prefixItems: [ 
                    { type: "boolean" },
                    { type: "number" }
                ],
            },
            values:   [ [ true, 1 ], [ false, 0 ], [ true, 1.1], [ false, -22 ],
                        [ true ], [ false ], [] // incomplete tuples
            ],
            nonValues: [ [ 1, true ], [ true, true ], [ 0, 0 ], [ false, false ] ]
        },
        {
            description: 'Simple tuple with extra items',
            schema: {
                type: "array",
                prefixItems: [ 
                    { type: "boolean" },
                    { type: "number" }
                ],
                items: { type: "string"}
            },
            values:  [ [ true, 1, "a" ], [ false, 0, "" ], [ true, 1.1, "hello"], [ false, -22 ]],
            nonValues: [ [ true, 1, 0 ], [ true, 1, false ], [ false, 0, null ] ]
        },
        {
            description: 'Simple but strict tuple (prefixItemsStrict extension)',
            schema: {
                type: "array",
                prefixItems: [ 
                    { type: "boolean" },
                    { type: "number" }
                ],
                prefixItemsStrict: true
            },
            values:   [ [ true, 1 ], [ false, 0 ], [ true, 1.1], [ false, -22 ] ],
            nonValues: [ [ true ], [ false ], [],    // incomplete tuples 
                [ 1, true ], [ true, true ], [ 0, 0 ], [ false, false ] ]
        },
        {
            description: 'Tuple with optional item type',
            schema: {
                type: "array",
                prefixItems: [ 
                    { type: "boolean", minOccurs: 0},
                    { type: "number" }
                ],
            },
            values:   [ [ true, 1 ], [ 1 ], [ true, 0 ], [ false, -22 ], [ true, 1, true ] ],
            nonValues: [ [ "" ], [ true, true ], [ "", 1 ], [ "", 0 ] ]
        },
        {
            description: 'Tuple with optional item type (strict)',
            schema: {
                type: "array",
                prefixItems: [ 
                    { type: "boolean", minOccurs: 0},
                    { type: "number" }
                ],
                prefixItemsStrict: true
            },
            values:   [ [ true, 1 ], [ 1 ], [ true, 0 ], [ false, -22 ] ],
            nonValues: [ [ "" ], [ true, 1, true ], [ true, 1, false ],[ "", 1 ], [ "", 0 ] ]
        },
        {
            description: 'Tuple with zero or more repetions of item type (strict)',
            schema: {
                type: "array",
                prefixItems: [ 
                    { type: "boolean", minOccurs: 0, maxOccurs: "unbounded" },
                    { type: "number" }
                ],
                prefixItemsStrict: true
            },
            values:   [ [ 1 ], [ true, 1 ], [ false, true, 0 ], [ false, true, true, 1 ] ],
            nonValues: [ [ 1, 1 ], [ 1, "" ], [ "" ], [ true, false, 1, 1 ] ]
        },
        {
            description: 'Tuple with one or more repetions of item type (strict)',
            schema: {
                type: "array",
                prefixItems: [ 
                    { type: "boolean", minOccurs: 1, maxOccurs: "unbounded" },
                    { type: "number" }
                ],
                prefixItemsStrict: true
            },
            values:   [  [ true, 1 ], [ false, true, 0 ], [ false, true, true, 1 ] ],
            nonValues: [ [ 1 ], [ 1, 1 ], [ 1, "" ], [ "" ], [ true, false, 1, 1 ] ]
        },
    ]

    for(const example of examples)
        describe(example.description,() => {
    
            for(const value of example.values) 
                it(`check validate ${JSON.stringify(value)}`, (done) => {
                    assert( validate(example.schema,value) );
                    done();
                });

            for(const nonValue of example.nonValues) 
                it(`check invalidate ${JSON.stringify(nonValue)}`, (done) => {
                    assert( ! validate(example.schema,nonValue) );
                done();
            });        
        });

});

describe('Objects', function() {
    const examples = [
        {
            description: 'Simple name/value pair, both required',
            schema: { 
                "type": "object",
                "properties": {
                    "b": { "type": "boolean"},
                    "n": { "type": "number"},
                    "s": { "type": "string" },
                },
    
            },
            values: [ 
                { "b": true },
                { "b": true, "n": 0 },
                { "b": true, "n": 0, "s": "" },
                { "b": false },
                { "b": false, "n": 1 },
                { "b": false, "n": 1, "s": "a" },
                { "b": true },
                { "b": true, "n": 2 },
                { "b": true, "n": 2, "s": "aa" },
                { "b": false },
                { "b": false, "n": 3 },
                { "b": false, "n": 3, "s": "" }, // default maxLenght is 2
                { "b": true },
                { "b": true, "n": 4 },
                { "b": true, "n": 4, "s": "a" },
                { "b": false },
                { "b": false, "n": 5 },
                { "b": false, "n": 5, "s": "aa" }
            ]
        },
        {
            description: 'Simple name/value pair, both required',
            schema: { 
                "type": "object",
                "properties": {
                    "name": { "type": "string", minLength: 1},
                    "value": { "type": "number"}
                },
                "required": [ "name", "value"]
            },
            values: [ 
                { "name": "a", "value": 0 } ,
                { "name": "aa", "value": 1 }
             ]
        }
    ];

    for(const example of examples) {
        describe(example.description,  
            () => theseWillGo(instances(example.schema),example.values));

        instancesValidate(example.schema);

        nonInstancesInvalidate(example.schema);
    }


    describe('non objects', () => nothingWithType(nonInstances({ "type": "object" }),"object") );

});

describe('Invalid schemata', function() {

    describe('Invalid schema raise exception', () => {
        for(const wrong in [1,"","wrong",[],[{"type":"string"}]]) 
            it(`invalid schema ${JSON.stringify(wrong)}`, (done) => {
               assert.throws( () => instances(wrong).next(),{ 
                   name: "Error", 
                   message: /Invalid JSON Schema/ });
                   done();
               });
    });

});


describe('Invalid types', function() {

    describe('Invalid type in instances', () => {
        assert.throws( () => instances({
            "type": "this is not a valid type"
        }).next(),{ name: "Error", message: /Invalid JSON type/ });
    });

    describe('Invalid type in non-instances', () => {
        assert.throws( () => nonInstances({
            "type": "this is not a valid type"
        }).next(),{ name: "Error", message: /Invalid JSON type/ });
    });
});

describe('Definitions', function() {

    describe('definition with invalid path', () => {
        assert.throws( () => instances({
            "definitions": {
                "aDefinition": {
                    "$id":  "someId"
                }
            },
            "$ref": "#/definitions/wrongDefinition"
        }).next(),{ name: "Error", message: /invalid path/ });
    });


    describe('definition with missing $id', () => {
        assert.throws( () => instances({
            "definitions": {
                "aDefinition": {
                    "$id":  "someId"
                }
            },
            "$ref": "wrongId"
        }).next(),{ name: "Error", message: /not found/ });
    });

    describe('boolean definition using path', () => checkWith(instances({
        "definitions": {
            "myBoolean": {
                "type": "boolean"
            }
        },
        "$ref": "#/definitions/myBoolean"}), 
    (value) => value === true || value === false ));

    describe('boolean definition using $id', () => checkWith(instances({
        "definitions": {
            "myBoolean": {
                "$id":  "myBooleanId",
                "type": "boolean"
            }
        },
        "$ref": "myBooleanId"}), 
    (value) => value === true || value === false ));

});


describe('Any of', function() {
    const examples = [
        {
            description: 'Either booleans or numbers',
            schema: {
                "anyOf": [
                    { "type": "boolean" },
                    { "type": "number" }
                ]
            },
            check: (value) => typeof(value) === "boolean" || typeof(value) === "number"
        },
        {
            description: 'Arrays or null',
            schema: {
                "anyOf": [
                    { "type": "array" },
                    { "type": "null" }
                ]
            },
            check: (value) => { 
                const type = jsonTypeOf(value); 
                return type === "array" || type === "null";
            }
        },
        {
            description: 'booleans also as text',
            schema: {
                "anyOf": [
                    { "type": "boolean" },
                    { "enum": [ "true", "false"] }
                ]
            },
            check: (value) => 
                jsonTypeOf(value) === "boolean" || value === "true" || value === "false"
        }

    ];

    for(const example of examples) {
        describe(example.description, 
            () => checkWith( instances(example.schema) , example.check ) );

        instancesValidate(example.schema);

        nonInstancesInvalidate(example.schema);
    }
});


describe('All of', function() {
    const examples = [
        {
            description: 'both multiples of 3 and 5',
            schema: {
                "allOf": [
                    { "type": "number", "multiple": 3 },
                    { "type": "number", "multiple": 5 }
                ]
            },
            check: (value) => value % 3 == 0  && value % 5 == 0 
        }
    ]

    for(const example of examples) {
        describe(example.description, 
            () => checkWith(instances(example.schema), example.check));
    
        instancesValidate(example.schema);

        nonInstancesInvalidate(example.schema);
    }
});


describe('One of', function() {
    const examples = [
        {
            description: 'either multiples of 3 or multiples of 5',
            schema: {
                "oneOf": [
                    { "type": "number", "multiple": 3 },
                    { "type": "number", "multiple": 5 }
                ]
            },
            check: (value) => 
                (value % 3 == 0  && value % 5 != 0) || 
                (value % 3 != 0  && value % 5 == 0)
        },
        {
            description: 'booleans also as text',
            schema: {
                "oneOf": [
                    { "type": "boolean" },
                    { "enum": [ "true", "false"] }
                ]
            },
            check: (value) => 
                jsonTypeOf(value) === "boolean" || value === "true" || value === "false"
        }
    ];

    for(const example of examples) {
        describe(example.description, 
            () => checkWith(instances(example.schema), example.check));

        
        instancesValidate(example.schema);

        nonInstancesInvalidate(example.schema);
    }
});

 
describe('Not', function() {

    for(const type of [ "boolean", "string", "number", "array", "object"]) {
        const schema = { "not": { "type": type } };

        describe(`Not ${type}`, 
            () => checkWith(instances(schema),(value) => jsonTypeOf(value) !== type ));

        instancesValidate(schema);

        nonInstancesInvalidate(schema);
    }
});


/*----------------*\
 |  Utilities     |
 \*---------------*/

 /**
  * Check if the generated instances are validated by given function .
  * @param {*} instances to check
  * @param {*} checker for instances
  */
function checkWith(instances,checker) {
    for(let c=0; c < repetions; c++)
    ((value) => {
        it(`${JSON.stringify(value)} tested with ${checker}`, function (done) {
            assert(checker(value))
            done();
        });
    })(instances.next().value);
}

 /**
  * Check if the generated instances corresponde to the given sequence.
  * Values are compared using deepEqual(), in case they objects or arrays.
  * 
  * @param {*} instances 
  * @param {*} sequence 
  */
function theseWillGo(instances, sequence) {

    for(const expected of sequence) {
        const value = instances.next().value;

        it(`expected ${JSON.stringify(expected)}`, function (done) {
                assert.deepEqual(value, expected)
                done();
        });
    }

}

/**
 * Check that many instances of different types are generated
 * @param {*} instances 
 */
function anythingGoes(instances) { 
    const types = [];
    for(let c=0; c < repetions; c++) {
        const value = instances.next().value;
        const type = typeof value;

        if(! types.includes(type))
                types.push(type);
        it(`anything goes, including ${JSON.stringify(value)}`,function(done) {
            assert.doesNotThrow(() => jsonTypeOf(value));
            done();
        });
    };

    it(`different types where generated: ${JSON.stringify(types)}`, (done) => {
        assert(types.length >= 4);
        done();
    })
}

/**
 * Check that none of the instances is of the given type
 * 
 * @param {*} instances 
 * @param {*} type 
 */
function nothingWithType(instances,type) {

    for(let c=0; c< repetions; c++) {
        const value = instances.next().value;

        it(`anything but a ${type}, such as ${JSON.stringify(value)}`,function(done) {
            assert.notEqual(jsonTypeOf(value),type);
            done();
        });
    }
}


/**
 * Check schema instance generation against validation
 * 
 * @param {*} schema to test
 */
function instancesValidate(schema) {
    let count = 0;

    for(const instance of instances(schema)) {
        it(`instance ${JSON.stringify(instance)} of ${JSON.stringify(schema)}`, 
            (done) => { assert( validate(schema,instance) ); done(); } );

        if(count++ > repetions)
            break;
    }
}

/**
 * Check schema non-instance generation against validation
 * 
 * @param {*} schema to test
 */
function nonInstancesInvalidate(schema) {
    let count = 0;

    for(const instance of nonInstances(schema)) {
        it(`noninstance ${JSON.stringify(instance)} of ${JSON.stringify(schema)}`, 
            (done) => { assert( ! validate(schema,instance) ); done(); } );

        if(count++ > repetions)
            break;
    }
}

/**
 * Check that no instance is ever generated
 * @param {*} instances 
 */
function nothingGoes(instances) {
    it('nothing is generated',function(done) {
        assert(instances.next().done);
        done();
    });
}


