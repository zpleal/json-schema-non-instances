const assert = require('assert');
const { jsonTypeOf, instances, nonInstances }  = require('../generator.js');

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
    describe('The usual constant :-)', function() {
        const label = "Hello World!";
        checkWith(instances({ "const": label}), (value) => value === label );
    });

    describe('A small contant', function() {
        const label = "e";
        checkWith(instances({ "const": label}), (value) => value === label );
    });

    describe('An empty contant', function() {
        const label = "";
        checkWith(instances({ "const": label}), (value) => value === label );
    });
});

describe('Enum', function() {
    describe('Enumerate single character words', function() {
        const enumeration = [ "a", "b", "c"];
        theseWillGo(instances({ "enum": enumeration}), enumeration.concat(enumeration));

    });

    describe('Enumerate empty string and full words', function() {
        const enumeration = [ "", "Hello", "World"];
        theseWillGo(instances({ "enum": enumeration}), enumeration.concat(enumeration));          
    });

    describe('Enumerate non intances of full words', function() {

        checkWith(nonInstances({ "enum": [ "Hello", "World"]}),(value) => ! [ "Hello", "World" ].includes(value));

    });
});


describe('All or nothing',function() {
    describe('with true anything is valid',() => anythingGoes(instances(true)) );

    describe('with false nothing is valid',() => nothingGoes(instances(false)) );

    describe('with {} anything is valid',() => anythingGoes(instances({})) );
    
    describe('Nothing is a non instace of {}',() => nothingGoes(nonInstances({})) );

});


describe('Booleans', function() {

  describe('all boolean values', () => checkWith(instances({ "type": "boolean"}), 
    (value) => value === true || value === false ));

   describe('non booleans', () => nothingWithType(nonInstances({ "type": "boolean" }),"boolean") );

});

describe('Numbers', function() {
    describe('integers betwen 5 and 10', () => theseWillGo(instances(
        { 
            "type": "number",
            "minimum": 5,
            "maximum": 10,
            "multiple": 1,
        }),[5,6,7,8,9,10]));

    describe('even numbers less than 10',  () => theseWillGo(instances({ 
            "type": "number",
            "minimum": 0,
            "maximum": 10,
            "multiple": 2,
        }),[0,2,4,6,8,10]));

    
    describe('non numbers', () => nothingWithType(nonInstances({ "type": "number" }),"number") );
    
    describe('anything but numbers between 2 and 4', () => checkWith(nonInstances({
         "type": "number",
         "minimum": 2,
         "maximum": 4
        }), (value) => (typeof value === "number" ? (value < 2 || value > 4) : true)));
});


describe('Strings', function() {
    describe('Simple strings (with default maxLength=2)',() => theseWillGo(instances(
        {"type": "string"}), 
        [ "", "a", "aa", "", "a", "aa", "", ] ));


    describe('Strings with less than 3 chars',() => theseWillGo(instances(
        { 
            "type": "string",
            "maxLength": 3
        }), [ "", "a", "aa", "aaa", "", "a"] ));

    describe('Strings with betwwen 4 and 7 chars',() => theseWillGo(instances(
            { 
                "type": "string",
                "minLength": 4,
                "maxLength": 7
            }), [ "aaaa", "aaaaa", "aaaaaa", "aaaaaaa", 
                  "aaaa", "aaaaa", "aaaaaa", "aaaaaaa"] ));

     describe('non strings', () => nothingWithType(nonInstances({ "type": "string" }),"string") );
});


describe('Arrays', function() {

    describe('boolean array with no more than 4 itens',() => theseWillGo(instances(
        { 
            "type": "array",
            "items": { "type": "boolean" },  
            "maxItems": 4
        }), [ [], [true], [true,false] ] ));

    describe('array of multiples of 3 less or equal 10',() => theseWillGo(instances(
        { 
            "type": "array",
            "items": { 
                "type": "number",
                "minimum": 3,
                "maximum": 10,
                "multiple": 3
             },
                "minItems": 1
            }),[ [3], [3,6], [3,6,9] ]));
            
 
     describe('non arrays', () => nothingWithType(nonInstances({ "type": "array" }),"array") );
});


describe('Objects', function() {

    describe('Object with simple properties',() => theseWillGo(instances(
        { 
            "type": "object",
            "properties": {
                "b": { "type": "boolean"},
                "n": { "type": "number"},
                "s": { "type": "string" },
            },

        }),[ 
            { "b": true },
            { "b": true, "n": 0 } ,
            { "b": true, "n": 0, "s": "" } ,
            { "b": false },
            { "b": false, "n": 1 },
            { "b": false, "n": 1, "s": "a" },
            { "b": true },
            { "b": true, "n": 2 } ,
            { "b": true, "n": 2, "s": "aa" } ,
            { "b": false },
            { "b": false, "n": 3 },
            { "b": false, "n": 3, "s": "" }, // default maxLenght is 2
            { "b": true },
            { "b": true, "n": 4 } ,
            { "b": true, "n": 4, "s": "a" },
            { "b": false },
            { "b": false, "n": 5 },
            { "b": false, "n": 5, "s": "aa" }
         ]
    ));

    describe('Simple name/value pair, both required',() => theseWillGo(instances(
        { 
            "type": "object",
            "properties": {
                "name": { "type": "string", minLength: 1},
                "value": { "type": "number"}
            },
            "required": [ "name", "value"]
        }),[ 
            { "name": "a", "value": 0 } ,
            { "name": "aa", "value": 1 }
         ])
    );

    describe('non objects', () => nothingWithType(nonInstances({ "type": "object" }),"object") );

});

describe('Wromg types', function() {

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

    for (item of sequence)
        ((value, expected) => {
            it(`expected ${JSON.stringify(expected)}`, function (done) {
                assert.deepEqual(value, expected)
                done();
            });
        })(instances.next().value, item);

}

/**
 * Check that many instances of different types are generated
 * @param {*} instances 
 */
function anythingGoes(instances) { 
    const types = [];
    for(let c=0; c < repetions; c++)
        ((value) => {
            const type = typeof value;
            if(! types.includes(type))
                types.push(type);
            it(`anything goes, including ${JSON.stringify(value)}`,function(done) {
                assert.doesNotThrow(() => jsonTypeOf(value));
                done();
        })
    })(instances.next().value);

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

    for(let c=0; c< repetions; c++)
        ((value) => {
            it(`anything but a ${type}, such as ${JSON.stringify(value)}`,function(done) {
                assert.notEqual(jsonTypeOf(value),type);
                done();
            });
        })(instances.next().value);
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

