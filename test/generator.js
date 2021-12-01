const assert = require('assert');
const generator  = require('../generator.js');

describe('Enum', function() {
    describe('Enumerate single character words', function() {
        const enumeration = [ "a", "b", "c"];
        theseWillGo(generator({ "enum": enumeration}), enumeration.concat(enumeration));

    });

    describe('Enumerate empty string and full words', function() {
        const enumeration = [ "", "Hello", "World"];
        theseWillGo(generator({ "enum": enumeration}), enumeration.concat(enumeration));          
    });

    describe('Enumerate non intances of full words', function() {

        theseWillGo(generator({ "enum": [ "Hello", "World"]},true),[ 
            "ello", "Hllo", "Helo", "Helo", "Hell", 
            "orld", "Wrld", "Wold", "Word", "Worl",
            "ello", "Hllo", "Helo", "Helo", "Hell",
            "orld", "Wrld", "Wold", "Word", "Worl"
        ]);
    });
});


describe('All or nothing',function() {
    describe('with true anything is valid',() => anythingGoes(generator(true)) );

    describe('with false nothing is valid',() => nothingGoes(generator(false)) );

    describe('with {} anything is valid',() => anythingGoes(generator({})) );
    
    describe('Nothing is a non instace of {}',() => nothingGoes(generator({},true)) );

});


describe('Booleans', function() {
  describe('all boolean values', () => theseWillGo(generator({ "type": "boolean"}),
    [true, false, true, false,true,false]));
});

describe('Numbers', function() {
    describe('integers betwen 5 and 10', () => theseWillGo(generator(
        { 
            "type": "number",
            "minimum": 5,
            "maximum": 10,
            "multiple": 1,
        }),[5,6,7,8,9,10]));

    describe('even numbers less than 10',  () => theseWillGo(generator({ 
            "type": "number",
            "minimum": 0,
            "maximum": 10,
            "multiple": 2,
        }),[0,2,4,6,8,10]));

    /*
    describe('non numbers', function(done) {
        const instances = generator({ "type": "number" },"no");

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
    describe('Strings with less than 3 chars',() => theseWillGo(generator(
        { 
            "type": "string",
            "maxLength": 3
        }), [ "", "a", "aa", "aaa", "", "a"] ));
});

 
describe('Arrays', function() {

    describe('boolean array with no more than 4 itens',() => theseWillGo(generator(
        { 
            "type": "array",
            "items": { "type": "boolean" },  
            "maxItems": 4
        }), [ [], [true], [true,false] ] ));

    describe('array of multiples of 3 less or equal 10',() => theseWillGo(generator(
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

    describe('Simple name value pair, both required',() => theseWillGo(generator(
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
         ]));

});


/*----------------*\
 |  Utilities     |
 \*---------------*/

 /**
  * Check if the generated instances corresponde to the given sequence.
  * Values are compared using deepEqual(), in case they a objects or arrays.
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


function anythingGoes(instances) { 
    for(let c=0; c< 10; c++)
        ((value) => {
            it(`anything goes, including ${JSON.stringify(value)}`,function(done) {
                assert(true);
                done();
        })
    })(instances.next().value);
}

function nothingGoes(instances) {
    it('nothing is generated',function(done) {
        assert(instances.next().done);
        done();
    });
}
