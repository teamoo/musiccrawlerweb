(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages\http-publish\http.publish.tests.server.js                                                              //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
function equals(a, b) {                                                                                            // 1
  return !!(EJSON.stringify(a) === EJSON.stringify(b));                                                            // 2
}                                                                                                                  // 3
                                                                                                                   // 4
Tinytest.add('http-publish - server - test environment', function(test) {                                          // 5
  test.isTrue(typeof _publishHTTP !== 'undefined', 'test environment not initialized _publishHTTP');               // 6
  test.isTrue(typeof HTTP !== 'undefined', 'test environment not initialized HTTP');                               // 7
  test.isTrue(typeof HTTP.publish !== 'undefined', 'test environment not initialized HTTP.publish');               // 8
  test.isTrue(typeof HTTP.unpublish !== 'undefined', 'test environment not initialized HTTP.unpublish');           // 9
  test.isTrue(typeof HTTP.publishFormats !== 'undefined', 'test environment not initialized HTTP.publishFormats'); // 10
                                                                                                                   // 11
});                                                                                                                // 12
                                                                                                                   // 13
list = new Meteor.Collection('list');                                                                              // 14
console.log('Server url: ' + Meteor.absoluteUrl());                                                                // 15
                                                                                                                   // 16
list.allow({                                                                                                       // 17
  insert: function() { return true; },                                                                             // 18
  update: function() { return true; },                                                                             // 19
  remove: function() { return true; }                                                                              // 20
});                                                                                                                // 21
                                                                                                                   // 22
console.log('Rig publish');                                                                                        // 23
HTTP.publish({collection: list}, function() {                                                                      // 24
  return list.find();                                                                                              // 25
});                                                                                                                // 26
                                                                                                                   // 27
// Test custom prefix, too                                                                                         // 28
HTTP.publish({collection: list, name: '/api2/list'}, function() {                                                  // 29
  return list.find();                                                                                              // 30
});                                                                                                                // 31
                                                                                                                   // 32
Meteor.methods({                                                                                                   // 33
  clearTest: function() {                                                                                          // 34
    console.log('Client called clearTest');                                                                        // 35
    // Empty test db                                                                                               // 36
    list.remove({});                                                                                               // 37
                                                                                                                   // 38
    // Insert one text                                                                                             // 39
    list.insert({ text: 'OK' });                                                                                   // 40
                                                                                                                   // 41
    // Count                                                                                                       // 42
    var count = list.find().count();                                                                               // 43
                                                                                                                   // 44
    return !!(count === 1);                                                                                        // 45
  },                                                                                                               // 46
  unmountCustom: function() {                                                                                      // 47
    console.log('Client called unmountCustom');                                                                    // 48
    _publishHTTP.unpublish('/api2/list');                                                                          // 49
    return true;                                                                                                   // 50
  }                                                                                                                // 51
});                                                                                                                // 52
                                                                                                                   // 53
                                                                                                                   // 54
Tinytest.add('http-publish - server - getMethodHandler', function(test) {                                          // 55
                                                                                                                   // 56
  try {                                                                                                            // 57
    var methodHandler = _publishHTTP.getMethodHandler(list, 'insert');                                             // 58
                                                                                                                   // 59
    test.isTrue(typeof methodHandler === 'function', 'expected getMethodHandler to return a function');            // 60
                                                                                                                   // 61
  } catch(err) {                                                                                                   // 62
    test.fail(err.message);                                                                                        // 63
  }                                                                                                                // 64
                                                                                                                   // 65
});                                                                                                                // 66
                                                                                                                   // 67
                                                                                                                   // 68
Tinytest.add('http-publish - server - formatHandlers', function(test) {                                            // 69
                                                                                                                   // 70
  test.isTrue(typeof _publishHTTP.formatHandlers.json === 'function', 'Cant find formatHandler for json');         // 71
                                                                                                                   // 72
  var testScope = {                                                                                                // 73
    code: 0,                                                                                                       // 74
    setContentType: function(code) {                                                                               // 75
      this.code = code;                                                                                            // 76
    }                                                                                                              // 77
  };                                                                                                               // 78
  var resultFormatHandler = _publishHTTP.formatHandlers.json.apply(testScope, [{test:'ok'}]);                      // 79
                                                                                                                   // 80
  test.equal(testScope.code, 'application/json', 'json formatHandler have not set setContentType');                // 81
                                                                                                                   // 82
  test.equal(resultFormatHandler, '{"test":"ok"}', 'json formatHandler returned a bad result');                    // 83
                                                                                                                   // 84
});                                                                                                                // 85
                                                                                                                   // 86
Tinytest.add('http-publish - server - getPublishScope', function(test) {                                           // 87
                                                                                                                   // 88
  var oldScope = {                                                                                                 // 89
    userId: '1',                                                                                                   // 90
    params: '2',                                                                                                   // 91
    query: '3',                                                                                                    // 92
    oldStuff: 'hmmm'                                                                                               // 93
  };                                                                                                               // 94
                                                                                                                   // 95
  var newScope = _publishHTTP.getPublishScope(oldScope);                                                           // 96
                                                                                                                   // 97
  test.isUndefined(newScope.oldStuff, 'This oldStuff should not be in the new scope');                             // 98
                                                                                                                   // 99
  test.equal(newScope.userId, '1', 'userId not set in the new scope');                                             // 100
  test.equal(newScope.params, '2', 'params not set in the new scope');                                             // 101
  test.equal(newScope.query, '3', 'query not set in the new scope');                                               // 102
                                                                                                                   // 103
});                                                                                                                // 104
                                                                                                                   // 105
Tinytest.add('http-publish - server - formatResult', function(test) {                                              // 106
                                                                                                                   // 107
  var oldScope = {                                                                                                 // 108
    statusCode: 200,                                                                                               // 109
    userId: '1',                                                                                                   // 110
    params: '2',                                                                                                   // 111
    query: '3',                                                                                                    // 112
    oldStuff: 'hmmm',                                                                                              // 113
    setStatusCode: function(code) {                                                                                // 114
      this.statusCode = code;                                                                                      // 115
    },                                                                                                             // 116
    code: 0,                                                                                                       // 117
    setContentType: function(code) {                                                                               // 118
      this.code = code;                                                                                            // 119
    }                                                                                                              // 120
  };                                                                                                               // 121
                                                                                                                   // 122
  var result = _publishHTTP.formatResult({test: 'ok'}, oldScope);                                                  // 123
                                                                                                                   // 124
  test.equal(oldScope.code, 'application/json', 'json formatHandler have not set setContentType');                 // 125
                                                                                                                   // 126
  test.equal(result, '{"test":"ok"}', 'json formatHandler returned a bad result');                                 // 127
                                                                                                                   // 128
});                                                                                                                // 129
                                                                                                                   // 130
//Test API:                                                                                                        // 131
//test.isFalse(v, msg)                                                                                             // 132
//test.isTrue(v, msg)                                                                                              // 133
//test.equalactual, expected, message, not                                                                         // 134
//test.length(obj, len)                                                                                            // 135
//test.include(s, v)                                                                                               // 136
//test.isNaN(v, msg)                                                                                               // 137
//test.isUndefined(v, msg)                                                                                         // 138
//test.isNotNull                                                                                                   // 139
//test.isNull                                                                                                      // 140
//test.throws(func)                                                                                                // 141
//test.instanceOf(obj, klass)                                                                                      // 142
//test.notEqual(actual, expected, message)                                                                         // 143
//test.runId()                                                                                                     // 144
//test.exception(exception)                                                                                        // 145
//test.expect_fail()                                                                                               // 146
//test.ok(doc)                                                                                                     // 147
//test.fail(doc)                                                                                                   // 148
//test.equal(a, b, msg)                                                                                            // 149
                                                                                                                   // 150
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
