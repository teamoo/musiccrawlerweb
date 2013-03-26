Links = new Meteor.Collection("links",{idGeneration:'MONGO'});
Sites = new Meteor.Collection("sites",{idGeneration:'MONGO'});
Sets = new Meteor.Collection("sets",{idGeneration:'MONGO'});
Counts = new Meteor.Collection("counts");

// we can set direct db access and validate here or always refuse and validate
// on server-side...
Links.allow({
	insert: function (userId, link) {
		if (Meteor.user().admin && Meteor.user().admin === true) return true;
		return false; // no cowboy inserts -- use createLink method
	},
	update: function (userId, link, fields, modifier) {
		var allowed = ["name", "likes", "likers", "downloaders"]; //comments have to be added through the createComment method
		if (_.difference(fields, allowed).length) {
			return false; // tried to write to forbidden field
		}
		if (fields.indexOf("likers") !== -1)
        	return !(_.contains(link.likers, Meteor.userId()));
		return true;
	},
	remove: function (userId, link) {
		if (Meteor.user().admin && Meteor.user().admin === true) return true;

        return link.creator !== Meteor.user().id;
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
        // deny if not the owner
        return site.creator !== Meteor.user().id;
		return true;
	},
	remove: function (userId, site) {
		if (Meteor.user().admin && Meteor.user().admin === true) return true;
        // deny if not the owner
        return site.creator !== Meteor.user().id;
	},
	fetch: ['creator']
});