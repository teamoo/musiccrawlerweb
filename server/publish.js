//Publishing - Meteor Collections, auf die die Clients zugreifen werden.

// alle Links
Links = new Meteor.Collection("links");

// Publish complete set of lists to all clients.
Meteor.publish('links', function () {
    return Links.find({}, {sort: {date: 1, source: 1}, limit:2000});
});

// Links, die heute hinzugefügt worden sind
LinksThisDay = new Meteor.Collection("links_today");

// Publish all items for requested timeframe
Meteor.publish('links_today', function () {
    return Links.find({}, {sort: {date: 1, name: 1}, limit:1000});
});

// Links, die diese Woche hinzugefügt worden sind
LinksThisWeek = new Meteor.Collection("links_this_week");

// Publish all items for requested timeframe
Meteor.publish('links_this_week', function () {
    return Links.find({}, {sort: {date: 1, name: 1}, limit:1000});
});

// Links, die diesen Monat hinzugefügt worden sind
LinksThisMonth = new Meteor.Collection("links_this_month");

// Publish all items for requested timeframe
Meteor.publish('links_this_month', function () {
    return Links.find({}, {sort: {date: 1, name: 1}, limit:1000});
});

// Links, die dieses Jahr hinzugefügt worden sind
LinksThisYear = new Meteor.Collection("links_this_year");

// Publish all items for requested timeframe
Meteor.publish('links_this_year', function () {
    return Links.find({}, {sort: {date: 1, source: 1}, limit:1000});
});

// Links, die irgendwann hinzugefügt worden sind
LinksAll = new Meteor.Collection("links_all");

// Publish all items for requested timeframe
Meteor.publish('links_all', function () {
    return Links.find({}, {sort: {date: 1, source: 1}, limit:1000});
});

// alle Filehoster - vielleicht sogar aus den Links selektieren?

// Likes

// Kommentare