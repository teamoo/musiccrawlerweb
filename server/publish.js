// Lists -- {name: String}
Links = new Meteor.Collection("links");

// Publish complete set of lists to all clients.
Meteor.publish('links', function () {
  return Links.find();
});


// Todos -- {text: String,
//           done: Boolean,
//           tags: [String, ...],
//           list_id: String,
//           timestamp: Number}
LinksThisDay = new Meteor.Collection("links_today");

// Publish all items for requested list_id.
Meteor.publish('links_today', function () {
    return Links.find({}, {sort: {date: 1, name: 1}, limit:1000});
});

LinksThisWeek = new Meteor.Collection("links_this_week");

// Publish all items for requested list_id.
Meteor.publish('links_this_week', function () {
    return Links.find({}, {sort: {date: 1, name: 1}, limit:1000});
});

LinksThisMonth = new Meteor.Collection("links_this_month");

// Publish all items for requested list_id.
Meteor.publish('links_this_month', function () {
    return Links.find({}, {sort: {date: 1, name: 1}, limit:1000});
});

LinksThisYear = new Meteor.Collection("links_this_year");

// Publish all items for requested list_id.
Meteor.publish('links_this_year', function () {
    return Links.find({}, {sort: {date: 1, source: 1}, limit:1000});
});

LinksAll = new Meteor.Collection("links_all");

Meteor.publish('links_all', function () {
    return Links.find({}, {sort: {date: 1, source: 1}, limit:1000});
});


