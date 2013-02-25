//Session Variablen initialisieren
Session.setDefault("wait_for_items", false);
Session.setDefault("sites_completed", false);
Session.setDefault("links_completed", false);
Session.setDefault('users_completed', false);
Session.setDefault("status", undefined);
Session.setDefault("showAccountSettingsDialog", false);

var tmp_date = new Date();
tmp_date.setDate(tmp_date.getDate() - 14);
Session.setDefault("selected_navitem", 14);
Session.setDefault("filter_date", tmp_date);
Session.setDefault("filter_status", ["on"]);
Session.setDefault("filter_term", ".*");
Session.setDefault("filter_limit", 1);
Session.setDefault("selected_links", []);
Session.setDefault("loading_results", true);

[1, 14, 30, 90, 365].forEach(function (timespan) {
	Session.setDefault("links_count_" + timespan, 0);
});

//lokale Collection für Suchergebnisse, damit wir auch diese mit reactivity anzeigen können.
SearchResults = new Meteor.Collection(null);
// Automatische subscription für alle wichtigen Collections: Links, Sites, und Counts
Meteor.autorun(function () {
	var filter_date = Session.get('filter_date');
	var filter_status = Session.get('filter_status');
	var filter_term = Session.get('filter_term');
	var filter_limit = Session.get('filter_limit');
	var loading_results = Session.get('loading_results');
	
	if (filter_date && filter_status && filter_limit) {
		Meteor.subscribe('sites', function onReady() {
			// set a session key to true to indicate that the subscription is
			// completed.
			Session.set('sites_completed', true);
		});

		Meteor.subscribe('links', filter_date, filter_status, filter_term, filter_limit, function onReady() {
			// set a session key to true to indicate that the
			// subscription is completed.
			Session.set('links_completed', true);
			Session.set('loading_results', false);
		});
	}

	Meteor.subscribe('userData');
	Meteor.subscribe('allUserData', function onReady() {
		Session.set('users_completed', true);
	});
	
	var timespans = [1, 14, 30, 90, 365];
	
	timespans.forEach(function (timespan) {
		var tmp_date = new Date();
		tmp_date.setDate(tmp_date.getDate() - timespan);
		Meteor.call("getLinksCount", tmp_date, function (error, count) {
			Session.set("links_count_" + timespan, count);
		});
	});
});
//
// Startup-Funktion
//
// Startup-Eventhandler: wird aufgerufen, wenn der Client bzw. Server
// vollständig gestartet ist
// leider funktioniert das noch nicht ganz, das Meteor.user() Objekt steht dann
// noch nicht immer
// zur Verfügung. Workaround: Timer auf 3 Sekunden, dann ist das Objekt im
// Regelfall verfügbar.
Meteor.startup(function () {
	$.fn.editable.defaults.validate = function(value) {
		if($.trim(value) == '') {
		     return 'Name darf nicht leer sein.';
		 }
	};
	$(document).ready(function () {
		bottomMargin = 49;
		itemHeight = 30;
		threshold = 10 * itemHeight + bottomMargin;
		$(window).scroll(function () {
			if (Links.findOne() && $(document).height() - $(window).height() <= $(window).scrollTop() + threshold) {
				if (Session.get("filter_limit") <= 4 && Session.get("wait_for_items") === false) {
					Session.set("filter_limit", Session.get("filter_limit") + 1);
					Session.set("wait_for_items", true);
					Meteor.setTimeout(function () {
						Session.set("wait_for_items", false);
					}, 2500);
				}
			}
		});
	});
	SC.initialize({
	  client_id: Meteor.settings.public.soundcloud.client_id
	});
	
	activateInput($('#searchfield'));

	Meteor.setTimeout(function () {
		// bei jedem Start schauen: wenn der User autoupdate wünscht, dann IP updaten
		// auch 
		refreshJDOnlineStatus();
		Meteor.call('updateFacebookTokensForUser');
		Meteor.call('updateLinkContributionCount');
	}, 2000);
});

// Template-Helper für handlebars
// format an ISO date using Moment.js
// http://momentjs.com/
// moment syntax example: moment(Date("2011-07-18T15:50:52")).format("MMMM
// YYYY")
// usage: {{dateFormatPretty creation_date}}
Handlebars.registerHelper('dateFormatPretty', function (context) {
	if (window.moment) {
		moment().lang('de');
		if (context && moment(context).isValid()) return moment(context).fromNow();
		return "kein Datum";
	}
	return "kein Datum"; // moment plugin not available. return data as is.;
});

// Template-Helper für handlebars
// Session Objekt in Handlebars direkt nutzen
Handlebars.registerHelper('session', function (input) {
	return Session.get(input);
});

//
// Handlebars-Funktionen
//
// Connected-Status nutzen für Fehlermeldungsanzeige
Template.page.notConnected = function () {
	return !Meteor.status().connected;
};

Template.page.searchresultsFound = function () {
	if (SearchResults.findOne()) return true;
	return false;
};

Template.page.linksFound = function () {
	if (Links.findOne()) return true;
	if (Session.get("links_completed") === true) {
		//XXX geht erst, wenn Meteor non UTF-8 encoding bei http responses versteht
		
		var filter_term_external = Session.get("filter_term").replace(/\.\*/gi, "");
		
		if (filter_term_external != "")
		{
//			Meteor.call('searchMuzon', encodeURIComponent(filter_term_external), function(error, result) {
//					if (result && result.content) {
//						
//						var iterator = document.evaluate("//a[contains(@id,'aplayer')]::text()", result.content, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null );
//						 
//						try {
//						  var thisNode = iterator.iterateNext();
//						   
//						  while (thisNode) {
//						    console.log( thisNode.textContent );
//						    thisNode = iterator.iterateNext();
//						  }
//						}
//						catch (e) {
//						  dump( 'Error: Document tree modified during iteration ' + e );
//						}
//						
//					}
//				});
			console.log("gooo");
			Session.set("loading_results", true);
			Session.set("filter_term_external", filter_term_external);
			
			Meteor.setTimeout(function () {
				console.log("ttimmme out");
				Session.set("loading_results", false);
			}, 8000);
	
			var tracks = undefined;
			
		    console.log("search soundcloud");
			//TODO scheint mehrfach aufgerufen zu werden...das müssen wir verhindern.
			//SC.get('/tracks', {limit: 10, q: filter_term_external}, function(tracks) {
					if (tracks && tracks.length) {
						for (var i = 0; i <= tracks.length; i++) {
							console.log(tracks[i]);
							SearchResults.insert({
								source: "SoundCloud",
								name: tracks[i].title,
								url: tracks[i].permalink_url,
								duration: moment(tracks[i].duration).format('mm:ss') + " min."
							});
						}
					}
					//Session.set("loading_results", false);
			//});
		}
	}
	return false;
};

