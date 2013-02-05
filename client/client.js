// Automatische subscription für alle wichtigen Collections: Links, Sites, und Counts
Meteor.autosubscribe(function() {
    var filter_date = Session.get('filter_date');
    var filter_status = Session.get('filter_status');
    var filter_term = Session.get('filter_term');
    var filter_limit = Session.get('filter_limit');
    if (filter_date && filter_status && filter_limit) {
      
	Meteor.subscribe('sites', function onComplete() {
	    // set a session key to true to indicate that the subscription is
	    // completed.
	    Session.set('sites_completed', true);
	});

	Meteor.subscribe('links', filter_date, filter_status, filter_term, filter_limit,
		function onComplete() {
		    // set a session key to true to indicate that the
		    // subscription is completed.
		    Session.set('links_completed', true);
		});
    }
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
Meteor.startup(function() {	
	//Session Variablen initialisieren
	Session.set("sites_completed", false);
	Session.set("links_completed", false);
	Session.set("status", undefined);
	Session.set("showAccountSettingsDialog",false);

	if (!Session.get("filter_date")) {
	    var tmp_date = new Date();
	    tmp_date.setDate(tmp_date.getDate() - 14);
	    Session.set("filter_date", tmp_date);
	}
	if (!Session.get("selected_navitem")) {
	    Session.set("selected_navitem", 14);
	}
	if (!Session.get("filter_status")) {
	    var filter_status = new Array();
	    filter_status.push("on");
	    Session.set("filter_status", filter_status);
	}
	if (!Session.get("filter_term")) {
	    var filter_term = ".*";
	    Session.set("filter_term", filter_term);
	}
	if (!Session.get("filter_limit")) {
	    var filter_limit = 1;
	    Session.set("filter_limit", filter_limit);
	}
	if (!Session.get("selected_links")) {
	    var selected_links = [];
	    Session.set("selected_links", selected_links);
	}
	
    Meteor.setTimeout(function() {
	// bei jedem Start schauen: wenn der User autoupdate wünscht, dann IP
	// updaten
		if (Meteor.userId() && Meteor.user().profile.autoupdateip) {
		    // TODO refactoring, wird noch woanders benutzt
		    if (Meteor.user().profile.autoupdateip == true) {
			Meteor.http.call("GET", "http://api.hostip.info/get_json.php",
				function(error, result) {
				    if (error)
				    	console.log("Fehler beim ermitteln der Benutzer-IP");
				    if (result)
				    	Meteor.user().profile.ip = result.data.ip;
				});
		    }
		    // unabhängig von autoupdate schauen wir, ob die gewünschte IP
		    // online ist
			Meteor.call("checkJDOnlineStatus", {
			    ip : Meteor.user().profile.ip,
			    port : Meteor.user().profile.port
			}, function(error, isOnline) {
			    if (error)
			    	console.log("Fehler beim prüfen des Online-Status");
			    Session.set("JDOnlineStatus", isOnline);
			});
		    // TODO Link Counts holen...
		}
    }, 3000);
});

// Template-Helper für handlebars
// format an ISO date using Moment.js
// http://momentjs.com/
// moment syntax example: moment(Date("2011-07-18T15:50:52")).format("MMMM
// YYYY")
// usage: {{dateFormat creation_date format="MMMM YYYY"}}
Handlebars.registerHelper('dateFormat', function(context, block) {
    if (window.moment) {
	moment().lang('de');
	var f = block.hash.format || "MMM Do, YYYY";
	if (context && moment(context).isValid())
	    return moment(context).format(f);
	return "kein Datum";
    }
    return "kein Datum"; // moment plugin not available. return data as is.;
});

// Template-Helper für handlebars
// Session Objekt in Handlebars direkt nutzen
Handlebars.registerHelper('session', function(input) {
    return Session.get(input);
});

//
// Handlebars-Funktionen
//
// Connected-Status nutzen für Fehlermeldungsanzeige
Template.page.notConnected = function() {
    return !Meteor.status().connected;
};
// Funktion um zu bestimmen, ob irgend ein Link ausgewählt ist
Template.navigation.isAnyLinkSelected = function() {
    if (Session.get("selected_links") && Session.get("selected_links").length)
	return true;
    return false;
};
// Funktion um den letzten Suchbegriff wieder ins Input Feld einzutragen
Template.navigation.getLastSearchTerm = function() {
    var lastterm = Session.get("filter_term");
    if (lastterm && lastterm != "" && lastterm != ".*")
	return lastterm.replace(/\.\*/g,"");
    return undefined;
};
// Funktion um die Anzahl der Seiten als badge anzuzeigen
Template.navigation.getSiteCount = function() {
    return Sites.find({}).count();
};
// Links-Outlet: alle Links, die gerade in der Subscription sind
Template.linklist.links = function() {
    //var links = Links.find({});
    //if (links.count() == 0) return false;
    return Links.find({});
};
// Link-Größe von Kilobyte in MB umwandeln
Template.link.getSizeinMB = function() {
    if (this.size && this.size > 0)
	return Math.round(this.size / 1048576) + " MB";
    return undefined;
};
// Status-Icon auswählen je nach Status des Links
Template.link.getStatusIcon = function() {
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
Template.link.isLinkSelected = function() {
    if (_.contains(Session.get("selected_links"), this._id))
	return true;
    return false;
};
// Funktion, die anhand der Source-URL im Link Objekt den zugehörigen Namen raussucht
Template.link.getSourceName = function() {
    if (Session.get("sites_completed") == true) {
	var site = Sites.findOne({
	    url : this.source
	}, {
	    fields : {
		url : 1,
		name : 1
	    }
	});
	if (site)
	    return site.name;
    } else
	return this.source;
};
// TODO Player-Widget zurückgeben, wenn es einen embedabble player gibt
Template.link.getPlayerWidget = function() {
    // Soundcloud: <a href="http://soundcloud.com/matas/hobnotropic"
    // class="sc-player">My new dub track</a>
    // Youtube: schauen
    // zippyshare: testen: <script type="text/javascript"
    // src="http://api.zippyshare.com/api/embed.js"></script>
    // vimeo: auch machen!

    // This is the oEmbed endpoint for Vimeo (we're using JSON)
    // (Vimeo also supports oEmbed discovery. See the PHP example.)

    if (this.status !== 'off') {
	if (this.hoster === "soundcloud.com")
	    return "<i class=\" icon-play\"><a href=\"" + this.url
		    + "\" class=\"sc-player\"></a></i>";
	else if (this.hoster === "zippyshare.com")
	    // Link aufsplitten, so dass wir die Bestandteile bekommen...
	    return "<script type='text/javascript'>var zippywww='www49';var zippyfile='67788444';var zippydown='101010';var zippyfront='ffffff';var zippyback='101010';var zippylight='ffffff';var zippywidth=30;var zippyauto=false;var zippyvol=80;</script>";
	else if (this.hoster === "youtube.com")
	    return undefined;
	else if (this.hoster === "vimeo.com") {
	    // TODO diese Links müssen asynchron erstellt werden, das dauert
	    // sonst zu lange...

	    var vimeoEndpoint = 'http://www.vimeo.com/api/oembed.json';
	    var callback = function(video) {
		return unescape(video.html);
	    };
	    var url = vimeoEndpoint + '?url=' + encodeURIComponent(this.url)
		    + '&callback=' + callback + '&width=30';

	    // Meteor.http.get(url);
	}
    } else
	return "<i class=\"icon-ban-circle\"></i>";
};
// Funktion um alle Seiten ins Template zu geben (die subscription)
Template.sitesDialog.sites = function() {
    return Sites.find({});
};
// Funktion, um den Feed-Typ per Icon zu symbolisieren
Template.sitesDialog.getFeedTypeIcon = function(data) {
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
Template.sitesDialog.isOwner = function() {
    if (this.creator === Meteor.users.find({_id : Meteor.userId()}).fetch()[0].profile.id)
	return true;
    return false;
};
// Funktion, um ein Eingabeelement auszuwählen und den Focus drauf zu setzen
var activateInput = function(input) {
    input.focus();
    input.select();
};
// Session Variablen, um Dialoge anzuzeigen
var openAccountSettingsDialog = function() {
    Session.set("showAccountSettingsDialog", true);
};

var openAddLinkDialog = function() {
    Session.set("showAddLinkDialog", true);
};

var openAddSiteDialog = function() {
    Session.set("showAddSiteDialog", true);
};

var openSitesDialog = function() {
    Session.set("showSitesDialog", true);
};

//
// Eventhandler
//
// Eventhandler, um das Fenster zu schließen, wenn der Beenden Knopf in der ConnectionWarning gedrückt wird
Template.connectionLostWarning.events({
    'click #terminateappbutton' : function(context) {
	if ($.browser.opera || $.browser.mozilla)
	    window.close();
	else {
	    window.open('', '_self', '');
	    window.close();
	}
    }
});

// Klick auf Login-Button
Template.user_loggedout.events({
    'click #login' : function() {
	// wir loggen den User mit Facebook ein, erbitten Zugriff auf seine
	// eMail-Adresse
	Meteor.loginWithFacebook({
	    requestPermissions : [ 'email' ]
	}, function(error) {
		//TODO hier alert ausgeben
	    if (error)
	    	throw error;
		// wenn die User-IP geupdate werden soll...
		if (Meteor.user().profile.autoupdateip === true) {
		    // TODO JDOnlineStatus beim starten der app oder beim
		    // einloggen prüfen?? Eigentlich Start...aber Login geht
		    // auch...

		    // dann rufen wir die neue IP ab und speichern sie im Profil
		    Meteor.http.call("GET",
			    "http://api.hostip.info/get_json.php", function(
				    error2, result) {
				if (error2)
				    console.log("Fehler beim ermitteln der Benutzer-IP");
				if (result)
				    Meteor.users.update({
					_id : Meteor.userId()
				    }, {
					$set : {
					    'profile.ip' : result.data.ip
					}
				    });
		    });
		}
	    }
	);
    }
});

// Logout-Eventhandler
Template.user_loggedin.events({
    'click #logout' : function() {
	Meteor.logout(function(error) {
	    if (error) {
			console.log("Fehler beim ausloggen.");
	    } else {
		//TODO  ggf. Session-Variablen zurücksetzen...
	    }
	});
    },
	//Accounteinstellungen anzeigen
    'click #showsettings' : function(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
	openAccountSettingsDialog();
	return false;
    }
});

Template.navigation.rendered = function() {
	$('li.linkfilter').removeClass("active");
	var activenumber = parseInt(Session.get("selected_navitem"));
	$('li.linkfilter #' + activenumber).parent().addClass("active");

};

//Eventhandler für die Navigationsleiste
Template.navigation.events({
	//Seite hinzufügen Dialog öffnen
    'click #addsitebutton' : function(event) {
    event.preventDefault();
	openAddSiteDialog();
	activateInput($("#newsiteurl"));
	return false;
    },
	//Seiten anzeigen Dialog öffnen
    'click #showsitesbutton' : function(event) {
    event.preventDefault();
	openSitesDialog();
	return false;
    },
	//Links downloaden Aktion ausführen
    'click #downloadbutton' : function(event, template) {
		Session.set("progressActive",true);
		Session.set("progress",5);
		
		var selected = Session.get("selected_links");
	
		var selectedurls = _.pluck(Links.find({
		    _id : {
			$in : selected
		    }
		}, {
		    fields : {
			url : 1
		    }
		}).fetch(), 'url');
	
		var urls_per_request = 20;
		var times = parseInt(Math.ceil(selectedurls.length / urls_per_request));
		var progressstep = 95 / (times*2);
		
		for ( var i = 1; i <= times; i++) {
			Session.set("progressState","progress-info");
			var oldprogress = Session.get("progress");
			Session.set("progress", parseInt(oldprogress + progressstep));
		
		    var sel_links = selectedurls.splice(0, urls_per_request);
	
		    var links_chained = _.reduce(sel_links, function(memo, aUrl) {
			return String(memo + " " + aUrl);
		    });

			var grabberoption;
			
			if (links_chained.match(/youtube|vimeo/i))
				grabberoption = "grabber1";
			else grabberoption = "grabber0";

		    var requeststring = "http://" + Meteor.user().profile.ip + ":"
		    	    + Meteor.user().profile.port
		    	    + "/action/add/links/" + grabberoption + "/start1/" + links_chained;
		    
		    requeststring = requeststring.replace("?","%3F").replace("=","%3D");
		    
		    Meteor.call("sendLinks", requeststring, function(error, result) {
		        // TODO error handling, wenn es mehrfach fehlschlägt, dann abbrechen
		        if (error)
		        {
		        	console.log(error);
		        	Session.set("progressState","progress-warning");
		        }
		    	if (result)
		    	{	
		    		console.log(result);	    	
		    	}
		    	
		    	var oldprogress = Session.get("progress");
		    	Session.set("progress", parseInt(oldprogress + progressstep));
		    	console.log(Session.get("progress"));
		    	if (Session.get("progress") >= 99)
		    	{
		    		if (Session.get("progressState") == "progress-warning")
		    			Session.set("progressState","progress-danger");
		    		else Session.set("progresState","progress-success"); 
		    		Session.set("progress",100);
		    		Session.set("progressActive",false);
		    		Meteor.setTimeout(function() {
		    			Session.set("progress",undefined);
		    			Session.set("progressState",undefined);
		    		},3500);
		    	}
		    		
		    });   
		}
    },
	//Link-URLs kopieren Aktion ausführen
    'click #copybutton' : function(event, template) {
	var selected = Session.get("selected_links");

	var selectedurls = _.pluck(Links.find({
	    _id : {
		$in : selected
	    }
	}, {
	    fields : {
		url : 1
	    }
	}).fetch(), 'url');
	writeConsole(_.reduce(selectedurls, function(memo, aUrl) {
	    return memo + aUrl + "<br/>";
	}));
    },
    'click #addlinkbutton' : function(event, template) {
	event.preventDefault();
	openAddLinkDialog();
	activateInput($('#newlinkurl'));
	return false;
    },
    'click .linkfilter' : function(event, template) {
	var tmp_date = new Date();
	tmp_date.setDate(tmp_date.getDate() - event.srcElement.id);
	Session.set("filter_date", tmp_date);
	Session.set("selected_navitem", parseInt(event.srcElement.id));
	$('li.linkfilter').removeClass("active");
	var activenumber = parseInt(Session.get("selected_navitem"));
	$('li.linkfilter #' + activenumber).parent().addClass("active");
	
	Session.set("filter_limit", 1);
    },
    'submit #searchform' : function(event, template) {
	event.preventDefault();
	var term = template.find('#searchfield').value;

	if (term && term != undefined && term != "") {
	    var prev_filter_date = Session.get("filter_date");
	    Session.set("prev_filter_date", prev_filter_date);
	    var tmp_date = new Date();
	    tmp_date.setDate(tmp_date.getDate() - 365);
	    Session.set("filter_date", tmp_date);
	    Session.set("filter_status", [ "on", "off", "unknown" ]);
	    Session.set("filter_term", ".*" + term.replace("\s", ".*") + ".*");
	} else {
	    Session.set("filter_term", ".*");

	    if (Session.get("prev_filter_date"))
		Session.set("filter_date", Session.get("prev_filter_date"));
	    else {
		var tmp_date = new Date();
		tmp_date.setDate(tmp_date.getDate() - 14);
		Session.set("filter_date", tmp_date);
	    }
	    Session.set("filter_status", [ "on" ]);
	}
	Session.set("filter_limit",1);
	return false;
    }
});

Template.page.rendered = function() {
	topMenuHeight = 90;
	itemBadgeSize = 30;
	itemHeight = 29;
	
	badgeHeight = itemBadgeSize * itemHeight;
	
	currentBadge = 1
	
	$(window).scroll(function(){
	   // Get container scroll position
	   var fromTop = $(this).scrollTop()+topMenuHeight;
	   
	   if (fromTop >= (currentBadge * badgeHeight)) {
	   	console.log("nachladen");
	   	currentBadge++;
	   	Session.set("filter_limit",currentBadge);
	   }
	});
};

//Events für das Template der Linkliste
Template.linklist.events = ({
	//Links filtern (alle / auch unbekannte)
    'click #filter_links' : function(event, template) {
    event.preventDefault();
	var tmp_status = Session.get("filter_status");

	if (_.indexOf(tmp_status, "unknown") != -1)
	    tmp_status = _.without(tmp_status, "off", "unknown");
	else {
	    tmp_status = new Array("on", "unknown");
	}
	Session.set("filter_status", _.uniq(tmp_status));
	Session.set("filter_limit",1);
    },
	//alle Links anhaken, die gerade zu sehen sind
    'click #select_all' : function(event, template) {
	if (event.srcElement.checked == true) {
	    var selected = _.pluck(Links.find({}, {
		fields : {
		    _id : 1
		}
	    }).fetch(), '_id');
	    Session.set("selected_links", selected);
	} else
	    Session.set("selected_links", []);
    }
});
//UI-Effekte aktivieren, wenn ein Link gerendered wurde
Template.link.rendered = function() {
    // TODO: popover geht nicht
    $('.linkname').editable();
		    
    Links.find().forEach(function(link) {
    	htmlstr ="<form class='newcommentform' id=" + link._id + "><textarea id='new_comment' name='new_comment' placeholder='Kommentar eingeben' rows='4'></textarea><button class='btn btn-small btn-primary' type='submit'>Posten</button></form>";
       	var commentsstr = "<p class='author'><small>Thimo</p><p>Testkommentar1</small></p><br/><p><small>Testkommentar2</p><br/></small><p>Seit ihr alle komisch Mensch, ich find das super.</p><br/>";
       	//for (comment in thelinks.comments) {
       	//	commentsstr = commentsstr + "<p><small>" + comment.creator + ":" + comment.message + "</small></p>"
     
            	$("#"+link._id+'_comments').popover({animation:true,placement:"bottom",trigger:"click",title:"Kommentare",html:true,content:commentsstr+htmlstr,delay: { show: 300, hide: 100 }});
    });
};

//Events für die einzelnen Link-Objekte
Template.link.events({
	//TODO geht schonmal einigermaßen....
	'submit .newcommentform' : function(event, template) {
		event.preventDefault();
		var newmessage = template.find('#new_comment').value;
		var linkid = event.srcElement.id;
		return Meteor.call('createComment',linkid,newmessage, function(error, result) {
			if (error)
				console.log(error);
			if (result)
				console.log(result);
		});
	},
	//Anhaken eines Links
    'click .link_checkbox' : function(event, template) {
	var selected = Session.get("selected_links");
	if (event.srcElement.checked) {
	    var idx = selected.indexOf(this._id);
	    if (idx == -1) {
		selected.push(this._id);
		Session.set("selected_links", selected);
	    }
	} else {
	    var idx = selected.indexOf(this._id);
	    if (idx != -1) {
		selected.splice(idx, 1);
		Session.set("selected_links", selected);
	    }
	    if (!selected.length) $('#select_all').prop("checked",false);
	}
    },
	//Link-Status aktualisieren
    'click .icon-refresh' : function(event, template) {
	event.srcElement.className = "icon-refreshing";
	
	var theurl = this.url
	
	Meteor.call("refreshLink", theurl, function(error, result) {
	    if (error)
	    {
	    	console.log("Fehler beim refreshen des Links " + theurl);
	    	event.srcElement.className = "icon-remove";
	    }
		if (result)
		{
			event.srcElement.className = "icon-refresh";
		}
	});
		
    },
	//X-Editable Formular - Namensänderung übernehmen
    'submit .form-inline' : function(event, template) {
	event.preventDefault();
	var newName = template.find('.editable-input input').value;
	Links.update({
	    _id : this._id
	}, {
	    $set : {
		name : newName
	    }
	});
    },
	//TODO nur 1 Kommentarbox zulassen, die anderen hiden....
	//Kommentare für einen Linkanzeigen
    'click .icon-comment' : function(context) {
            
	$('#'+context.srcElement.id+"_comments").popover('show'); // show tooltip
    },
	//Link liken
    'click .like' : function(context) {
	// This query succeeds only if the voters array doesn't contain the user
	query = {
	    _id : this._id,
	    likers : {
		'$ne' : Meteor.userId()
	    }
	};
	// Update to add the user to the array and increment the number of
	// votes.
	update = {
	    '$push' : {
		'likers' : Meteor.userId()
	    },
	    '$inc' : {
		likes : 1
	    }
	};
	Links.update(query, update);
    }
});
//Events im Link hinzufügen Dialog
Template.addLinkDialog.events({
	//Dialog schließen
    'click .cancel' : function() {
	// User hat abgebrochen, Dialog schließen
	Session.set("showAddLinkDialog", false);
	Session.set("status", undefined);
    },
	//Link validieren - ist das eine gültige URL
    'input #newlinkurl' : function(event, template) {
	if (!event.srcElement.validity.valid) {
	    template.find('.addlink').disabled = true;
	} else {
	    template.find('.addlink').disabled = false;
	}
    },
	//Link in die Datenbank aufnehmen, bzw. vorher prüfen
    'click .addlink' : function(event, template) {
	event.preventDefault();
	Session.set("status",
		'<p class="pull-left statustext"><small><i class="icon-loader"></i> Link wird überprüft</small></p>');
	var newlinkurl = template.find("#newlinkurl").value;
	//TODO timeout scheint bei post nicht zu funktionieren
	Meteor.call('createLink', newlinkurl, function(error, result) {
    // TODO erorr number special, dann anderes zeichen
    if (error)
    	Session.set("status",'<p class="pull-left statustext"><i class="icon-remove-red"></i> <small>' + error.details + "</small></p>");
	
    if (result)
    	Session.set("status",'<p class="pull-left statustext"><i class="icon-ok-green"></i> <small>' + "Link hinzugefügt!</small></p>");

	});
	}
});
//Events für den Seite hinzufügen Dialog
Template.addSiteDialog
	.events({
		// User hat abgebrochen, Dialog schließen
	    'click .cancel' : function() {
		
		Session.set("showAddSiteDialog", false);
		Session.set("status", undefined);
	    },
		// Seiten-URL validieren
	    'input #newsiteurl' : function(event, template) {
		if (!event.srcElement.validity.valid) {
		    template.find('.addsite').disabled = true;
		} else {
		    template.find('.addsite').disabled = false;
		}
	    },
		//Seite prüfen und hinzufügen
	    'submit #addsiteform' : function(event, template) {
		event.preventDefault();
		Session
			.set(
				"status",
				'<p class="pull-left statustext"><small><i class="icon-loader"></i> Seite wird überprüft</small></p>');
		var newsiteurl = template.find('#newsiteurl').value;
		Meteor.call('createSite', newsiteurl, function(error, result) {
		    // TODO erorr number special, dann anderes zeichen
		    if (error)
			Session.set("status",
				'<p class="pull-left statustext"><i class="icon-remove-red"></i> <small>'
					+ error.details + "</small></p>");
		    if (result)
			Session.set("status",
				'<p class="pull-left statustext"><i class="icon-ok-green"></i> <small>'
					+ "Seite hinzugefügt!</small></p>");
		});
	    }
	});
//Wenn der Seitendialog gerendered wurde, UI Widgets aktivieen
Template.sitesDialog.rendered = function() {
    $('.sitename').editable();
};
//Events des Seiten anzeigen Dialogs
Template.sitesDialog.events({
	// User hat abgebrochen, Dialog schließen
    'click .cancel' : function() {
	
	Session.set("showSitesDialog", false);
    },
    // Hilfsfunktion, um die Eingaben in X-Editable in der Meteor DB einzutragen
	'submit .form-inline' : function(event, template) {
	event.preventDefault();
	var newName = template.find('.editable-input input').value;
	Sites.update({
	    _id : this._id
	}, {
	    $set : {
		name : newName
	    }
	});
    },
    'click .icon-trash' : function(event, template) {
    	Sites.remove({_id:this._id});
    }
});
//Events des Einstellungs-Dialogs
Template.accountSettingsDialog.events({
	//IP-Adresse aktualisieren Button - IP checken und anzeigen
    'click #refreship' : function(event, template) {
    Session.set("status",
    	'<p class="pull-left"><i class="icon-refreshing"></i></p>');
    
	var aport = Meteor.user().profile.port;
	Meteor.http.call("GET", "http://api.hostip.info/get_json.php",
		function(error, result) {
		    if (error)
				console.log("Fehler beim ermitteln der Benutzer-IP");
			if (result)
		    Meteor.users.update({
			_id : Meteor.userId()
		    }, {
			$set : {
			    'profile.ip' : result.data.ip,
			}
		    });
		    template.find("#ip").value = result.data.ip;
		    // neue IP nutzen und checken, ob hier ein JD läuft...
		    //
		    Meteor.call("checkJDOnlineStatus", {
			ip : result.data.ip,
			port : aport
		    }, function(error2, isOnline) {
			if (error2) {
			    console.log("Fehler beim ermitteln des Online-Status");
			}
			Session.set("JDOnlineStatus", isOnline);
		    Session.set("status",undefined);
		    });
		});
    },
	//IP-Feld für Eingbae aktivieren/deaktivieren, je nachdem ob autoupdate eingeschaltet ist
    'click #autoupdate' : function(event, template) {
	if (template.find("#autoupdate").checked)
	    $('#ip').prop("disabled", true);
	else
	    $('#ip').prop("disabled", false);
    },
	//eingaben speichern und IP nochmal updaten, falls der User was komisches eingegeben hat
    'click .save' : function(event, template) {
	var aip = template.find("#ip").value;
	var aport = template.find("#port").value;
	var aupdateip = template.find("#autoupdate").checked;

	if (aupdateip === true) {
	    Meteor.http.call("GET", "http://api.hostip.info/get_json.php",
		    function(error, result) {
			if (error)
			    console.log("Fehler beim ermitteln der Benutzer-IP");
			Meteor.users.update({
			    _id : Meteor.userId()
			}, {
			    $set : {
				'profile.ip' : result.data.ip,
				'profile.port' : aport,
				'profile.autoupdateip' : aupdateip
			    }
			});
			// neue IP nutzen und checken, ob hier ein JD läuft...
			//
			Meteor.call("checkJDOnlineStatus", {
			    ip : result.data.ip,
			    port : aport
			}, function(error2, isOnline) {
			    if (error2) {
				console.log("Fehler beim ermitteln des Online-Status");
			    }
			    Session.set("JDOnlineStatus", isOnline);
			});
		    });
	} else {
	    // wenn Aut-Update aus ist, nehmen wir die IP-Adresse, die der User
	    // im Formular eingetragen hat
	    Meteor.users.update({
		_id : Meteor.userId()
	    }, {
		$set : {
		    'profile.port' : aport,
		    'profile.ip' : aip,
		    'profile.autoupdateip' : aupdateip
		}
	    });
	}
	// es wurde gespeichert, Dialog schließen
	Session.set("showAccountSettingsDialog", false);
    },

    'click .cancel' : function() {
	// User hat abgebrochen, Dialog schließen
	Session.set("showAccountSettingsDialog", false);
    }
});
//Hilfsfunktion für die Kopierenfunktion von Links - alle Link URLs in einem neuen Fenster anzeigen
function writeConsole(content) {
    top.consoleRef = window.open('', 'Links', 'width=250,height=500'
	    + ',menubar=0' + ',toolbar=0' + ',status=0' + ',scrollbars=0'
	    + ',resizable=1');
    top.consoleRef.document.writeln('<html><head><title>Console</title></head>'
	    + '<body bgcolor=white onLoad="self.focus()">' + content
	    + '</body></html>');
    alert("Bitte JDownloader starten und alles markieren und kopieren.\nJDownloader erkennt dann die Links");
    top.consoleRef.document.close();
}