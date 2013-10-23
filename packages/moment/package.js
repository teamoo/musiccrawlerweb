Package.describe({
  summary: "Moment.js, a JavaScript date library for parsing, validating, manipulating, and formatting dates, packaged for Meteor. See http://momentjs.com."
});

Package.on_use(function (api, where) {
  if(api.export) {
    api.export('moment');
  }
  where = where || ['client', 'server'];
  api.add_files('lib/moment/moment.js', where);
  api.add_files('export-moment.js', where);
});
