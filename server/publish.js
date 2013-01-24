//Publishing - Meteor Collections, die Clients subscriben können

// Publish filtered list to all clients
Meteor.publish('links', function (filter_date, filter_status) {
	if (this.userId) return Links.find({date: {$gte: filter_date}, status: {$in: filter_status}}, {sort: {date: 1, source: 1}, limit:2000});
});

// Quellen
// Publish all sites
Meteor.publish('sites', function () {
  if (this.userId) return Sites.find({});
});