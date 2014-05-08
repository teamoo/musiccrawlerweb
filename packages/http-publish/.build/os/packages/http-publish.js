(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages\http-publish\http.publish.server.api.js                                                                //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
/*                                                                                                                 // 1
                                                                                                                   // 2
GET /note                                                                                                          // 3
GET /note/:id                                                                                                      // 4
POST /note                                                                                                         // 5
PUT /note/:id                                                                                                      // 6
DELETE /note/:id                                                                                                   // 7
                                                                                                                   // 8
*/                                                                                                                 // 9
                                                                                                                   // 10
// Could be cool if we could serve some api doc or even an api script                                              // 11
// user could do <script href="/note/api?token=1&user=2"></script> and be served                                   // 12
// a client-side javascript api?                                                                                   // 13
// Eg.                                                                                                             // 14
// HTTP.api.note.create();                                                                                         // 15
// HTTP.api.login(username, password);                                                                             // 16
// HTTP.api.logout                                                                                                 // 17
                                                                                                                   // 18
                                                                                                                   // 19
_publishHTTP = {};                                                                                                 // 20
                                                                                                                   // 21
// Cache the names of all http methods we've published                                                             // 22
_publishHTTP.currentlyPublished = [];                                                                              // 23
                                                                                                                   // 24
var defaultAPIPrefix = '/api/';                                                                                    // 25
                                                                                                                   // 26
/**                                                                                                                // 27
 * @method _publishHTTP.getPublishScope                                                                            // 28
 * @private                                                                                                        // 29
 * @param {Object} scope                                                                                           // 30
 * @returns {httpPublishGetPublishScope.publishScope}                                                              // 31
 *                                                                                                                 // 32
 * Creates a nice scope for the publish method                                                                     // 33
 */                                                                                                                // 34
_publishHTTP.getPublishScope = function httpPublishGetPublishScope(scope) {                                        // 35
  var publishScope = {};                                                                                           // 36
  publishScope.userId = scope.userId;                                                                              // 37
  publishScope.params = scope.params;                                                                              // 38
  publishScope.query = scope.query;                                                                                // 39
  // TODO: Additional scoping                                                                                      // 40
  // publishScope.added                                                                                            // 41
  // publishScope.ready                                                                                            // 42
  return publishScope;                                                                                             // 43
};                                                                                                                 // 44
                                                                                                                   // 45
_publishHTTP.formatHandlers = {};                                                                                  // 46
                                                                                                                   // 47
/**                                                                                                                // 48
 * @method _publishHTTP.formatHandlers.json                                                                        // 49
 * @private                                                                                                        // 50
 * @param {Object} result - The result object                                                                      // 51
 * @returns {String} JSON                                                                                          // 52
 *                                                                                                                 // 53
 * Formats the output into JSON and sets the appropriate content type on `this`                                    // 54
 */                                                                                                                // 55
_publishHTTP.formatHandlers.json = function httpPublishJSONFormatHandler(result) {                                 // 56
  // Set the method scope content type to json                                                                     // 57
  this.setContentType('application/json');                                                                         // 58
  // Return EJSON string                                                                                           // 59
  return EJSON.stringify(result);                                                                                  // 60
};                                                                                                                 // 61
                                                                                                                   // 62
/**                                                                                                                // 63
 * @method _publishHTTP.formatResult                                                                               // 64
 * @private                                                                                                        // 65
 * @param {Object} result - The result object                                                                      // 66
 * @param {Object} scope                                                                                           // 67
 * @param {String} [defaultFormat='json'] - Default format to use if format is not in query string.                // 68
 * @returns {Any} The formatted result                                                                             // 69
 *                                                                                                                 // 70
 * Formats the result into the format selected by querystring eg. "&format=json"                                   // 71
 */                                                                                                                // 72
_publishHTTP.formatResult = function httpPublishFormatResult(result, scope, defaultFormat) {                       // 73
                                                                                                                   // 74
  // Get the format in lower case and default to json                                                              // 75
  var format = scope && scope.query && scope.query.format || defaultFormat || 'json';                              // 76
                                                                                                                   // 77
  // Set the format handler found                                                                                  // 78
  var formatHandlerFound = !!(typeof _publishHTTP.formatHandlers[format] === 'function');                          // 79
                                                                                                                   // 80
  // Set the format handler and fallback to default json if handler not found                                      // 81
  var formatHandler = _publishHTTP.formatHandlers[(formatHandlerFound) ? format : 'json'];                         // 82
                                                                                                                   // 83
  // Check if format handler is a function                                                                         // 84
  if (typeof formatHandler !== 'function') {                                                                       // 85
    // We break things the user could have overwritten the default json handler                                    // 86
    throw new Error('The default json format handler not found');                                                  // 87
  }                                                                                                                // 88
                                                                                                                   // 89
  if (!formatHandlerFound) {                                                                                       // 90
    scope.setStatusCode(500);                                                                                      // 91
    return '{"error":"Format handler for: `' + format + '` not found"}';                                           // 92
  }                                                                                                                // 93
                                                                                                                   // 94
  // Execute the format handler                                                                                    // 95
  try {                                                                                                            // 96
    return formatHandler.apply(scope, [result]);                                                                   // 97
  } catch(err) {                                                                                                   // 98
    scope.setStatusCode(500);                                                                                      // 99
    return '{"error":"Format handler for: `' + format + '` Error: ' + err.message + '"}';                          // 100
  }                                                                                                                // 101
};                                                                                                                 // 102
                                                                                                                   // 103
/**                                                                                                                // 104
 * @method _publishHTTP.error                                                                                      // 105
 * @private                                                                                                        // 106
 * @param {String} statusCode - The status code                                                                    // 107
 * @param {String} message - The message                                                                           // 108
 * @param {Object} scope                                                                                           // 109
 * @returns {Any} The formatted result                                                                             // 110
 *                                                                                                                 // 111
 * Responds with error message in the expected format                                                              // 112
 */                                                                                                                // 113
_publishHTTP.error = function httpPublishError(statusCode, message, scope) {                                       // 114
  var result = _publishHTTP.formatResult(message, scope);                                                          // 115
  scope.setStatusCode(statusCode);                                                                                 // 116
  return result;                                                                                                   // 117
};                                                                                                                 // 118
                                                                                                                   // 119
/**                                                                                                                // 120
 * @method _publishHTTP.getMethodHandler                                                                           // 121
 * @private                                                                                                        // 122
 * @param {Meteor.Collection} collection - The Meteor.Collection instance                                          // 123
 * @param {String} methodName - The method name                                                                    // 124
 * @returns {Function} The server method                                                                           // 125
 *                                                                                                                 // 126
 * Returns the DDP connection handler, already setup and secured                                                   // 127
 */                                                                                                                // 128
_publishHTTP.getMethodHandler = function httpPublishGetMethodHandler(collection, methodName) {                     // 129
  if (collection instanceof Meteor.Collection) {                                                                   // 130
    if (collection._connection && collection._connection.method_handlers) {                                        // 131
      return collection._connection.method_handlers[collection._prefix + methodName];                              // 132
    } else {                                                                                                       // 133
      throw new Error('HTTP publish does not work with current version of Meteor');                                // 134
    }                                                                                                              // 135
  } else {                                                                                                         // 136
    throw new Error('_publishHTTP.getMethodHandler expected a collection');                                        // 137
  }                                                                                                                // 138
};                                                                                                                 // 139
                                                                                                                   // 140
/**                                                                                                                // 141
 * @method _publishHTTP.unpublishList                                                                              // 142
 * @private                                                                                                        // 143
 * @param {Array} names - List of method names to unpublish                                                        // 144
 * @returns {undefined}                                                                                            // 145
 *                                                                                                                 // 146
 * Unpublishes all HTTP methods that have names matching the given list.                                           // 147
 */                                                                                                                // 148
_publishHTTP.unpublishList = function httpPublishUnpublishList(names) {                                            // 149
  if (!names.length) {                                                                                             // 150
    return;                                                                                                        // 151
  }                                                                                                                // 152
                                                                                                                   // 153
  // Carry object for methods                                                                                      // 154
  var methods = {};                                                                                                // 155
                                                                                                                   // 156
  // Unpublish the rest points by setting them to false                                                            // 157
  for (var i = 0, ln = names.length; i < ln; i++) {                                                                // 158
    methods[names[i]] = false;                                                                                     // 159
  }                                                                                                                // 160
                                                                                                                   // 161
  HTTP.methods(methods);                                                                                           // 162
                                                                                                                   // 163
  // Remove the names from our list of currently published methods                                                 // 164
  _publishHTTP.currentlyPublished = _.difference(_publishHTTP.currentlyPublished, names);                          // 165
};                                                                                                                 // 166
                                                                                                                   // 167
/**                                                                                                                // 168
 * @method _publishHTTP.unpublish                                                                                  // 169
 * @private                                                                                                        // 170
 * @param {String|Meteor.Collection} [name] - The method name or collection                                        // 171
 * @returns {undefined}                                                                                            // 172
 *                                                                                                                 // 173
 * Unpublishes all HTTP methods that were published with the given name or                                         // 174
 * for the given collection. Call with no arguments to unpublish all.                                              // 175
 */                                                                                                                // 176
_publishHTTP.unpublish = function httpPublishUnpublish(/* name or collection, options */) {                        // 177
                                                                                                                   // 178
  // Determine what method name we're unpublishing                                                                 // 179
  var name = (arguments[0] instanceof Meteor.Collection) ?                                                         // 180
          defaultAPIPrefix + arguments[0]._name : arguments[0];                                                    // 181
                                                                                                                   // 182
  // Unpublish name and name/id                                                                                    // 183
  if (name && name.length) {                                                                                       // 184
    _publishHTTP.unpublishList([name, name + '/:id']);                                                             // 185
  }                                                                                                                // 186
                                                                                                                   // 187
  // If no args, unpublish all                                                                                     // 188
  else {                                                                                                           // 189
    _publishHTTP.unpublishList(_publishHTTP.currentlyPublished);                                                   // 190
  }                                                                                                                // 191
                                                                                                                   // 192
};                                                                                                                 // 193
                                                                                                                   // 194
/**                                                                                                                // 195
 * @method HTTP.publishFormats                                                                                     // 196
 * @public                                                                                                         // 197
 * @param {Object} newHandlers                                                                                     // 198
 * @returns {undefined}                                                                                            // 199
 *                                                                                                                 // 200
 * Add publish formats. Example:                                                                                   // 201
 ```js                                                                                                             // 202
 HTTP.publishFormats({                                                                                             // 203
                                                                                                                   // 204
    json: function(inputObject) {                                                                                  // 205
      // Set the method scope content type to json                                                                 // 206
      this.setContentType('application/json');                                                                     // 207
      // Return EJSON string                                                                                       // 208
      return EJSON.stringify(inputObject);                                                                         // 209
    }                                                                                                              // 210
                                                                                                                   // 211
  });                                                                                                              // 212
 ```                                                                                                               // 213
 */                                                                                                                // 214
HTTP.publishFormats = function httpPublishFormats(newHandlers) {                                                   // 215
  _.extend(_publishHTTP.formatHandlers, newHandlers);                                                              // 216
};                                                                                                                 // 217
                                                                                                                   // 218
/**                                                                                                                // 219
 * @method HTTP.publish                                                                                            // 220
 * @public                                                                                                         // 221
 * @param {Object} options                                                                                         // 222
 * @param {String} [name] - Restpoint name (url prefix). Optional if `collection` is passed. Will mount on `/api/collectionName` by default.
 * @param {Meteor.Collection} [collection] - Meteor.Collection instance. Required for all restpoints except collectionGet
 * @param {String} [options.defaultFormat='json'] - Format to use for responses when `format` is not found in the query string.
 * @param {String} [options.collectionGet=true] - Add GET restpoint for collection? Requires a publish function.   // 226
 * @param {String} [options.collectionPost=true] - Add POST restpoint for adding documents to the collection?      // 227
 * @param {String} [options.documentGet=true] - Add GET restpoint for documents in collection? Requires a publish function.
 * @param {String} [options.documentPut=true] - Add PUT restpoint for updating a document in the collection?       // 229
 * @param {String} [options.documentDelete=true] - Add DELETE restpoint for deleting a document in the collection? // 230
 * @param {Function} [publishFunc] - A publish function. Required to mount GET restpoints.                         // 231
 * @returns {undefined}                                                                                            // 232
 * @todo this should use options argument instead of optional args                                                 // 233
 *                                                                                                                 // 234
 * Publishes one or more restpoints, mounted on "name" ("/api/collectionName/"                                     // 235
 * by default). The GET restpoints are subscribed to the document set (cursor)                                     // 236
 * returned by the publish function you supply. The other restpoints forward                                       // 237
 * requests to Meteor's built-in DDP methods (insert, update, remove), meaning                                     // 238
 * that full allow/deny security is automatic.                                                                     // 239
 *                                                                                                                 // 240
 * __Usage:__                                                                                                      // 241
 *                                                                                                                 // 242
 * Publish only:                                                                                                   // 243
 *                                                                                                                 // 244
 * HTTP.publish({name: 'mypublish'}, publishFunc);                                                                 // 245
 *                                                                                                                 // 246
 * Publish and mount crud rest point for collection /api/myCollection:                                             // 247
 *                                                                                                                 // 248
 * HTTP.publish({collection: myCollection}, publishFunc);                                                          // 249
 *                                                                                                                 // 250
 * Mount CUD rest point for collection and documents without GET:                                                  // 251
 *                                                                                                                 // 252
 * HTTP.publish({collection: myCollection});                                                                       // 253
 *                                                                                                                 // 254
 */                                                                                                                // 255
HTTP.publish = function httpPublish(options, publishFunc) {                                                        // 256
  options = _.extend({                                                                                             // 257
    name: null,                                                                                                    // 258
    collection: null,                                                                                              // 259
    defaultFormat: null,                                                                                           // 260
    collectionGet: true,                                                                                           // 261
    collectionPost: true,                                                                                          // 262
    documentGet: true,                                                                                             // 263
    documentPut: true,                                                                                             // 264
    documentDelete: true                                                                                           // 265
  }, options || {});                                                                                               // 266
                                                                                                                   // 267
  var collection = options.collection;                                                                             // 268
                                                                                                                   // 269
  // Use provided name or build one                                                                                // 270
  var name = (typeof options.name === "string") ? options.name : defaultAPIPrefix + collection._name;              // 271
                                                                                                                   // 272
  // Make sure we have a name                                                                                      // 273
  if (typeof name !== "string") {                                                                                  // 274
    throw new Error('HTTP.publish expected a collection or name option');                                          // 275
  }                                                                                                                // 276
                                                                                                                   // 277
  var defaultFormat = options.defaultFormat;                                                                       // 278
                                                                                                                   // 279
  // Rig the methods for the CRUD interface                                                                        // 280
  var methods = {};                                                                                                // 281
                                                                                                                   // 282
  // console.log('HTTP restpoint: ' + name);                                                                       // 283
                                                                                                                   // 284
  // list and create                                                                                               // 285
  methods[name] = {};                                                                                              // 286
                                                                                                                   // 287
  if (options.collectionGet && publishFunc) {                                                                      // 288
    // Return the published documents                                                                              // 289
    methods[name].get = function(data) {                                                                           // 290
      // Format the scope for the publish method                                                                   // 291
      var publishScope = _publishHTTP.getPublishScope(this);                                                       // 292
      // Get the publish cursor                                                                                    // 293
      var cursor = publishFunc.apply(publishScope, [data]);                                                        // 294
                                                                                                                   // 295
      // Check if its a cursor                                                                                     // 296
      if (cursor && cursor.fetch) {                                                                                // 297
        // Fetch the data fron cursor                                                                              // 298
        var result = cursor.fetch();                                                                               // 299
        // Return the data                                                                                         // 300
        return _publishHTTP.formatResult(result, this, defaultFormat);                                             // 301
      } else {                                                                                                     // 302
        // We didnt get any                                                                                        // 303
        return _publishHTTP.error(200, [], this);                                                                  // 304
      }                                                                                                            // 305
    };                                                                                                             // 306
  }                                                                                                                // 307
                                                                                                                   // 308
  if (collection) {                                                                                                // 309
    // If we have a collection then add insert method                                                              // 310
    if (options.collectionPost) {                                                                                  // 311
      methods[name].post = function(data) {                                                                        // 312
        var insertMethodHandler = _publishHTTP.getMethodHandler(collection, 'insert');                             // 313
        // Make sure that _id isset else create a Meteor id                                                        // 314
        data._id = data._id || Random.id();                                                                        // 315
        // Create the document                                                                                     // 316
        try {                                                                                                      // 317
          // We should be passed a document in data                                                                // 318
          insertMethodHandler.apply(this, [data]);                                                                 // 319
          // Return the data                                                                                       // 320
          return _publishHTTP.formatResult({ _id: data._id }, this, defaultFormat);                                // 321
        } catch(err) {                                                                                             // 322
          // This would be a Meteor.error?                                                                         // 323
          return _publishHTTP.error(err.error, { error: err.message }, this);                                      // 324
        }                                                                                                          // 325
      };                                                                                                           // 326
    }                                                                                                              // 327
                                                                                                                   // 328
    // We also add the findOne, update and remove methods                                                          // 329
    methods[name + '/:id'] = {};                                                                                   // 330
                                                                                                                   // 331
    if (options.documentGet && publishFunc) {                                                                      // 332
      // We have to have a publish method inorder to publish id? The user could                                    // 333
      // just write a publish all if needed - better to make this explicit                                         // 334
      methods[name + '/:id'].get = function(data) {                                                                // 335
        // Get the mongoId                                                                                         // 336
		var mongoId;                                                                                                     // 337
		try {                                                                                                            // 338
			mongoId = new Meteor.Collection.ObjectID(this.params.id);                                                       // 339
		} catch (exception) {                                                                                            // 340
			mongoId = '';                                                                                                   // 341
		}                                                                                                                // 342
        // We would allways expect a string but it could be empty                                                  // 343
        if (mongoId !== '') {                                                                                      // 344
                                                                                                                   // 345
          // Format the scope for the publish method                                                               // 346
          var publishScope = _publishHTTP.getPublishScope(this);                                                   // 347
                                                                                                                   // 348
          // Get the publish cursor                                                                                // 349
          var cursor = publishFunc.apply(publishScope, [data]);                                                    // 350
                                                                                                                   // 351
          // Result will contain the document if found                                                             // 352
          var result;                                                                                              // 353
                                                                                                                   // 354
          // Check to see if document is in published cursor                                                       // 355
          cursor.forEach(function(doc) {                                                                           // 356
            if (!result) {                                                                                         // 357
              if (EJSON.equals(doc._id,mongoId)) {                                                                 // 358
                result = doc;                                                                                      // 359
              }                                                                                                    // 360
            }                                                                                                      // 361
          });                                                                                                      // 362
                                                                                                                   // 363
          // If the document is found the return                                                                   // 364
          if (result) {                                                                                            // 365
            return _publishHTTP.formatResult(result, this, defaultFormat);                                         // 366
          } else {                                                                                                 // 367
            // We do a check to see if the doc id exists                                                           // 368
            var exists = collection.findOne({ _id: mongoId });                                                     // 369
            // If it exists its not published to the user                                                          // 370
            if (exists) {                                                                                          // 371
              // Unauthorized                                                                                      // 372
              return _publishHTTP.error(401, { error: 'Unauthorized' }, this);                                     // 373
            } else {                                                                                               // 374
              // Not found                                                                                         // 375
              return _publishHTTP.error(404, { error: 'Document with id ' + mongoId + ' not found' }, this);       // 376
            }                                                                                                      // 377
          }                                                                                                        // 378
                                                                                                                   // 379
        } else {                                                                                                   // 380
          return _publishHTTP.error(400, { error: 'Method expected a document id' }, this);                        // 381
        }                                                                                                          // 382
      };                                                                                                           // 383
    }                                                                                                              // 384
                                                                                                                   // 385
    if (options.documentPut) {                                                                                     // 386
      methods[name + '/:id'].put = function(data) {                                                                // 387
        // Get the mongoId                                                                                         // 388
		var mongoId;                                                                                                     // 389
		try {                                                                                                            // 390
			mongoId = new Meteor.Collection.ObjectID(this.params.id);                                                       // 391
		} catch (exception) {                                                                                            // 392
			mongoId = '';                                                                                                   // 393
		}                                                                                                                // 394
        // We would allways expect a string but it could be empty                                                  // 395
        if (mongoId !== '') {                                                                                      // 396
                                                                                                                   // 397
          var updateMethodHandler = _publishHTTP.getMethodHandler(collection, 'update');                           // 398
          // Create the document                                                                                   // 399
          try {                                                                                                    // 400
            // We should be passed a document in data                                                              // 401
            updateMethodHandler.apply(this, [{ _id: mongoId }, data]);                                             // 402
            // Return the data                                                                                     // 403
            return _publishHTTP.formatResult({ _id: mongoId }, this, defaultFormat);                               // 404
          } catch(err) {                                                                                           // 405
            // This would be a Meteor.error?                                                                       // 406
            return _publishHTTP.error(err.error, { error: err.message }, this);                                    // 407
          }                                                                                                        // 408
                                                                                                                   // 409
        } else {                                                                                                   // 410
          return _publishHTTP.error(400, { error: 'Method expected a document id' }, this);                        // 411
        }                                                                                                          // 412
      };                                                                                                           // 413
    }                                                                                                              // 414
                                                                                                                   // 415
    if (options.documentDelete) {                                                                                  // 416
      methods[name + '/:id'].delete = function(data) {                                                             // 417
         // Get the mongoId                                                                                        // 418
		var mongoId;                                                                                                     // 419
		try {                                                                                                            // 420
			mongoId = new Meteor.Collection.ObjectID(this.params.id);                                                       // 421
		} catch (exception) {                                                                                            // 422
			mongoId = '';                                                                                                   // 423
		}                                                                                                                // 424
        // We would allways expect a string but it could be empty                                                  // 425
        if (mongoId !== '') {                                                                                      // 426
                                                                                                                   // 427
          var removeMethodHandler = _publishHTTP.getMethodHandler(collection, 'remove');                           // 428
          // Create the document                                                                                   // 429
          try {                                                                                                    // 430
            // We should be passed a document in data                                                              // 431
            removeMethodHandler.apply(this, [{ _id: mongoId }]);                                                   // 432
            // Return the data                                                                                     // 433
            return _publishHTTP.formatResult({ _id: mongoId }, this, defaultFormat);                               // 434
          } catch(err) {                                                                                           // 435
            // This would be a Meteor.error?                                                                       // 436
            return _publishHTTP.error(err.error, { error: err.message }, this);                                    // 437
          }                                                                                                        // 438
                                                                                                                   // 439
        } else {                                                                                                   // 440
          return _publishHTTP.error(400, { error: 'Method expected a document id' }, this);                        // 441
        }                                                                                                          // 442
      };                                                                                                           // 443
    }                                                                                                              // 444
                                                                                                                   // 445
  }                                                                                                                // 446
                                                                                                                   // 447
  // Publish the methods                                                                                           // 448
  HTTP.methods(methods);                                                                                           // 449
                                                                                                                   // 450
  // Mark these method names as currently published                                                                // 451
  _publishHTTP.currentlyPublished = _.union(_publishHTTP.currentlyPublished, _.keys(methods));                     // 452
                                                                                                                   // 453
}; // EO Publish                                                                                                   // 454
                                                                                                                   // 455
/**                                                                                                                // 456
 * @method HTTP.unpublish                                                                                          // 457
 * @public                                                                                                         // 458
 * @param {String|Meteor.Collection} [name] - The method name or collection                                        // 459
 * @returns {undefined}                                                                                            // 460
 *                                                                                                                 // 461
 * Unpublishes all HTTP methods that were published with the given name or                                         // 462
 * for the given collection. Call with no arguments to unpublish all.                                              // 463
 */                                                                                                                // 464
HTTP.unpublish = _publishHTTP.unpublish;                                                                           // 465
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
