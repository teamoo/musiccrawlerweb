//Methoden, die auf dem Server aufgerufen werden können
Meteor.methods({
	checkJDOnlineStatus : function (ip, port) {
		if (this.isSimulation) {
		  return true;
		}
	
	
		this.unblock();
		var result = Meteor.http.get("http://" + ip + ":" + port + "/get/version");
		
		if (result.statusCode === 200 && result.content == "JDownloader") return true;
		return false;
	},
	
	checkLink: function (link, userId) {
    options = options || {};
    if (! (typeof options.url === "string" && options.title.length &&
           typeof options.url === "string" &&
           options.status.length &&
           typeof options.x === "number" && options.x >= 0 && options.x <= 1 &&
           typeof options.y === "number" && options.y >= 0 && options.y <= 1))
      throw new Meteor.Error(400, "Required parameter missing");
    if (options.title.length > 100)
      throw new Meteor.Error(413, "Title too long");
    if (options.description.length > 1000)
      throw new Meteor.Error(413, "Description too long");
    if (! this.userId)
      throw new Meteor.Error(403, "You must be logged in");

    return Parties.insert({
      owner: this.userId,
      x: options.x,
      y: options.y,
      title: options.title,
      description: options.description,
      public: !! options.public,
      invited: [],
      rsvps: []
    });
  },

  createLink: function (linkObject, userId) {
    options = options || {};
    if (! (typeof options.url === "string" && options.title.length &&
           typeof options.url === "string" &&
           options.status.length &&
           typeof options.x === "number" && options.x >= 0 && options.x <= 1 &&
           typeof options.y === "number" && options.y >= 0 && options.y <= 1))
      throw new Meteor.Error(400, "Required parameter missing");
    if (options.title.length > 100)
      throw new Meteor.Error(413, "Title too long");
    if (options.description.length > 1000)
      throw new Meteor.Error(413, "Description too long");
    if (! this.userId)
      throw new Meteor.Error(403, "You must be logged in");

    return Parties.insert({
      owner: this.userId,
      x: options.x,
      y: options.y,
      title: options.title,
      description: options.description,
      public: !! options.public,
      invited: [],
      rsvps: []
    });
  },

  createComment: function (userId, linkId, aMessage) {
		if (this.isSimulation) {
		  return true;
		}
		var comment = {creator: userId, message: aMessage, date : new Date()};
		Links.update( { _id: linkId }, { $push: { comments: comment } } );
  },
});