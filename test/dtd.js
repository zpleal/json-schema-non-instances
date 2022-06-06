const assert = require('assert');
const { getJsonSchema, validate, instances, nonInstances } = require('../dtd');


describe('DTD and documents',() => {

    const examples = [
        {
            description: 'Simple DTD with just top empty element',
            dtd: `<!DOCTYPE top [
                <!ELEMENT top EMPTY>
            ]>`,
            expected:  {
                definitions: {
                    'top': {
                        $id: 'top',
                        type: 'object',
                        properties: { element: { const: 'top'} }
                    }
                },
                $ref: 'top'
            },
            instances: [ '<top/>' ],
            nonInstances: [ '<root/>', '<top>hello</top>', '<top a="1"/>' ]
        }
    ];

    for(const example of examples)
        describe(example.description, () => {
            
            it('Check JSON Schema', (done) => { 
                similarTo(getJsonSchema(example.dtd),example.expected); 
                done();
            });

            for(const instance of example.instances)
                it(`validate instance ${instance}`, (done) => { 
                    assert(validate(example.dtd,instance)); 
                    done(); 
                });
        
            for(const nonInstance of example.nonInstances)
                it(`invalidate non-instace ${nonInstance}`, (done) => { 
                    assert(! validate(example.dtd,nonInstance)); 
                    done(); 
                });

        });
});

describe('Simple DTD with just top empty element', () => {
    const dtd = `<!DOCTYPE top [
        <!ELEMENT top EMPTY>
    ]>`;
    const expected = {
        definitions: {
            'top': {
                $id: 'top',
                type: 'object',
                properties: { element: { const: 'top'} }
            }
        },
        $ref: 'top'
    };
    const actual = getJsonSchema(dtd);

    it('JSON Schema', (done) => { similarTo(actual,expected); done();});

    it('validate', (done) => { assert(validate(dtd,'<top/>')); done(); });


   // console.log(JSON.stringify(obtained,null,'    '));
});
/*
describe('', () => {
    const dtd = `<!DOCTYPE top [
        <!ELEMENT top (#PCDATA | b)>
        <!ELEMENT b (#PCDATA)>
        <!ATTLIST top x CDATA "" y CDATA ""> 
        ]>`;
    const jsonSchema = ``;
    

    const obtaines = getJsonSchema(dtd);

    console.log(jsonSchema);
});
*/

function similarTo(actual,expected) {
    const type = typeof expected;

    switch(type) {
        case "object":
            if(typeof actual !== type)
                throw new assert.AssertionError({ 
                    message: `expected object ${expected} but got ${actual}`,
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
                
            for(const key in expected)
                similarTo(actual[key],expected[key]);
             break;
        default:
            if(actual !== expected)
                throw new assert.AssertionError({
                    message: `wrong value ${actual}, expected ${expected}`,
                    expected, actual   
                });     
    }
}