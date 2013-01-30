//Methoden, die auf dem Server aufgerufen werden können
Meteor.methods({
	checkJDOnlineStatus : function (options) {
		if (this.isSimulation) {
		  return true;
		}
		this.unblock();
		var result = Meteor.http.get("http://" + options['ip'] + ":" + options['port'] + "/get/version");
		if (result.statusCode === 200 && result.content == "JDownloader") return true;
		return false;
	},
	//TODO: ausarbeiten..., WS aufrufen
	checkLink: function (link) {
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
  	//TODO: funktioniert noch nicht...
  	checkSite: function (siteurl) {
  		if (this.isSimulation)
  		{
  			var feedObject;
			feedObject.title = "new Site";
			feedObject.feedUrl = siteurl;
			feedObject.url = siteurl;
  		}
  		
  	   	var result = Meteor.http.get("https://ajax.googleapis.com/ajax/services/feed/find?v=1.0&q=" + encodeURI(siteurl).replace(".com","").replace("http://",""));
  	   		   	
		if (result.responseData) {					
			var feedObject;
			feedObject.title = result.responseData.feed.titel;
			feedObject.feedUrl = result.responseData.feed.feedUrl;
			feedObject.url = result.responseData.feed.link;
				
			console.log(feedObject);
				
			return feedObject;
		};
	},
	//TODO: implementieren
	createLink: function (linkObject) {
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

  	createComment: function (linkId, aMessage) {
		if (this.isSimulation) {
			var comment = {creator: this.userId, message: aMessage, date : new Date()};
			return Links.update( { _id: linkId }, { $push: { comments: comment } } ) ;
		};
		var comment = {creator: this.userId, message: aMessage, date : new Date()};
		return Links.update( { _id: linkId }, { $push: { comments: comment } } );
  	},
});