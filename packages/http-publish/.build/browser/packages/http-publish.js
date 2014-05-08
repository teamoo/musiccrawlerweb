(function () {

///////////////////////////////////////////////////////////////////////////
//                                                                       //
// packages\http-publish\http.publish.client.api.js                      //
//                                                                       //
///////////////////////////////////////////////////////////////////////////
                                                                         //
// Client-side is not implemented                                        // 1
HTTP.publish = function() {                                              // 2
  throw new Error('HTTP.publish not implemented on client-side');        // 3
};                                                                       // 4
                                                                         // 5
HTTP.publishFormats = function() {                                       // 6
  throw new Error('HTTP.publishFormats not implemented on client-side'); // 7
};                                                                       // 8
                                                                         // 9
HTTP.unpublish = function() {                                            // 10
  throw new Error('HTTP.unpublish not implemented on client-side');      // 11
};                                                                       // 12
                                                                         // 13
///////////////////////////////////////////////////////////////////////////

}).call(this);
