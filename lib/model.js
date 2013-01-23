//Links = new Meteor.Collection("links");
Comments = new Meteor.Collection("comments");

//we can set direct db access and validate here or always refuse and validate on server-side...
//change to links when production
Comments.allow({
  insert: function (userId, links) {
	return false; // no cowboy inserts -- use createParty method
  },
  update: function (userId, links, fields, modifier) {
      var allowed = ["name", "likes"];
      if (_.difference(fields, allowed).length)
        return false; // tried to write to forbidden field
      return true;
  },
  remove: function (userId, links) {
    return ! _.any(links, function (link) {
      // deny if not the owner, or if other people are going
      return link.creator !== userId;
    });
  },
  fetch: ['creator']
});

Comments.allow({
   insert: function (userId, comments) {
	return true;
   },
   update: function (userId, comments, fields, modifier) {
	return false;
   },
   remove: function (userId, comment) {
      return ! _.any(comments, function (comment) {
      	// deny if not the owner, or if other people are going
      	return comment.creator !== userId;
      });
   },
   fetch: ['creator']
});