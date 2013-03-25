//TODO: Search does not always start
//TODO: animate searching and searching finished
//TODO: save filter_status

//Initialize Session Variables
Session.setDefault("loading_results", false);
Session.setDefault("wait_for_items", false);
Session.setDefault("sites_completed", false);
Session.setDefault("links_completed", false);
Session.setDefault("users_completed", false);
Session.setDefault("counts_completed", false);
Session.setDefault("status", undefined);
Session.setDefault("showAccountSettingsDialog", false);
Session.setDefault("showAddLinkDialog", false);
Session.setDefault("showAddSiteDialog", false);
Session.setDefault("showSitesDialog", false);
Session.setDefault("showFilterSitesDialog", false);
Session.setDefault("progressActive", false);
Session.setDefault("progress", undefined);
Session.setDefault("progressState", undefined);
Session.setDefault("selected_navitem", 14);
Session.setDefault("filter_date", new Date(new Date().setDate(new Date().getDate()-14)));
Session.setDefault("filter_status", ["on"]);
Session.setDefault("filter_term", ".*");
Session.setDefault("filter_limit", 1);
Session.setDefault("filter_skip", 0);
Session.setDefault("filter_sites", []);
Session.setDefault("temp_filter_sites", []);
Session.setDefault("filter_show_already_downloaded", false);
Session.setDefault("selected_links", []);
Session.setDefault("JDOnlineStatus", false);


[1, 14, 30, 90, 365].forEach(function (timespan) {
	Session.setDefault("links_count_" + timespan, 0);
	/*Meteor.call("getLinksCount", new Date(new Date().setDate(new Date().getDate()-timespan)), function (error, count) {
		if (count)
			Session.set("links_count_" + timespan, count);
	});*/
});


//local Collection for external search results
SearchResults = new Meteor.Collection(null);
//Subscriptions
Deps.autorun(function () {
	//Admin-Flag
	Meteor.subscribe('userData');
	
	Meteor.subscribe('counts-by-timespan', Session.get("filter_status"), function onReady() {
		Session.set('counts_completed', true);
	});
	
	//User-Names and Facebook-IDs for display purposes
	Meteor.subscribe('allUserData', function onReady() {
		Session.set('users_completed', true);
	});	
	//music source sites	
	Meteor.subscribe('sites', function onReady() {
		// set a session key to true to indicate that the subscription is
		// completed.
		Session.set('sites_completed', true);
	});
	//music links
	Meteor.subscribe('links', Session.get("filter_date"), Session.get("filter_status"), Session.get('filter_term'), Session.get('filter_limit'), Session.get('filter_skip'), Session.get('filter_show_already_downloaded'), Session.get("filter_sites"), function onReady() {
		// set a session key to true to indicate that the
		// subscription is completed.
		Session.set('links_completed', true);
	});
	
	
	if (Session.get("counts_completed") === true)
	{
		var query = Counts.find({});
		var handle = query.observeChanges({
		  added: function (id, count) {
		    [1, 14, 30, 90, 365].forEach(function (timespan) {
		    	var item = Counts.findOne({_id: timespan})
		    	if (item && item.count)
		    		Session.set("links_count_" + timespan, item.count);
		    });
		  },
		  changed: function () {
		    [1, 14, 30, 90, 365].forEach(function (timespan) {
		    	var item = Counts.findOne({_id: timespan})
		    	if (item && item.count)
		    		Session.set("links_count_" + timespan, item.count);
		    }); 
		  }
		});
	}
});

//
// Startup function
Meteor.startup(function () {

	activateInput($('#searchfield'));
		
	Meteor.setTimeout(function () {
		// if user profile is already available, set session varibles for filtering links just for specific sites
		// and showing already downloaded items. They are not reactive because we need to change them when searching
		if (Meteor.user() && Meteor.user().profile)
		{
			Session.set("filter_show_already_downloaded", Meteor.user().profile.showdownloadedlinks);
			
			if (Meteor.user().profile.showunknownlinks === true)
				Session.set("filter_status", ["on","unknown"])
			else {
				Session.set("filter_status", ["on"])
			}
			
			if(Meteor.user().profile.filteredsites !== undefined)
			{
				Session.set("filter_sites", Meteor.user().profile.filteredsites);
				Session.set("temp_filter_sites", Meteor.user().profile.filteredsites);
			}
		}
	
		// update user IP and check if JD Remote is responding
		refreshJDOnlineStatus();
		//XXX when Meteor can provide the resume login event, do this only there
		// Add user facebook token to groups of the user that should be crawled, so the crawl will work
		Meteor.call('updateFacebookTokensForUser');
		// Update the number of links and sites the user contributed to the app and save it in his profile
		Meteor.call('updateLinkContributionCount');
	}, 2500);
	
	//initialize soundcloud API for external search with app key
	SC.initialize({
	  client_id: Meteor.settings.public.soundcloud.client_id
	});
	
	$.fn.editable.defaults.validate = function(value) {
		if($.trim(value) == '') {
		     return 'Name darf nicht leer sein.';
		 }
	};
	
	bottomMargin = 49;
	itemHeight = 30;
	threshold = 10 * itemHeight + bottomMargin;
	$(window).scroll(function () {
		if (Links.findOne() && $(document).height() - $(window).height() <= $(window).scrollTop() + threshold) {
			if (Session.get("filter_limit") <= 4 && Session.get("wait_for_items") === false && Links.find().count() === (Session.get("filter_limit") * Meteor.settings.public.itembadgesize)) {
				Session.set("wait_for_items", true);
				Session.set("filter_limit", Session.get("filter_limit") + 1);
				Meteor.setTimeout(function () {
					Session.set("wait_for_items", false);
				}, 2500);
			}
		}
	});
});

