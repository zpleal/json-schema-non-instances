const assert = require('assert');
const { serialize, parse } = require('../xmlinjson.js');
const { jsonTypeOf, validate, instances, nonInstances }  = require('../generator.js');

describe('Debug', () => {

    const schema = {
        type: "array",
        prefixItems: [ 
            { type: "boolean", minOccurs: 0},
            { type: "number" }
        ],
    };
    const value = [ 1 ];

    it(`check validate ${JSON.stringify(value)}`, (done) => {
        assert( validate(schema,value) );
        done();
    });
});