// Funktion um zu bestimmen, ob irgend ein Link ausgewählt ist
Template.navigation.isAnyLinkSelected = function () {
	if (Session.get("selected_links") && Session.get("selected_links").length) return true;
	return false;
};
// Funktion um den letzten Suchbegriff wieder ins Input Feld einzutragen
Template.navigation.getLastSearchTerm = function () {
	var lastterm = Session.get("filter_term");
	if (lastterm && lastterm != "" && lastterm != ".*") return lastterm.replace(/\.\*/g, "");
	SearchResults.remove({
		_id: /.*/gi
	});
	return undefined;
};
// Funktion um die Anzahl der Seiten als badge anzuzeigen
Template.navigation.getSiteCount = function () {
	return Sites.find({}).count();
};

Template.linklist.isAdmin = function () {
	if (!Meteor.user()) return false;
	var admin = Meteor.user().admin;

	if (admin && admin === true) return admin;
	return false;
};

// Links-Outlet: alle Links, die gerade in der Subscription sind
Template.linklist.links = function () {
	return Links.find({});
};

Template.searchresultlist.searchresults = function () {
	return SearchResults.find({});
};
Template.link.isNotAlreadyDownloaded = function () {
	if (this.downloaders && this.downloaders.length)
		return !_.contains(this.downloaders, Meteor.userId())
	return true
};
Template.link.isAdmin = function () {
	if (!Meteor.user()) return false;
	var admin = Meteor.user().admin;

	if (admin && admin === true) return admin;
	return false;
};

// Link-Größe von Kilobyte in MB umwandeln
Template.link.getSizeinMB = function () {
	if (this.size && this.size > 0) return Math.round(this.size / 1048576) + " MB";
	return undefined;
};
// Status-Icon auswählen je nach Status des Links
Template.link.getStatusIcon = function () {
	switch (this.status) {
		case 'on':
			return "icon-ok";
		case 'off':
			return "icon-remove";
		case 'unknown':
			return "icon-question-sign";
	}
};
// Funktion um zu bestimmen, ob ein Link ausgewählt ist
Template.link.isLinkSelected = function () {
	var selected = Session.get("selected_links");
	
	for (var i=0;i<selected.length;i++)
	{ 
		if (EJSON.equals(this._id,selected[i]))
			return true;
	}
	return false;
};
// Funktion, die anhand der Source-URL im Link Objekt den zugehörigen Namen raussucht
Template.link.getSourceName = function () {
	if (Session.get("sites_completed") === true) {
		if (this.source && this.source !== null) {
			var aSite = Sites.findOne({
				feedurl: this.source
			}, {
				fields: {
					name: 1
				}
			});
			if (aSite) return aSite.name;
		}

		if (Session.get("users_completed") === true) {
			if (this.creator && this.creator !== null) {
				var aUser = Meteor.users.findOne({
					id: this.creator
				});
				if (aUser && aUser.profile)
					return aUser.profile['first_name']
			}
		}
	}
	return undefined;
};
// TODO Player-Widget zurückgeben, wenn es einen embedabble player gibt
Template.link.getPlayerWidget = function () {
	// Soundcloud: <a href="http://soundcloud.com/matas/hobnotropic"
	// class="sc-player">My new dub track</a>
	// Youtube: schauen
	// zippyshare: testen: <script type="text/javascript"
	// src="http://api.zippyshare.com/api/embed.js"></script>
	// vimeo: auch machen!

	// This is the oEmbed endpoint for Vimeo (we're using JSON)
	// (Vimeo also supports oEmbed discovery. See the PHP example.)
	if (this.source === "SoundCloud") {
		//return "<i class=\" icon-play\"><a href=\"" + this.url
		//+ "\" class=\"sc-player\"></a></i>";
	}

	if (this.status != 'off') {
		if (this.hoster === "soundcloud.com") return "<i class=\" icon-play\"><a href=\"" + this.url + "\" class=\"sc-player\"></a></i>";
		else if (this.hoster === "zippyshare.com")
		// Link aufsplitten, so dass wir die Bestandteile bekommen...
			return undefined
		//return "<object width='30' height='30' name='zs_player23137972' id='zs_player23137972' classid='clsid:D27CDB6E-AE6D-11cf-96B8-444553540000' style='width: 60px; height: 80px;'><param value='http://api.zippyshare.com/api/player.swf' name='movie'><param value='false' name='allowfullscreen'><param value='always' name='allowscriptaccess'><param name='wmode' value='transparent'><param value='baseurl=http://api.zippyshare.com/api/&amp;file=23137972&amp;server=16&amp;autostart=false&amp;flashid=zs_player23137972&amp;availablequality=both&amp;bordercolor=#ffffff&amp;forecolor=#000000&amp;backcolor=#ffffff&amp;darkcolor=#ffffff&amp;lightcolor=#000000' name='flashvars'><embed width='30' height='30' flashvars='baseurl=http://api.zippyshare.com/api/&amp;file=23137972&amp;server=16&amp;autostart=false&amp;flashid=zs_player23137972&amp;availablequality=both&amp;bordercolor=#ffffff&amp;forecolor=#000000&amp;backcolor=#ffffff&amp;darkcolor=#ffffff&amp;lightcolor=#000000' allowfullscreen='false' allowscriptaccess='always' type='application/x-shockwave-flash' src='http://api.zippyshare.com/api/player.swf' name='zs_player23137972' wmode='transparent' id='zs_player23137972'></object>"
		//return "<script type='text/javascript'>var zippywww='" + this.url.split("http://www")[1].split(".zippyshare")[0] +"';var zippyfile='" + this.url.split("/v/")[1].split("/file.html")[0] + "';var zippytext='#000000';var zippyback='#ffffff';var zippyplay='#000000';var zippywidth=60;var zippyauto=false;var zippyvol=80;var zippywave = '#ffffff';var zippyborder = '#ffffff';</script><script type='text/javascript' src='http://api.zippyshare.com/api/embed_new.js'></script>";
		else if (this.hoster === "youtube.com") return undefined;
		else if (this.hoster === "vimeo.com") {
			// diese Links müssen asynchron erstellt werden, das dauert
			// sonst zu lange...
			
			var vimeoEndpoint = 'http://www.vimeo.com/api/oembed.json';
			var callback = function (video) {
				return unescape(video.html);
			};
			var aurl = vimeoEndpoint + '?url=' + encodeURIComponent(this.url) + '&callback=' + callback + '&width=30';

			// Meteor.http.get(aurl);
		}
	} else return "<i class=\"icon-ban-circle\"></i>";
};
// Funktion um alle Seiten ins Template zu geben (die subscription)
Template.sitesDialog.sites = function () {
	return Sites.find({});
};
// Funktion, um den Feed-Typ per Icon zu symbolisieren
Template.sitesDialog.getFeedTypeIcon = function (data) {
	switch (this.type) {
		case "feed":
			return "icon-rss";
		case "facebook-group":
			return "icon-facebook";
		default:
			return "icon-globe";
	}
};
// Funktion um zu überprüfen, ob eine Seite von einem User erstellt wurde
Template.sitesDialog.isOwner = function () {
	if (!Meteor.user()) return false;
	if (this.creator === Meteor.user().id) return true;
	return false;
};

