const assert = require('assert');
const { serialize, parse } = require('../xmlinjson.js');

describe('Serializer', () => {

    describe('Just the root element', () => {

        check({ "element": "top" }, "<top/>");
        check({ "element": "top", "attributes": {} }, "<top/>");
        check({ "element": "top", "attributes": {}, "content": [] }, "<top/>");
        check({ "element": "top", "content": [], "attributes": {} }, "<top/>");
        check({ "content": [], "attributes": {}, "element": "top" }, "<top/>");
    });

    describe('Invalid XIJ should throw errors', () => {
        checkSerializeThrows({}, /Invalid node type/);
        checkSerializeThrows({ "ELEMENT": "top" }, /Invalid node type/);
        checkSerializeThrows({ "element": "top", "attributes": 1 }, /Attributes must be an object/);
        checkSerializeThrows({ "element": "top", "content": {} }, /Content must be an array/);
    });

    describe('The root element with attribues', () => {
        check({ "element": "top", "attributes": { "a": 1 } }, '<top a="1"/>');
        check({ "element": "top", "attributes": { "a": "b" } }, '<top a="b"/>');
        check({ "element": "top", "attributes": { "a": true } }, '<top a="true"/>');
        check({ "element": "top", "attributes": { "a": "1\"" } }, "<top a='1\"'/>");
        check({ "element": "top", "attributes": { "a": 1, "b": 2 } }, '<top a="1" b="2"/>');
        check({ "element": "top", "attributes": { "a": "hello world" } }, '<top a="hello world"/>');
    });

    describe('The root element with text and attribues', () => {
        check({ "element": "top", "content": [1] }, '<top>1</top>');
        check({ "element": "top", "content": [true] }, '<top>true</top>');
        check({ "element": "top", "content": ["hello world"] }, '<top>hello world</top>');
        check({ "element": "top", "content": ["hello world"] }, '<top>hello world</top>');
        check({ "element": "top", "attributes": { "a": 1 }, "content": ["hello world"] }, '<top a="1">hello world</top>');
        check({ "element": "top", "attributes": { "a": 1, "b": 2 }, "content": ["hello world"] }, '<top a="1" b="2">hello world</top>');
    });


    describe('Data oriented (no mixed content)', () => {

        check({
            "element": "top", "content": [
                { "element": "a", "content": [1] },
                { "element": "b", "content": [2] }
            ]
        }, "<top><a>1</a><b>2</b></top>");
        check({
            "element": "top", "content": [
                { "element": "middle", "content": [{ "element": "leaf" }, { "element": "leaf" }] },
                { "element": "middle", "content": [{ "element": "leaf" }, { "element": "leaf" }] }
            ]
        }, "<top><middle><leaf/><leaf/></middle><middle><leaf/><leaf/></middle></top>");
        check({
            "element": "top", "content": [
                { "element": "middle", "content": [{ "element": "leaf", "content": [1] }, { "element": "leaf", "content": [2] }] },
                { "element": "middle", "content": [{ "element": "leaf", "content": [3] }, { "element": "leaf", "content": [4] }] }
            ]
        }, "<top><middle><leaf>1</leaf><leaf>2</leaf></middle><middle><leaf>3</leaf><leaf>4</leaf></middle></top>");

    });

    describe('Mixed content', () => {
        check({
            "element": "top", "content": [
                "hello ",
                { "element": "b", "content": ["new"] },
                " world"]
        },
            "<top>hello <b>new</b> world</top>");
        check({
            "element": "top", "content": [
                "goodbye ",
                { "element": "i", "content": ["old"] },
                " and ",
                { "element": "b", "content": ["funny"] },
                " world"]
        },
            '<top>goodbye <i>old</i> and <b>funny</b> world</top>');
    });

    describe('Comment', () => {
        check({ "element": "top", "content": [{ "comment": "this is a comment" }] },
            '<top><!--this is a comment--></top>');
    });

    describe('Processing instruction', () => {
        check({ "element": "top", "content": [{ "processingInstruction": "xij", "attributes": { "indent": true } }] },
            '<top><?xml-xij indent="true"?></top>');
    });

});

describe('Parser', () => {

    const examples = [
        {
            description: 'Just root element',
            xml: '<top/>',
            json: {element: 'top'}
        },
        {
            description: 'Root element just with attributes',
            xml: '<top a="1" b="2"/>',
            json: {element: 'top', attributes: { a: 1, b: 2}}
        },
        {
            description: 'Root element and attributes with different delimiters',
            xml: '<top a="1" b=\'2"\' c="hello world"/>',
            json: {element: 'top', attributes: { a: 1, b: '2"', c:"hello world"}}
        },
        {
            description: 'With text content',
            xml: '<top>hello world</top>',
            json: {element: 'top', content: [ 'hello world' ]}
        },
        {
            description: 'With attributes and text content',
            xml: '<top a="hello" b="world">hello world</top>',
            json: {element: 'top', attributes: { a: 'hello', b: 'world'}, content: [ 'hello world' ]}
        },
        {
            description: 'With mixed  content',
            xml: '<top>hello <b>my</b> world</top>',
            json: {element: 'top', content: [ 'hello ', { element: 'b', content: [ 'my' ]}, ' world' ]}
        },
        {
            description: 'With mixed  content and attributes',
            xml: '<top a="1" b="2">hello <b>my</b> world</top>',
            json: {element: 'top', attributes: { a: 1, b: 2}, content: [ 'hello ', { element: 'b', content: [ 'my' ]}, ' world' ]}
        },
        {
            description: 'With a comment',
            xml: '<top><!-- hello world --></top>',
            json: {element: 'top', content: [ { comment: " hello world " } ]}
        },


    ]

    for(const example of examples) { console.log(example.description);
        describe(example.description, () => {
            const json = parse(example.xml);

            it('parse', (done) => { 
                assert.deepEqual(json,example.json); 
                done(); 
            });

            it('parse and serialize', (done) => {
                assert.equal(serialize(json),example.xml);
                done();
            });
        }); }
});


describe('Parser errors', () => {
    const examples = [
        {
            description: 'Missing attribute value delimiter',
            xml: '',
            pattern: /empty document/
        },
        {
            description: 'Missing attribute value delimiter',
            xml: '<top x=1/>',
            pattern: /invalid attributes/
        },
        {
            description: 'Missing end tag in root',
            xml: '<top>',
            pattern: /unexpected end of document/
        },
        {
            description: 'Missing end tag',
            xml: '<top><b></top>',
            pattern: /invalid close tag/
        },
        
    ];

    for(const example of examples)
        describe(example.description, () => {
            checkParseThrows(example.xml,example.pattern);
    });
});


/*----------------*\
 |  Utilities     |
 \*---------------*/


function check(xij, xml) {
    it(xml, (done) => { assert.equal(serialize(xij), xml); done(); });
}

function checkSerializeThrows(xij, pattern) {
    it(`${JSON.stringify(xij)} should report ${pattern}`, (done) => {
        assert.throws(() => serialize(xij), { name: "Error", message: pattern });
        done();
    });
}

function checkParseThrows(xml, pattern) {
    it(`${JSON.stringify(xml)} should report ${pattern}`, (done) => {
        assert.throws(() => parse(xml), { name: "Error", message: pattern });
        done();
    });
}