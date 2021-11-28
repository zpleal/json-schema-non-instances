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
    describe('even numbers less than 10', function() {
        const instances = generator({ 
            "type": "number",
            "minimum": 0,
            "maximum": 10,
            "multiple": 2,
        });
        
        
        for(let even=0; even <= 10; even += 2)
            it(`expected ${even}`,function(done) {
                assert.equal(instances.next().value,even);
                done();
            });     
    });
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