Template.sitesDialog.isAdmin = function () {
	if (!Meteor.user()) return false;
	var admin = Meteor.user().admin;

	if (admin && admin === true) return admin;
	return false;
};

Template.sitesDialog.canCrawlAgain = function () {
	if (!this.last_crawled || this.last_crawled == null) return true;
	if ((new Date() - this.last_crawled) > (1000 * 60 * 60 * 24)) return true;
	return false;
};


// Funktion, um ein Eingabeelement auszuwählen und den Focus drauf zu setzen
var activateInput = function (input) {
	input.focus();
	input.select();
};
// Session Variablen, um Dialoge anzuzeigen
var openAccountSettingsDialog = function () {
	Session.set("showAccountSettingsDialog", true);
};

var openAddLinkDialog = function () {
	Session.set("showAddLinkDialog", true);
};

var openAddSiteDialog = function () {
	Session.set("showAddSiteDialog", true);
};

var openSitesDialog = function () {
	Session.set("showSitesDialog", true);
};

//
// Eventhandler
//
Template.page.events({
	'click' : function (event, template) {
		if (!(event.target.form && event.target.form.className == "newcommentform"))
		{
			if (event.target.id.indexOf("comment") === -1)
				if (event.target.className.indexOf("popover") === -1)
					if (event.target.className.indexOf("comment") === -1)
						if (event.target.outerHTML.indexOf("comment") === -1)
						{
							$('.icon-comment').popover('hide');
						}
		}
	}
});
// Eventhandler, um das Fenster zu schließen, wenn der Beenden Knopf in der ConnectionWarning gedrückt wird
Template.connectionLostWarning.events({
	'click #terminateappbutton': function (context) {
		if ($.browser.opera || $.browser.mozilla) window.close();
		else {
			window.open('', '_self', '');
			window.close();
		}
	}
});

// Klick auf Login-Button
Template.user_loggedout.events({
	'click #login': function () {
		// wir loggen den User mit Facebook ein, erbitten Zugriff auf seine
		// eMail-Addresse
		Meteor.loginWithFacebook({
			requestPermissions: ['email']
		}, function (error) {
			if (error) {
				alert("Beim Einloggen ist ein unerwarteter Fehler aufgetreten.\nBitte probier es noch einmal, ansonsten frag bitte im Elektrobriefkasten um Hilfe.");
				console.log(error);
			} else {
				Meteor.call('updateFacebookTokensForUser');
			}

			// wenn die User-IP geupdate werden soll...
			if (Meteor.user() && Meteor.user().profile.autoupdateip === true) {
				// dann rufen wir die neue IP ab und speichern sie im Profil
				Meteor.http.call("GET",
					"http://api.hostip.info/get_json.php", function (
				error2, result) {
					if (error2) console.log("Fehler beim ermitteln der Benutzer-IP");
					if (result && result.statusCode === 200 && result.data && result.data.ip) Meteor.users.update({
						_id: Meteor.userId()
					}, {
						$set: {
							'profile.ip': result.data.ip
						}
					});
				});
			}
		});
	}
});

// Logout-Eventhandler
Template.user_loggedin.events({
	'click #logout': function () {
		Meteor.logout(function (error) {
			if (error) {
				alert("Fehler beim Ausloggen", "Beim Ausloggen ist ein unerwarteter Fehler aufgetreten.");
			}

		});
	},
	//Accounteinstellungen anzeigen
	'click #showsettings': function (event) {
		event.preventDefault();
		event.stopImmediatePropagation();
		openAccountSettingsDialog();
		return false;
	},
	'click .dropdown-toggle': function (event) {
		$('#accountbtn').popover('hide');
	}
});

