(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages\http-methods\http.methods.tests.js                                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
function equals(a, b) {                                                                                               // 1
  return !!(EJSON.stringify(a) === EJSON.stringify(b));                                                               // 2
}                                                                                                                     // 3
                                                                                                                      // 4
Tinytest.add('http-methods - test environment', function(test) {                                                      // 5
  test.isTrue(typeof _methodHTTP !== 'undefined', 'test environment not initialized _methodHTTP');                    // 6
  test.isTrue(typeof HTTP !== 'undefined', 'test environment not initialized HTTP');                                  // 7
  test.isTrue(typeof HTTP.methods !== 'undefined', 'test environment not initialized HTTP.methods');                  // 8
                                                                                                                      // 9
});                                                                                                                   // 10
                                                                                                                      // 11
Tinytest.add('http-methods - nameFollowsConventions', function(test) {                                                // 12
  test.isFalse(_methodHTTP.nameFollowsConventions(), 'Tested methods naming convention 1');                           // 13
  test.isFalse(_methodHTTP.nameFollowsConventions(''), 'Tested methods naming convention 2');                         // 14
  test.isFalse(_methodHTTP.nameFollowsConventions({}), 'Tested methods naming convention 3');                         // 15
  test.isFalse(_methodHTTP.nameFollowsConventions([1]), 'Tested methods naming convention 4');                        // 16
  test.isFalse(_methodHTTP.nameFollowsConventions(-1), 'Tested methods naming convention 5');                         // 17
  test.isFalse(_methodHTTP.nameFollowsConventions(1), 'Tested methods naming convention 6');                          // 18
  test.isFalse(_methodHTTP.nameFollowsConventions(0.1), 'Tested methods naming convention 7');                        // 19
  test.isFalse(_methodHTTP.nameFollowsConventions(-0.1), 'Tested methods naming convention 8');                       // 20
                                                                                                                      // 21
  test.isTrue(_methodHTTP.nameFollowsConventions('/test/test'), 'Tested methods naming convention leading slash');    // 22
  test.isTrue(_methodHTTP.nameFollowsConventions('test/test'), 'Tested methods naming convention');                   // 23
});                                                                                                                   // 24
                                                                                                                      // 25
Tinytest.add('http-methods - getNameList', function(test) {                                                           // 26
  test.equal(EJSON.stringify(_methodHTTP.getNameList()), '[]', 'Name list failed');                                   // 27
  test.equal(EJSON.stringify(_methodHTTP.getNameList('')), '[]', 'Name list failed');                                 // 28
  test.equal(EJSON.stringify(_methodHTTP.getNameList('/')), '[]', 'Name list failed');                                // 29
  test.equal(EJSON.stringify(_methodHTTP.getNameList('//')), '["",""]', 'Name list failed');                          // 30
                                                                                                                      // 31
  test.equal(EJSON.stringify(_methodHTTP.getNameList('/1/')), '["1",""]', 'Name list failed');                        // 32
  test.equal(EJSON.stringify(_methodHTTP.getNameList('/1/2')), '["1","2"]', 'Name list failed');                      // 33
  test.equal(EJSON.stringify(_methodHTTP.getNameList('/1/:name/2')), '["1",":name","2"]', 'Name list failed');        // 34
  test.equal(EJSON.stringify(_methodHTTP.getNameList('/1//2')), '["1","","2"]', 'Name list failed');                  // 35
});                                                                                                                   // 36
                                                                                                                      // 37
                                                                                                                      // 38
Tinytest.add('http-methods - createObject', function(test) {                                                          // 39
  test.equal(EJSON.stringify(_methodHTTP.createObject()), '{}', 'createObject failed');                               // 40
  test.equal(EJSON.stringify(_methodHTTP.createObject(2, 4)), '{}', 'createObject failed');                           // 41
  test.equal(EJSON.stringify(_methodHTTP.createObject(['foo'], [])), '{"foo":""}', 'createObject failed');            // 42
  test.equal(EJSON.stringify(_methodHTTP.createObject(['foo'], ['bar'])), '{"foo":"bar"}', 'createObject failed');    // 43
  test.equal(EJSON.stringify(_methodHTTP.createObject(['foo'], [3])), '{"foo":"3"}', 'createObject failed');          // 44
  test.equal(EJSON.stringify(_methodHTTP.createObject(['foo'], ['bar', 3])), '{"foo":"bar"}', 'createObject failed'); // 45
  test.equal(EJSON.stringify(_methodHTTP.createObject(['foo', 'foo'], ['bar', 3])), '{"foo":"3"}', 'createObject failed');
  test.equal(EJSON.stringify(_methodHTTP.createObject([''], ['bar', 3])), '{"":"bar"}', 'createObject failed');       // 47
  test.equal(EJSON.stringify(_methodHTTP.createObject(['', ''], ['bar', 3])), '{"":"3"}', 'createObject failed');     // 48
});                                                                                                                   // 49
                                                                                                                      // 50
Tinytest.add('http-methods - addToMethodTree', function(test) {                                                       // 51
  var original = _methodHTTP.methodTree;                                                                              // 52
  _methodHTTP.methodTree = {};                                                                                        // 53
  _methodHTTP.addToMethodTree('login');                                                                               // 54
  test.equal(EJSON.stringify(_methodHTTP.methodTree), '{"login":{":ref":{"name":"/login/","params":[]}}}', 'addToMethodTree failed');
                                                                                                                      // 56
  _methodHTTP.methodTree = {};                                                                                        // 57
  _methodHTTP.addToMethodTree('/foo/bar');                                                                            // 58
  test.equal(EJSON.stringify(_methodHTTP.methodTree), '{"foo":{"bar":{":ref":{"name":"/foo/bar/","params":[]}}}}', 'addToMethodTree failed');
                                                                                                                      // 60
  _methodHTTP.methodTree = {};                                                                                        // 61
  _methodHTTP.addToMethodTree('/foo/:name/bar');                                                                      // 62
  test.equal(EJSON.stringify(_methodHTTP.methodTree), '{"foo":{":value":{"bar":{":ref":{"name":"/foo/:value/bar/","params":["name"]}}}}}', 'addToMethodTree failed');
                                                                                                                      // 64
  _methodHTTP.addToMethodTree('/foo/:name/bar');                                                                      // 65
  test.equal(EJSON.stringify(_methodHTTP.methodTree), '{"foo":{":value":{"bar":{":ref":{"name":"/foo/:value/bar/","params":["name"]}}}}}', 'addToMethodTree failed');
                                                                                                                      // 67
  _methodHTTP.addToMethodTree('/foo/name/bar');                                                                       // 68
  test.equal(EJSON.stringify(_methodHTTP.methodTree), '{"foo":{":value":{"bar":{":ref":{"name":"/foo/:value/bar/","params":["name"]}}},"name":{"bar":{":ref":{"name":"/foo/name/bar/","params":[]}}}}}', 'addToMethodTree failed');
                                                                                                                      // 70
  _methodHTTP.methodTree = original;                                                                                  // 71
});                                                                                                                   // 72
                                                                                                                      // 73
Tinytest.add('http-methods - getMethod', function(test) {                                                             // 74
  // Basic tests                                                                                                      // 75
  test.equal(EJSON.stringify(_methodHTTP.getMethod('')), 'null', 'getMethod failed');                                 // 76
  test.equal(EJSON.stringify(_methodHTTP.getMethod('//')), 'null', 'getMethod failed');                               // 77
                                                                                                                      // 78
  _methodHTTP.addToMethodTree('login');                                                                               // 79
  test.equal(EJSON.stringify(_methodHTTP.getMethod('login')), '{"name":"/login/","params":{}}', 'getMethod failed');  // 80
  test.equal(EJSON.stringify(_methodHTTP.getMethod('/login')), '{"name":"/login/","params":{}}', 'getMethod failed'); // 81
  test.equal(EJSON.stringify(_methodHTTP.getMethod('login/')), 'null', 'getMethod failed');                           // 82
  test.equal(EJSON.stringify(_methodHTTP.getMethod('/login/')), 'null', 'getMethod failed');                          // 83
  test.equal(EJSON.stringify(_methodHTTP.getMethod('login/test')), 'null', 'getMethod failed');                       // 84
                                                                                                                      // 85
  _methodHTTP.addToMethodTree('/login/');                                                                             // 86
  test.equal(EJSON.stringify(_methodHTTP.getMethod('login')), '{"name":"/login/","params":{}}', 'getMethod failed');  // 87
                                                                                                                      // 88
  //                                                                                                                  // 89
                                                                                                                      // 90
  _methodHTTP.addToMethodTree('/login/foo');                                                                          // 91
  test.equal(EJSON.stringify(_methodHTTP.getMethod('login/foo')), '{"name":"/login/foo/","params":{}}', 'getMethod failed');
                                                                                                                      // 93
  _methodHTTP.addToMethodTree('/login/:name/foo');                                                                    // 94
  test.equal(EJSON.stringify(_methodHTTP.getMethod('login/bar/foo')), '{"name":"/login/:value/foo/","params":{"name":"bar"}}', 'getMethod failed');
  test.equal(EJSON.stringify(_methodHTTP.getMethod('login/foo')), '{"name":"/login/foo/","params":{}}', 'getMethod failed');
                                                                                                                      // 97
});                                                                                                                   // 98
                                                                                                                      // 99
//Test API:                                                                                                           // 100
//test.isFalse(v, msg)                                                                                                // 101
//test.isTrue(v, msg)                                                                                                 // 102
//test.equal(actual, expected, message, not)                                                                          // 103
//test.length(obj, len)                                                                                               // 104
//test.include(s, v)                                                                                                  // 105
//test.isNaN(v, msg)                                                                                                  // 106
//test.isUndefined(v, msg)                                                                                            // 107
//test.isNotNull                                                                                                      // 108
//test.isNull                                                                                                         // 109
//test.throws(func)                                                                                                   // 110
//test.instanceOf(obj, klass)                                                                                         // 111
//test.notEqual(actual, expected, message)                                                                            // 112
//test.runId()                                                                                                        // 113
//test.exception(exception)                                                                                           // 114
//test.expect_fail()                                                                                                  // 115
//test.ok(doc)                                                                                                        // 116
//test.fail(doc)                                                                                                      // 117
                                                                                                                      // 118
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
