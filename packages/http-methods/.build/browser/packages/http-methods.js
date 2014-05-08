(function () {

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages\http-methods\http.methods.client.api.js                  //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
HTTP = Package.http && Package.http.HTTP || {};                      // 1
                                                                     // 2
// Client-side simulation is not yet implemented                     // 3
HTTP.methods = function(methods) {                                   // 4
  throw new Error('HTTP.methods not implemented on client-side');    // 5
};                                                                   // 6
///////////////////////////////////////////////////////////////////////

}).call(this);
