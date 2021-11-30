const assert = require('assert');
const generator  = require('../generator.js');

describe('Enum', function() {
    describe('Enumerate "a" "b" "c"', function() {
        const instances = generator({ "enum": [ "a", "b", "c"]});

        it('1st should "a"', function(done) {
            assert.equal(instances.next().value, "a");
            done();
        });
        it('2nd should "b"', function(done) {
            assert.equal(instances.next().value, "b");
            done();
          }); 
        it('3nrd should "c"', function(done) {
            assert.equal(instances.next().value, "c");
            done();
          });  
          
    });
});


describe('All or nothing',function() {
    describe('with true anything is valid',function() {
        const instances = generator(true);

        for(let c=0; c< 10; c++)
            ((value) => {
                it(`anything goes, including ${JSON.stringify(value)}`,function(done) {
                    assert(true);
                    done();
                })
            })(instances.next().value);
    });

    describe('with false nothing is valid',function() {
        const instances = generator(false);

        it('nothing is generated',function(done) {
            assert(instances.next().done);
            done();
        });
    });

    describe('with {} anything is valid',function() {
        const instances = generator({});

        for(let c=0; c< 10; c++)
            ((value) => {
                it(`anything goes, including ${JSON.stringify(value)}`,function(done) {
                    assert(true);
                    done();
                })
            })(instances.next().value);
    });

});


describe('Booleans', function() {
  describe('all boolean values', function() {
    const instances = generator({ "type": "boolean"});

    it('first should true', function(done) {
      assert.equal(instances.next().value, true);
      done();
    });
    it('second should false', function(done) {
        assert.equal(instances.next().value, false);
        done();
      });
  });
});

describe('Numbers', function() {
    describe('integers betwen 5 and 10', function() {
        const instances = generator({ 
            "type": "number",
            "minimum": 5,
            "maximum": 10,
            "multiple": 1,
        });
        
        
        for(let number=5; number <= 10; number++)
            ((value,expected) => {
                it(`expected ${expected}`,function(done) {
                    assert.equal(value,expected);
                    done();
                });
            })(instances.next().value,number) ;  
    });

    describe('even numbers less than 10', function() {
        const instances = generator({ 
            "type": "number",
            "minimum": 0,
            "maximum": 10,
            "multiple": 2,
        });
        
        for(let number=0; number <= 10; number += 2)
            ((value,expected) => {
                it(`expected ${expected}`,function(done) {
                    assert.equal(value,expected);
                    done();
                });
            })(instances.next().value,number) ; 

    });
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
    describe('Strings with less than 3 chars',function() {
        const instances = generator({ 
            "type": "string",
            "maxLength": 3
        });
        
        let text = "";
        for(let c=0; c<=3; c++) {
            ((value,expected) => {
                it(`expected ${expected}`, function(done) {
                    assert.equal(value,expected);
                    done();
                })
            })(instances.next().value,text);
            text += "a";
        }
    });
});


describe('Arrays', function() {

    describe('boolean array with no more than 4 itens', function() {
        const instances = generator({ 
            "type": "array",
            "items": { "type": "boolean" },  
            "maxItems": 4
        });

        it(`expected []`,function(done) {
            assert.deepEqual(instances.next().value,[]);
            done();
        });
        it(`expected [true]`,function(done) {
            assert.deepEqual(instances.next().value,[true]);
            done();
        });
        it(`expected [true,false]`,function(done) {
            assert.deepEqual(instances.next().value,[true,false]);
            done();
        });
        it(`expected [true,false,true]`,function(done) {
            assert.deepEqual(instances.next().value,[true,false,true]);
            done();
        });
        it(`expected [true,false,true,false]`,function(done) {
            assert.deepEqual(instances.next().value,[true,false,true,false]);
            done();
        });
        it(`expected [] again`,function(done) {
            assert.deepEqual(instances.next().value,[]);
            done();
        });
    });

    describe('array of multiples of 3 less or equal 10',function() {
        const instances = generator({ 
            "type": "array",
            "items": { 
                "type": "number",
                "minimum": 3,
                "maximum": 10,
                "multiple": 3
             },
                "minItems": 1
            });
             
             const array = [];
             for(let number=3; number < 10; number += 3) {
                 array.push(number);

                 ((value,expected) => {
                     it(`expected ${expected}`,function(done) {
                        assert.deepEqual(value,expected);
                        done();
                     });
                 })(instances.next().value,array);
                 
             }
        });
});


describe('Objects', function() {

    describe('Simple name value pair',function() {
        const instances = generator({ 
            "type": "object",
            "properties": {
                "name": { "type": "string", minLength: 1},
                "value": { "type": "number"}
            },
            "required": [ "name", "value"]
        });

        it('expected { "name": "a", "value": 0 }',function(done) {
            assert.deepEqual(instances.next().value,{name:"a","value":0})
            done();
        });
        it('expected { "name": "aa", "value": 1 }',function(done) {
            assert.deepEqual(instances.next().value,{name:"aa","value":1})
            done();
        });

    });
});