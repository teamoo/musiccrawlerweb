(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages\http-publish\http.publish.tests.client.js                                                              //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
function equals(a, b) {                                                                                            // 1
  return !!(EJSON.stringify(a) === EJSON.stringify(b));                                                            // 2
}                                                                                                                  // 3
                                                                                                                   // 4
list = new Meteor.Collection('list');                                                                              // 5
console.log('Client url: ' + Meteor.absoluteUrl('api'));                                                           // 6
                                                                                                                   // 7
Tinytest.add('http-publish - client - test environment', function(test) {                                          // 8
  test.isTrue(typeof _publishHTTP === 'undefined', 'test environment not initialized _publishHTTP');               // 9
  test.isTrue(typeof HTTP !== 'undefined', 'test environment not initialized HTTP');                               // 10
  test.isTrue(typeof HTTP.publish !== 'undefined', 'test environment not initialized HTTP.publish');               // 11
  test.isTrue(typeof HTTP.unpublish !== 'undefined', 'test environment not initialized HTTP.unpublish');           // 12
  test.isTrue(typeof HTTP.publishFormats !== 'undefined', 'test environment not initialized HTTP.publishFormats'); // 13
});                                                                                                                // 14
                                                                                                                   // 15
Tinytest.addAsync('http-publish - client - clearTest', function (test, onComplete) {                               // 16
  test.isTrue(true);                                                                                               // 17
  Meteor.call('clearTest', function(err, result) {                                                                 // 18
    test.isTrue(result);                                                                                           // 19
    onComplete();                                                                                                  // 20
  });                                                                                                              // 21
  test.isTrue(true);                                                                                               // 22
});                                                                                                                // 23
                                                                                                                   // 24
id = '';                                                                                                           // 25
removedId = '';                                                                                                    // 26
                                                                                                                   // 27
Tinytest.addAsync('http-publish - client - get list', function (test, onComplete) {                                // 28
                                                                                                                   // 29
  HTTP.get(Meteor.absoluteUrl('api/list'), function(err, result) {                                                 // 30
    // Test the length of array result                                                                             // 31
    var len = result.data && result.data.length;                                                                   // 32
    test.isTrue(!!len, 'Result was empty');                                                                        // 33
    // Get the object                                                                                              // 34
    var obj = result.data && result.data[0] || {};                                                                 // 35
    test.equal(obj.text, 'OK', 'Didnt get the expected result');                                                   // 36
    // Set the id for the next test                                                                                // 37
    id = obj._id;                                                                                                  // 38
    onComplete();                                                                                                  // 39
  });                                                                                                              // 40
                                                                                                                   // 41
});                                                                                                                // 42
                                                                                                                   // 43
Tinytest.addAsync('http-publish - client - get list from custom prefix', function (test, onComplete) {             // 44
                                                                                                                   // 45
  // Now test the one we added with a custom prefix                                                                // 46
  HTTP.get(Meteor.absoluteUrl('api2/list'), function(err, result) {                                                // 47
    // Test the length of array result                                                                             // 48
    var len = result.data && result.data.length;                                                                   // 49
    test.isTrue(!!len, 'Result was empty');                                                                        // 50
    // Get the object                                                                                              // 51
    var obj = result.data && result.data[0] || {};                                                                 // 52
    test.equal(obj.text, 'OK', 'Didnt get the expected result');                                                   // 53
    onComplete();                                                                                                  // 54
  });                                                                                                              // 55
                                                                                                                   // 56
});                                                                                                                // 57
                                                                                                                   // 58
Tinytest.addAsync('http-publish - client - unmountCustom', function (test, onComplete) {                           // 59
  // Now unmount the methods with custom prefix                                                                    // 60
  test.isTrue(true);                                                                                               // 61
  Meteor.call('unmountCustom', function(err, result) {                                                             // 62
    test.isTrue(result);                                                                                           // 63
    onComplete();                                                                                                  // 64
  });                                                                                                              // 65
  test.isTrue(true);                                                                                               // 66
});                                                                                                                // 67
                                                                                                                   // 68
Tinytest.addAsync('http-publish - client - custom unmounted', function (test, onComplete) {                        // 69
                                                                                                                   // 70
  // Now test the one we added with a custom prefix                                                                // 71
  HTTP.get(Meteor.absoluteUrl('api2/list'), function(err, result) {                                                // 72
    test.isTrue(!!err, "Should have received an error since we unmounted the custom rest points");                 // 73
    onComplete();                                                                                                  // 74
  });                                                                                                              // 75
                                                                                                                   // 76
});                                                                                                                // 77
                                                                                                                   // 78
Tinytest.addAsync('http-publish - client - put list', function (test, onComplete) {                                // 79
                                                                                                                   // 80
  test.isTrue(id !== '', 'No id is set?');                                                                         // 81
                                                                                                                   // 82
  // Update the data                                                                                               // 83
  HTTP.put(Meteor.absoluteUrl('api/list/' + id), {                                                                 // 84
    data: {                                                                                                        // 85
      $set: { text: 'UPDATED' }                                                                                    // 86
    }                                                                                                              // 87
  }, function(err, result) {                                                                                       // 88
    var resultId = result.data && result.data._id;                                                                 // 89
    test.isTrue(resultId !== undefined, 'Didnt get the expected id in result');                                    // 90
                                                                                                                   // 91
    // Check if data is updated                                                                                    // 92
    HTTP.get(Meteor.absoluteUrl('api/list'), function(err, result) {                                               // 93
      var len = result.data && result.data.length;                                                                 // 94
      test.isTrue(!!len, 'Result was empty');                                                                      // 95
      var obj = result.data && result.data[0] || {};                                                               // 96
      test.equal(obj.text, 'UPDATED', 'Didnt get the expected result');                                            // 97
      onComplete();                                                                                                // 98
    });                                                                                                            // 99
  });                                                                                                              // 100
                                                                                                                   // 101
});                                                                                                                // 102
                                                                                                                   // 103
Tinytest.addAsync('http-publish - client - insert/remove list', function (test, onComplete) {                      // 104
                                                                                                                   // 105
  // Insert a doc                                                                                                  // 106
  HTTP.post(Meteor.absoluteUrl('api/list'), {                                                                      // 107
    data: {                                                                                                        // 108
      text: 'INSERTED'                                                                                             // 109
    }                                                                                                              // 110
  }, function(err, result) {                                                                                       // 111
    var resultId = result.data && result.data._id;                                                                 // 112
    test.isTrue(resultId !== undefined, 'Didnt get the expected id in result');                                    // 113
    // Delete the doc                                                                                              // 114
    HTTP.del(Meteor.absoluteUrl('api/list/' + resultId), function(err, result) {                                   // 115
      removedId = result.data && result.data._id;                                                                  // 116
      test.isTrue(removedId !== undefined, 'Didnt get the expected id in result');                                 // 117
      onComplete();                                                                                                // 118
    });                                                                                                            // 119
  });                                                                                                              // 120
                                                                                                                   // 121
});                                                                                                                // 122
                                                                                                                   // 123
Tinytest.addAsync('http-publish - client - check removed', function (test, onComplete) {                           // 124
                                                                                                                   // 125
  test.isTrue(removedId !== '', 'No removedId is set?');                                                           // 126
                                                                                                                   // 127
  HTTP.get(Meteor.absoluteUrl('api/list/' + removedId), function(err, result) {                                    // 128
    var obj = result.data || {};                                                                                   // 129
    test.isTrue(obj._id === undefined, 'Item was not removed');                                                    // 130
    test.isTrue(err.response.statusCode === 404, 'Item was not removed');                                          // 131
    onComplete();                                                                                                  // 132
  });                                                                                                              // 133
                                                                                                                   // 134
});                                                                                                                // 135
                                                                                                                   // 136
Tinytest.addAsync('http-publish - client - check findOne', function (test, onComplete) {                           // 137
                                                                                                                   // 138
  test.isTrue(id !== '', 'No id is set?');                                                                         // 139
                                                                                                                   // 140
  HTTP.get(Meteor.absoluteUrl('api/list/' + id), function(err, result) {                                           // 141
    var obj = result.data || {};                                                                                   // 142
    test.isTrue(obj._id !== undefined, 'expected a document');                                                     // 143
    test.isTrue(obj.text === 'UPDATED', 'expected text === UPDATED');                                              // 144
                                                                                                                   // 145
    onComplete();                                                                                                  // 146
  });                                                                                                              // 147
                                                                                                                   // 148
});                                                                                                                // 149
                                                                                                                   // 150
                                                                                                                   // 151
      // Check if removedId found                                                                                  // 152
                                                                                                                   // 153
      // Check if id still found                                                                                   // 154
                                                                                                                   // 155
                                                                                                                   // 156
//Test API:                                                                                                        // 157
//test.isFalse(v, msg)                                                                                             // 158
//test.isTrue(v, msg)                                                                                              // 159
//test.equalactual, expected, message, not                                                                         // 160
//test.length(obj, len)                                                                                            // 161
//test.include(s, v)                                                                                               // 162
//test.isNaN(v, msg)                                                                                               // 163
//test.isUndefined(v, msg)                                                                                         // 164
//test.isNotNull                                                                                                   // 165
//test.isNull                                                                                                      // 166
//test.throws(func)                                                                                                // 167
//test.instanceOf(obj, klass)                                                                                      // 168
//test.notEqual(actual, expected, message)                                                                         // 169
//test.runId()                                                                                                     // 170
//test.exception(exception)                                                                                        // 171
//test.expect_fail()                                                                                               // 172
//test.ok(doc)                                                                                                     // 173
//test.fail(doc)                                                                                                   // 174
//test.equal(a, b, msg)                                                                                            // 175
                                                                                                                   // 176
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