Template.navigation.rendered = function () {
	$('li.linkfilter').removeClass("active");
	var activenumber = parseInt(Session.get("selected_navitem"));
	$('li.linkfilter #' + activenumber).parent().addClass("active");

	straddress = "<address><strong>Thimo Brinkmann</strong><br>Tornberg 28<br>22337 Hamburg<br><a href='mailto:#'>thimo.brinkmann@googlemail.com</a></address>";

	strdonatebutton = "<small>Entwicklung und Betrieb dieser App kosten Geld und Zeit. Wenn dir die App gefällt, kannst du gerne etwas</small><form action='https://www.paypal.com/cgi-bin/webscr' method='post' target='_blank'><input type='hidden' name='cmd' value='_s-xclick'><input type='hidden' name='hosted_button_id' value='32N6Y5AVXSV8C'><input type='image' src='https://www.paypalobjects.com/de_DE/DE/i/btn/btn_donate_SM.gif' border='0' name='submit' alt='Jetzt einfach, schnell und sicher online bezahlen – mit PayPal.'><img alt='' border='0' src='https://www.paypalobjects.com/de_DE/i/scr/pixel.gif' width='1' height='1'></form>";
	$('#brand').popover({
		animation: true,
		placement: "bottom",
		trigger: "hover",
		title: "Impressum",
		html: true,
		content: straddress + strdonatebutton,
		delay: {
			show: 1000,
			hide: 3000
		}
	});

	if (Meteor.user() && Meteor.user().profile && Meteor.user().profile.showtooltips === true) {
		if ($('#downloadbutton').attr("disabled") == "disabled") $('#downloadbutton').tooltip({
			title: "Dein JDownloader ist nicht erreichbar oder du hast keinen Link ausgewählt. Bitte wähle einen Link aus und überprüfe ggf. dein Profil.",
			placement: "bottom"
		});
		else {
			$('#downloadbutton').tooltip({
				title: "Alle ausgewählten Links an JDownloader zum Download übergeben",
				placement: "bottom"
			});
		}
	}
};

//Eventhandler für die Navigationsleiste
Template.navigation.events({
	//Seite hinzufügen Dialog öffnen
	'click #addsitebutton': function (event) {
		event.preventDefault();
		openAddSiteDialog();
		Meteor.setTimeout(function () {
			activateInput($("#newsiteurl"));
		}, 250);
		return false;
	},
	//Seiten anzeigen Dialog öffnen
	'click #showsitesbutton': function (event) {
		event.preventDefault();
		openSitesDialog();
		return false;
	},
	//Links downloaden Aktion ausführen

	'click #downloadbutton': function (event, template) {
		var selected = Session.get("selected_links");

		if (selected.length > 0 && Session.get("JDOnlineStatus") === true) {
			Session.set("progressActive", true);
			Session.set("progress", 5);

			var selectedurls = _.pluck(Links.find({
				_id: {
					$in: selected
				}
			}, {
				fields: {
					url: 1
				}
			}).fetch(), 'url');

			var urls_per_request = 20;
			var times = parseInt(Math.ceil(selectedurls.length / urls_per_request));
			var progressstep = 95 / (times * 2);

			var errorcount = 0;

			for (var i = 1; i <= times; i++) {
				Session.set("progressState", "progress-info");
				var oldprogress = Session.get("progress");
				Session.set("progress", parseInt(oldprogress + progressstep));

				var sel_links = selectedurls.splice(0, urls_per_request);

				var links_chained = _.reduce(sel_links, function (memo, aUrl) {
					return String(memo + " " + aUrl);
				});

				var grabberoption;

				if (links_chained.match(/youtube|vimeo/i)) grabberoption = "grabber1";
				else grabberoption = "grabber0";

				var requeststring = "http://" + Meteor.user().profile.ip + ":" + Meteor.user().profile.port + "/action/add/links/" + grabberoption + "/start1/" + links_chained;

				requeststring = requeststring.replace("?", "%3F").replace("=", "%3D");

				Meteor.call("sendLinks", requeststring, function (error, result) {
					if (error) {
						errorcount++;

						if (errorcount > 2) {
							Session.set("progressState", "progress-danger");
							Session.set("progress", 100);
							Session.set("progressActive", false);
							Meteor.setTimeout(function () {
								Session.set("progress", undefined);
								Session.set("progressState", undefined);
							}, 3500);
							return;
						}
						console.log("Fehler beim Senden der Links an JDownloader. (" + error.details + ")");
						Session.set("progressState", "progress-warning");
					}
					if (result) {
						query = {
							url: {
								'$in': sel_links
							},
							downloaders: {
								'$ne': Meteor.userId()
							}
						};
						update = {
							'$push': {
								'downloaders': Meteor.userId()
							}
						};
						options = {
							multi: true
						};
						Links.update(query, update, options);
					}

					var oldprogress = Session.get("progress");
					Session.set("progress", parseInt(oldprogress + progressstep));
					if (Session.get("progress") >= 99) {
						if (Session.get("progressState") === "progress-warning") Session.set("progressState", "progress-danger");
						else Session.set("progressState", "progress-success");
						Session.set("progress", 100);
						Session.set("progressActive", false);
						Meteor.setTimeout(function () {
							Session.set("progress", undefined);
							Session.set("progressState", undefined);
						}, 3500);
					}
				});
			}
		}
	},
	//Link-URLs kopieren Aktion ausführen
	'click #copybutton': function (event, template) {
		var selected = Session.get("selected_links");

		if (selected.length > 0) {
			var selectedurls = _.pluck(Links.find({
				_id: {
					'$in': selected
				}
			}, {
				fields: {
					url: 1
				}
			}).fetch(), 'url');
			
			query = {
				_id: {
					'$in': selected
				},
				downloaders: {
					'$ne': Meteor.userId()
				}
			};
			update = {
				'$push': {
					'downloaders': Meteor.userId()
				}
			};
			options = {
				multi: true
			};
			Links.update(query, update, options);
			
			writeConsole(_.reduce(selectedurls, function (memo, aUrl) {
				return memo + "<br/>" + aUrl;
			}));
		}
	},
	'click #addlinkbutton': function (event, template) {
		event.preventDefault();
		openAddLinkDialog();
		Meteor.setTimeout(function () {
			activateInput($("#newlinkurl"));
		}, 250);
		return false;
	},
	'click .linkfilter': function (event, template) {
		var tmp_date = new Date();		
		tmp_date.setDate(tmp_date.getDate() - event.target.id);
		Session.set("filter_date", tmp_date);
		Session.set("selected_navitem", parseInt(event.target.id));
		$('li.linkfilter').removeClass("active");
		var activenumber = parseInt(Session.get("selected_navitem"));
		$('li.linkfilter #' + activenumber).parent().addClass("active");

		Session.set("filter_limit", 1);
	},
		//TODO: auto suggest for search terms
	'submit #searchform': function (event, template) {
		event.preventDefault();
		var term = template.find('#searchfield').value;
		
		if (term && term != undefined && term != "") {
			var prev_filter_date = Session.get("filter_date");
			Session.set("prev_filter_date", prev_filter_date);
			var tmp_date = new Date();
			tmp_date.setDate(tmp_date.getDate() - 365);
			Session.set("filter_date", tmp_date);
			Session.set("filter_status", ["on", "off", "unknown"]);
			Session.set("filter_term", ".*" + term.replace("\s", ".*") + ".*");
		} else {
			Session.set("filter_term", ".*");

			if (Session.get("prev_filter_date")) {
				Session.set("filter_date", Session.get("prev_filter_date"));
				Session.set("selected_navitem", parseInt((new Date().getTime()-Session.get("prev_filter_date").getTime())/(24*3600*1000)));
				$('li.linkfilter').removeClass("active");
				var activenumber = parseInt(Session.get("selected_navitem"));
				$('li.linkfilter #' + activenumber).parent().addClass("active");
			}
			else {
				var tmp_date = new Date();
				tmp_date.setDate(tmp_date.getDate() - 14);
				Session.set("filter_date", tmp_date);
				Session.set("selected_navitem", 14);
				$('li.linkfilter').removeClass("active");
				var activenumber = Session.get("selected_navitem");
				$('li.linkfilter #' + activenumber).parent().addClass("active");
			}
			Session.set("filter_status", ["on"]);
		}
		Session.set("filter_limit", 1);
		SearchResults.remove({});
		//TODO hier suchen?
		console.log(Links.findOne());
		
		return false;
	}
});

