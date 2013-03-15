//Methoden, die auf dem Server aufgerufen werden können
Meteor.methods({
	markLinksAsDownloadedById: function(sel_links) {
	
		if (this.isSimulation)
		{
			query = {
						_id: {
								'$in': sel_links
							}
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
		}
		
		query = {
				_id: {
					'$in': sel_links
				}
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
	markLinksAsDownloadedByURL: function(sel_links) {
	
		if (this.isSimulation)
		{
			query = {
						url: {
								'$in': sel_links
							}
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
		}
		
		query = {
				url: {
					'$in': sel_links
				}
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
	getSuggestionsForSearchTerm: function(searchterm) {
		//XXX wenn Meteor $-Projections kann, hier umbauen
		var searchterms = searchterm.trim().split(" ");
		
		for (var i = 0; i < searchterms.length; i++) {
			searchterms[i] = new RegExp(searchterms[i],"i");
		}
		
		var ret = Links.find({keywords: {$all: searchterms}},{limit:5,fields:{_id:-1,name:1}}).fetch();		
		return _.uniq(_.map(_.pluck(ret,'name'),function(text){if (text.length > 45) return text.substr(0,44);return text;}));
	},
	updateLinkContributionCount: function() {
		if (Meteor.user())
		{
			var contribcount = Links.find({creator: Meteor.user().id}).count();
			Meteor.users.update({_id: Meteor.userId()},{$set : {"profile.linkcontributioncount" : contribcount}});
		}	
	},
	updateFacebookGroupName: function(groupid) {
		if (this.isSimulation)
			return undefined;
		
		if (Meteor.user() && Meteor.user().services.facebook)
		{
			Meteor.http.call("GET", "https://graph.facebook.com/" + groupid + "/?fields=name&access_token=" + Meteor.user().services.facebook.accessToken,
			function (error, result) {
				if (error) console.log("Error getting Groupname: " + error);
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
	},
	removeFacebookTokensForUser: function() {
		Sites.update({
			creator : Meteor.user().id,
			type : "facebook-group"
			}, {
			$set: {
				active: false,
				accesstoken: null
				}
			}, {
			multi: true
		});	
	},
	updateFacebookTokensForUser: function() {
		if (Meteor.user() && Meteor.user().services && Meteor.user().services.facebook) {			
			if (new Date(Meteor.user().services.facebook.expiresAt) > new Date()) Sites.update({
				creator: Meteor.user().id,
				type: "facebook-group"
			}, {
				$set: {
					accesstoken: Meteor.user().services.facebook.accessToken,
					active: true
				}
			},{multi: true});
			else Sites.update({
				creator: Meteor.user().id,
				type: "facebook-group"
			}, {
				$set: {
					accesstoken: null,
					active: false
				}
			},{multi: true});
		}
	},
	searchMuzon: function (searchterm) {
		if (this.isSimulation) {
			return undefined;
		}
		
		this.unblock;
		var result = Meteor.http.get("http://muzon.ws/music/" + searchterm, {
			timeout: 5000
		});
		if (result && result.statusCode === 200) {
            var require = __meteor_bootstrap__.require;
            var Iconv = require('iconv').Iconv;
            var iconv2 = new Iconv('utf-8', 'latin1//IGNORE');
            var iconv1 = new Iconv('cp1251', 'utf-8//IGNORE');
            
            return iconv2.convert(new Buffer(iconv1.convert(new Buffer(result.content)).toString())).toString();
		}
		throw new Meteor.Error(result.statusCode, result.content);		
	},
	sendLinks: function (requeststring) {
		if (this.isSimulation) {
			return true;
		}
		this.unblock();
		var result = Meteor.http.get(requeststring, {
			timeout: 4000
		});
		if (result && result.content && result.statusCode === 200 && result.content.indexOf("Link(s) added") != -1) return true;
		throw new Meteor.Error(result.statusCode, result.content);
		return false;
	},
	checkJDOnlineStatus: function (options) {
		if (this.isSimulation) {
			return true;
		}
		this.unblock();
		var result = Meteor.http.get("http://" + options['ip'] + ":" + options['port'] + "/get/version", {
			timeout: 4000
		});
		if (result.statusCode === 200 && result.content === "JDownloader") return true;
		return false;
	},
	//TODO nochmal testen, dass hier wirklich keine Infos gelöscht werden
	refreshLink: function (linkid) {
		if (this.isSimulation) {
			return undefined;
		}

		var alink = Links.findOne({
			_id: linkid
		});

		this.unblock();
		
		if (alink)
		{
			var result = Meteor.http.post("http://" + Meteor.settings.linkbuilder.host + ":" + Meteor.settings.linkbuilder.port + "/musiccrawler/checkmusicdownloadlink", {
				data: {
					url: alink.url,
					source: alink.source
				},
				timeout: 30000
			});
	
			if (result && result.statusCode === 200) {
				if (result.content) {
					var freshlink = result.data;
					
					if (freshlink) {
						if (freshlink.name && freshlink.name.indexOf("file") === -1)
							newname = freshlink.name;
						else
							newname = alink.name;
							
						if (freshlink.size != undefined)
							newsize = freshlink.size;
						else
							newsize = alink.size;
						
						if (freshlink.status && freshlink.status != "" && freshlink.status != "unknown")
							newstatus = freshlink.status;
						else
							newstatus = alink.status;
							
						if (freshlink.hoster && freshlink.hoster != "")
							newhoster = freshlink.hoster;
						else
							newhoster = alink.hoster;
					
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
					throw new Meteor.Error(result.statusCode, "Fehler bei der Serverkommunikation", "Fehler beim aktualisieren des Links " + alink.url + " : ungültige Antwort vom Server");
				}
				throw new Meteor.Error(result.statusCode, "Fehler bei der Serverkommunikation", "Fehler beim aktualisieren des Links " + alink.url + " : ungültige Antwort vom Server");
			}
			throw new Meteor.Error(result.statusCode, "Server antwortet nicht", "Fehler beim aktualisieren des Links " + alink.url + " : keine Antwort vom Server");			
		}
		throw new Meteor.Error(404, "Link nicht gefunden", "Fehler beim aktualisieren des Links " + alink.url + " : Link nicht in der Datenbank gefunden");	
	},

	createLink: function (linkurl, stream_url) {
	
		this.unblock();

		if (this.isSimulation) {
			return undefined;
		}
		
		if (!(linkurl.indexOf("http") === 0))
			throw new Meteor.Error(400,"fehlerhafte Adresse", "Die angegebene Adresse " + linkurl + " ist keine gültige Adresse.");
		
		cleanlinkurl = linkurl.replace(/\/$/, "");

		if (Links.findOne({
			url: cleanlinkurl
		}) != undefined) throw new Meteor.Error(409, "Link bereits vorhanden",
			"Der Link " + linkurl + " ist bereits im System vorhanden");

		var userid = Meteor.user().id;

		var result = Meteor.http.post("http://" + Meteor.settings.linkbuilder.host + ":" + Meteor.settings.linkbuilder.port + "/musiccrawler/checkmusicdownloadlink", {
			data: {
				url: cleanlinkurl,
				source: userid,
				creator: userid
			},
			timeout: 30000
		});

		if (result && result.statusCode === 200) {
			if (result.content) {
				var freshlink = result.data;
				
				if (freshlink.status == "off")
					 throw new Meteor.Error(404, "Link ist offline",
						"Der Link " + linkurl + " ist offline und kann daher von niemandem heruntergeladen werden. Der Link wird deshalb nicht in die Sammlung aufgenommen.");
						
				if (freshlink.name && freshlink.size != undefined && freshlink.status && freshlink.source) {
					if (Links.findOne({
						url: freshlink.url
					}) != undefined) throw new Meteor.Error(409, "Link bereits vorhanden",
						"Der Link " + linkurl + " ist bereits im System vorhanden");

					freshlink.creator = freshlink.source;
					freshlink.date_discovered = new Date();
					freshlink.date_published = new Date();
					
					if (stream_url)
						freshlink.stream_url = stream_url;
					
					if (freshlink.url.indexOf("muzon.ws" !== -1))
						freshlink.hoster = "muzon.ws";
					
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

		resiteurl = ".*" + siteurl.replace(/\/$/, "").replace("www.", "")
			.replace(/\//g, "\\/") + ".*";
		
		if (Sites.findOne({
			url: {
				$regex: resiteurl,
				$options: 'i'
			}
		}) != undefined) {
			throw new Meteor.Error(409, "Seite bereits vorhanden",
				"Die Seite " + siteurl + " ist bereits im System vorhanden");
		}
		
		if (siteurl.indexOf("facebook.com/groups/") !== -1) {			
			var newSite = new Object();

			newSite.name = siteurl.replace("http://", "").replace("https://", "").replace(
				"www.", "");
			newSite.feedurl = resiteurl.replace(/\.\*/g, "")
				.replace(/\\/g, "");
			newSite.url = resiteurl.replace(/\.\*/g, "").replace(
				/\\/g, "");

			newSite.creator = Meteor.user().id;
			newSite.active = false;
			newSite.last_crawled = null;
			newSite.type = "facebook-group";
			newSite.date_created = new Date();
			newSite.accesstoken = null;
			newSite.groupid = siteurl.split("groups/")[1].split("/")[0];
			
			if (newSite.groupid && newSite.groupid != "")
			{
				var ok = Sites.insert(newSite);
				if (ok)
				{
					var result = Meteor.http.get("https://graph.facebook.com/" + Meteor.user().id + "/permissions?access_token=" + Meteor.user().services.facebook.accessToken, {timeout: 4000});
							
					if (result && result.statusCode === 200)
					{
						if (result.data && result.data.data[0] && result.data.data[0].user_groups === 1)
						{
							Sites.update({_id: ok},{$set: {active : true}});
							return ok;
						}
						throw new Meteor.Error(
							401,
							"Zugriffsschlüssel erforderlich",
							"Um die Facebook Gruppe " + siteurl + " zu durchsuchen wird Zugriff auf deine Gruppen benötigt. Du wirst jetzt aufgefordert, den Zugriff zu gewähren.");
					}
				}
				throw new Meteor.Error(500,"unbekannter Fehler", "Die Facebook Gruppe " + siteurl + "konnte nicht hinzugefügt werden (Grund: unbekannt).");
			}
			throw new Meteor.Error(
				406,
					"ungültige Gruppen-ID",
					"Die URL " + siteurl + " enthält keine gültige Facebook Gruppen ID. Bitte gebe die Gruppen URL in folgender Form an: https://facebook.com/groups/1234567890");
		}
		
		var refeedurl = /<link.*type\s*=\s*"application\/rss\+xml".*href\s*=\s*"?([^" >]+)[" >]/i;
		
		if (!(siteurl.indexOf("http") === 0))
			throw new Meteor.Error(400,"fehlerhafte Adresse", "Die angegebene Adresse " + siteurl + " ist keine gültige Adresse.");
		
		var result2 = Meteor.http.get("https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=1&output=json&q=" + siteurl);
			
		if (result2 && result2.statusCode === 200 && result2.data)
		{
			if (result2.data.responseStatus === 200)
			{
				renewfeedurl = ".*" + result2.data.responseData.feed.feedUrl.replace(/\/$/, "").replace("www.", "").replace(/\//g, "\\/") + ".*";
			
				if (Sites.findOne({
					feedurl: {
						$regex: renewfeedurl,
						$options: 'i'
					}
				}) != undefined) {
					throw new Meteor.Error(409, "Seite bereits vorhanden",
						"Die Seite " + siteurl + " ist bereits im System vorhanden");
				}
			
				var newSite = new Object();
				newSite.name = result2.data.responseData.feed.title;
				newSite.feedurl = result2.data.responseData.feed.feedUrl.replace("www","");
				newSite.url = result2.data.responseData.feed.link.replace("www","");

				newSite.creator = Meteor.user().id;
				newSite.active = true;
				newSite.last_crawled = null;
				newSite.type = "feed";
				newSite.date_created = new Date();

				return Sites.insert(newSite);						
			}
		}
		
		var result = Meteor.http.get(siteurl, {
			timeout: 8000
		});
		
		if (result && result.statusCode === 200) {

			var m = refeedurl.exec(result.content);

			if (m == null) {
				var newSite = new Object();
				newSite.name = siteurl.replace("http://", "").replace("https://", "").replace(
					"www.", "");
				newSite.feedurl = resiteurl.replace(/\.\*/g, "")
					.replace(/\\/g, "");
				newSite.url = resiteurl.replace(/\.\*/g, "").replace(
					/\\/g, "");

				newSite.creator = Meteor.user().id;
				newSite.active = false;
				newSite.last_crawled = null;
				newSite.type = "unknown";
				newSite.date_created = new Date();

				
				var ok = Sites.insert(newSite);
				
				if (ok)
				{
					//TODO eMail-Server einrichten
					try {
						Email.send({
							to: "thimo.brinkmann@googlemail.com",
							from: "info@meteormusiccrawler.de",
							subject: "neue Seite im MusicCrawler",
							text: escape("Es wurde eine neue Seite zum MusicCrawler hinzugefügt (_id: '" + ok + "').\nDie Seite hat keinen RSS-Feed und muss daher manuell geprüft werden.\nDie Adresse lautet:" + newSite.url)
						});
					}
					catch(error) {
						console.log("Error sending eMail: " + error.details);
					}
					throw new Meteor.Error(
					415,
					"unbekannter Seitentyp",
					"Für die Seite " + siteurl + " konnte kein RSS-Feed gefunden werden. Die Seite wird manuell überprüft und dann durchsucht.");
				}
				throw new Meteor.Error(500,"unbekannter Fehler","Die Seite " + siteurl + " konnte nicht hinzugefügt werden (Grund: unbekannt)");
			}
			var newfeedurl = m[m.length - 1];

			renewfeedurl = ".*" + newfeedurl.replace(/\/$/, "").replace("www.", "")
				.replace(/\//g, "\\/") + ".*";

			if (Sites.findOne({
				feedurl: {
					$regex: renewfeedurl,
					$options: 'i'
				}
			}) != undefined) {
				throw new Meteor.Error(409, "Seite bereits vorhanden",
					"Die Seite " + siteurl + " ist bereits im System vorhanden");
			}
			var newSite = new Object();

			newSite.name = siteurl.replace("http://", "").replace("https://", "").replace(
				"www.", "");
			newSite.feedurl = renewfeedurl.replace(/\.\*/g, "")
				.replace(/\\/g, "");
			newSite.url = resiteurl.replace(/\.\*/g, "").replace(/\\/g,
				"");
			newSite.creator = Meteor.user().id;
			newSite.active = true;
			newSite.last_crawled = null;
			newSite.type = "feed";
			newSite.date_created = new Date();

			scheduleCrawl(newSite.feedurl);

			return Sites.insert(newSite);
		}
		throw new Meteor.Error(404,
			"Seite konnte nicht geladen werden", "Die Seite " + siteurl + " konnte nicht geladen werden.");
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

	getLinksCount: function (timespan) {
		if (this.isSimulation) {
			return 0;
		}
				
		var acount = Links.find({
			date_published: {
				$gte: timespan
			},
			status: "on",
			downloaders: {
				'$ne': Meteor.userId()
			}
		}).count(false);
		
		return acount;
	},

	scheduleCrawl: function (asiteId) {
		if (this.isSimulation) {
			return undefined;
		}

		var site = Sites.findOne({
			_id: asiteId
		});
		
		if (site) {
			this.unblock();

			if ((Meteor.user().admin === true) || (site.creator = Meteor.user().id)) {
				if (site.type == 'feed')
					spidertype = "feedspider";
				if (site.type == 'facebook-group')
					spidertype = "facebookgroupspider";
			
				var result = Meteor.http.post("http://" + Meteor.settings.crawler.host + ":" + Meteor.settings.crawler.port + "/schedule.json", {
					params: {
						project: "musiccrawler",
						spider: spidertype,
						feedurl: site.feedurl
					},
					timeout: 3000
				});

				if (result && result.statusCode === 200) {
					var content = result.data;

					if (content.status == "error") throw new Meteor.Error(500, "unerwarteter Fehler", content.message);
					return result;
				}
				throw new Meteor.Error(500, "unerwarteter Fehler", "Der Crawl-Lauf konnte nicht erstellt werden.");
			}
			throw new Meteor.Error(401, "keine Berechtigung", "Der Crawl-Lauf konnte nicht erstellt werden, da du keine Berechtigung dazu hast.");
		}
		throw new Meteor.Error(404, "Seite nicht gefunden", "Der Crawl-Lauf konnte nicht erstellt werden, da die Seite nicht gefunden wurde.");
	},

	cancelCrawl: function (asiteId) {
		if (this.isSimulation) {
			return undefined;
		}

		if (Meteor.user().admin === true) {
			this.unblock();

			var site = Sites.findOne({
				_id: asiteId
			});

			if (site) {
			
				if (site.next_crawl && site.next_crawl != null)
				{
					var result = Meteor.http.post("http://" + Meteor.settings.crawler.host + ":" + Meteor.settings.crawler.port + "/cancel.json", {
						params: {
							project: "musiccrawler",
							job: site.next_crawl
						},
						timeout: 3000
					});

					if (result && result.statusCode === 200) {
						var content = result.data;

						if (content.status == "error") throw new Meteor.Error(500, "unerwarteter Fehler", content.message);
						return result;
					}
					throw new Meteor.Error(500, "unerwarteter Fehler", "Der Crawl-Lauf konnte nicht gestoppt werden.");
				}
				throw new Meteor.Error(417, "geplanter Job erwartet", "Der Crawl-Lauf konnte nicht gestoppt werden, da kein Crawl-Lauf für diese Seite geplant ist.");
			}
			throw new Meteor.Error(404, "Seite nicht gefunden", "Der Crawl-Lauf konnte nicht gestoppt werden, da die Seite nicht gefunden wurde.");
		}
		throw new Meteor.Error(401, "keine Berechtigung", "Der Crawl-Lauf konnte nicht gestoppt werden, da du keine Berechtigung dazu hast.");
	}
});