//TODO Logging einbauen. Notifications in adminnotifications db loggen mit zusätzlichen Metadaten
if (Meteor.isServer) {
	var winston = Winston;
	winston.add(MongoDB, {db:"meteor",collection:"logs",host:"localhost",port:3001});
}


//Methoden, die auf dem Server aufgerufen werden können
Meteor.methods({
	getLinkURLsByDate: function(sel_date, filter_sites, filter_mixes) {
		check(sel_date,Date);
		check(filter_sites, [String]);
		check(filter_mixes, Boolean);
	
		if (filter_mixes && filter_mixes === true)
			return Links.find({
					$and:[{
							name: {
								$regex: "(?=^((?!Live at).)*$)(?=^((?!Chart).)*$)(?=^(?!VA).*)" }
							},{
							size: {
								$lt : 80000000
							}
						}],
					date_published: {
						$gte: sel_date
					},
					status: {
						$in: ["on","unknown"]
					},
					source: {
						$nin: filter_sites
					},
					downloaders: {
						$ne: Meteor.userId()
					}
				}, {
					fields: {
						url: 1,
						hoster: 1,
						aid: 1,
						oid: 1
					}
				}).fetch();
		else
			return Links.find({
					date_published: {
						$gte: sel_date
					},
					status: {
						$in: ["on","unknown"]
					},
					source: {
						$nin: filter_sites
					},
					downloaders: {
						$ne: Meteor.userId()
					}
				}, {
					fields: {
						url: 1,
						hoster: 1,
						aid: 1,
						oid: 1
					}
				}).fetch();
	},
	markLinksAsDownloadedByDate: function (sel_date, filter_sites, filter_mixes, include_vk) {
		check(sel_date, Date);
		check(filter_sites, [String]);
		check(filter_mixes, Boolean);
		check(include_vk, Boolean);
	
		if (include_vk)	{
			if (filter_mixes && filter_mixes === true)
				query = {
					$and:[{
							name: {
								$regex: "(?=^((?!Live at).)*$)(?=^((?!Chart).)*$)(?=^(?!VA).*)" }
							},{
							size: {
								$lt : 80000000
							}
						}],
					date_published: {
						$gte: sel_date
					},
					status: {
						$in: ["on","unknown"]
					},
					source: {
						$nin: filter_sites
					},
					downloaders: {
						$ne: Meteor.userId()
					}
				};
			else
				query = {
					date_published: {
						$gte: sel_date
					},
					status: {
						$in: ["on","unknown"]
					},
					source: {
						$nin: filter_sites
					},
					downloaders: {
						$ne: Meteor.userId()
					}
				};
		}	
		else {
			if (filter_mixes && filter_mixes === true)
				query = {
					$and:[{
							name: {
								$regex: "(?=^((?!Live at).)*$)(?=^((?!Chart).)*$)(?=^(?!VA).*)" }
							},{
							size: {
								$lt : 80000000
							}
						}],
					date_published: {
						$gte: sel_date
					},
					status: {
						$in: ["on","unknown"]
					},
					source: {
						$nin: filter_sites
					},
					downloaders: {
						$ne: Meteor.userId()
					},
					hoster: {
						$ne: "vk.com"
					}
				};
			else
				query = {
					date_published: {
						$gte: sel_date
					},
					status: {
						$in: ["on","unknown"]
					},
					source: {
						$nin: filter_sites
					},
					downloaders: {
						$ne: Meteor.userId()
					},
					hoster: {
						$ne: "vk.com"
					}
				};
		}			
			
		update = {
			'$addToSet': {
				'downloaders': Meteor.userId()
			}
		};
		options = {
			multi: true
		};
		return Links.update(query, update, options);
	},
	markLinksAsDownloadedById: function (sel_links) {
		check(sel_links, [String]);
	
		var ids = _.map(sel_links, function (linkid) {
			return new Meteor.Collection.ObjectID(linkid);
		});
	
		var samenames = _.pluck(Links.find({
				_id: {
					'$in': ids				
				}
			},
			{
				fields: {
					name: 1
				}
			}
		).fetch(),'name');		
		
		var samenames_filtered = _.filter(samenames, function(name){ return name.length > 20; });
		
		
		query = {
			$or: [
				{
					name: {
						'$in': samenames_filtered
					}
				},
				{
					_id: {
						'$in': ids
					}
				}
			]
		};
		update = {
			'$addToSet': {
				'downloaders': Meteor.userId()
			}
		};
		options = {
			multi: true
		};

		return Links.update(query, update, options);
	},
	markLinksAsDownloadedByURL: function (sel_links) {
		check(sel_links, [String]);
		
	
		var samenames = _.pluck(Links.find({
				url: {
					'$in': sel_links				
				}
			},
			{
				fields: {
					name: 1
				}
			}
		).fetch(),'name');		
		
		var samenames_filtered = _.filter(samenames, function(name){ return name.length > 20; });
		
		query = {
			$or: [
				{
					name: {
						'$in': samenames_filtered
					}
				},
				{
					url: {
						'$in': sel_links
					}
				}
			]
		};
		update = {
			'$addToSet': {
				'downloaders': Meteor.userId()
			}
		};
		options = {
			multi: true
		};
		return Links.update(query, update, options);
	},
	getSuggestions: function (searchterm) {
		check(searchterm, String);
	
		if (this.isSimulation) {
			return undefined;
		}

		var searchterm_mod = '';
		
		var searchterms = searchterm.trim().split(" ");
		for (var i = 0; i < searchterms.length; i++) {
			searchterm_mod+= '\"' + searchterms[i] + '\"' + ' ';
		}
		
		searchterm_mod = searchterm_mod.replace(/\.\*|\(|\)/g,"").trim();
		
		Future = Meteor.require('fibers/future');
		
		var fut = new Future();		
		
		MongoInternals.defaultRemoteCollectionDriver().mongo.db.executeDbCommand({"text":"links",search: searchterm_mod, limit:9, sort:{textScore: -1, date_published: -1},project:{_id:0, name:1, size:1, date_published: 1}},
		//var results = Links.find({$text: {$search: searchterm_mod}}).limit(10).
			function (error,result){
				if (result && result.documents[0].ok === 1 && result.documents[0].results)
				{	
					fut.return(_.pluck(result.documents[0].results,'obj'));
				}
				else
					winston.warn("Fehler beim Abruf von Suchvorschlägen: Rückgabe-Objekt ist fehlerhaft.", {action:"getSuggestions"});
				if (error)
					winston.warn("Fehler beim Abruf von Suchvorschlägen: Rückgabe-Objekt ist fehlerhaft.", {action:"getSuggestions"});
			}
		);
		return fut.wait();
	},
	getSuggestionsForEmail: function (emailaddress) {
		check(emailaddress, String);
	
		var ret = Meteor.users.find({
			$or: [{
					'services.facebook.email': {
						$regex: emailaddress,
						$options: 'i'
					}
				}, {
					'services.facebook.name': {
						$regex: emailaddress,
						$options: 'i'
					}
				}
			]
		}, {
			limit: 5,
			fields: {
				services: 1
			}
		}).fetch();
		return _.map(ret, function (item) {
			return _.pick(item.services.facebook, 'name', 'email');
		});
	},
//	initiateBeatportLogin: function() {
//		if (this.isSimulation) return undefined;
//		
//		Future = Meteor.require('fibers/future');
//		
//		var fut = new Future();
//		
//		var OAuth = Meteor.require('oauth').OAuth;
//		
//		var oa = new OAuth("https://oauth-api.beatport.com/identity/1/oauth/request-token",
//		                  "https://oauth-api.beatport.com/identity/1/oauth/access-token",
//		                  Meteor.settings.beatport.api_key,Meteor.settings.beatport.api_secret,
//		                  "1.0A", undefined, "HMAC-SHA1");
//		
//		
//		oa.getOAuthRequestToken({"scope":"https://oauth-api.beatport.com/catalog/3/search/"}, function(error, oauth_token, oauth_token_secret, results) {
//		    if (error) {
//		        fut.return(Meteor.Error(500,JSON.stringify(error)));
//		    } else {
//		        console.log('oauth_token: ' + oauth_token);
//		        console.log('oauth_token_secret: ' + oauth_token_secret);
//
//		        console.log("Requesting access token");
//		        console.log('Please go to https://oauth-api.beatport.com/identity/1/oauth/authorize?oauth_token=' + oauth_token);
//				
//				fut.return({"auth_url" :"http://oauth-api.beatport.com/identity/1/oauth/authorize?oauth_token=" + oauth_token + "&format=json", "oauth_token": oauth_token, "oauth_token_secret" : oauth_token_secret});
//				
//		        
//		    }
//		});
//		
//		return fut.wait();
//	},
	searchBeatport: function(searchterm) {
		if (this.isSimulation) return undefined;
		
		Future = Meteor.require('fibers/future');
		
		var fut = new Future();
		
		
		var OAuth = Meteor.require('oauth').OAuth;
		
		var oa = new OAuth("https://oauth-api.beatport.com/catalog/3/search/",
		                  "https://oauth-api.beatport.com/catalog/3/search/",
		                  Meteor.settings.beatport.api_key,Meteor.settings.beatport.api_secret,
		                  "1.0A", undefined, "HMAC-SHA1");
		
		var url = "https://oauth-api.beatport.com/catalog/3/search/?query=" + searchterm + "&facets=fieldType:track&perPage=17&page=1&sortBy=publishDate+ASC",
		    access_token = Meteor.settings.beatport.access_token,
		    access_token_secret = Meteor.settings.beatport.access_token_secret;
		
		var request = oa.get(url, access_token, access_token_secret, function(error, data) {
		    if (error) {
		    	winston.warn("Fehler bei Beatport-Suchanfrage:" + error.details,{action:"searchBeatport", object:error});
		        fut.return(Meteor.Error(500, "Unbekannter Fehler bei der Beatport-Suche."));
		    } else {
		       fut.return(JSON.parse(data));
		    }
		});
		
		return fut.wait();
	},
	getMuzofonDownloadLink: function(url, searchterm) {
		if (this.isSimulation) return undefined;
		
		Future = Meteor.require('fibers/future');
		
		var fut = new Future();
	
		HTTP.get(url,{headers: {Referer: searchterm}}, function(error,result){
			if (error) Meteor.Error(500, error);
			if (result && result.content) {
				var pattern = /http:\/\/muzofon.com\/dwl2\.php\?jeq\=[a-zA-Z0-9%]*/
				var match = pattern.exec(result.content);
				if (match) fut.return(match);
			}
		});
		
		return fut.wait();
	},
	updateLinkContributionCount: function (infoObject) {	
		if (this.isSimulation) return undefined;
		if (infoObject.user) {
			var contribcount = Links.find({
				creator: infoObject.user.id
			}).count();
			Meteor.users.update({
				_id: infoObject.user._id
			}, {
				$set: {
					"profile.linkcontributioncount": contribcount
				}
			});
		}
		else
			winston.warn("Fehler bei der Berechnung des Benutzer-Community-Link-Beitrags: kein Benutzerobjekt.",{action:"updateLinkContributionCount", object:infoObject});
	},
	updateFacebookGroupName: function (groupid) {
		check(groupid, Number);
		
		if (this.isSimulation) return undefined;
		if (Meteor.user() && Meteor.user().services.facebook) {
			try {
				HTTP.call("GET", "https://graph.facebook.com/" + groupid + "/?fields=name&access_token=" + Meteor.user().services.facebook.accessToken, function (error, result) {
					if (error) 
						winston.log("Gruppenname konnte nicht abgerufen werden: " + error.details ,{object: groupid, action:"updateFacebookGroupName"});
					if (result && result.data && result.data.name) {
						var res = Sites.update({
							groupid: groupid
						}, {
							$set: {
								name: result.data.name
							}
						});
						return res;
					}
				});
			}
			catch (e) {
				winston.warn("Fehler beim Abfragen des Gruppennamen für die Gruppe mit ID " + groupid + " und AccessToken " + Meteor.user().services.facebook.accessToken + error.details,{object: groupid, action:"updateFacebookGroupName", title:"Gruppenname konnte nicht abgerufen werden."});
			}
		}
		else
			winston.warn("Fehler beim Abfragen des Gruppennamen für die Gruppe mit ID " + groupid + " und AccessToken " + Meteor.user().services.facebook.accessToken + error.details,{object: groupid, action:"updateFacebookGroupName", title:"Fehlerhaftes Benutzer-Objekt"});	},
	removeFacebookTokensForUser: function () {
		Sites.update({
			creator: Meteor.user().id,
			type: "facebook-group"
		}, {
			$set: {
				active: false,
				accesstoken: null
			}
		}, {
			multi: true
		});
	},
	updateFacebookPictureForUser: function(infoObject) {
		if (this.isSimulation) return undefined;
		if (infoObject.user && infoObject.user.services && infoObject.user.services.facebook && infoObject.user.services.facebook.accessToken)
		{
			try {
				result = HTTP.get("https://graph.facebook.com/me/picture?access_token=&redirect=false&type=large", {
					params: {
						access_token: infoObject.user.services.facebook.accessToken
					}
				});	
				if (result && result.data && result.data.data && result.data.data.url)
				{
					Meteor.users.update({
						_id: infoObject.user._id
					}, {
						$set: {
							"profile.pictureurl": result.data.data.url
						}
					});
					winston.log("Profilbild erfolgreich aktualisiert für Benutzer " + infoObject.user._id,{action:"updateFacebookTokensForUser"});
				}
				else
					winston.warn("Profilbild konnte nicht von Facebook abgerufen werden.",{action:"updateFacebookTokensForUser"})
			}
			catch (e) {
				winston.warn("Profilbild konnte nicht von Facebook abgerufen werden.",{action:"updateFacebookTokensForUser"})
			}
		}
		else
			winston.warn("Profilbild konnte nicht von Facebook abgerufen werden.",{action:"updateFacebookTokensForUser"})
	},
	updateFacebookTokensForUser: function (infoObject) {
		if (this.isSimulation) return undefined;
		if (infoObject.user && infoObject.user.services && infoObject.user.services.facebook) {		
			if (new Date(infoObject.user.services.facebook.expiresAt) > new Date()) Sites.update({
					creator: infoObject.user.id,
					type: "facebook-group"
				}, {
					$set: {
						accesstoken: infoObject.user.services.facebook.accessToken,
						active: true
					}
				}, {
					multi: true
				});
			else Sites.update({
					creator: infoObject.user.id,
					type: "facebook-group"
				}, {
					$set: {
						accesstoken: null,
						active: false
					}
				}, {
					multi: true
				});
		}
		else
			winston.error("Token konnten nicht aktualisiert werden: Kein gültiges Benutzerobjekt.",{action:"updateFacebookTokensForUser"})
	},
	
	searchExternalService: function(searchterm, servicename) {
		check(searchterm, String);
		check(servicename, String);
		
		if (this.isSimulation) {
		        return undefined;
		}
		
		switch (servicename) {
			case "muzofon":
				var search_url = "http://muzofon.com/search/" + searchterm;
				break;
			case "myfreemp3":
				var search_url = "http://myfreemp3.eu/music/" + searchterm;
				break;
			case "mp3monkey":
				var search_url = "http://mp3monkey.net/mp3/" + searchterm.replace(" ","_") + ".html";
				break;
			default:
				winston.error("Unbekannter externer Suchanbieter " + servicename,{action:"searchExternalService"});
				throw new Meteor.Error(404, "Unknown external search provider: " + servicename);
		}

		this.unblock;
		
		var maxretries = 3;
		
		var retries = 1;
		
		while (retries <= maxretries){
		        try {
		                var result = Meteor.http.get(search_url, {
		                        timeout: 5000
		                });
		                if (result && result.statusCode && result.statusCode === 200) {
		                        return result;
		                }
		                else {
		                        retries++;
								winston.warn("Fehler bei der Kommunikation mit externem Dienst " + servicename + ", wird erneut versucht" ,{action:"searchExternalService"});
		                }
		        }
		        catch (e) {
		                retries++;
						winston.warn("Fehler bei der Kommunikation mit externem Dienst " + servicename + ", wird erneut versucht" ,{action:"searchExternalService"});
		        }
		}	
	},
	sendLinks: function (requeststring) {

		if (this.isSimulation) {
			return true;
		}
		this.unblock();
		
		try {
			var result = HTTP.get(requeststring, {
				timeout: 4000
			});
			if (result && result.content && result.statusCode && result.statusCode === 200 && result.content.indexOf("Link(s) added") != -1) return true;
			winston.warn("Fehler beim Senden von Links an JDownloader mit Requeststring: " + requeststring ,{action:"sendLinks"});
			throw new Meteor.Error(result.statusCode, result.content);
			return false;
		}
		catch (e) {
			winston.warn("Fehler beim Senden von Links an JDownloader mit Requeststring: " + requeststring ,{action:"sendLinks"});
			return false;
		}
	},
	checkJDOnlineStatus: function (options1) {
		if (this.isSimulation) {
			return true;
		}
		this.unblock();
		
		try {
			var result = HTTP.get("http://" + options1['ip'] + ":" + options1['port'] + "/get/version", {
				timeout: 4000
			});
			if (result && result.statusCode && result.statusCode === 200 && result.content === "JDownloader") return true;
				return false;
		}
		catch (e) {
			winston.log("Fehler beim Aktualisieren des JD-Remote-Status mit URL " + "http://" + options1['ip'] + ":" + options1['port'] + "/get/version" ,{action:"checkJDOnlineStatus"});
			return false;
		}
	},
	refreshLink: function (linkid) {
		if (this.isSimulation) {
			return undefined;
		}
		var alink = Links.findOne({
			_id: linkid
		});
		this.unblock();
		if (alink) {
			try {
				var result = HTTP.post("http://" + Meteor.settings.linkbuilder.host + ":" + Meteor.settings.linkbuilder.port + "/musiccrawler/checkmusicdownloadlink", {
					data: {
						url: alink.url,
						source: alink.source
					},
					timeout: 30000
				});
			}
			
			catch (e) {
				winston.error("Fehler beim aktualisieren des Links " + alink.url + " : ungültige Antwort vom Server",{title:"Fehlerin LinkChecker Kommunikation",action:"refreshLink"});
				throw new Meteor.Error(500, "Fehler beim aktualisieren des Links " + alink.url + " : ungültige Antwort vom Server");
			}
			
			if (result && result.statusCode && result.statusCode === 200) {
				if (result.content) {
					var freshlink = result.data;
					if (freshlink) {
					
						//TODO Kann das raus?
						//fix for ec2 not able to connect to vk.com servers
						if (alink.hoster == "vk.com") newstatus = alink.status;
					
						if (freshlink.name && freshlink.name.indexOf("file") === -1 && alink.url.indexOf("/" + freshlink.name) === -1) newname = freshlink.name;
						else newname = alink.name;
						if (freshlink.size != undefined && freshlink.size != 0 && freshlink.size != null) newsize = freshlink.size;
						else newsize = alink.size;
						if (freshlink.status && freshlink.status != "" && freshlink.status != "unknown") newstatus = freshlink.status;
						else newstatus = alink.status;
						if (freshlink.hoster && freshlink.hoster != "") newhoster = freshlink.hoster;
						else newhoster = alink.hoster;
						var ret = Links.update({
							_id: linkid
						}, {
							$set: {
								name: newname,
								hoster: newhoster,
								size: newsize,
								status: newstatus,
							}
						});
						if (ret === undefined) return true;
						return ret;
					}
					winston.error("Fehler beim aktualisieren des Links " + alink.url + " : ungültige Antwort vom Server",{title:"Fehlerin LinkChecker Kommunikation",action:"refreshLink"});
					throw new Meteor.Error(result.statusCode, "Fehler bei der Serverkommunikation", "Fehler beim aktualisieren des Links " + alink.url + " : ungültige Antwort vom Server");
				}
				winston.error("Fehler beim aktualisieren des Links " + alink.url + " : ungültige Antwort vom Server",{title:"Fehlerin LinkChecker Kommunikation",action:"refreshLink"});
				throw new Meteor.Error(result.statusCode, "Fehler bei der Serverkommunikation", "Fehler beim aktualisieren des Links " + alink.url + " : ungültige Antwort vom Server");
			}
			winston.error("Fehler beim aktualisieren des Links " + alink.url + " : ungültige Antwort vom Server",{title:"Fehlerin LinkChecker Kommunikation",action:"refreshLink"});
			throw new Meteor.Error(result.statusCode, "Server antwortet nicht", "Fehler beim aktualisieren des Links " + alink.url + " : keine Antwort vom Server");
		}
		winston.error("Fehler beim aktualisieren des Links " + alink.url + " : Link nicht in der Datenbank gefunden",{title:"Fehler bei Linkaktualisierung",action:"refreshLink"});
		throw new Meteor.Error(404, "Link nicht gefunden", "Fehler beim aktualisieren des Links " + alink.url + " : Link nicht in der Datenbank gefunden");
	},
	//TODO Methoden ordentlich machen. Parameter sind Kraut und rüben
	createLink: function (linkobject, linkurl, stream_url, name, aid, oid) {
		this.unblock();
		
		if (this.isSimulation) {
			return undefined;
		}
		if (!(linkurl.indexOf("http") === 0)) throw new Meteor.Error(400, "fehlerhafte Adresse", "Die angegebene Adresse " + linkurl + " ist keine gültige Adresse.");
		cleanlinkurl = linkurl.replace(/\/$/, "");
		if (Links.findOne({
			url: cleanlinkurl
		}) != undefined) throw new Meteor.Error(409, "Link bereits vorhanden", "Der Link " + linkurl + " ist bereits im System vorhanden");
		var userid = Meteor.user().id;
		
		if (linkurl.indexOf("beatport.com") != -1) {
			freshlink = linkobject;
			freshlink.date_discovered = new Date();
			freshlink.date_published = linkobject.date_published;
			freshlink.duration = undefined;
			freshlink.size = 0;
			freshlink.creator = userid;
			var ret = Links.insert(freshlink);
			if (ret) {
				winston.info("Eine neuer Link wurde hinzugefügt",{object: freshlink, action:"createLink",title:"Link hinzugefügt", ready_by: [], creator:Meteor.user().profile.name});
			}
			return ret;
		}
		
		try {
			var result = HTTP.post("http://" + Meteor.settings.linkbuilder.host + ":" + Meteor.settings.linkbuilder.port + "/musiccrawler/checkmusicdownloadlink", {
				data: {
					url: cleanlinkurl,
					source: userid,
					creator: userid
				},
				timeout: 30000
			});
		}
		catch (e) {
			throw new Meteor.Error(500, "Fehler bei der Serverkommunikation", "Fehler beim Erstellen des Links " + linkurl + ": ungültige Antwort vom Server");
		};
		
		if (result && result.statusCode && result.statusCode === 200) {
			if (result.content) {
				var freshlink = result.data;
				if (freshlink.status == "off" && freshlink.url.indexOf("muzon.ws") === -1 && linkurl.indexOf("vk.me") === -1) throw new Meteor.Error(404, "Link ist offline", "Der Link " + linkurl + " ist offline und kann daher von niemandem heruntergeladen werden. Der Link wird deshalb nicht in die Sammlung aufgenommen.");
				if (freshlink.name && freshlink.size != undefined && freshlink.status && freshlink.source) {
					if (Links.findOne({
						url: freshlink.url
					}) != undefined) throw new Meteor.Error(409, "Link bereits vorhanden", "Der Link " + linkurl + " ist bereits im System vorhanden");
					freshlink.creator = freshlink.source;
					freshlink.date_discovered = new Date();
					freshlink.date_published = new Date();
					if (stream_url) freshlink.stream_url = stream_url;
					if (freshlink.url.indexOf("muzon.ws") !== -1) 
					{
						freshlink.hoster = "muzon.ws";
						if (!stream_url) freshlink.stream_url = freshlink.url;
						if (name) freshlink.name = name;
					}
					if (freshlink.url.indexOf("vk.me") !== -1) 
					{
						freshlink.hoster = "vk.com";
						freshlink.status = "on";
						if (name) freshlink.name = name;
					}
					
					if (aid) {
						freshlink.aid = aid;
					}
					
					if (oid) {
						freshlink.oid = oid;
					}
				
					var ret = Links.insert(freshlink);
					return ret;
				}
				throw new Meteor.Error(result.statusCode, "Fehler bei der Serverkommunikation", "Fehler beim Erstellen des Links " + linkurl + ": ungültige Antwort vom Server");
			}
			throw new Meteor.Error(result.statusCode, "Fehler bei der Serverkommunikation", "Fehler beim Erstellen des Links " + linkurl + ": ungültige Antwort vom Server");
		}
		throw new Meteor.Error(500, "Server antwortet nicht", "Fehler beim Erstellen des Links " + linkurl + ": keine Antwort vom Server");
	},
	createSite: function (siteurl) {
		if (this.isSimulation) {
			return undefined;
		}
		if (siteurl == "http://www.de") throw new Meteor.Error(500, "ungültige Seite", "Die Adresse " + siteurl + " ist zu kurz");
		resiteurl = ".*" + siteurl.replace(/\/$/, "").replace("www.", "").replace(/\//g, "\\/") + ".*";
		if (Sites.findOne({
			url: {
				$regex: resiteurl,
				$options: 'si'
			}
		}) != undefined) {
			throw new Meteor.Error(409, "Seite bereits vorhanden", "Die Seite " + siteurl + " ist bereits im System vorhanden");
		}
		if ((siteurl.indexOf("vk.com/") !== -1) || (siteurl.indexOf("vkontakte.ru/") !== -1)) {
			var newSite = new Object();
			
			var regexTitle = /<title>.*<\/title>/gi
			
			var result = HTTP.get(siteurl, {
				timeout: 4000
			});
			if (result) newSite.name = regexTitle.exec(result.content)[0].replace("<title>","").replace("</title>","");
			else
				newSite.name = siteurl.replace("http://", "").replace("https://", "").replace("www.", "").replace("_"," ").replace("vkontakte.ru","").replace("vk.com","");
			
			newSite.feedurl = resiteurl.replace(/\.\*/g, "").replace(/\\/g, "").replace("vkontakte.ru","vk.com").replace("www.", "").replace("https://", "");
			newSite.url = resiteurl.replace(/\.\*/g, "").replace(/\\/g, "").replace("vkontakte.ru","vk.com").replace("www.", "").replace("https://", "");
			newSite.creator = Meteor.user().id;
			newSite.active = true;
			newSite.last_crawled = null;
			newSite.type = "vkontakte";
			newSite.date_created = new Date();

			var ok = Sites.insert(newSite);
			if (ok) {
				winston.info("Eine neue Seite wurde hinzugefügt",{object: newSite, action:"createSite",title:"Seite hinzugefügt", ready_by: [], creator:Meteor.user().profile.name});
			}
			return ok;
			throw new Meteor.Error(500, "unbekannter Fehler", "Die VKontakte-Gruppe " + siteurl + "konnte nicht hinzugefügt werden (Grund: unbekannt).");
		}
		if (siteurl.indexOf("facebook.com/groups/") !== -1) {
			var newSite = new Object();
			newSite.name = siteurl.replace("http://", "").replace("https://", "").replace("www.", "");
			newSite.feedurl = resiteurl.replace(/\.\*/g, "").replace(/\\/g, "").replace("www.", "");
			newSite.url = resiteurl.replace(/\.\*/g, "").replace(/\\/g, "").replace("www.", "");
			newSite.creator = Meteor.user().id;
			newSite.active = false;
			newSite.last_crawled = null;
			newSite.type = "facebook-group";
			newSite.date_created = new Date();
			newSite.accesstoken = null;
			newSite.groupid = siteurl.split("groups/")[1].split("/")[0];
			if (newSite.groupid && newSite.groupid != "") {
				var ok = Sites.insert(newSite);
				if (ok) {
						winston.info("Eine neue Seite wurde hinzugefügt",{object: newSite, action:"createSite",title:"Seite hinzugefügt", ready_by: [], creator:Meteor.user().profile.name});
					try {
						var result = HTTP.get("https://graph.facebook.com/" + Meteor.user().id + "/permissions?access_token=" + Meteor.user().services.facebook.accessToken, {
							timeout: 4000
						});
					}
					catch (e) {
						throw new Meteor.Error(500, "unbekannter Fehler", "Die Facebook Gruppe " + siteurl + "konnte nicht hinzugefügt werden (Grund: unbekannt).");
					}
					if (result && result.statusCode && result.statusCode === 200) {
						if (result.data && result.data.data[0] && result.data.data[0].user_groups === 1) {
							Sites.update({
								_id: ok
							}, {
								$set: {
									active: true
								}
							});
							return ok;
						}
						throw new Meteor.Error(401, ok, "Um die Facebook Gruppe " + siteurl + " zu durchsuchen wird Zugriff auf deine Gruppen benötigt. Du wirst jetzt aufgefordert, den Zugriff zu gewähren.");
					}
				}
				throw new Meteor.Error(500, "unbekannter Fehler", "Die Facebook Gruppe " + siteurl + "konnte nicht hinzugefügt werden (Grund: unbekannt).");
			}
			throw new Meteor.Error(406, "ungültige Gruppen-ID", "Die URL " + siteurl + " enthält keine gültige Facebook Gruppen ID. Bitte gebe die Gruppen URL in folgender Form an: https://facebook.com/groups/1234567890");
		}
		var refeedurl = /<link.*type\s*=\s*"application\/rss\+xml".*href\s*=\s*"?([^" >]+)[" >]/i;
		if (!(siteurl.indexOf("http") === 0)) throw new Meteor.Error(400, "fehlerhafte Adresse", "Die angegebene Adresse " + siteurl + " ist keine gültige Adresse.");
		try {
			var result2 = HTTP.get("https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=1&output=json&q=" + siteurl);
		}
		catch (e) {
			winston.warn("Fehler bei der Abfrage von Feed-Informationen via Google Feed API für Seiten-URL." + siteurl,{action:"createSite", object: e})
		}
		if (result2 && result2.statusCode &&  result2.statusCode === 200 && result2.data) {
			if (result2.data.responseStatus === 200) {
				renewfeedurl = ".*" + result2.data.responseData.feed.feedUrl.replace(/\/$/, "").replace("www.", "").replace(/\//g, "\\/") + ".*";
				if (Sites.findOne({
					feedurl: {
						$regex: renewfeedurl,
						$options: 'si'
					}
				}) != undefined) {
					throw new Meteor.Error(409, "Seite bereits vorhanden", "Die Seite " + siteurl + " ist bereits im System vorhanden");
				}
				var newSite = new Object();
				newSite.name = result2.data.responseData.feed.title;
				newSite.feedurl = result2.data.responseData.feed.feedUrl.replace("www", "");
				newSite.url = result2.data.responseData.feed.link.replace("www", "");
				newSite.creator = Meteor.user().id;
				newSite.active = true;
				newSite.last_crawled = null;
				newSite.type = "feed";
				newSite.date_created = new Date();
				var ok = Sites.insert(newSite);
				if (ok) {
					winston.info("Eine neue Seite wurde hinzugefügt",{object: newSite, action:"createSite",title:"Seite hinzugefügt", ready_by: [], creator:Meteor.user().profile.name});
				}
				return ok;
			}
		}
		try {
			var result = HTTP.get(siteurl, {
				timeout: 8000
			});
		}
		catch (e) {
			throw new Meteor.Error(404, "Seite konnte nicht geladen werden", "Die Seite " + siteurl + " konnte nicht geladen werden.");
		};
		if (result && result.statusCode && result.statusCode === 200) {
			var m = refeedurl.exec(result.content);
			if (m == null) {
				var newSite = new Object();
				newSite.name = siteurl.replace("http://", "").replace("https://", "").replace("www.", "");
				newSite.feedurl = resiteurl.replace(/\.\*/g, "").replace(/\\/g, "");
				newSite.url = resiteurl.replace(/\.\*/g, "").replace(/\\/g, "");
				newSite.creator = Meteor.user().id;
				newSite.active = false;
				newSite.last_crawled = null;
				newSite.type = "unknown";
				newSite.date_created = new Date();
				var ok = Sites.insert(newSite);
				if (ok) {
					winston.info("Eine neue Seite wurde hinzugefügt",{object: newSite, action:"createSite",title:"Seite hinzugefügt", ready_by: [], creator:Meteor.user().profile.name});
					try {
						Email.send({
							to: "thimo.brinkmann@googlemail.com",
							from: "info@musiccrawlerweb.de",
							subject: "neue Seite im MusicCrawler",
							text: "Es wurde eine neue Seite zum MusicCrawler hinzugefügt (_id: '" + ok + "').\nDie Seite hat keinen RSS-Feed und muss daher manuell geprüft werden.\nDie Adresse lautet: " + newSite.url
						});
					} catch (error) {
						winston.error("Fehler beim Senden der Benachrichtigungs-eMail zur Seitenerstellung:" + error.details, {action:"createSite", object: newSite})
					}
					throw new Meteor.Error(415, "unbekannter Seitentyp", "Für die Seite " + siteurl + " konnte kein RSS-Feed gefunden werden. Die Seite wird manuell überprüft und dann durchsucht.");
				}
				throw new Meteor.Error(500, "unbekannter Fehler", "Die Seite " + siteurl + " konnte nicht hinzugefügt werden (Grund: unbekannt)");
			}
			var newfeedurl = m[m.length - 1];
			renewfeedurl = ".*" + newfeedurl.replace(/\/$/, "").replace("www.", "").replace(/\//g, "\\/") + ".*";
			if (Sites.findOne({
				feedurl: {
					$regex: renewfeedurl,
					$options: 'si'
				}
			}) != undefined) {
				throw new Meteor.Error(409, "Seite bereits vorhanden", "Die Seite " + siteurl + " ist bereits im System vorhanden");
			}
			var newSite = new Object();
			newSite.name = siteurl.replace("http://", "").replace("https://", "").replace("www.", "");
			newSite.feedurl = renewfeedurl.replace(/\.\*/g, "").replace(/\\/g, "");
			newSite.url = resiteurl.replace(/\.\*/g, "").replace(/\\/g, "");
			newSite.creator = Meteor.user().id;
			newSite.active = true;
			newSite.last_crawled = null;
			newSite.type = "feed";
			newSite.date_created = new Date();
			var ok = Sites.insert(newSite);
			if (ok)
				winston.info("Eine neue Seite wurde hinzugefügt",{object: newSite, action:"createSite",title:"Seite hinzugefügt", ready_by: [], creator:Meteor.user().profile.name});
			return ok;
		}
		throw new Meteor.Error(404, "Seite konnte nicht geladen werden", "Die Seite " + siteurl + " konnte nicht geladen werden.");
	},
	createComment: function (linkId, aMessage) {
		if (this.isSimulation) {
			var comment = {
				creator: Meteor.user().id,
				message: aMessage,
				date_created: new Date()
			};
			if (comment && comment.creator && comment.message) return Links.update({
					_id: linkId
				}, {
					'$push': {
						comments: comment
					}
				});
			throw new Meteor.Error(500, "Daten unvollständig", "Benutzername oder Nachricht nicht gesetzt.");
		}
		var comment = {
			creator: Meteor.user().id,
			message: aMessage,
			date_created: new Date()
		};
		if (comment && comment.creator && comment.message) return Links.update({
				_id: linkId
			}, {
				'$push': {
					comments: comment
				}
			});
		throw new Meteor.Error(500, "Daten unvollständig", "Benutzername oder Nachricht nicht gesetzt.");
	},
	scheduleCleanup: function () {
		if (this.isSimulation) {
			return undefined;
		}
		this.unblock();
		if (Meteor.user().admin === true)
		{
			try {
				var result = HTTP.post("http://" + Meteor.settings.crawler.host + ":" + Meteor.settings.crawler.port + "/schedule.json", {
					params: {
						project: "musiccrawler",
						spider: "cleanupspider",
					},
					timeout: 3000
				});			
			}
			catch (e) {
				throw new Meteor.Error(500, "unerwarteter Fehler", "Der Bereinigungs-Lauf konnte nicht erstellt werden.");
			}
			
			if (result && result.statusCode && result.statusCode === 200) {
				var content = result.data;
				winston.info("Datenbank Bereinigungs-Lauf erfolgreich gestartet",{title: "Link-Bereinigung gestartet" ,object: result.data, action: "scheduleCleanup", read_by: []})
				if (content.status == "error") throw new Meteor.Error(500, "unerwarteter Fehler", content.message);
				return result;
			}
			throw new Meteor.Error(500, "unerwarteter Fehler", "Der Bereinigungs-Lauf konnte nicht erstellt werden.");
		}
		throw new Meteor.Error(401, "keine Berechtigung", "Der Bereinigungs-Lauf konnte nicht erstellt werden, da du keine Berechtigung dazu hast.");
	},
	scheduleCrawl: function (asiteId) {
		check(asiteId, String);
	
		if (this.isSimulation) {
			return undefined;
		}
		var site = Sites.findOne({
			_id: asiteId
		});
		if (site) {
			this.unblock();
			if ((Meteor.user().admin === true) || (site.creator = Meteor.user().id)) {
				if (site.type == 'feed') spidertype = "feedspider";
				if (site.type == 'facebook-group') spidertype = "facebookgroupspider";
				if (site.type == 'vkontakte') spidertype = "vkontaktespider";
				try {
					var result = HTTP.post("http://" + Meteor.settings.crawler.host + ":" + Meteor.settings.crawler.port + "/schedule.json", {
						params: {
							project: "musiccrawler",
							spider: spidertype,
							feedurl: site.feedurl
						},
						timeout: 3000
					});				
				}
				catch (e) {
					throw new Meteor.Error(500, "unerwarteter Fehler", "Der Crawl-Lauf konnte nicht erstellt werden.");
				}
				
				if (result && result.statusCode && result.statusCode === 200) {
					var content = result.data;
					if (content.status == "error") throw new Meteor.Error(500, "unerwarteter Fehler", content.message);
					if (content.status == "ok") Sites.update({
							_id: asiteId
						}, {
							$set: {
								next_crawl: content.jobid
							}
						});
					return result;
				}
				throw new Meteor.Error(500, "unerwarteter Fehler", "Der Crawl-Lauf konnte nicht erstellt werden.");
			}
			throw new Meteor.Error(401, "keine Berechtigung", "Der Crawl-Lauf konnte nicht erstellt werden, da du keine Berechtigung dazu hast.");
		}
		throw new Meteor.Error(404, "Seite nicht gefunden", "Der Crawl-Lauf konnte nicht erstellt werden, da die Seite nicht gefunden wurde.");
	},
	cancelCrawl: function (asiteId) {
		check(asiteId, String);
	
		if (this.isSimulation) {
			return undefined;
		}
		if (Meteor.user().admin === true) {
			this.unblock();
			var site = Sites.findOne({
				_id: asiteId
			});
			if (site) {
				if (site.next_crawl && site.next_crawl != null) {
					try {
						var result = HTTP.post("http://" + Meteor.settings.crawler.host + ":" + Meteor.settings.crawler.port + "/cancel.json", {
							params: {
								project: "musiccrawler",
								job: site.next_crawl
							},
							timeout: 3000
						});
					}
					catch (e) {
						throw new Meteor.Error(500, "unerwarteter Fehler", "Der Crawl-Lauf konnte nicht gestoppt werden.");
					};
					if (result && result.statusCode && result.statusCode === 200) {
						var content = result.data;
						if (content.status == "error") throw new Meteor.Error(500, "unerwarteter Fehler", content.message);
						if (content.status == "ok") Sites.update({
								_id: asiteId
							}, {
								$set: {
									next_crawl: undefined
								}
							});
						return result;
					}
					throw new Meteor.Error(500, "unerwarteter Fehler", "Der Crawl-Lauf konnte nicht gestoppt werden.");
				}
				throw new Meteor.Error(417, "geplanter Job erwartet", "Der Crawl-Lauf konnte nicht gestoppt werden, da kein Crawl-Lauf für diese Seite geplant ist.");
			}
			throw new Meteor.Error(404, "Seite nicht gefunden", "Der Crawl-Lauf konnte nicht gestoppt werden, da die Seite nicht gefunden wurde.");
		}
		throw new Meteor.Error(401, "keine Berechtigung", "Der Crawl-Lauf konnte nicht gestoppt werden, da du keine Berechtigung dazu hast.");
	},
	shareLinks: function (emailaddress, linkids) {
		check(emailaddress, String)
		check(linkids, [String]);
	
		if (this.isSimulation) {
			return undefined;
		}
		this.unblock();
		var sender = Meteor.user().profile.name;
		var thelinks = Links.find({
			_id: {
				$in: _.map(linkids, function (linkid) {
					return new Meteor.Collection.ObjectID(linkid);
				})
			}
		}).fetch();
		if (thelinks && thelinks.length && sender && emailaddress) {
			if (thelinks.length === 1) {
				try {
					Email.send({
						to: emailaddress,
						from: "info@musiccrawlerweb.de",
						subject: "MusicCrawler Link: " + thelinks[0].name + " wurde für dich freigegeben",
						html: "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">\
							<html>\
							    <head>\
							        <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />\
							        \
							        <!-- Facebook sharing information tags -->\
							        <meta property=\"og:title\" content=\"MusicCrawler - Link freigegeben\" />\
							        \
							        <title>MusicCrawler - Link freigegeben</title>\
									<style type=\"text/css\">\
										/* Client-specific Styles */\
										#outlook a{padding:0;} /* Force Outlook to provide a \"view in browser\" button. */\
										body{width:100% !important;} .ReadMsgBody{width:100%;} .ExternalClass{width:100%;} /* Force Hotmail to display emails at full width */\
										body{-webkit-text-size-adjust:none;} /* Prevent Webkit platforms from changing default text sizes. */\
							\
										/* Reset Styles */\
										body{margin:0; padding:0;}\
										img{border:0; height:auto; line-height:100%; outline:none; text-decoration:none;}\
										table td{border-collapse:collapse;}\
										#backgroundTable{height:100% !important; margin:0; padding:0; width:100% !important;}\
							\
										/* Template Styles */\
							\
										/* /\/\/\/\/\/\/\/\/\/\ STANDARD STYLING: COMMON PAGE ELEMENTS /\/\/\/\/\/\/\/\/\/\ */\
							\
										/**\
										* @tab Page\
										* @section background color\
										* @tip Set the background color for your email. You may want to choose one that matches your company's branding.\
										* @theme page\
										*/\
										body, #backgroundTable{\
											/*@editable*/ background-color:#FAFAFA;\
										}\
							\
										/**\
										* @tab Page\
										* @section email border\
										* @tip Set the border for your email.\
										*/\
										#templateContainer{\
											/*@editable*/ border: 1px solid #DDDDDD;\
										}\
							\
										/**\
										* @tab Page\
										* @section heading 1\
										* @tip Set the styling for all first-level headings in your emails. These should be the largest of your headings.\
										* @style heading 1\
										*/\
										h1, .h1{\
											/*@editable*/ color:#202020;\
											display:block;\
											/*@editable*/ font-family:Arial;\
											/*@editable*/ font-size:34px;\
											/*@editable*/ font-weight:bold;\
											/*@editable*/ line-height:100%;\
											margin-top:0;\
											margin-right:0;\
											margin-bottom:10px;\
											margin-left:0;\
											/*@editable*/ text-align:left;\
										}\
							\
										/**\
										* @tab Page\
										* @section heading 2\
										* @tip Set the styling for all second-level headings in your emails.\
										* @style heading 2\
										*/\
										h2, .h2{\
											/*@editable*/ color:#202020;\
											display:block;\
											/*@editable*/ font-family:Arial;\
											/*@editable*/ font-size:30px;\
											/*@editable*/ font-weight:bold;\
											/*@editable*/ line-height:100%;\
											margin-top:0;\
											margin-right:0;\
											margin-bottom:10px;\
											margin-left:0;\
											/*@editable*/ text-align:left;\
										}\
							\
										/**\
										* @tab Page\
										* @section heading 3\
										* @tip Set the styling for all third-level headings in your emails.\
										* @style heading 3\
										*/\
										h3, .h3{\
											/*@editable*/ color:#202020;\
											display:block;\
											/*@editable*/ font-family:Arial;\
											/*@editable*/ font-size:26px;\
											/*@editable*/ font-weight:bold;\
											/*@editable*/ line-height:100%;\
											margin-top:0;\
											margin-right:0;\
											margin-bottom:10px;\
											margin-left:0;\
											/*@editable*/ text-align:left;\
										}\
							\
										/**\
										* @tab Page\
										* @section heading 4\
										* @tip Set the styling for all fourth-level headings in your emails. These should be the smallest of your headings.\
										* @style heading 4\
										*/\
										h4, .h4{\
											/*@editable*/ color:#202020;\
											display:block;\
											/*@editable*/ font-family:Arial;\
											/*@editable*/ font-size:22px;\
											/*@editable*/ font-weight:bold;\
											/*@editable*/ line-height:100%;\
											margin-top:0;\
											margin-right:0;\
											margin-bottom:10px;\
											margin-left:0;\
											/*@editable*/ text-align:left;\
										}\
							\
										/* /\/\/\/\/\/\/\/\/\/\ STANDARD STYLING: HEADER /\/\/\/\/\/\/\/\/\/\ */\
							\
										/**\
										* @tab Header\
										* @section header style\
										* @tip Set the background color and border for your email's header area.\
										* @theme header\
										*/\
										#templateHeader{\
											/*@editable*/ background-color:#FFFFFF;\
											/*@editable*/ border-bottom:0;\
										}\
							\
										/**\
										* @tab Header\
										* @section header text\
										* @tip Set the styling for your email's header text. Choose a size and color that is easy to read.\
										*/\
										.headerContent{\
											/*@editable*/ color:#202020;\
											/*@editable*/ font-family:Arial;\
											/*@editable*/ font-size:34px;\
											/*@editable*/ font-weight:bold;\
											/*@editable*/ line-height:100%;\
											/*@editable*/ padding:0;\
											/*@editable*/ text-align:center;\
											/*@editable*/ vertical-align:middle;\
										}\
							\
										/**\
										* @tab Header\
										* @section header link\
										* @tip Set the styling for your email's header links. Choose a color that helps them stand out from your text.\
										*/\
										.headerContent a:link, .headerContent a:visited, /* Yahoo! Mail Override */ .headerContent a .yshortcuts /* Yahoo! Mail Override */{\
											/*@editable*/ color:#336699;\
											/*@editable*/ font-weight:normal;\
											/*@editable*/ text-decoration:underline;\
										}\
							\
										#headerImage{\
											height:auto;\
											max-width:600px !important;\
										}\
							\
										/* /\/\/\/\/\/\/\/\/\/\ STANDARD STYLING: MAIN BODY /\/\/\/\/\/\/\/\/\/\ */\
							\
										/**\
										* @tab Body\
										* @section body style\
										* @tip Set the background color for your email's body area.\
										*/\
										#templateContainer, .bodyContent{\
											/*@editable*/ background-color:#FFFFFF;\
										}\
							\
										/**\
										* @tab Body\
										* @section body text\
										* @tip Set the styling for your email's main content text. Choose a size and color that is easy to read.\
										* @theme main\
										*/\
										.bodyContent div{\
											/*@editable*/ color:#505050;\
											/*@editable*/ font-family:Arial;\
											/*@editable*/ font-size:14px;\
											/*@editable*/ line-height:150%;\
											/*@editable*/ text-align:left;\
										}\
							\
										/**\
										* @tab Body\
										* @section body link\
										* @tip Set the styling for your email's main content links. Choose a color that helps them stand out from your text.\
										*/\
										.bodyContent div a:link, .bodyContent div a:visited, /* Yahoo! Mail Override */ .bodyContent div a .yshortcuts /* Yahoo! Mail Override */{\
											/*@editable*/ color:#336699;\
											/*@editable*/ font-weight:normal;\
											/*@editable*/ text-decoration:underline;\
										}\
							\
										/**\
										* @tab Body\
										* @section button style\
										* @tip Set the styling for your email's button. Choose a style that draws attention.\
										*/\
										.templateButton{\
											-moz-border-radius:3px;\
											-webkit-border-radius:3px;\
											/*@editable*/ background-color:#336699;\
											/*@editable*/ border:0;\
											border-collapse:separate !important;\
											border-radius:3px;\
										}\
							\
										/**\
										* @tab Body\
										* @section button style\
										* @tip Set the styling for your email's button. Choose a style that draws attention.\
										*/\
										.templateButton, .templateButton a:link, .templateButton a:visited, /* Yahoo! Mail Override */ .templateButton a .yshortcuts /* Yahoo! Mail Override */{\
											/*@editable*/ color:#FFFFFF;\
											/*@editable*/ font-family:Arial;\
											/*@editable*/ font-size:15px;\
											/*@editable*/ font-weight:bold;\
											/*@editable*/ letter-spacing:-.5px;\
											/*@editable*/ line-height:100%;\
											text-align:center;\
											text-decoration:none;\
										}\
							\
										.bodyContent img{\
											display:inline;\
											height:auto;\
										}\
							\
										/* /\/\/\/\/\/\/\/\/\/\ STANDARD STYLING: FOOTER /\/\/\/\/\/\/\/\/\/\ */\
							\
										/**\
										* @tab Footer\
										* @section footer style\
										* @tip Set the background color and top border for your email's footer area.\
										* @theme footer\
										*/\
										#templateFooter{\
											/*@editable*/ background-color:#FFFFFF;\
											/*@editable*/ border-top:0;\
										}\
							\
										/**\
										* @tab Footer\
										* @section footer text\
										* @tip Set the styling for your email's footer text. Choose a size and color that is easy to read.\
										* @theme footer\
										*/\
										.footerContent div{\
											/*@editable*/ color:#707070;\
											/*@editable*/ font-family:Arial;\
											/*@editable*/ font-size:12px;\
											/*@editable*/ line-height:125%;\
											/*@editable*/ text-align:center;\
										}\
							\
										/**\
										* @tab Footer\
										* @section footer link\
										* @tip Set the styling for your email's footer links. Choose a color that helps them stand out from your text.\
										*/\
										.footerContent div a:link, .footerContent div a:visited, /* Yahoo! Mail Override */ .footerContent div a .yshortcuts /* Yahoo! Mail Override */{\
											/*@editable*/ color:#336699;\
											/*@editable*/ font-weight:normal;\
											/*@editable*/ text-decoration:underline;\
										}\
							\
										.footerContent img{\
											display:inline;\
										}\
							\
										/**\
										* @tab Footer\
										* @section utility bar style\
										* @tip Set the background color and border for your email's footer utility bar.\
										* @theme footer\
										*/\
										#utility{\
											/*@editable*/ background-color:#FFFFFF;\
											/*@editable*/ border:0;\
										}\
							\
										/**\
										* @tab Footer\
										* @section utility bar style\
										* @tip Set the background color and border for your email's footer utility bar.\
										*/\
										#utility div{\
											/*@editable*/ text-align:center;\
										}\
							\
										#monkeyRewards img{\
											max-width:190px;\
										}\
									</style>\
								</head>\
							    <body leftmargin=\"0\" marginwidth=\"0\" topmargin=\"0\" marginheight=\"0\" offset=\"0\">\
							    	<center>\
							        	<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" height=\"100%\" width=\"100%\" id=\"backgroundTable\">\
							            	<tr>\
							                	<td align=\"center\" valign=\"top\" style=\"padding-top:20px;\">\
							                    	<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"600\" id=\"templateContainer\">\
							                        	<tr>\
							                            	<td align=\"center\" valign=\"top\">\
							                                    <!-- // Begin Template Header \\ -->\
							                                	<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"600\" id=\"templateHeader\">\
							                                        <tr>\
							                                            <td class=\"headerContent\">\
							                                            	<!-- // Begin Module: Standard Header Image \\ -->\
							                                                <!-- // End Module: Standard Header Image \\ -->\
							                                            </td>\
							                                        </tr>\
							                                    </table>\
							                                    <!-- // End Template Header \\ -->\
							                                </td>\
							                            </tr>\
							                        	<tr>\
							                            	<td align=\"center\" valign=\"top\">\
							                                    <!-- // Begin Template Body \\ -->\
							                                	<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"600\" id=\"templateBody\">\
							                                    	<tr>\
							                                            <td valign=\"top\">\
							                                \
							                                                <!-- // Begin Module: Standard Content \\ -->\
							                                                <table border=\"0\" cellpadding=\"20\" cellspacing=\"0\" width=\"100%\">\
							                                                    <tr>\
							                                                        <td valign=\"top\" class=\"bodyContent\">\
							                                                            <div mc:edit=\"std_content00\">\
							                                                                <h1 class=\"h1\">neue Musik wartet auf dich...</h1>\
							                                                                <strong>Hey,</strong> <br /><br />\
							                                                                dein Freund <b>" + sender + "</b> hat im MusicCrawler den megacoolen weltklasse Track\
							                                                                <p align=\"center\"><b>" + thelinks[0].name + "</b></p>\
							                                                                mit hammer geiler Stelle gefunden und möchte, dass du ihn dir ansiehst.\
							                                                                <br />\
							                                                            </div>\
																					</td>\
							                                                    </tr>\
							                                                    <tr>\
							                                                    	<td align=\"center\" valign=\"top\" style=\"padding-top:0;\">\
							                                                        	<table width=\"65%\" border=\"0\" cellpadding=\"15\" cellspacing=\"0\" class=\"templateButton\">\
							                                                            	<tr>\
							                                                                	<td valign=\"middle\" class=\"templateButtonContent\">\
							                                                                    	<div mc:edit=\"std_content01\">\
							                                                                        	<a href=\"" + Meteor.absoluteUrl("link/" + thelinks[0]._id) + "\" target=\"_blank\">Link anzeigen</a>\
							                                                                        </div>\
							                                                                    </td>\
							                                                                </tr>\
							                                                            </table>\
							                                                        </td>\
							                                                    </tr>\
							                                                </table>\
							                                                <!-- // End Module: Standard Content \\ -->\
							                                                \
							                                            </td>\
							                                        </tr>\
							                                    </table>\
							                                    <!-- // End Template Body \\ -->\
							                                </td>\
							                            </tr>\
							                        	<tr>\
							                            	<td align=\"center\" valign=\"top\">\
							                                    <!-- // Begin Template Footer \\ -->\
							                                	<table border=\"0\" cellpadding=\"10\" cellspacing=\"0\" width=\"600\" id=\"templateFooter\">\
							                                    	<tr>\
							                                        	<td valign=\"top\" class=\"footerContent\">\
							                                                                 <div>\
							                                                                 Falls du den  <a href=\"" + Meteor.absoluteUrl() + "\" target=\"_blank\">MusicCrawler</a> noch nicht kennst, kein Problem: Du kannst dich ganz einfach mit deinem Facebook-Account kostenlos anmelden.\
							                                                                 </div>\
							                                            </td>\
							                                        </tr>\
							                                    </table>\
							                                    <!-- // End Template Footer \\ -->\
							                                </td>\
							                            </tr>\
							                        </table>\
							                        <br />\
							                    </td>\
							                </tr>\
							            </table>\
							        </center>\
							    </body>\
							</html>"
					});
				} catch (error) {
					winston.error("Fehler beim Senden einer Link-Freigabe-Benachrichtigung: " + error.details,{action:"shareLinks", object: error, title:"eMail senden fehlgeschlagen"})
					throw new Meteor.Error(500, "unerwarteter Fehler", "eMail konnte nicht gesendet werden: Server-Fehler");
				}
				return true;
			}
			var setid = Sets.insert({
				creator: Meteor.user().id,
				links: linkids,
				date_created: new Date()
			});
			if (setid) {
				var links_table_string = "";
				for (var i = 0; i < thelinks.length; i++) {
					var sizestring;
					var datestring;
					var sizeinMB = Math.round(thelinks[i].size / 1048576);
					if (Math.ceil(Math.log(sizeinMB + 1) / Math.LN10) > 3) {
						var sizeinGB = sizeinMB / 1024;
						sizestring = sizeinGB.toFixed(1).toString().replace(".", ",") + " GB";
					} else sizestring = sizeinMB + " MB";
					datestring = thelinks[i].date_published.getDate() + "." + (thelinks[i].date_published.getMonth() + 1) + "." + thelinks[i].date_published.getFullYear();
					links_table_string += "<tr mc:repeatable><td valign=\"top\" class=\"dataTableContent\" mc:edit=\"data_table_content00\">";
					links_table_string += thelinks[i].name;
					links_table_string += "</td><td valign=\"top\" class=\"dataTableContent\" mc:edit=\"data_table_content01\">";
					links_table_string += sizestring;
					links_table_string += "</td><td valign=\"top\" class=\"dataTableContent\" mc:edit=\"data_table_content02\">";
					links_table_string += datestring;
					links_table_string += "</td>";
				}
				try {
					Email.send({
						to: emailaddress,
						from: "info@musiccrawlerweb.de",
						subject: "MusicCrawler Links wurde für dich freigegeben",
						html: "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">\
												<html>\
												    <head>\
												        <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />\
												        \
												        <!-- Facebook sharing information tags -->\
												        <meta property=\"og:title\" content=\"MusicCrawler - Links freigegeben\" />\
												        \
												        <title>MusicCrawler - Links freigegeben</title>\
														<style type=\"text/css\">\
															/* Client-specific Styles */\
															#outlook a{padding:0;} /* Force Outlook to provide a \"view in browser\" button. */\
															body{width:100% !important;} .ReadMsgBody{width:100%;} .ExternalClass{width:100%;} /* Force Hotmail to display emails at full width */\
															body{-webkit-text-size-adjust:none;} /* Prevent Webkit platforms from changing default text sizes. */\
												\
															/* Reset Styles */\
															body{margin:0; padding:0;}\
															img{border:0; height:auto; line-height:100%; outline:none; text-decoration:none;}\
															table td{border-collapse:collapse;}\
															#backgroundTable{height:100% !important; margin:0; padding:0; width:100% !important;}\
												\
															/* Template Styles */\
												\
															/* /\/\/\/\/\/\/\/\/\/\ STANDARD STYLING: COMMON PAGE ELEMENTS /\/\/\/\/\/\/\/\/\/\ */\
												\
															/**\
															* @tab Page\
															* @section background color\
															* @tip Set the background color for your email. You may want to choose one that matches your company's branding.\
															* @theme page\
															*/\
															body, #backgroundTable{\
																/*@editable*/ background-color:#FAFAFA;\
															}\
												\
															/**\
															* @tab Page\
															* @section email border\
															* @tip Set the border for your email.\
															*/\
															#templateContainer{\
																/*@editable*/ border: 1px solid #DDDDDD;\
															}\
												\
															/**\
															* @tab Page\
															* @section heading 1\
															* @tip Set the styling for all first-level headings in your emails. These should be the largest of your headings.\
															* @style heading 1\
															*/\
															h1, .h1{\
																/*@editable*/ color:#202020;\
																display:block;\
																/*@editable*/ font-family:Arial;\
																/*@editable*/ font-size:34px;\
																/*@editable*/ font-weight:bold;\
																/*@editable*/ line-height:100%;\
																margin-top:0;\
																margin-right:0;\
																margin-bottom:10px;\
																margin-left:0;\
																/*@editable*/ text-align:left;\
															}\
												\
															/**\
															* @tab Page\
															* @section heading 2\
															* @tip Set the styling for all second-level headings in your emails.\
															* @style heading 2\
															*/\
															h2, .h2{\
																/*@editable*/ color:#202020;\
																display:block;\
																/*@editable*/ font-family:Arial;\
																/*@editable*/ font-size:30px;\
																/*@editable*/ font-weight:bold;\
																/*@editable*/ line-height:100%;\
																margin-top:0;\
																margin-right:0;\
																margin-bottom:10px;\
																margin-left:0;\
																/*@editable*/ text-align:left;\
															}\
												\
															/**\
															* @tab Page\
															* @section heading 3\
															* @tip Set the styling for all third-level headings in your emails.\
															* @style heading 3\
															*/\
															h3, .h3{\
																/*@editable*/ color:#202020;\
																display:block;\
																/*@editable*/ font-family:Arial;\
																/*@editable*/ font-size:26px;\
																/*@editable*/ font-weight:bold;\
																/*@editable*/ line-height:100%;\
																margin-top:0;\
																margin-right:0;\
																margin-bottom:10px;\
																margin-left:0;\
																/*@editable*/ text-align:left;\
															}\
												\
															/**\
															* @tab Page\
															* @section heading 4\
															* @tip Set the styling for all fourth-level headings in your emails. These should be the smallest of your headings.\
															* @style heading 4\
															*/\
															h4, .h4{\
																/*@editable*/ color:#202020;\
																display:block;\
																/*@editable*/ font-family:Arial;\
																/*@editable*/ font-size:22px;\
																/*@editable*/ font-weight:bold;\
																/*@editable*/ line-height:100%;\
																margin-top:0;\
																margin-right:0;\
																margin-bottom:10px;\
																margin-left:0;\
																/*@editable*/ text-align:left;\
															}\
												\
															/* /\/\/\/\/\/\/\/\/\/\ STANDARD STYLING: HEADER /\/\/\/\/\/\/\/\/\/\ */\
												\
															/**\
															* @tab Header\
															* @section header style\
															* @tip Set the background color and border for your email's header area.\
															* @theme header\
															*/\
															#templateHeader{\
																/*@editable*/ background-color:#FFFFFF;\
																/*@editable*/ border-bottom:0;\
															}\
												\
															/**\
															* @tab Header\
															* @section header text\
															* @tip Set the styling for your email's header text. Choose a size and color that is easy to read.\
															*/\
															.headerContent{\
																/*@editable*/ color:#202020;\
																/*@editable*/ font-family:Arial;\
																/*@editable*/ font-size:34px;\
																/*@editable*/ font-weight:bold;\
																/*@editable*/ line-height:100%;\
																/*@editable*/ padding:0;\
																/*@editable*/ text-align:center;\
																/*@editable*/ vertical-align:middle;\
															}\
												\
															/**\
															* @tab Header\
															* @section header link\
															* @tip Set the styling for your email's header links. Choose a color that helps them stand out from your text.\
															*/\
															.headerContent a:link, .headerContent a:visited, /* Yahoo! Mail Override */ .headerContent a .yshortcuts /* Yahoo! Mail Override */{\
																/*@editable*/ color:#336699;\
																/*@editable*/ font-weight:normal;\
																/*@editable*/ text-decoration:underline;\
															}\
												\
															#headerImage{\
																height:auto;\
																max-width:600px !important;\
															}\
												\
															/* /\/\/\/\/\/\/\/\/\/\ STANDARD STYLING: MAIN BODY /\/\/\/\/\/\/\/\/\/\ */\
												\
															/**\
															* @tab Body\
															* @section body style\
															* @tip Set the background color for your email's body area.\
															*/\
															#templateContainer, .bodyContent{\
																/*@editable*/ background-color:#FFFFFF;\
															}\
												\
															/**\
															* @tab Body\
															* @section body text\
															* @tip Set the styling for your email's main content text. Choose a size and color that is easy to read.\
															* @theme main\
															*/\
															.bodyContent div{\
																/*@editable*/ color:#505050;\
																/*@editable*/ font-family:Arial;\
																/*@editable*/ font-size:14px;\
																/*@editable*/ line-height:150%;\
																/*@editable*/ text-align:left;\
															}\
												\
															/**\
															* @tab Body\
															* @section body link\
															* @tip Set the styling for your email's main content links. Choose a color that helps them stand out from your text.\
															*/\
															.bodyContent div a:link, .bodyContent div a:visited, /* Yahoo! Mail Override */ .bodyContent div a .yshortcuts /* Yahoo! Mail Override */{\
																/*@editable*/ color:#336699;\
																/*@editable*/ font-weight:normal;\
																/*@editable*/ text-decoration:underline;\
															}\
												\
															/**\
															* @tab Body\
															* @section data table style\
															* @tip Set the background color and border for your email's data table.\
															*/\
															.templateDataTable{\
																/*@editable*/ background-color:#FFFFFF;\
																/*@editable*/ border:1px solid #DDDDDD;\
															}\
															\
															/**\
															* @tab Body\
															* @section data table heading text\
															* @tip Set the styling for your email's data table text. Choose a size and color that is easy to read.\
															*/\
															.dataTableHeading{\
																/*@editable*/ background-color:#D8E2EA;\
																/*@editable*/ color:#336699;\
																/*@editable*/ font-family:Helvetica;\
																/*@editable*/ font-size:14px;\
																/*@editable*/ font-weight:bold;\
																/*@editable*/ line-height:150%;\
																/*@editable*/ text-align:left;\
															}\
														\
															/**\
															* @tab Body\
															* @section data table heading link\
															* @tip Set the styling for your email's data table links. Choose a color that helps them stand out from your text.\
															*/\
															.dataTableHeading a:link, .dataTableHeading a:visited, /* Yahoo! Mail Override */ .dataTableHeading a .yshortcuts /* Yahoo! Mail Override */{\
																/*@editable*/ color:#FFFFFF;\
																/*@editable*/ font-weight:bold;\
																/*@editable*/ text-decoration:underline;\
															}\
															\
															/**\
															* @tab Body\
															* @section data table text\
															* @tip Set the styling for your email's data table text. Choose a size and color that is easy to read.\
															*/\
															.dataTableContent{\
																/*@editable*/ border-top:1px solid #DDDDDD;\
																/*@editable*/ border-bottom:0;\
																/*@editable*/ color:#202020;\
																/*@editable*/ font-family:Helvetica;\
																/*@editable*/ font-size:12px;\
																/*@editable*/ font-weight:bold;\
																/*@editable*/ line-height:150%;\
																/*@editable*/ text-align:left;\
															}\
														\
															/**\
															* @tab Body\
															* @section data table link\
															* @tip Set the styling for your email's data table links. Choose a color that helps them stand out from your text.\
															*/\
															.dataTableContent a:link, .dataTableContent a:visited, /* Yahoo! Mail Override */ .dataTableContent a .yshortcuts /* Yahoo! Mail Override */{\
																/*@editable*/ color:#202020;\
																/*@editable*/ font-weight:bold;\
																/*@editable*/ text-decoration:underline;\
															}\
												\
															/**\
															* @tab Body\
															* @section button style\
															* @tip Set the styling for your email's button. Choose a style that draws attention.\
															*/\
															.templateButton{\
																-moz-border-radius:3px;\
																-webkit-border-radius:3px;\
																/*@editable*/ background-color:#336699;\
																/*@editable*/ border:0;\
																border-collapse:separate !important;\
																border-radius:3px;\
															}\
												\
															/**\
															* @tab Body\
															* @section button style\
															* @tip Set the styling for your email's button. Choose a style that draws attention.\
															*/\
															.templateButton, .templateButton a:link, .templateButton a:visited, /* Yahoo! Mail Override */ .templateButton a .yshortcuts /* Yahoo! Mail Override */{\
																/*@editable*/ color:#FFFFFF;\
																/*@editable*/ font-family:Arial;\
																/*@editable*/ font-size:15px;\
																/*@editable*/ font-weight:bold;\
																/*@editable*/ letter-spacing:-.5px;\
																/*@editable*/ line-height:100%;\
																text-align:center;\
																text-decoration:none;\
															}\
												\
															.bodyContent img{\
																display:inline;\
																height:auto;\
															}\
												\
															/* /\/\/\/\/\/\/\/\/\/\ STANDARD STYLING: FOOTER /\/\/\/\/\/\/\/\/\/\ */\
												\
															/**\
															* @tab Footer\
															* @section footer style\
															* @tip Set the background color and top border for your email's footer area.\
															* @theme footer\
															*/\
															#templateFooter{\
																/*@editable*/ background-color:#FFFFFF;\
																/*@editable*/ border-top:0;\
															}\
												\
															/**\
															* @tab Footer\
															* @section footer text\
															* @tip Set the styling for your email's footer text. Choose a size and color that is easy to read.\
															* @theme footer\
															*/\
															.footerContent div{\
																/*@editable*/ color:#707070;\
																/*@editable*/ font-family:Arial;\
																/*@editable*/ font-size:12px;\
																/*@editable*/ line-height:125%;\
																/*@editable*/ text-align:center;\
															}\
												\
															/**\
															* @tab Footer\
															* @section footer link\
															* @tip Set the styling for your email's footer links. Choose a color that helps them stand out from your text.\
															*/\
															.footerContent div a:link, .footerContent div a:visited, /* Yahoo! Mail Override */ .footerContent div a .yshortcuts /* Yahoo! Mail Override */{\
																/*@editable*/ color:#336699;\
																/*@editable*/ font-weight:normal;\
																/*@editable*/ text-decoration:underline;\
															}\
												\
															.footerContent img{\
																display:inline;\
															}\
												\
															/**\
															* @tab Footer\
															* @section utility bar style\
															* @tip Set the background color and border for your email's footer utility bar.\
															* @theme footer\
															*/\
															#utility{\
																/*@editable*/ background-color:#FFFFFF;\
																/*@editable*/ border:0;\
															}\
												\
															/**\
															* @tab Footer\
															* @section utility bar style\
															* @tip Set the background color and border for your email's footer utility bar.\
															*/\
															#utility div{\
																/*@editable*/ text-align:center;\
															}\
												\
															#monkeyRewards img{\
																max-width:190px;\
															}\
														</style>\
													</head>\
												    <body leftmargin=\"0\" marginwidth=\"0\" topmargin=\"0\" marginheight=\"0\" offset=\"0\">\
												    	<center>\
												        	<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" height=\"100%\" width=\"100%\" id=\"backgroundTable\">\
												            	<tr>\
												                	<td align=\"center\" valign=\"top\" style=\"padding-top:20px;\">\
												                    	<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"600\" id=\"templateContainer\">\
												                        	<tr>\
												                            	<td align=\"center\" valign=\"top\">\
												                                    <!-- // Begin Template Header \\ -->\
												                                	<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"600\" id=\"templateHeader\">\
												                                        <tr>\
												                                            <td class=\"headerContent\">\
												                                            \
												                                            	<!-- // Begin Module: Standard Header Image \\ -->\
												                                            	<!-- // End Module: Standard Header Image \\ -->\
												                                            \
												                                            </td>\
												                                        </tr>\
												                                    </table>\
												                                    <!-- // End Template Header \\ -->\
												                                </td>\
												                            </tr>\
												                        	<tr>\
												                            	<td align=\"center\" valign=\"top\">\
												                                    <!-- // Begin Template Body \\ -->\
												                                	<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"600\" id=\"templateBody\">\
												                                    	<tr>\
												                                            <td valign=\"top\">\
												                                \
												                                                <!-- // Begin Module: Standard Content \\ -->\
												                                                <table border=\"0\" cellpadding=\"20\" cellspacing=\"0\" width=\"100%\">\
												                                                    <tr>\
												                                                        <td valign=\"top\" class=\"bodyContent\">\
												                                                            <div mc:edit=\"std_content00\">\
																												<h1 class=\"h1\">neue Musik wartet auf dich...</h1>\
																												<strong>Hey,</strong> <br /><br />\
																												dein Freund <b>" + sender + "</b> hat im MusicCrawler ein paar megacoole Tracks zusammengestellt, die du dir unbedingt anhören solltest.\
																												<br />\
												                                                            </div>\
																										</td>\
												                                                    </tr>\
												                                                    <tr>\
												                                                    	<td valign=\"top\" style=\"padding-top:0; padding-bottom:0;\">\
												                                                          <table border=\"0\" cellpadding=\"10\" cellspacing=\"0\" width=\"100%\" class=\"templateDataTable\">\
												                                                              <tr>\
												                                                                  <th scope=\"col\" valign=\"top\" width=\"65%\" class=\"dataTableHeading\" mc:edit=\"data_table_heading00\">\
												                                                                    Titel\
												                                                                  </th>\
												                                                                  <th scope=\"col\" valign=\"top\" width=\"10%\" class=\"dataTableHeading\" mc:edit=\"data_table_heading01\">\
												                                                                    Größe\
												                                                                  </th>\
												                                                                  <th scope=\"col\" valign=\"top\" width=\"25%\" class=\"dataTableHeading\" mc:edit=\"data_table_heading02\">\
												                                                                    Veröffentlicht\
												                                                                  </th>\
												                                                              </tr>" + links_table_string + "</tr>\
												                                                          </table>\
												                                                        </td>\
												                                                    </tr>\
												                                                    <tr>\
												                                                        <td valign=\"top\" class=\"bodyContent\">\
																										</td>\
												                                                    </tr>\
												                                                    <tr>\
												                                                    	<td align=\"center\" valign=\"top\" style=\"padding-top:0;\">\
												                                                        	<table width=\"65%\" border=\"0\" cellpadding=\"15\" cellspacing=\"0\" class=\"templateButton\">\
												                                                            	<tr>\
												                                                                	<td valign=\"middle\" class=\"templateButtonContent\">\
												                                                                    	<div mc:edit=\"std_content01\">\
												                                                                    		<a href=\"" + Meteor.absoluteUrl("set/" + setid) + "\" target=\"_blank\">Links anzeigen</a>\
												                                                                    	</div>\
												                                                                    </td>\
												                                                                </tr>\
												                                                            </table>\
												                                                        </td>\
												                                                    </tr>\
												                                                </table>\
												                                                <!-- // End Module: Standard Content \\ -->\
												                                                \
												                                            </td>\
												                                        </tr>\
												                                    </table>\
												                                    <!-- // End Template Body \\ -->\
												                                </td>\
												                            </tr>\
												                        	<tr>\
												                            	<td align=\"center\" valign=\"top\">\
												                                    <!-- // Begin Template Footer \\ -->\
												                                	<table border=\"0\" cellpadding=\"10\" cellspacing=\"0\" width=\"600\" id=\"templateFooter\">\
												                                    	<tr>\
												                                        	<td valign=\"top\" class=\"footerContent\">\
													                                            <div>\
													                                            Falls du den  <a href=\"" + Meteor.absoluteUrl() + "\" target=\"_blank\">MusicCrawler</a> noch nicht kennst, kein Problem: Du kannst dich ganz einfach mit deinem Facebook-Account kostenlos anmelden.\
													                                            </div>\
												                                            </td>\
												                                        </tr>\
												                                    </table>\
												                                    <!-- // End Template Footer \\ -->\
												                                </td>\
												                            </tr>\
												                        </table>\
												                        <br />\
												                    </td>\
												                </tr>\
												            </table>\
												        </center>\
												    </body>\
												</html>"
					});
				} catch (error) {
					winston.error("Fehler beim Senden einer Link-Freigabe-Benachrichtigung: " + error.details,{action:"shareLinks", object: error, title:"eMail senden fehlgeschlagen"})
					throw new Meteor.Error(500, "unerwarteter Fehler", "eMail konnte nicht gesendet werden: Server-Fehler");
				}
				return true;
			}
			throw new Meteor.Error(500, "unerwarteter Fehler", "eMail konnte nicht gesendet werden: Set konnte nicht erstellt werden");
		}
		throw new Meteor.Error(500, "unerwarteter Fehler", "eMail konnte nicht gesendet werden: Server-Fehler");
	}
});