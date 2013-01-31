//Methoden, die auf dem Server aufgerufen werden können
Meteor
.methods({
    checkJDOnlineStatus : function(options) {
	if (this.isSimulation) {
	    return true;
	}
		this.unblock();
		var result = Meteor.http.get("http://" + options['ip'] + ":"
			+ options['port'] + "/get/version");
		if (result.statusCode === 200
			&& result.content == "JDownloader")
			return true;
		return false;
    },

    refreshLink : function(linkid) {
	
	var refreshurl = _.pluck(Links.find({
				_id : linkid
			}, {
				fields : {
				url : 1
			}
		}).fetch(), 'url');
	
	//TODO call webservice here
	//if link ok
	return Links.update({
	    _id: linkid
	},{
		$set:
	{
		name: freshlink.name,
		size: freshlink.size,
		status: freshlink.status
	}
	});
	//else return undefined
	
    },
    // TODO: implementieren
    createLink : function(linkObject) {
	options = options || {};
	if (!(typeof options.url === "string" && options.title.length
		&& typeof options.url === "string"
		    && options.status.length
		    && typeof options.x === "number" && options.x >= 0
		    && options.x <= 1 && typeof options.y === "number"
			&& options.y >= 0 && options.y <= 1))
	    throw new Meteor.Error(400, "Required parameter missing");
	if (options.title.length > 100)
	    throw new Meteor.Error(413, "Title too long");
	if (options.description.length > 1000)
	    throw new Meteor.Error(413, "Description too long");
	if (!this.userId)
	    throw new Meteor.Error(403, "You must be logged in");

	return Parties.insert({
	    owner : this.userId,
	    x : options.x,
	    y : options.y,
	    title : options.title,
	    description : options.description,
	    public : !!options.public,
	    invited : [],
	    rsvps : []
	});
    },

    // TODO: fast fertig...
    createSite : function(siteurl) {
	if (this.isSimulation) {
	    return false;
	}

	resiteurl = ".*"
	    + siteurl.replace(/\/$/, "").replace("www.", "")
	    .replace(/\//g, "\\/") + ".*";

	if (Sites.findOne({
	    url : {
		$regex : resiteurl,
		$options : 'i'
	    }
	}) != undefined) {
	    throw new Meteor.Error(409, "Seite bereits vorhanden",
		    "Die Seite " + siteurl
		    + " ist bereits im System vorhanden");
	    return undefined;
	}
	
	var refeedurl = /<link.*type\s*=\s*"application\/rss\+xml".*href\s*=\s*"?([^" >]+)[" >]/i;

	var result = Meteor.http.get(siteurl);
	
	if (result.statusCode === 200) {
	    var m = refeedurl.exec(result.content);

	    if (m == null) {
		var newSite = new Object();
		newSite.name = siteurl.replace("http://", "").replace(
			"www.", "");
		newSite.feedurl = resiteurl.replace(/\.\*/g, "")
		.replace(/\\/g, "");
		newSite.url = resiteurl.replace(/\.\*/g, "").replace(
			/\\/g, "");
		newSite.creator = Meteor.user().profile.id;
		newSite.active = false;
		newSite.last_crawled = null;
		newSite.type = "unknown";
		newSite.date = new Date();

		return
		new Meteor.Error(
			415,
			"unbekannter Seitentyp",
			"Für die Seite "
			+ siteurl
			+ " konnte kein RSS-Feed gefunden werden. Die Seite wird manuell überprüft und dann durchsucht."),
			Sites.insert(newSite);
	    }
	    var newfeedurl = m[m.length - 1];
		
	    renewfeedurl = ".*"
		+ newfeedurl.replace(/\/$/, "").replace("www.", "")
		.replace(/\//g, "\\/") + ".*";

	    if (Sites.findOne({
		feedurl : {
		    $regex : renewfeedurl,
		    $options : 'i'
		}
	    }) != undefined) {
		throw new Meteor.Error(409, "Seite bereits vorhanden",
			"Die Seite " + siteurl
			+ " ist bereits im System vorhanden");
		return undefined;
	    }
	    var newSite = new Object();

	    newSite.name = siteurl.replace("http://", "").replace(
		    "www.", "");
	    newSite.feedurl = renewfeedurl.replace(/\.\*/g, "")
	    .replace(/\\/g, "");
	    newSite.url = resiteurl.replace(/\.\*/g, "").replace(/\\/g,
	    "");
	    newSite.creator = Meteor.user().profile.id;
	    newSite.active = true;
	    newSite.last_crawled = null;
	    newSite.type = "feed";
	    newSite.date = new Date();

	    return Sites.insert(newSite);
	}
	throw new Meteor.Error(404,
		"Seite konnte nicht geladen werden", "Die Seite "
		+ siteurl + " konnte nicht geladen werden.");
	return undefined;
    },


    createComment : function(linkId, aMessage) {
	if (this.isSimulation) {
	    var comment = {
		    creator : this.userId,
		    message : aMessage,
		    date : new Date()
	    };
	    return Links.update({
		_id : linkId
	    }, {
		$push : {
		    comments : comment
		}
	    });
	}
	var comment = {
		creator : this.userId,
		message : aMessage,
		date : new Date()
	};
	return Links.update({
	    _id : linkId
	}, {
	    $push : {
		comments : comment
	    }
	});
    },
});