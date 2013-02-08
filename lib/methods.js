//Methoden, die auf dem Server aufgerufen werden können
Meteor
.methods({
	searchMuzon : function(searchterm) {
	if (this.isSimulation) {
	    return true;
	}
	this.unblock;
	var result = Meteor.http.get("http://muzon.ws/music/"+searchterm,{timeout: 5000});
		if (result && result.content && result.statusCode === 200)
			console.log(result);
			return true;
		throw new Meteor.Error(result.statusCode,result.content);
		return false;
	},
	sendLinks : function(requeststring) {
	if (this.isSimulation) {
	    return true;
	}
		this.unblock();
		var result = Meteor.http.get(requeststring,{timeout: 8000});
		if (result && result.content && result.statusCode === 200 && result.content.indexOf("Link(s) added") != -1)
			return true;
		throw new Meteor.Error(result.statusCode,result.content);
		return false;
	},
    checkJDOnlineStatus : function(options) {
	if (this.isSimulation) {
	    return true;
	}
		this.unblock();
		var result = Meteor.http.get("http://" + options['ip'] + ":"
			+ options['port'] + "/get/version",{timeout: 4000});
		if (result.statusCode === 200
			&& result.content === "JDownloader")
			return true;
		return false;
    },

    refreshLink : function(refreshurl) {
    if (this.isSimulation) {
    	return undefined;
    }
    
    this.unblock();	
	var result = Meteor.http.post("http://localhost:10050/musiccrawler/checkmusicdownloadlink",{data: {url: refreshurl}, timeout: 8000});
	
	if (result && result.statusCode === 200)
	{
		if (result.content)
		{			
			var freshlink = JSON.parse(result.content);

			if (freshlink.name && freshlink.size != undefined && freshlink.status)
			{
				var ret = Links.update({
					url: refreshurl
				},{
				$set:
				{
					name: freshlink.name,
					size: freshlink.size,
					status: freshlink.status,
				}
				});
				
				if (ret === undefined)
					return true;
				return ret;
			}
			else throw new Meteor.Error(result.statusCode,"Fehler bei der Serverkommunikation","Fehler beim aktualisieren des Links " + refreshurl + " : ungültige Antwort vom Server");	
		}
		else throw new Meteor.Error(result.statusCode,"Fehler bei der Serverkommunikation","Fehler beim aktualisieren des Links " + refreshurl + " : ungültige Antwort vom Server");	
	}
	else throw new Meteor.Error(result.statusCode,"Server antwortet nicht","Fehler beim aktualisieren des Links " + refreshurl + " : keine Antwort vom Server");	
    },
    // TODO: testen, aber erst den LinkBuilder fixen
    createLink : function(linkurl) {
    	this.unblock();
    	
    	if (this.isSimulation) {
    		return undefined;
    	}
    	
		cleanlinkurl = linkurl.replace(/\/$/, "");
		
		if (Links.findOne({url : cleanlinkurl}) != undefined)
			throw new Meteor.Error(409, "Link bereits vorhanden",
		    "Der Link " + linkurl
		    + " ist bereits im System vorhanden");
		
		var userid = Meteor.users.findOne({_id : Meteor.userId()}).profile.id;
		
		var result = Meteor.http.post("http://localhost:10050/musiccrawler/checkmusicdownloadlink",{data: {url: cleanlinkurl, source: userid, creator: userid}, timeout:20000});
				
		if (result && result.statusCode === 200)
		{
			if (result.content)
			{		
				var freshlink = JSON.parse(result.content);
				if (freshlink.name && freshlink.size != undefined && freshlink.status && freshlink.source)
				{
					if (Links.findOne({url : freshlink.url}) != undefined)
						throw new Meteor.Error(409, "Link bereits vorhanden",
					    "Der Link " + linkurl
					    + " ist bereits im System vorhanden");
				
					freshlink.creator = freshlink.source;
					freshlink.date_discovered = new Date();
					freshlink.date_published = new Date();
					var ret = Links.insert(freshlink);
					return ret;
				}
				else throw new Meteor.Error(result.statusCode,"Fehler bei der Serverkommunikation","Fehler beim Erstellen des Links " + linkurl + ": ungültige Antwort vom Server");	
			}
			else throw new Meteor.Error(result.statusCode,"Fehler bei der Serverkommunikation","Fehler beim Erstellen des Links " + linkurl + ": ungültige Antwort vom Server");
		}
		else
			throw new Meteor.Error(500,"Server antwortet nicht","Fehler beim Erstellen des Links " + linkurl + ": keine Antwort vom Server");
    },
    createSite : function(siteurl) {
	if (this.isSimulation) {
	    return undefined;
	}

	resiteurl = ".*"
	    + siteurl.replace(/\/$/, "").replace("www.", "")
	    .replace(/\//g, "\\/") + ".*";
	
	//TODO Seiten ohne rictigen Namen sind nicht ok, das müssen wir noch filtern, geht noch nicht
	if (resiteurl == ".*http:\/\/de.*")
		throw new Meteor.Error(500,"ungültige Seite","Die Adresse " + siteurl + " ist zu kurz");
	
	if (Sites.findOne({
	    url : {
		$regex : resiteurl,
		$options : 'i'
	    }
	}) != undefined) {
	    throw new Meteor.Error(409, "Seite bereits vorhanden",
		    "Die Seite " + siteurl
		    + " ist bereits im System vorhanden");
	}
	
	var refeedurl = /<link.*type\s*=\s*"application\/rss\+xml".*href\s*=\s*"?([^" >]+)[" >]/i;

	var result = Meteor.http.get(siteurl,{timeout: 8000});
	
	if (result && result.statusCode === 200) {
	    var m = refeedurl.exec(result.content);

	    if (m == null) {
		var newSite = new Object();
		newSite.name = siteurl.replace("http://", "").replace(
			"www.", "");
		newSite.feedurl = resiteurl.replace(/\.\*/g, "")
		.replace(/\\/g, "");
		newSite.url = resiteurl.replace(/\.\*/g, "").replace(
			/\\/g, "");
			
		newSite.creator = Meteor.users.findOne({_id : Meteor.userId()}).profile.id;
		newSite.active = false;
		newSite.last_crawled = null;
		newSite.type = "unknown";
		newSite.date_created = new Date();

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
	    }
	    var newSite = new Object();

	    newSite.name = siteurl.replace("http://", "").replace(
		    "www.", "");
	    newSite.feedurl = renewfeedurl.replace(/\.\*/g, "")
	    .replace(/\\/g, "");
	    newSite.url = resiteurl.replace(/\.\*/g, "").replace(/\\/g,
	    "");
		newSite.creator = Meteor.users.findOne({_id : Meteor.userId()}).profile.id;
	    newSite.active = true;
	    newSite.last_crawled = null;
	    newSite.type = "feed";
	    newSite.date_created = new Date();

	    return Sites.insert(newSite);
	}
	throw new Meteor.Error(404,
		"Seite konnte nicht geladen werden", "Die Seite "
		+ siteurl + " konnte nicht geladen werden.");
    },
	
    createComment : function(linkId, aMessage) {
	if (this.isSimulation) {
	    var comment = {
		    creator : Meteor.users.findOne({_id : Meteor.userId()}).profile.id,
		    message : aMessage,
		    date_created : new Date()
	    };
		
		if(comment && comment.creator && comment.message)
			return Links.update({
			_id : linkId
			}, {
			$push : {
				comments : comment
			}
			});
		throw new Meteor.Error(500,"Daten unvollständig", "Benutzername oder Nachricht nicht gesetzt.");
	}
	var comment = {
		creator : Meteor.users.findOne({_id : Meteor.userId()}).profile.id,
		message : aMessage,
		date_created : new Date()
	};
	
	if(comment && comment.creator && comment.message)
		return Links.update({
			_id : linkId
		}, {
			$push : {
			comments : comment
			}
		});
	throw new Meteor.Error(500,"Daten unvollständig", "Benutzername oder Nachricht nicht gesetzt.");
    },
});