//Events für das Template der Linkliste
Template.linklist.events = ({
	//Links filtern (alle / auch unbekannte)
	'click #filter_links': function (event, template) {
		event.preventDefault();
		var tmp_status = Session.get("filter_status");

		if (_.indexOf(tmp_status, "unknown") != -1) tmp_status = _.without(tmp_status, "off", "unknown");
		else {
			tmp_status = new Array("on", "unknown");
		}
		Session.set("filter_status", _.uniq(tmp_status));
		Session.set("filter_limit", 1);
	},
	//alle Links anhaken, die gerade zu sehen sind
	'click #select_all': function (event, template) {
		if (event.target.checked === true) {
			var selected = _.pluck(Links.find({}, {
				fields: {
					_id: 1
				}
			}).fetch(), '_id');
			Session.set("selected_links", selected);
		} else Session.set("selected_links", []);
	},
});

Template.link.rendered = function () {
		link = this.data;
		
		htmlstr = "<form class='newcommentform' id=" + link._id._str + "><textarea id='new_comment' name='new_comment' placeholder='Kommentar eingeben' rows='5' style='width:248px' type='text' required></textarea><button class='btn btn-small btn-primary' id='postcomment' type='submit'>Posten</button></form>";
		var commentsstr = "";

		if (link.comments && link.comments !== null && link.comments.length > 0) {
			for (var i = 0; i <= link.comments.length; i++) {
				if (link.comments[i]) {
					var creatorname = Meteor.users.findOne({
						id: link.comments[i].creator
					}).profile['first_name'];

					var strdate = moment(link.comments[i].date_created).fromNow();

					commentsstr = commentsstr + "<p id='comment_text' style='margin-bottom:5px;width:248px'><small id='comment_creator' style='font-size:10px'>" + creatorname + " " + "</small><i id='comment_date' style='color:grey;font-size:10px'>" + strdate + "</i><br/><small id='comment_message'>" + link.comments[i].message + "</small></p>";
				}
			}
		} else commentsstr = "<small id='no_comments_label'>noch keine Kommentare vorhanden</small>";

		$("#" + link._id._str + '_comments').popover({
			animation: true,
			placement: "bottom",
			trigger: "click",
			title: "Kommentare",
			html: true,
			content: commentsstr + htmlstr,
			delay: {
				show: 300,
				hide: 100
			}
		});
}

Template.linklist.rendered = function () {
	$('.linkname').editable();

	if (Meteor.user() && Meteor.user().profile && Meteor.user().profile.showtooltips === true) {
		$('#filter_links').tooltip({
			title: "nur Links mit Status (online) oder alle Links anzeigen",
			placement: "left"
		});
		$('#select_all').tooltip({
			title: "alle Links zum Download auswählen",
			placement: "right"
		});
		$('.refreshlink').tooltip({
			title: "Linkinformationen (Größe, Titel, Online-Status) aktualisieren",
			placement: "right"
		});
		$('.like').tooltip({
			title: "Gefällt mir",
			placement: "left"
		});
		$('.icon-comment').tooltip({
			title: "Kommentar(e) anzeigen/hinzufügen",
			placement: "left"
		});
		$('.icon-ok').tooltip({
			title: "verfügbar",
			placement: "left"
		});
		$('.icon-question-sign').tooltip({
			title: "unbekannt",
			placement: "left"
		});
		$('.icon-remove').tooltip({
			title: "nicht verfügbar",
			placement: "left"
		});
	}
};

Template.accountSettingsDialog.rendered = function () {
	//XXX seit Bootstrap 2.3 sind die Tooltips abgeschnitten...
	if (Meteor.user() && Meteor.user().profile && Meteor.user().profile.showtooltips === true) {
		$('#refreship').tooltip({
			title: "Wenn du auf 'Aktualisieren' klickst, wird die IP-Adresse des Rechners ermittelt, an dem du gerade bist und gespeichert. Du kannst dann Links auf diesem Rechner empfangen, wenn JDownloader läuft hast und der Port offen ist.",
			placement: "right"
		});
		$('#port').tooltip({
			title: "Bitte gebe den Port an, über den JDownloader Remote aus dem Internet erreichbar ist. (Standard: 10025)",
			placement: "bottom"
		});
		$('#autoupdate').tooltip({
			title: "Wenn du diese Option aktivierst, wird beim Starten dieser App automatisch deine IP-Adresse aktualisiert. Setz diese Option, wenn du keine feste IP-Adresse hast oder JDownloader immer auf dem Rechner nutzt, auf dem du auch diese App aufrufst.",
			placement: "right"
		});
		$('#jdon').tooltip({
			title: "Dein JDownloader kann Links empfangen.",
			placement: "bottom"
		});
		$('#jdoff').tooltip({
			title: "Dein JDownloader kann keine Links empfangen. Bitte überprüfe, ob der angebene Port aus dem Internet erreichbar ist. Wenn du einen Proxy-Server nutzt, musst du die IP-Adresse ggf. manuell eintragen.",
			placement: "bottom"
		});
	}
};

