
const assert = require('assert');
const { getJsonSchema, validate, instances, nonInstances } = require('../dtd');
const { serialize, parse } = require('../xmlinjson.js');


describe('Parser errors', () => {
    const examples = [
        {
            description: 'Missing end tag',
            xml: '<top>Hello world</top>',
            pattern: /unexpected end token: START/
        },
    ];

    for(const example of examples)
        describe(example.description, () => {
            checkParseThrows(example.xml,example.pattern);
    });
});


function checkParseThrows(xml, pattern) {
    it(`${JSON.stringify(xml)} should report ${pattern}`, (done) => {
        assert.throws(() => parse(xml), { name: "Error", message: pattern });
        done();
    });
}

/*

describe('DTD and documents',() => {

    const examples = [
        {
            description: 'Top empty element with optional attribute x',
            dtd: `<!DOCTYPE top [
                <!ELEMENT top   EMPTY>
                <!ATTLIST top x CDATA "">
            ]>
            `,
            expected:  {
                definitions: {
                    'top': {
                        $id: 'top',
                        type: 'object',
                        properties: { 
                            element: { const: 'top'},
                            attributes: {
                                type: 'object',
                                properties: {
                                    x: { type: 'string'}
                                },
                                required: [],
                                maxProperties: 1
                            }
                        },
                    }
                }
            },
            instances: [ '<top/>', '<top></top>', '<top x="1">', '<top x="1"></top>', '<top x="hello world">'  ],
            nonInstances: [ '<root/>', '<top y="1"/>', '<top x="1">Hello</top>', '<top x="1" y="2"/>']
        },
    ];

    for(const example of examples)
        describe(example.description, () => {
            
            it('Check JSON Schema', (done) => { 
                const obtained = getJsonSchema(example.dtd);
                
                console.log( JSON.stringify(obtained,null,3));
                similarTo( obtained ,example.expected); 
                done();
            });
            for(const instance of example.instances)
                it(`validate instance ${instance}`, (done) => { 
                    assert(validate(example.dtd,instance)); 
                    done(); 
                });
    
            for(const nonInstance of example.nonInstances)
                it(`invalidate non-instance ${nonInstance}`, (done) => { 
                    assert(! validate(example.dtd,nonInstance)); 
                    done(); 
                });

        });
});

function similarTo(actual,expected) {
    const type = typeof expected;

    switch(type) {
        case "object":
            if(typeof actual !== type)
                throw new assert.AssertionError({ 
                    message: `expected object ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`,
                    actual, expected
                });
            if(Array.isArray(expected)) {
                if(! Array.isArray(actual))
                    throw new assert.AssertionError({
                        message: `expected array ${expected} but got ${actal}`, 
                        expected, actual
                    });
                    
                if(expected.length !== actual.length)
                    throw new assert.AssertionError({
                        message: `invalid array size ${expected.length}, expected ${actual.length}`,
                        expected, actual
                    });
            }
                
            for(const key in expected) {
                if(actual[key])
                    similarTo(actual[key],expected[key]);
                else
                    throw new assert.AssertionError({
                        message: `expected key ${key} in ${JSON.stringify(actual)}`,
                        expected, actual
                    });
            }
            break;
        default:
            if(actual !== expected)
                throw new assert.AssertionError({
                    message: `wrong value ${actual}, expected ${expected}`,
                    expected, actual   
                });     
    }
}

*/