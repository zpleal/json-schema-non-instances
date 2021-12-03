const assert = require('assert');
const { instances, nonInstances }  = require('../generator.js');


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

        theseWillGo(nonInstances({ "enum": [ "Hello", "World"]}),[ 
            "ello", "Hllo", "Helo", "Helo", "Hell", 
            "orld", "Wrld", "Wold", "Word", "Worl",
            "ello", "Hllo", "Helo", "Helo", "Hell",
            "orld", "Wrld", "Wold", "Word", "Worl"
        ]);
    });
});


describe('All or nothing',function() {
    describe('with true anything is valid',() => anythingGoes(instances(true)) );

    describe('with false nothing is valid',() => nothingGoes(instances(false)) );

    describe('with {} anything is valid',() => anythingGoes(instances({})) );
    
    describe('Nothing is a non instace of {}',() => nothingGoes(nonInstances({})) );

});


describe('Booleans', function() {
  describe('all boolean values', () => theseWillGo(instances({ "type": "boolean"}),
    [true, false, true, false,true,false]));
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

    /*
    describe('non numbers', function(done) {
        const instances = nonInstances({ "type": "number" });

        for(let c=0; c< 10; c++)
            ((value) => {
                it(`anything but a number such as ${JSON.stringify(value)}`,function(done) {
                    assert(typeof value !== "number");
                    done();
                });
            })(instances.next().value);
        
    });
    */
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

});


/*----------------*\
 |  Utilities     |
 \*---------------*/

 /**
  * Check if the generated instances corresponde to the given sequence.
  * Values are compared using deepEqual(), in case they objects or arrays.
  * 
  * @param {*} instances 
  * @param {*} sequence 
  */
function theseWillGo(instances,sequence) {
    for(item of sequence) 
        ((value,expected) => {
            it(`expected ${JSON.stringify(expected)}`,function(done) {
                assert.deepEqual(value,expected)
                done();
            });
        })(instances.next().value,item);
}

/**
 * Check that many instances of different types are generated
 * @param {*} instances 
 */
function anythingGoes(instances) { 
    const types = [];
    for(let c=0; c< 10; c++)
        ((value) => {
            const type = typeof value;
            if(! types.includes(type))
                types.push(type);
            it(`anything goes, including ${JSON.stringify(value)}`,function(done) {
                assert(true);
                done();
        })
    })(instances.next().value);

    it(`different types where generated: ${JSON.stringify(types)}`, (done) => {
        assert(types.length >= 4);
        done();
    })
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