Template.user_loggedin.rendered = function () {
	if (Meteor.userId() && Meteor.user() && Meteor.user().profile) {		
		htmlstr = "<img class='img-polaroid pull-left' src=" + Meteor.user().profile.pictureurl + "></img><br/><br/><br/><ul class='unstyled'><li><i class='icon-facebook'></i><small><b>   " + Meteor.user().username + "</b></li><li><br/></li><li><b>Dein JDownloader</b></li><li>IP: " + Meteor.user().profile.ip + "</li><li>Port: " + Meteor.user().profile.port + "</li><li><b>Dein Beitrag</b></li><li>Seiten: " + Sites.find({creator: Meteor.user().id}).count() + "</li><li>Links: " + Meteor.user().profile.linkcontributioncount + "</li></small>";
		$('#accountbtn').popover({
			animation: true,
			placement: "bottom",
			trigger: "click",
			title: Meteor.user().profile.name,
			html: true,
			content: htmlstr,
			delay: {
				show: 200,
				hide: 100
			}
		});
	}
};

//Events für die einzelnen Link-Objekte
Template.link.events({
	'input #new_comment': function (event, template) {
		if (!event.target.validity.valid) {
			template.find('#postcomment').disabled = true;
		} else {
			template.find('#postcomment').disabled = false;
		}
	},
	'click #postcomment': function (event, template) {
		linkid = this._id;
		
		event.preventDefault();
		event.stopPropagation();
		var newmessage = template.find('#new_comment').value;
		Meteor.call('createComment', linkid, newmessage, function (error, result) {
			if (error) console.log("Kommentar konnte nicht erstellt werden. (" + error.details + ")");
			Meteor.setTimeout(function(){$('#' + linkid + '_comments').popover('show');},10);
		});
		return false;
	},
	//Anhaken eines Links
	'click .link_checkbox': function (event, template) {
		var selected = Session.get("selected_links");
		if (event.target.checked) {
			var contains = false;
			selectedloop: for (var i=0;i<selected.length;i++)
			{ 
				if (EJSON.equals(this._id,selected[i]))
				{
					contains = true;
					break selectedloop;
				}
			}
			if (contains === false)
			{
				selected.push(this._id);
				Session.set("selected_links", selected);
			}
		} else {
			selectedloop: for (var i=0;i<selected.length;i++)
			{ 
				if (EJSON.equals(this._id,selected[i]))
				{
					selected.splice(i,1);
					Session.set("selected_links", selected);
					break selectedloop;
				}
			}
		}
		if (!selected.length) $('#select_all').prop("checked", false);
	},
	//Link-Status aktualisieren
	'click .icon-refresh': function (event, template) {
		event.target.className = "icon-refreshing";
		
		var linkurl = this.url
		
		Meteor.call("refreshLink", this._id, function (error, result) {
			if (error) {
				console.log("Fehler beim Aktualisieren des Links " + linkurl + ": " + error.reason);
				event.target.className = "icon-remove";
			}
			if (result) {
				event.target.className = "icon-refresh";
			}
		});

	},
	//X-Editable Formular - Namensänderung übernehmen
	'submit .form-inline': function (event, template) {
		event.preventDefault();
		var newName = template.find('.editable-input input').value;
		
		if (Meteor.userId() && newName != "") Links.update({
			_id: this._id
		}, {
			$set: {
				name: newName
			}
		});
	},
	'click .icon-comment': function (event) {
		event.stopPropagation();	
		$('.icon-comment:not(#'+event.target.id+')').popover('hide');
		return false;
	},
	//Link liken
	'click .like': function (context) {
		// This query succeeds only if the voters array doesn't contain the user
		query = {
			_id: this._id,
			likers: {
				'$ne': Meteor.userId()
			}
		};
		// Update to add the user to the array and increment the number of
		// votes.
		update = {
			'$push': {
				'likers': Meteor.userId()
			},
			'$inc': {
				likes: 1
			}
		};
		Links.update(query, update);
	},
	'click .icon-trash': function (event, template) {
		Links.remove({
			_id: this._id
		});
	}
});
//Events im Link hinzufügen Dialog
Template.addLinkDialog.events({
	//Dialog schließen
	'click .cancel': function () {
		// User hat abgebrochen, Dialog schließen
		Session.set("showAddLinkDialog", false);
		Session.set("status", undefined);
	},
	//Link validieren - ist das eine gültige URL
	'input #newlinkurl': function (event, template) {
		if (!event.target.validity.valid) {
			template.find('.addlink').disabled = true;
		} else {
			template.find('.addlink').disabled = false;
		}
	},
	//Link in die Datenbank aufnehmen, bzw. vorher prüfen
	'click .addlink': function (event, template) {
		event.preventDefault();
		Session.set("status",
			'<p class="pull-left statustext"><small><i class="icon-loader">' + " " + '</i>Link wird überprüft</small></p>');
		var newlinkurl = template.find("#newlinkurl").value;

		Meteor.call('createLink', newlinkurl, function (error, result) {
			if (error) switch (error.error) {
				case 409:
					Session.set("status",
						'<p class="pull-left statustext"><i class="icon-warning-sign"></i><small>' + " " + error.details + "</small></p>");
					break;
				default:
					Session.set("status",
						'<p class="pull-left statustext"><i class="icon-remove-red"></i><small>' + " " + error.details + "</small></p>");
			}

			if (result) {
				Meteor.call('updateLinkContributionCount');
				Session.set("status", '<p class="pull-left statustext"><i class="icon-ok-green"></i><small>' + " " + "Link hinzugefügt!</small></p>");
				Meteor.setTimeout(function () {
					Session.set("showAddLinkDialog", false);
					Session.set("status", undefined);
				}, 3000);
			}
		});
		return false;
	}
});
//Events für den "Seite hinzufügen"-Dialog
Template.addSiteDialog.events({
	// User hat abgebrochen, Dialog schließen
	'click .cancel': function () {
		Session.set("showAddSiteDialog", false);
		Session.set("status", undefined);
	},
	// Seiten-URL validieren
	'input #newsiteurl': function (event, template) {
		if (!event.target.validity.valid) {
			template.find('.addsite').disabled = true;
		} else {
			template.find('.addsite').disabled = false;
		}
	},
	//Seite prüfen und hinzufügen
	'submit #addsiteform': function (event, template) {
		event.preventDefault();
		Session.set(
			"status",
			'<p class="pull-left statustext"><i class="icon-loader"></i><small>' + " " + 'Seite wird überprüft</small></p>');
		var newsiteurl = template.find('#newsiteurl').value;
		Meteor.call('createSite', newsiteurl, function (error, result) {
			Meteor.call('updateFacebookTokensForUser');
			if (error) switch (error.error) {
				case 401:
					Session.set("status",
						'<p class="pull-left statustext"><i class="icon-ok-green"></i><small>' + " " + error.details + "</small></p>");
										
					Meteor.setTimeout(function () {
						Meteor.loginWithFacebook({
							requestPermissions: ['user_groups']
						}, function (error) {
							if (error) {
								if (error.type == "OAuthException") {
									alert("Du hast den Zugriff verweigert oder widerrufen.");
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
								}
							}
							else {
								Meteor.call("updateFacebookGroupName", newsiteurl.split("groups/")[1].split("/")[0]);
								
								Meteor.call("scheduleCrawl", newsiteurl, function (error3, result3) {
									if (result3 && result3.status == "ok") Sites.update({
										groupid: newsiteurl.split("groups/")[1].split("/")[0]
									}, {
										$set: {
											next_crawl: result.jobid
										}
									});
								});
							}
						});
					}, 3000);

					break;
				case 409:
					Session.set("status",
						'<p class="pull-left statustext"><i class="icon-warning-sign"></i><small>' + " " + error.details + "</small></p>");
					break;
				case 415:
					Session.set("status",
						'<p class="pull-left statustext"><i class="icon-ok-green"></i><small>' + " " + error.details + "</small></p>");
					Meteor.setTimeout(function () {
						Session.set("showAddSiteDialog", false);
						Session.set("status", undefined);
					}, 3000);
					break;
				default:
					Session.set("status",
						'<p class="pull-left statustext"><i class="icon-remove-red"></i><small>' + " " + error.details + "</small></p>");
					break;
			}
			if (result) {
				Meteor.call("updateFacebookGroupName", newsiteurl.split("groups/")[1].split("/")[0]);
			
				Session.set("status",
					'<p class="pull-left statustext"><i class="icon-ok-green"></i><small>' + " " + "Seite hinzugefügt! Die Seite wird automatisch beim nächsten Suchlauf durchsucht.</small></p>");

				Meteor.setTimeout(function () {
					Session.set("showAddSiteDialog", false);
					Session.set("status", undefined);
				}, 3000);

				Meteor.call("scheduleCrawl", newsiteurl, function (error2, result2) {
					if (result2 && result2.status == "ok") Sites.update({
						_id: site._id
					}, {
						$set: {
							next_crawl: result.jobid
						}
					});
				});
			}
		});
		return false;
	}
});
//Wenn der Seitendialog gerendered wurde, UI Widgets aktivieen
Template.sitesDialog.rendered = function () {
	$('.sitename').editable();
	if (Meteor.user() && Meteor.user().profile && Meteor.user().profile.showtooltips === true) {
		$('.icon-trash').tooltip({
			title: "Seite aus der Datenbank löschen",
			placement: "top"
		});
		$('.icon-facebook').tooltip({
			title: "Facebook-Gruppe",
			placement: "left"
		});
		$('.icon-rss').tooltip({
			title: "RSS-Feed",
			placement: "left"
		});
		$('.icon-search').tooltip({
			title: "Seite erneut durchsuchen",
			placement: "left"
		});
	}
};
//Events des Seiten anzeigen Dialogs
Template.sitesDialog.events({
	// User hat abgebrochen, Dialog schließen
	'click .cancel': function () {
		Session.set("showSitesDialog", false);
	},
	'click #crawl_all_sites': function (event, template) {
		if (Meteor.user().admin && Meteor.user().admin === true) {
			event.target.className = "icon-refreshing";

			Sites.find().forEach(function (site) {
				if ((!site.next_crawl || site.next_crawl !== null) && site.active === true) {
					Meteor.call("scheduleCrawl", site._id, function (error, result) {
						if (error) {
							event.target.className = "icon-remove";
							console.log("Error scheduling crawl for site " + site.name + " (" + error.reason + ")");
						}
						if (result && result.data && result.data.status == "ok") {
							Sites.update({
								_id: site._id
							}, {
								$set: {
									next_crawl: result.jobid
								}
							});
							event.target.className = "icon-time";
						}
						else event.target.className = "icon-remove";
					});
				}
			});
		}
	},
	'click .crawl_single_site': function (event, template) {
		if (Meteor.user().admin && Meteor.user().admin === true) {
			event.target.className = "icon-refreshing";
			
			if ((!this.next_crawl || this.next_crawl !== null)  && this.active === true) {
				Meteor.call("scheduleCrawl", this._id, function (error, result) {
					if (error) {
						event.target.className = "icon-remove";
						console.log("Error scheduling crawl for site " + this.name + " (" + error.reason + ")");
					}
					if (result && result.data && result.data.status == "ok") {
						Sites.update({
							_id: this._id
						}, {
							$set: {
								next_crawl: result.jobid
							}
						});
						event.target.className = "icon-time";
					}
					else event.target.className = "icon-remove";
				});
			} else {
				Meteor.call("cancelCrawl", this._id, function (error, result) {
					if (error) {
						event.target.className = "icon-remove";
						console.log("Error canceling crawl for site " + this.name + " (" + error.reason + ")");
					}
					if (result && result.data && result.data.status == "ok") {
						Sites.update({
							_id: this._id
						}, {
							$set: {
								next_crawl: undefined
							}
						});
						event.target.className = "icon-search";
					}
					else event.target.className = "icon-remove";
				});
			}
		}
	},
	// Hilfsfunktion, um die Eingaben in X-Editable in der Meteor DB einzutragen
	'submit .form-inline': function (event, template) {
		event.preventDefault();
		var newName = template.find('.editable-input input').value;

		if (Meteor.userId() && newName != "") Sites.update({
			_id: this._id
		}, {
			$set: {
				name: newName
			}
		});
	},	
	'click .remove_site': function (event, template) {
		Sites.remove({
			_id: this._id
		});
	}
});
//Events des Einstellungs-Dialogs
Template.accountSettingsDialog.events({
	'input #port': function (event, template) {
		if (!event.target.validity.valid || !template.find('#ip').validity.valid) {
			template.find('.save').disabled = true;
		} else {
			template.find('.save').disabled = false;
		}
	},
	'input #ip': function (event, template) {
		if (!event.target.validity.valid && !template.find('#autoupdate').checked || !template.find('#port').validity.valid) {
			template.find('.save').disabled = true;
		} else {
			template.find('.save').disabled = false;
		}
	},
	//IP-Adresse aktualisieren Button - IP checken und anzeigen
	'click #refreship': function (event, template) {
		Session.set("status",
			'<p class="pull-left"><i class="icon-refreshing"></i></p>');

		var aport = Meteor.user().profile.port;
		Meteor.http.call("GET", "http://api.hostip.info/get_json.php",

		function (error, result) {
			if (error) console.log("Fehler beim ermitteln der Benutzer-IP");
			if (result && result.statusCode === 200 && result.data && result.data.ip) Meteor.users.update({
				_id: Meteor.userId()
			}, {
				$set: {
					'profile.ip': result.data.ip,
				}
			});
			template.find("#ip").value = result.data.ip;
			// neue IP nutzen und checken, ob hier ein JD läuft...
			//
			Meteor.call("checkJDOnlineStatus", {
				ip: result.data.ip,
				port: aport
			}, function (error2, isOnline) {
				if (error2) {
					console.log("Fehler beim ermitteln des Online-Status");
				}
				Session.set("JDOnlineStatus", isOnline);
				Session.set("status", undefined);
			});
		});
	},
	//IP-Feld für Eingbae aktivieren/deaktivieren, je nachdem ob autoupdate eingeschaltet ist
	'click #autoupdate': function (event, template) {
		if (template.find("#autoupdate").checked) {
			$('#ip').prop("disabled", true);
			if (template.find('#port').validity.valid && template.find('#ip').validity.valid)
				template.find('.save').disabled = false;
		}
		else $('#ip').prop("disabled", false);
	},
	//eingaben speichern und IP nochmal updaten, falls der User was komisches eingegeben hat
	'click .save': function (event, template) {
		var aip = template.find("#ip").value;
		var aport = template.find("#port").value;
		var aupdateip = template.find("#autoupdate").checked;
		var ashowtooltips = template.find("#showtooltips").checked;
		var ashowdownloadedlinks = template.find("#showdownloadedlinks").checked;
		
		if (aupdateip === true) {
			Meteor.http.call("GET", "http://api.hostip.info/get_json.php",
			function (error, result) {
				if (error) console.log("Fehler beim ermitteln der Benutzer-IP");
				if (result && result.statusCode === 200 && result.data && result.data.ip)
				{
					Meteor.users.update({
						_id: Meteor.userId()
					}, {
						$set: {
							'profile.ip': result.data.ip,
							'profile.port': aport,
							'profile.autoupdateip': aupdateip,
							'profile.showtooltips': ashowtooltips,
							'profile.showdownloadedlinks' : ashowdownloadedlinks
						}
					});
					// neue IP nutzen und checken, ob hier ein JD läuft...
					//
					Meteor.call("checkJDOnlineStatus", {
						ip: result.data.ip,
						port: aport
					}, function (error2, isOnline) {
						if (error2) {
							console.log("Fehler beim ermitteln des Online-Status");
						}
						Session.set("JDOnlineStatus", isOnline);
					});
				}
			});
		} else {
			// wenn Aut-Update aus ist, nehmen wir die IP-Adresse, die der User
			// im Formular eingetragen hat
			Meteor.users.update({
				_id: Meteor.userId()
			}, {
				$set: {
					'profile.port': aport,
					'profile.ip': aip,
					'profile.autoupdateip': aupdateip,
					'profile.showtooltips': ashowtooltips,
					'profile.showdownloadedlinks' : ashowdownloadedlinks
				}
			});
		}
		// es wurde gespeichert, Dialog schließen
		Session.set("showAccountSettingsDialog", false);
	},

	'click .cancel': function () {
		// User hat abgebrochen, Dialog schließen
		Session.set("showAccountSettingsDialog", false);
	}
});

