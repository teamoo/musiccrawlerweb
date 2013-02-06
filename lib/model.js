Links = new Meteor.Collection("links");
Sites = new Meteor.Collection("sites");

var itemBadgeSize = 50;

// we can set direct db access and validate here or always refuse and validate
// on server-side...
Links.allow({
    insert : function(userId, links) {
	return false; // no cowboy inserts -- use createLink method
    },
    update : function(userId, links, fields, modifier) {
	return true;
	var allowed = [ "name", "likes", "likers"]; //comments have to be added through the createComment method
	//TODO verfeinern, dass ich nur mich in likers packen kann, aber eigentlich sehr sehr unwahrscheinlich...
	if (_.difference(fields, allowed).length) {
	    return false; // tried to write to forbidden field
	}
	return true;
    },
    remove : function(userId, links) {
	return !_.any(links, function(link) {
	    // deny if not the owner
	    return link.creator !== Meteor.users.findOne({_id : userId}).profile.id;
	});
    },
    fetch : [ 'creator', 'likers' ]
});

Sites.allow({
    insert : function(userId, site) {
	return true;
    },
    update : function(userId, site, fields, modifier) {
	var allowed = [ "name" ];
	if (_.difference(fields, allowed).length)
	    return false; // tried to write to forbidden field
	return !_.any(site, function(aSite) {
	    // deny if not the owner
	    return aSite.creator !== Meteor.users.findOne({_id : userId}).profile.id;
	});	
	return true;
    },
    remove : function(userId, site) {
	return !_.any(site, function(aSite) {
	    // deny if not the owner
	    return aSite.creator !== Meteor.users.findOne({_id : userId}).profile.id;
	});
    },
    fetch : [ 'creator' ]
});