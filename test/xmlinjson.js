const assert = require('assert');
const { serialize }  = require('../xmlinjson.js');

describe('Just the root element', () => {

   check({ "element": "top"},"<top/>");
   check({ "element": "top", "attributes": {} },"<top/>");
   check({ "element": "top", "attributes": {}, "content": [] },"<top/>");
   check({ "element": "top", "content": [], "attributes": {} },"<top/>");
   check({ "content": [], "attributes": {}, "element": "top" },"<top/>");
});

describe('Invalid XIJ should thorw errors', () =>{
    checkThrows({},/Invalid node type/);
    checkThrows({ "ELEMENT": "top"},/Invalid node type/);
    checkThrows({ "element": "top", "attributes": 1 },/Attributes must be an object/);
    checkThrows({ "element": "top", "content": {} },/Content must be an array/);
});

describe('The root element with attribues', () => {
   check({ "element": "top", "attributes": { "a": 1}},'<top a="1"/>');
   check({ "element": "top", "attributes": { "a": "b"}},'<top a="b"/>');
   check({ "element": "top", "attributes": { "a": true}},'<top a="true"/>');
   check({ "element": "top", "attributes": { "a": "1\""}},"<top a='1\"'/>");
   check({ "element": "top", "attributes": { "a": 1, "b": 2}},'<top a="1" b="2"/>');
   check({ "element": "top", "attributes": { "a": "hello world"}},'<top a="hello world"/>');
});

describe('The root element with text and attribues', () => {
   check({ "element": "top","content": [ 1 ] },'<top>1</top>');
   check({ "element": "top","content": [ true ] },'<top>true</top>');
   check({ "element": "top","content": [ "hello world"]},'<top>hello world</top>');
   check({ "element": "top","content": [ "hello world"]},'<top>hello world</top>');
   check({ "element": "top", "attributes": { "a": 1}, "content": [ "hello world"]},'<top a="1">hello world</top>');
   check({ "element": "top", "attributes": { "a": 1, "b": 2}, "content": [ "hello world"]},'<top a="1" b="2">hello world</top>');
});


describe('Data oriented (no mixed content)', () => {

    check({ "element": "top","content":[
        { "element": "a", "content": [ 1 ]},
        { "element": "b", "content": [ 2 ]}
    ]},"<top><a>1</a><b>2</b></top>");
    check({ "element": "top","content":[
        { "element": "middle", "content": [ { "element": "leaf" }, { "element": "leaf" } ]},
        { "element": "middle", "content": [ { "element": "leaf" }, { "element": "leaf" } ]}
    ]},"<top><middle><leaf/><leaf/></middle><middle><leaf/><leaf/></middle></top>");
    check({ "element": "top","content":[
        { "element": "middle", "content": [ { "element": "leaf", "content": [ 1 ] }, { "element": "leaf", "content": [ 2 ] } ]},
        { "element": "middle", "content": [ { "element": "leaf", "content": [ 3 ] }, { "element": "leaf", "content": [ 4 ] } ]}
    ]},"<top><middle><leaf>1</leaf><leaf>2</leaf></middle><middle><leaf>3</leaf><leaf>4</leaf></middle></top>");
    
 });

describe('Mixed content', () => {
    check({ "element": "top","content": [ 
        "hello ",
        { "element": "b","content": [ "new"] },
        " world" ] },
        "<top>hello <b>new</b> world</top>");
        check({ "element": "top","content": [ 
            "goodbye ",
            { "element": "i","content": [ "old"] },
            " and ",
            { "element": "b","content": [ "funny"] },
            " world" ] },
            '<top>goodbye <i>old</i> and <b>funny</b> world</top>');
});

describe('Comment', () => {
    check({ "element": "top","content": [ { "comment": "this is a comment" } ]},
    '<top><!--this is a comment--></top>');
});

describe('Processing instruction', () => {
    check({ "element": "top","content": [ { "processingInstruction": "xij", "attributes": { "indent": true } } ]},
    '<top><?xml-xij indent="true"?></top>');
});

/*----------------*\
 |  Utilities     |
 \*---------------*/


function check(xij,xml) {
    it(xml, (done ) => { assert.equal(serialize(xij),xml); done(); });
}

function checkThrows(xij,pattern) {
    it(`${JSON.stringify(xij)} should report ${pattern}`, (done) => {
        assert.throws( () => serialize(xij), { name: "Error", message: pattern });
        done();
    });
}