// Template-Helper für handlebars
// represent ISO Date as String from now (e.g. 3 minute before, in 1 hour)
// usage: {{dateFormatPretty creation_date}}
Handlebars.registerHelper('dateFormatPretty', function (context) {
	if (window.moment) {
		moment().lang('de');
		if (context && moment(context).isValid()) return moment(context).fromNow();
		return "noch nie";
	}
	return context; // moment plugin not available. return data as is.;
});
Handlebars.registerHelper('millisecondsFormatPretty', function (context) {
    if (window.moment) {
        moment().lang('de');
        if (context && moment(context).isValid()) return moment(context).format('mm:ss') + " min.";
        return "unbekannt";
    }
    return context; // moment plugin not available. return data as is.;
});
Handlebars.registerHelper('searchProviderEnabled', function (context) {
	if (Meteor.user() && Meteor.user().profile)
	{
		return _.contains(Meteor.user().profile.searchproviders, context);
	}
	return true;
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
	return false;
};

Template.page.isExternalSearch = function () {
	return ((Session.get("filter_term") !== ".*") && Meteor.user().profile.searchproviders.length);
};

// Funktion um zu bestimmen, ob irgend ein Link ausgewählt ist
Template.navigation.isAnyLinkSelected = function () {
	if (Session.get("selected_links").length) return true;
	return false;
};

Template.linklist.getNextLinksText = function () {
	return (parseInt(Session.get("filter_skip"))+251) + "-" + (parseInt(Session.get("filter_skip"))+300);
};

Template.linklist.getCurrentLinksText = function () {
	if (Links.find().count() === 1)
		return undefined;
	if (Links.find().count() === (Session.get("filter_limit") * Meteor.settings.public.itembadgesize))
		return (parseInt(Session.get("filter_skip"))+1) + "-" + (parseInt(Session.get("filter_skip"))+250);
	return (parseInt(Session.get("filter_skip"))+1) + "-" + (parseInt(Session.get("filter_skip"))+Links.find().count());
};

Template.linklist.hasMoreLinks = function () {
	return (Links.find().count() === (Session.get("filter_limit") * Meteor.settings.public.itembadgesize));
};

Template.linklist.isLinksLimit = function () {
	return (Session.get("filter_limit") == 5);
};

Template.linklist.isAnyLinkSelected = function () {
	if (Session.get("selected_links").length) return true;
	return false;
};

// Funktion um den letzten Suchbegriff wieder ins Input Feld einzutragen
Template.navigation.getLastSearchTerm = function () {
	var lastterm = Session.get("filter_term");
	if (lastterm != "" && lastterm != ".*") return lastterm.replace(/\.\*/g, "").replace(/\\/g,"");
	return undefined;
};
// Funktion um die Anzahl der Seiten als badge anzuzeigen
Template.navigation.getSiteCount = function () {
	return Sites.find({}).count();
};

// Links-Outlet: alle Links, die gerade in der Subscription sind
Template.linklist.links = function () {
	return Links.find({},{sort: {date_published: -1}});
};

Template.searchresultlist.searchresults = function () {
	return SearchResults.find({});
};

Template.link.isNotAlreadyDownloaded = function () {
	if (this.downloaders && this.downloaders.length)
		return !_.contains(this.downloaders, Meteor.userId());
	return true;
};

// Link-Größe von Kilobyte in MB umwandeln
Template.link.getSizeinMB = function () {
	if (this.size && this.size > 0)
	{
		var sizeinMB = Math.round(this.size / 1048576);
		if (Math.ceil(Math.log(sizeinMB +1) / Math.LN10) > 3) {
			var sizeinGB = sizeinMB / 1024;
			return sizeinGB.toFixed(1).toString().replace(".",",") + " GB";
		}
		return sizeinMB + " MB";
	}
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
					return aUser.profile['first_name'];
			}
		}
	}
	return undefined;
};

Template.link.isPlayable = function () {	
	if (this.status != 'off') {
		switch (this.hoster) {
			case "soundcloud.com":
				return true;
			case "youtube.com":
				return true;
			case "zippyshare.com":
				return true;
			case "muzon.ws":
				if (this.stream_url)
					return true;
				return false;
			case "ex.fm":
				return true;
			case "vimeo.com":
				return false;
			default:
				return false;
		}
	}
	return false;
};

Template.searchresult.isPlayable = function () {	
	if (this.status != 'off') {
		switch (this.hoster) {
			case "soundcloud.com":
				return true;
			case "youtube.com":
				return true;
			case "muzon.ws": case "zippyshare.com":
				if (this.stream_url)
					return true;
				return false;
			case "ex.fm":
				return true;
			case "vimeo.com":
				return false;
			default:
				return false;
		}
	}
	return false;
};

Template.searchresult.getExternalSourceIcon = function() {
	if (this.hoster == "zippyshare.com") return "<a href='http://www.zippyshare.com'><img alt='Zippyshare Attribution' src='zippyshare.png'></a>";
	if (this.hoster == "soundcloud.com") return "<a href='" + this.url + "'><img alt='Player Attribution' class='playerattribution' src='soundcloud.png'></a>";
	if (this.hoster == "muzon.ws") return "<a href='http://www.muzon.ws'><img alt='Muzon Attribution' src='muzon.png'></a>";
	if (this.hoster == "youtube.com") return "<a href='http://www.youtube.com'><img alt='YouTube Attribution' src='youtube.png'></a>";
	if (this.hoster == "ex.fm") return "<a href='http://ex.fm'><img alt='ex.fm Attribution' src='exfm.png'></a>";
	return undefined;
};
// Funktion um alle Seiten ins Template zu geben (die subscription)
Template.sitesDialog.sites = function () {
	return Sites.find({});
};

