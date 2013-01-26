//Publishing - Meteor Collections, die Clients subscriben können

// Publish filtered list to all clients
Meteor.publish('links', function (filter_date, filter_status, filter_term) {
	if (this.userId) return Links.find({date: {$gte: filter_date}, status: {$in: filter_status}, name: {$regex: filter_term, $options: 'i' }}, {fields: {_id:1, name:1, size:1, likes:1, comments:1, url:1, source:1, date:1, status:1}}, {sort: {$natural:-1}, limit:1000});
});

// Quellen
// Publish all sites
Meteor.publish('sites', function () {
  if (this.userId) return Sites.find({},{fields: {name:1, feedurl:1, type:1, creator:1, last_crawled:1}});
});

//TODO: ausarbeiten
//Anzahl Links in den einzelnen Sub-Collections
Meteor.publish("counts", function () {
  var self = this;
  var uuid = Meteor.uuid();
  var count = 0;

  var handle = Links.find({},{fields: _id}).observe({
    added: function () {
      count++;
      self.set("counts", uuid, {count: count});
      self.flush();
    },
    removed: function () {
      count--;
      self.set("counts", uuid, {count: count});
      self.flush();
    }
    // don't care about moved or changed
  });

  // Observe only returns after the initial added callbacks have
  // run.  Now mark the subscription as ready.
  self.complete();
  self.flush();

  // stop observing the cursor when client unsubs
  self.onStop(function () {
    handle.stop();
  });
});