Links = new Meteor.Collection("links");
Sites = new Meteor.Collection("sites");

//we can set direct db access and validate here or always refuse and validate on server-side...
//change to links when production
Links.allow({
  insert: function (userId, links) {
	return false; // no cowboy inserts -- use createLink method
  },
  update: function (userId, links, fields, modifier) {
      var allowed = ["name", "likes", "likers"];
      if (_.difference(fields, allowed).length)
        return false; // tried to write to forbidden field
      return true;
  },
  remove: function (userId, links) {
    return ! _.any(links, function (link) {
      // deny if not the owner
      return link.creator !== userId;
    });
  },
  fetch: ['creator']
});

Sites.allow({
   insert: function (userId, site) {
	return true;
   },
   update: function (userId, site, fields, modifier) {
	var allowed = ["name"];
	if (_.difference(fields, allowed).length)
	  return false; // tried to write to forbidden field
	return true;
   },
   remove: function (userId, site) {
      return ! _.any(site, function (site) {
      	// deny if not the owner
      	return site.creator !== userId;
      });
   },
   fetch: ['creator']
});