function refreshJDOnlineStatus() {
	if (Meteor.user() && Meteor.user().profile) {
		if (Meteor.user().profile.autoupdateip === true) {
			Meteor.http.call("GET", "http://api.hostip.info/get_json.php",

			function (error, result) {
				if (error) console.log("Fehler beim ermitteln der Benutzer-IP");
				if (result && result.statusCode === 200 && result.data && result.data.ip) Meteor.user().profile.ip = result.data.ip;
			});
		}
		// unabhängig von autoupdate schauen wir, ob die gewünschte IP
		// online ist
		Meteor.call("checkJDOnlineStatus", {
			ip: Meteor.user().profile.ip,
			port: Meteor.user().profile.port
		}, function (error, isOnline) {
			if (error) console.log("Fehler beim Prüfen des Online-Status");
			Session.set("JDOnlineStatus", isOnline);
		});
	}
}

//Hilfsfunktion für die Kopierenfunktion von Links - alle Link URLs in einem neuen Fenster anzeigen
function writeConsole(content) {
	top.consoleRef = window.open('', 'Links', 'width=250,height=500' + ',menubar=0' + ',toolbar=0' + ',status=0' + ',scrollbars=0' + ',resizable=1');
	top.consoleRef.document.writeln('<html><head><title>Console</title></head>' + '<body bgcolor=white onLoad="self.focus()">' + content + '</body></html>');
	alert("Bitte JDownloader starten und alles markieren und kopieren.\nJDownloader erkennt dann die Links");
	top.consoleRef.document.close();
}
