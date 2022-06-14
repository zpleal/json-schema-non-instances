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
        }, 
        {
            description: 'Top element with #PCDATA',
            dtd: `<!DOCTYPE top [
                <!ELEMENT top (#PCDATA)>
            ]>
            `,
            expected:  {
                definitions: {
                    'top': {
                        $id: 'top',
                        type: 'object',
                        properties: { 
                            element: { const: 'top'},
                            content: {
                                type: 'array',
                                items: { type: 'string' },
                                maxContains: 1
                            }
                        },
                    }
                }
            },
            instances: [ '<top/>', '<top></top>', '<top>Hello</top>', '<top>Hello world!</top>'  ],
            nonInstances: [ '<root/>', '<top x="1"/>', '<top x="1"></top>', '<top x="1">Hello</top>']
        },
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
            instances: [ '<top/>', '<top></top>', '<top x="1"/>', '<top x="1"></top>', '<top x="hello world"/>'  ],
            nonInstances: [ '<root/>', '<top y="1"/>', '<top x="1">Hello</top>', '<top x="1" y="2"/>', '<top y="2">Hello world!<top/>']
        },
        /*
        {
            description: 'Top element with atributes x and y, having as content either #PCDATA or element b with #PCDATA',
            dtd: `<!DOCTYPE top [
                <!ELEMENT top (#PCDATA | b)>
                <!ELEMENT b (#PCDATA)>
                <!ATTLIST top x CDATA "" y CDATA ""> 
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
                                    x: { type: 'string' },
                                    y: { type: 'string' }
                                },
                                required: [],
                                maxProperties: 2
                            },
                            content: {
                                type: 'array',
                                items: {
                                    anyOf: [
                                        { type: 'string' },
                                        { $ref: 'b'}
                                    ] 
                                }
                                    
                            },
                            maxItems: 1
                         }
                    },
                    'b': {
                        '$id': 'b', 
                        type: 'object',
                        properties: {
                            element: { const: 'b' },
                            properties: {},
                            maxProperties: 0
                        },
                        content: {
                            type: 'array',
                            items: { type: 'string' },
                            maxContains: 1
                        }
                    }
                },
                $ref: 'top'
            },
            instances: [ '<top/>', '<top></top>', '<top>Hello</top>', '<top>Hello World!</top>', 
                         '<top><b/></top>', '<top><b></b></top>', '<top><b>Hello</b></top>',
                         '<top x="1"/>', '<top x="1" y="2"/>', '<top x="1"></top>', '<top x="1" y="2"></top>',
                         '<top x="1">Hello world!</top>', '<top x="1" y="2">Hello world!</top>',
                         '<top x="1" y="2"><b/></top>', '<top x="1" y="2"><b></b></top>', '<top x="1" y="2"><b>Hello</b></top>'],
            nonInstances: [ '<top><a/></top>', '<top><a>Hello</a></top>',
                            '<top z="1"></top>', '<top x="1" y="3"></top>', '<top z="1">Hello</top>',
                            '<top>Hello <b>world</b></top>' ]
        } */
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
                it(`invalidate non-instance ${nonInstance}`, (done) => { 
                    assert(! validate(example.dtd,nonInstance)); 
                    done(); 
                });

        });
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