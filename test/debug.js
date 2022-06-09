
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
            nonInstances: [ 
                //'<root/>', 
                //'<top>hello</top>', 
                '<top a="1"/>' 
            ]
        }
    ];

    for(const example of examples)
        describe(example.description, () => {
            /*
            it('Check JSON Schema', (done) => { 
                similarTo(getJsonSchema(example.dtd),example.expected); 
                done();
            });

            for(const instance of example.instances)
                it(`validate instance ${instance}`, (done) => { 
                    assert(validate(example.dtd,instance)); 
                    done(); 
                });
        */
            for(const nonInstance of example.nonInstances)
                it(`invalidate non-instace ${nonInstance}`, (done) => { 
                    assert(! validate(example.dtd,nonInstance)); 
                    done(); 
                });

        });
});