Template.filterSitesDialog.sites = function () {
	return Sites.find({});
};

Template.filterSitesDialog.isSiteFiltered = function () {
	return _.contains(Session.get("temp_filter_sites"), this.feedurl);
};

Template.filterSitesDialog.noSitefiltered = function () {
	if (Session.get("temp_filter_sites"))
		return !Session.get("temp_filter_sites").length;
	return true;
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
// Funktion die prüft, ob der letzte Crawl einer Seite mehr als 24 Stunden her ist
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
	if (Meteor.status().connected)
		Session.set("showAccountSettingsDialog", true);
};

var openAddLinkDialog = function () {
	if (Meteor.status().connected)
		Session.set("showAddLinkDialog", true);
};

var openAddSiteDialog = function () {
	if (Meteor.status().connected)
		Session.set("showAddSiteDialog", true);
};

var openSitesDialog = function () {
	if (Meteor.status().connected)
		Session.set("showSitesDialog", true);
};

var openFilterSitesDialog = function () {
	if (Meteor.status().connected)
		Session.set("showFilterSitesDialog", true);
};

//
// Eventhandler
//
Template.page.events({
	'click' : function (event, template) {	
		$('#accountbtn').popover('hide');
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
	'click #terminateappbutton': function () {
		if ($.browser.opera || $.browser.mozilla) window.close();
		else {
			window.open('', '_self', '');
			window.close();
		}
	},
	'click #waitbutton': function (event) {
		event.preventDefault();
		event.target.disabled = true;
		event.target.innerHTML = "<i class='icon-loader'></i> Warten";
		
		Meteor.setTimeout(function () {
			event.target.innerHTML = "<i class='icon-warning-sign'></i> Verbindung verloren";
		}, 10000);
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
		Session.set("filter_show_already_downloaded", Meteor.user().profile.showdownloadedlinks);
		openAccountSettingsDialog();
		return false;
	},
	'click #showsitefilter': function (event) {
		event.preventDefault();
		openFilterSitesDialog();
		return false;
	},
	'click #accountbtn': function (event) {
		event.preventDefault();
		event.stopPropagation();
		return false;
	}
});

Template.navigation.rendered = function () {
	$('#searchfield').typeahead({items: 6, minLength: 3,
		source: function(query, process) {
			Meteor.call("getSuggestionsForSearchTerm", ".*" + query.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1") + ".*", function(error, result) {
				if (result.length)
					result.unshift(query.trim());
				process(result);
			});	
		},
		updater: function(name) {
			SearchResults.remove({});
			var term = name.trim();
			var prev_filter_date = Session.get("filter_date");
			var prev_filter_skip = Session.get("filter_skip");
			Session.set("prev_filter_skip", prev_filter_skip);
			Session.set("prev_filter_date", prev_filter_date);
			Session.set("filter_show_already_downloaded", true);
			Session.set("filter_date", new Date(new Date().setDate(new Date().getDate()-365)));
			Session.set("filter_status", ["on", "off", "unknown"]);
			Session.set("filter_term", ".*" + term.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1") + ".*");
			Session.set("filter_skip", 0);
			Session.set("filter_sites", []);			
			return name;
        },
		matcher: function(item) {
			return true;
		},
		highlighter: function (item) {
			var searchterms = this.query.trim().split(" ");
			
			for (var i = 0; i < searchterms.length; i++) {
				var regex = new RegExp( '(' + searchterms[i] + ')', 'i' );
				newitem = item.replace( regex, "<strong>$1</strong>" );
			}

            return newitem;
        },
	});
	
	$('li.linkfilter').removeClass("active");
	var activenumber = parseInt(Session.get("selected_navitem"));
	$('li.linkfilter #' + activenumber).parent().addClass("active");

	straddress = "<address><strong>Thimo Brinkmann</strong><br>Tornberg 28<br>22337 Hamburg<br><a href='mailto:#'>thimo.brinkmann@googlemail.com</a></address>";
	strdonatebutton = "<small>Entwicklung und Betrieb dieser App kosten Geld und Zeit. Wenn dir die App gefällt, kannst du gerne etwas</small><form action='https://www.paypal.com/cgi-bin/webscr' method='post' target='_blank'><input type='hidden' name='cmd' value='_s-xclick'><input type='hidden' name='hosted_button_id' value='32N6Y5AVXSV8C'><input type='image' src='https://www.paypalobjects.com/de_DE/DE/i/btn/btn_donate_SM.gif' border='0' name='submit' alt='Jetzt einfach, schnell und sicher online bezahlen – mit PayPal.'><img alt='' border='0' src='https://www.paypalobjects.com/de_DE/i/scr/pixel.gif' width='1' height='1'></form>";
	
	if (Meteor.userId())
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
		
		if (selected.length && Session.get("JDOnlineStatus") === true) {
			Session.set("progressActive", true);
			Session.set("progress", 5);

			var selectedurls = _.pluck(Links.find({
				_id: {
					$in: selected
				}
			}, {
				fields: {
					_id: -1,
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

				if (links_chained.match(/youtube|vimeo/i))
					grabberoption = "grabber1";
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
						Meteor.call("markLinksAsDownloadedByURL", sel_links, function (error, result) {
							if (result)
								console.log("Error updating Links after Download.");
							if (error)
								console.log("Error updating Links after Download.");
						});
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
						Session.set("selected_links",[]);
					}
				});
			}
		}
	},
	//Link-URLs kopieren Aktion ausführen
	'click #copybutton': function (event, template) {
		var selected = Session.get("selected_links");

		if (selected.length) {
			var selectedurls = _.pluck(Links.find({
				_id: {
					'$in': selected
				}
			}, {
				fields: {
					_id: -1,
					url: 1
				}
			}).fetch(), 'url');
			
			Meteor.call("markLinksAsDownloadedById", selected, function (error, result) {
				if (result)
					console.log("Error updating Links while copying to clipboard.");
				if (error)
					console.log("Error updating Links while copying to clipboard.");
			});
			
			Session.set("selected_links",[]);
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
		$("html, body").animate({ scrollTop: 0 }, "fast");
		var sitefilter = Session.get("filter_sites");
		Session.set("filter_show_already_downloaded", Meteor.user().profile.showdownloadedlinks);
		Session.set("filter_sites",_.without(sitefilter,Meteor.user().id));
		Session.set("filter_limit", 1);
		Session.set("filter_skip", 0);
		Session.set("filter_term",".*");
		Session.set("filter_date", new Date(new Date().setDate(new Date().getDate()-event.target.id)));
		Session.set("selected_navitem", parseInt(event.target.id));
		$('li.linkfilter').removeClass("active");
		var activenumber = parseInt(Session.get("selected_navitem"));
		$('li.linkfilter #' + activenumber).parent().addClass("active");
		SearchResults.remove({});
	},	
	'submit #searchform': function (event, template) {
		
		event.preventDefault();
		event.stopPropagation();
		var term = template.find('#searchfield').value.trim();
		
		Session.set("filter_limit", 1);
		Session.set("filter_skip", 0);
		
		var sitefilter = Session.get("filter_sites");
		Session.set("filter_sites",_.without(sitefilter,Meteor.user().id));
		
		if (term && term != undefined && term != "") {
			SearchResults.remove({});
			var prev_filter_date = Session.get("filter_date");
			var prev_filter_skip = Session.get("filter_skip");
			Session.set("prev_filter_skip", prev_filter_skip);
			Session.set("prev_filter_date", prev_filter_date);
			Session.set("filter_sites",[]);
			Session.set("filter_show_already_downloaded", true);
			Session.set("filter_date", new Date(new Date().setDate(new Date().getDate()-365)));
			Session.set("filter_status", ["on", "off", "unknown"]);
			Session.set("filter_term", ".*" + term.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1") + ".*");
		} else {
			Session.set("filter_show_already_downloaded", Meteor.user().profile.showdownloadedlinks);
			Session.set("filter_term", ".*");
                           
            if (Meteor.user().profile.filteredsites)
            {
				Session.set("filter_sites", Meteor.user().profile.filteredsites);
				Session.set("temp_filter_sites", Meteor.user().profile.filteredsites);
			}
			
			if (Session.get("prev_filter_date")) {
				Session.set("filter_date", Session.get("prev_filter_date"));
				Session.set("filter_skip", Session.get("prev_filter_skip"));
				Session.set("selected_navitem", Math.round((new Date().getTime()-Session.get("prev_filter_date").getTime())/(24*3600*1000)));
				$('li.linkfilter').removeClass("active");
				var activenumber = parseInt(Session.get("selected_navitem"));
				$('li.linkfilter #' + activenumber).parent().addClass("active");
			}
			else {
				Session.set("filter_date", new Date(new Date().setDate(new Date().getDate()-14)));
				Session.set("selected_navitem", 14);
				$('li.linkfilter').removeClass("active");
				var activenumber = Session.get("selected_navitem");
				$('li.linkfilter #' + activenumber).parent().addClass("active");
			}

			if (Meteor.user().profile.showunknownlinks === true)
				Session.set("filter_status", ["on","unknown"])
			else {
				Session.set("filter_status", ["on"])
			}
			
			//Session.set("filter_status", ["on"]);
		}
		
		if (Meteor.user().profile.searchproviders.length && term && term != undefined && term != "")
			Session.set("loading_results", true);
		
		Meteor.setTimeout(function () {
			Session.set("loading_results", false);
		}, 8000);
		
		Meteor.setTimeout(function(){
			if (Session.get("links_completed") === true && !Links.findOne()) {
				
				var filter_term_external = Session.get("filter_term").replace(/\.\*/gi, "").replace(/\\/gi, "");;
				
				if (filter_term_external != "")
				{
					if (!Meteor.user().profile.searchproviders.length)
					{
						Session.set("loading_results", false);
						return;
					}	                    

                    Session.set("filter_term_external", filter_term_external);
                    
					if (_.contains(Meteor.user().profile.searchproviders,"zippysharemusic"))
                    {
						Meteor.http.get("https://www.googleapis.com/customsearch/v1?key=" + Meteor.settings.public.google.search_api_key + "&cx=partner-pub-9019877854699644%3At1iell5gp8b&alt=json&fields=items(pagemap)&q=" + encodeURIComponent(filter_term_external), function(error, result) {
							if (result && result.data && result.data.items) {
								var items = result.data.items;
								
								var pattern1 = /https?\:\/\/www\d{1,2}\.zippyshare.com/i
								var pattern2 = /\d{3,8}(?=\/file\.html)/i

								if (items && items.length) {
									for (var i = 0; i <= items.length; i++) {
										if(items[i])
										{										
											var theurl = items[i].pagemap.metatags[0]["og:url"].replace("\\");
											var stream_url = undefined;
											
											var match1 = pattern1.exec(theurl);
											var match2 = pattern2.exec(theurl);
							
											if (match1 && match2)
												stream_url = match1 + "/downloadMusic?key=" + match2;
											
											if (!SearchResults.findOne({url: theurl}))											
												SearchResults.insert({
													hoster: "zippyshare.com",
													status: "unknown",
													name: unescape(items[i].pagemap.metatags[0]["og:title"].replace("null").replace("undefined").trim()),
													url: items[i].pagemap.metatags[0]["og:url"].replace("\\"),
													stream_url: stream_url,
													duration: moment(0)
												});
										}
									}
									Session.set("loading_results", false);
								}
							}
						});
					}
					
                    if (_.contains(Meteor.user().profile.searchproviders,"muzon"))
                    {
                    	Meteor.call('searchMuzon', encodeURIComponent(filter_term_external), function(error, result) {
                    		if (result) {
                                   var pattern1 = /<span.*id.*(aid|oid|autor|title|time).*>.*(?=<\/span>)/gi;
                                   var pattern2 = /http.*(?=<img src="\/JJS\/download.png)/gi;
                                   
                                   var tempaid = undefined;
                                   var tempoid = undefined;
                                   var tempautor = undefined;
                                   var temptitle = undefined;
                                   var temptime = undefined;
                                   var tempurl = undefined;
                                   
                                   var matches;
                                   
                                   while (matches = pattern1.exec(result)) {
                                       if (matches[0].indexOf("aid\">") !== -1)
                                       {
                                           tempaid = (matches[0].split("aid\">")[1]);
                                       }
                                       if (matches[0].indexOf("oid\">") !== -1)
                                       {
                                           tempoid = (matches[0].split("oid\">")[1]);
                                       }
                                       if (matches[0].indexOf("autor\">") !== -1)
                                       {
                                           tempautor = (matches[0].split("autor\">")[1]);
                                       }
                                       if (matches[0].indexOf("title\">") !== -1)
                                       {
                                           temptitle = (matches[0].split("title\">")[1]);
                                       }
                                       if (matches[0].indexOf("time\">") !== -1)
                                       {
                                           temptime = (matches[0].split("time\">")[1]);
                                       }
                    
                                       if (tempaid && tempoid && tempautor && temptitle && temptime)
                                       {
                                           var matches2;
                                           while (matches2 = pattern2.exec(result)) {
                                               var temp = matches2[0].split(" ")[0];
                                               if (temp.indexOf(tempoid) !== -1 && temp.indexOf(tempaid) !== -1)
                                               {
                                               		var tempname = temptitle;
                                               		
                                               		if (temptitle.indexOf(tempautor) === -1)
                                               			tempname = tempautor + " - " + temptitle;
                                               
                                                   tempurl = temp;
												   
												   if (!SearchResults.findOne({url: tempurl}))	
													   SearchResults.insert({
														   hoster: "muzon.ws",
														   status: "on",
														   name: unescape(tempname.replace("null").replace("undefined").trim()),
														   url: tempurl,
														   duration: moment(temptime*1000),
														   stream_url: "http://s2.muzon.ws/audio/" + tempaid + "/" + tempoid + "/play.mp3"
													   });
                                                   
                                                   tempaid = undefined;
                                                   tempoid = undefined;
                                                   tempautor = undefined;
                                                   temptitle = undefined;
                                                   temptile = undefined;
                                                   tempurl = undefined;
                                               }
                                           }
                                           Session.set("loading_results", false);
                                       }
                                   }
                    		}
                    	});
                    }
                          
					if (_.contains(Meteor.user().profile.searchproviders,"soundcloud"))
					{
						SC.get('/tracks', {filter:'public',limit: 10, q: filter_term_external}, function(tracks) {
								if (tracks && tracks.length) {
									for (var i = 0; i <= tracks.length; i++) {
										if(tracks[i])
										{
											if (!SearchResults.findOne({url: tracks[i].permalink_url}))	
												SearchResults.insert({
													hoster: "soundcloud.com",
													status: "on",
													name: tracks[i].title,
													url: tracks[i].permalink_url,
													duration: moment(tracks[i].duration)
												});
										}
									}
									Session.set("loading_results", false);
								}
						});
					}
					      
					if (_.contains(Meteor.user().profile.searchproviders,"youtube"))
					{
						var youtube_term = _.reduce(filter_term_external.split(" "), function (memo, token) {
							return String(memo + "+" + token);
						});
					
						Meteor.http.get("https://gdata.youtube.com/feeds/api/videos?q=" + youtube_term + "&max-results=10&v=2&alt=json",function(error,result)
						{								
							if (result && result.data && result.data.feed && result.data.feed.entry) {
								var entry = result.data.feed.entry;
									for (var i = 0; i <= entry.length; i++) {
										if(entry[i])
										{
											if (!SearchResults.findOne({url: entry[i].link[0].href}))
												SearchResults.insert({
													hoster: "youtube.com",
													status: "on",
													name: entry[i].title.$t,
													url: entry[i].link[0].href,
													duration: moment(entry[i].media$group.yt$duration.seconds*1000)
												});
										}
									}
									Session.set("loading_results", false);
							}
						});
					}
						
					if (_.contains(Meteor.user().profile.searchproviders,"ex.fm"))
					{
						Meteor.http.get("http://ex.fm/api/v3/song/search/" + filter_term_external,function(error,result)
						{							
							if (result && result.data && result.data.status_code === 200) {
								var songs = result.data.songs;
									for (var i = 0; i <= songs.length; i++) {
										if(songs[i])
										{
											console.log("http://ex.fm/api/v3/song/" + songs[i].id);
											console.log(songs[i].artist + " " + songs[i].title.replace("null").replace("undefined").trim());
											if (!SearchResults.findOne({url: "http://ex.fm/api/v3/song/" + songs[i].id}))
												SearchResults.insert({
													hoster: "ex.fm",
													status: "on",
													name: unescape((songs[i].artist + " " + songs[i].title.replace("null").replace("undefined").trim())),
													url: "http://ex.fm/api/v3/song/" + songs[i].id,
													duration: moment(0)
												});
										}
									}
									Session.set("loading_results", false);
							}
						});
					}
				}
			}
			else {
				Session.set("loading_results",false);
			}	
		},1000);
		return false;
	}
});

//Events für das Template der Linkliste
Template.linklist.events = ({
	'click #paginate': function (event, template) {
		$("html, body").animate({ scrollTop: 0 }, "fast");
             
		Session.set("filter_limit" ,1);
		Session.set("filter_skip", Session.get("filter_skip")+250);
		Session.set("selected_links", []);
	},
	//Links filtern (alle / auch unbekannte)
	'click #filter_links': function (event, template) {
		event.preventDefault();
		Session.set("filter_limit", 1);
		Session.set("filter_skip", 0);
		
		var tmp_status = Session.get("filter_status");

		if (_.indexOf(tmp_status, "unknown") != -1) 
		{
			tmp_status = _.without(tmp_status, "off", "unknown");
			event.target.className = "icon-filter hand";
			Meteor.users.update({
				_id: Meteor.userId()
			}, {
				$set: {
					'profile.showunknownlinks': false,
				}
			});		
		}
		else {
			tmp_status = new Array("on", "unknown");
			event.target.className = "icon-filter hand icon-white";
			Meteor.users.update({
				_id: Meteor.userId()
			}, {
				$set: {
					'profile.showunknownlinks': true,
				}
			});
		}

		Session.set("filter_status", _.uniq(tmp_status));
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
	'click #hide_selected_links' : function (event, template) {
		var selected = Session.get("selected_links");

		if (selected.length) {			
			Meteor.call("markLinksAsDownloadedById", selected, function (error, result) {
				if (result)
					console.log("Error updating Links while marking as read.");
				if (error)
					console.log("Error updating Links while marking as read.");
			});
			Session.set("selected_links",[]);
		}
	}	
});

Template.link.rendered = function () {
		link = this.data;
		
		htmlstr = "<form class='newcommentform' id=" + link._id._str + "><textarea id='new_comment' name='new_comment' placeholder='Kommentar eingeben' rows='5' style='width:248px' type='text' required></textarea><button class='btn btn-small btn-primary' id='postcomment' type='submit'>Posten</button></form>";
		var commentsstr = "";

		if (link.comments && link.comments !== null && link.comments.length) {
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
};

Template.linklist.rendered = function () {
	$('.linkname').editable();

	if (Meteor.user() && Meteor.user().profile && Meteor.user().profile.showtooltips === true) {
		$('#filter_links').tooltip({
			title: "nur Links mit Status (online) oder alle Links anzeigen",
			placement: "left"
		});
		$('#hide_selected_links').tooltip({
			title: "ausgewählte Links verbergen",
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
		$('.delete_link').tooltip({
			title: "Link aus der Datenbank löschen",
			placement: "left"
		});
		$('.hide_link').tooltip({
			title: "Link ausblenden",
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
		$('#showdownloadedlinks').tooltip({
			title: "Wenn du diese Option aktivierst, werden auch Links angezeigt, die du bereits heruntergeladen, kopiert oder ausgeblendet hast.",
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
	'click .player' : function(event, template) {		
		if (this.status != 'off') {
			switch (this.hoster) {
				case "soundcloud.com":
					event.target.className = "icon-loader";
					if (window.SCM)
					{
						if (this.url.indexOf("/sets") !== -1)
						{
						
							SC.get('/resolve', { url: this.url }, function(result) {
								if (result.errors) {
									event.target.className = "icon-remove";
									return;
								}
								if (result.tracks && result.tracks.length)
								{
									var tracks = result.tracks;
									
									SCM.play({title:tracks[0].title, url: tracks[0].permalink_url});
									
									for (var i = 1; i <= tracks.length; i++) {
										if(tracks[i])
										{
											SCM.queue({title:tracks[i].title, url: tracks[i].permalink_url});
										}	
									}
									event.target.className="icon-list";
									return;
								}
								event.target.className = "icon-remove";
								return;
							});
							break;
						}
						SCM.play({title:this.name,url:this.url.replace("/download","")});
						event.target.className="icon-list";
						return;
					}
					event.target.className = "icon-remove";
					break;
				 case "youtube.com":
					event.target.className = "icon-loader";
					if (window.SCM)
					{
						SCM.play({title:this.name,url:this.url});
						event.target.className="icon-list";
					}
					else
						event.target.className = "icon-remove";
					break;
				case "zippyshare.com":
					event.target.className = "icon-loader";
				    if (window.SCM)
				    {
						var pattern1 = /https?\:\/\/www\d{1,2}\.zippyshare.com/i
						var pattern2 = /\d{3,8}(?=\/file\.html)/i
						var match1 = pattern1.exec(this.url);
						var match2 = pattern2.exec(this.url);
						
						if (match1 && match2)
						{
							var stream_url = match1 + "/downloadMusic?key=" + match2;
							SCM.play({title:this.name,url:stream_url});
							event.target.className="icon-list";
						}
						else
							event.target.className = "icon-remove";
						return;
				    }
				    else
				        event.target.className = "icon-remove";
				    break;					
				case "muzon.ws":
				    event.target.className = "icon-loader";
				    if (window.SCM && this.stream_url)
				    {
				        SCM.play({title:this.name,url:this.stream_url});
				        event.target.className="icon-list";
				    }
				    else
				        event.target.className = "icon-remove";
				    break;
				case "vimeo.com":
					event.target.className = "icon-remove";
					break;
				default:
					event.target.className = "icon-remove";
					break;
			}
		}
		else
			event.target.className = "icon-remove";
	},
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
		
		var linkurl = this.url;
		
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
		
		if (newName != "") Links.update({
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
			_id: this._id
		};
		// Update to add the user to the array and increment the number of
		// votes.
		update = {
			'$addToSet': {
				'likers': Meteor.userId()
			},
			'$inc': {
				likes: 1
			}
		};
		Links.update(query, update);
	},
	'click .delete_link': function (event, template) {
		Links.remove({
			_id: this._id
		});
	},
	'click .hide_link': function (event, template) {
		query = {
			_id: this._id,
		};
		update = {
			'$addToSet': {
				'downloaders': Meteor.userId()
			}
		};
		Links.update(query, update);
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

		Meteor.call('createLink', newlinkurl, undefined, function (error, result) {
			if (error) switch (error.error) {
				case 409:
					Session.set("status",
						'<p class="pull-left statustext"><i class="icon-warning-sign"></i><small>' + " " + error.details + "</small></p>");
					break;
				default:
					Session.set("status",
						'<p class="pull-left statustext"><i class="icon-remove"></i><small>' + " " + error.details + "</small></p>");
			}
			if (result) {
				Meteor.call('updateLinkContributionCount');
				Session.set("status", '<p class="pull-left statustext"><i class="icon-ok"></i><small>' + " " + "Link hinzugefügt!</small></p>");
				Meteor.setTimeout(function () {
					Session.set("showAddLinkDialog", false);
					Session.set("status", undefined);
				}, 3000);
			}
		});
		return false;
	}
});

Template.searchresult.preserve([".add_external_link"]);
Template.searchresult.preserve([".download_external_link"]);

Template.searchresult.events({
	'click .player' : function(event, template) {		
		if (this.status != 'off') {
			switch (this.hoster) {
				case "soundcloud.com": case "youtube.com": case "ex.fm":
					event.target.className = "icon-loader";
					if (window.SCM)
					{
						SCM.play({title:this.name,url:this.url});
						event.target.className="icon-list";
					}
					else
						event.target.className = "icon-remove";
	 				break;
				case "muzon.ws": case "zippyshare.com":
                    event.target.className = "icon-loader";
                    if (window.SCM && this.stream_url)
                    {
                        SCM.play({title:this.name,url:this.stream_url});
                        event.target.className="icon-list";
                    }
                    else
                        event.target.className = "icon-remove";
                    break;
				default:
					event.target.className = "icon-remove";
					break;
			}
		}
		else
			event.target.className = "icon-remove";
	},
	'click .download_external_link' : function (event, template) {
		event.preventDefault();
		event.stopPropagation();
		event.target.disabled = true;
		event.target.innerHTML = "<i class='icon-loader'></i>";

		if (Session.get("JDOnlineStatus") === true)
		{
			var grabberoption;
			
			if (this.url.match(/youtube|vimeo/i))
				grabberoption = "grabber1";
			else grabberoption = "grabber0";
		
			var requeststring = "http://" + Meteor.user().profile.ip + ":" + Meteor.user().profile.port + "/action/add/links/" + grabberoption + "/start1/" + this.url;

			requeststring = requeststring.replace("?", "%3F").replace("=", "%3D");

			Meteor.call("sendLinks", requeststring, function (error, result) {
				if (error) {
					event.target.innerHTML = "<i class='icon-remove'></i>";
					console.log("Fehler beim Senden der Links an JDownloader. (" + error.details + ")");
				}
				if (result) {
					event.target.innerHTML = "<i class='icon-ok'></i>";
				}
			});		
		}
		else
		{
			writeConsole(this.url);
			event.target.innerHTML = "<i class='icon-ok'></i>";
		}		
		return false;
	},
	'click .add_external_link': function (event, template) {
		event.preventDefault();
		event.stopPropagation();
		event.target.disabled = true;
		event.target.innerHTML = "<i class='icon-loader'></i> Link zur Datenbank hinzufügen";
		var sitefilter = Session.get("filter_sites");
		sitefilter.push(Meteor.user().id);
		Session.set("filter_sites",sitefilter);
		Meteor.call('createLink', this.url, this.stream_url, function (error, result) {
			if (error) {
				console.log("externer Link konnte nicht hinzugefügt werden ( " + error.details + " )");
				event.target.innerHTML = "<i class='icon-remove'></i> Link zur Datenbank hinzufügen";
			}
			if (result) {
				event.target.innerHTML = "<i class='icon-ok'></i> Link zur Datenbank hinzufügen";
				Meteor.call('updateLinkContributionCount');
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
						'<p class="pull-left statustext"><i class="icon-ok"></i><small>' + " " + error.details + "</small></p>");
										
					Meteor.setTimeout(function () {
						Meteor.loginWithFacebook({
							requestPermissions: ['user_groups']
						}, function (error2) {
							if (error2) {
								if (error2.type == "OAuthException") {
									alert("Du hast den Zugriff verweigert oder widerrufen.");
									
									Meteor.call("removeFacebookTokensForUser");
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
						'<p class="pull-left statustext"><i class="icon-ok"></i><small>' + " " + error.details + "</small></p>");
					Meteor.setTimeout(function () {
						Session.set("showAddSiteDialog", false);
						Session.set("status", undefined);
					}, 3000);
					break;
				default:
					Session.set("status",
						'<p class="pull-left statustext"><i class="icon-remove"></i><small>' + " " + error.details + "</small></p>");
					break;
			}
			if (result && result._str) {
				var aid = new Meteor.Collection.ObjectID(result._str);
			
				newsite = Sites.findOne({_id: aid});
				
				if (newsite && newsite.type == "facebook-group")
					Meteor.call("updateFacebookGroupName", newsite.groupid);
			
				Session.set("status",
					'<p class="pull-left statustext"><i class="icon-ok"></i><small>' + " " + "Seite hinzugefügt! Die Seite wird automatisch beim nächsten Suchlauf durchsucht.</small></p>");

				Meteor.setTimeout(function () {
					Session.set("showAddSiteDialog", false);
					Session.set("status", undefined);
				}, 3000);
				
				if (newsite)
					Meteor.call("scheduleCrawl", newsite.feedurl, function (error2, result2) {
						if (error2) console.log("Error scheduling Crawl for Site " + newsite.url + " (" + error.details + ")");
 						if (result2 && result2.status == "ok") Sites.update({
							_id: aid
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
		$('.remove_site').tooltip({
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
		$('.icon-time').tooltip({
			title: "Durchsuchen der Seite ist eingeplant",
			placement: "left"
		});
		$('.icon-ban-circle').tooltip({
			title: "Seite wurde innerhalb der letzten 24h durchsucht und kann noch nicht wieder durchsucht werden.",
			placement: "left"
		});
		$('.crawl_single_site').tooltip({
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
				if ((!site.next_crawl || site.next_crawl == null) && site.active === true && (new Date() - site.last_crawled) > (1000 * 60 * 60 * 24)) {
					Meteor.call("scheduleCrawl", site._id, function (error, result) {
						if (error) {
							event.target.className = "icon-remove";
							console.log("Error scheduling crawl for site " + site.name + " (" + error.reason + ")");
							$('#'+site._id+'_crawlstatus').removeClass("icon-search");
							$('#'+site._id+'_crawlstatus').removeClass("hand");
							$('#'+site._id+'_crawlstatus').addClass("icon-remove");
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
							$('#'+site._id+'_crawlstatus').removeClass("icon-search");
							$('#'+site._id+'_crawlstatus').removeClass("hand");
							$('#'+site._id+'_crawlstatus').addClass("icon-time");
						}
						else {
							event.target.className = "icon-remove";
							$('#'+site._id+'_crawlstatus').removeClass("icon-search");
							$('#'+site._id+'_crawlstatus').removeClass("hand");
							$('#'+site._id+'_crawlstatus').addClass("icon-remove");
						}
					});
				}
			});
		}
	},
	'click .crawl_single_site': function (event, template) {
		if (Meteor.user().admin && Meteor.user().admin === true) {
			event.target.className = "icon-refreshing";
			
			if ((!this.next_crawl || this.next_crawl == null)  && this.active === true) {
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
			'<p class="pull-left" style="margin:0px"><i class="icon-loader" style="margin-top:5px"></i></p>');

		var aport = Meteor.user().profile.port;
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
					}
				});
				template.find("#ip").value = result.data.ip;
				
				// neue IP nutzen und checken, ob hier ein JD läuft...			
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
			}
			else
			{
				console.log("Fehler beim ermitteln des Online-Status: ungültige Anwort vom Server");
				Session.set("JDOnlineStatus", false);
				Session.set("status", undefined);
			}
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
		
		var searchzippysharemusic = template.find("#searchzippysharemusic").checked;
		var searchmuzon = template.find("#searchmuzon").checked;
		var searchsoundcloud = template.find("#searchsoundcloud").checked;
		var searchyoutube = template.find("#searchyoutube").checked;
		var searchexfm = template.find("#searchexfm").checked;
		
		var searchproviders = [];
		
		if (searchzippysharemusic)
			searchproviders.push("zippysharemusic");
		
		if (searchmuzon)
			searchproviders.push("muzon");
		
		if (searchsoundcloud)
			searchproviders.push("soundcloud");
			
		if (searchyoutube)
			searchproviders.push("youtube");
			
		if (searchexfm)
			searchproviders.push("ex.fm");	
		
		Session.set("filter_show_already_downloaded",ashowdownloadedlinks);
		
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
					'profile.ip': aip,
				}
			});
		}
		
		Meteor.users.update({
			_id: Meteor.userId()
		}, {
			$set: {
				'profile.port': aport,
				'profile.autoupdateip': aupdateip,
				'profile.showtooltips': ashowtooltips,
				'profile.showdownloadedlinks' : ashowdownloadedlinks,
				'profile.searchproviders' : searchproviders
			}
		});		

		// es wurde gespeichert, Dialog schließen
		Session.set("showAccountSettingsDialog", false);
	},

	'click .cancel': function () {
		// User hat abgebrochen, Dialog schließen
		Session.set("showAccountSettingsDialog", false);
	}
});

Template.filterSitesDialog.events({
	'click #filter_all' : function (event, template) {
		if (!event.target.checked === true) {
			var selected = _.pluck(Sites.find({}, {
				fields: {
					feedurl: 1
				}
			}).fetch(), 'feedurl');
			Session.set("temp_filter_sites", selected);
		} else Session.set("temp_filter_sites", []);
	},
	'click .site_checkbox': function (event, template) {
		var selected = Session.get("temp_filter_sites");
		if (event.target.checked)
			selected = _.without(selected, this.feedurl);
		else
			selected.push(this.feedurl);
		Session.set("temp_filter_sites", _.uniq(selected));
		if (!selected.length) $('#filter_all').prop("checked", false);
	},
	'click .save': function () {
		Meteor.users.update({
			_id: Meteor.userId()
			}, {
				$set: {
					'profile.filteredsites': Session.get("temp_filter_sites")
				}
		});
		Session.set("filter_sites", Session.get("temp_filter_sites"));
		// User hat abgebrochen, Dialog schließen
		Session.set("showFilterSitesDialog", false);
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
			if (error) console.log("Fehler beim Ermitteln des Online-Status");
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
