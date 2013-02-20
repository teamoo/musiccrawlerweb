Links = new Meteor.Collection("links");
Sites = new Meteor.Collection("sites");

var itemBadgeSize = 50;

// we can set direct db access and validate here or always refuse and validate
// on server-side...
Links.allow({
	insert: function (userId, links) {
		if (Meteor.user().admin && Meteor.user().admin === true) return true;
		return false; // no cowboy inserts -- use createLink method
	},
	update: function (userId, links, fields, modifier) {
		var allowed = ["name", "likes", "likers"]; //comments have to be added through the createComment method
		if (_.difference(fields, allowed).length) {
			return false; // tried to write to forbidden field
		}
		return true;
	},
	remove: function (userId, links) {
		if (Meteor.user().admin && Meteor.user().admin === true) return true;

		return !_.any(links, function (link) {
			// deny if not the owner
			return link.creator !== Meteor.user().profile.id;
		});
	},
	fetch: ['creator', 'likers']
});

Sites.allow({
	insert: function (userId, site) {
		if (Meteor.user().admin && Meteor.user().admin === true) return true;
		return false; // no cowboy inserts - use createSite method
	},
	update: function (userId, site, fields, modifier) {
		if (Meteor.user().admin && Meteor.user().admin === true) return true;
		var allowed = ["name", "next_crawl", "accesstoken", "active"];
		if (_.difference(fields, allowed).length) return false; // tried to write to forbidden field
		return !_.any(site, function (aSite) {
			// deny if not the owner
			return aSite.creator !== Meteor.user().profile.id;
		});
		return true;
	},
	remove: function (userId, site) {
		if (Meteor.user().admin && Meteor.user().admin === true) return true;
		return !_.any(site, function (aSite) {
			// deny if not the owner
			return aSite.creator !== Meteor.user().profile.id;
		});
	},
	fetch: ['creator']
});