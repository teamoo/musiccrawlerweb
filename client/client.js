
// Always be subscribed to the currently filtered links
Meteor.autosubscribe(function () {
  var filter_date = Session.get('filter_date');
  var filter_status = Session.get('filter_status');
  var filter_term = Session.get('filer_term');
  if (filter_date && filter_status)
    Meteor.subscribe('links', filter_date, filter_status, filter_term, function onComplete(){
         // set a session key to true to indicate that the subscription is completed.
         Session.set('links_completed', true);
});
    Meteor.subscribe('sites');
});

//Autorun: wenn sich die IP-Adresse ändert, JDOnlineStatus checken!
//Meteor.autorun(function(handle) {
// if (!Session.equals("shouldAlert", true)) return;
//  handle.stop();
//  alert("Oh no!");
//});

//Template-Helper für handlebars
//  format an ISO date using Moment.js
//  http://momentjs.com/
//  moment syntax example: moment(Date("2011-07-18T15:50:52")).format("MMMM YYYY")
//  usage: {{dateFormat creation_date format="MMMM YYYY"}}
Handlebars.registerHelper('dateFormat', function(context, block) {
  if (window.moment) {
	moment().lang('de');
    var f = block.hash.format || "MMM Do, YYYY";
	if (moment(context).isValid())return moment(context).format(f);
	return context;
  }else{
    return context;   //  moment plugin not available. return data as is.
  };
});

Handlebars.registerHelper('session',function(input){
    return Session.get(input);
});

//
//Handlebar-Funktionen
//
//Links-Outlet: alle Links, die gerade in der subscription sind
Template.linklist.links = function () {
    //var links = Links.find({});
	//if (links.count() == 0) return false;
	return Links.find({});
};

Template.sitesDialog.sites = function () {
	return Sites.find({});
};


//Link-Größe von Kilobyte in MB umwandeln
Template.link.getSizeinMB = function (data) {
	if (this.size && this.size > 0)
	{
		return Math.round(this.size/1048576) + " MB";
	}
	return undefined;
};

//Status-Icon auswählen je nach Status
Template.link.getStatusIcon = function (data) {
	switch (this.status)
	{
		case 'on':	return "icon-ok"
		case 'off': return  "icon-remove"
		case 'unknown':	return "icon-remove"
	}
};

Template.sitesDialog.getFeedTypeIcon = function (data) {
	switch (this.type)
	{
		case 'feed': return "icon-rss"
		case "facebook-group" : return "icon-facebook"
	}
};

//Status-Icon auswählen je nach Status
Template.link.getSourceName = function (data) {
	//TODO: Namen anzeigen
	return this.source;
};

//Player-Widget zurückgeben, wenn es einen embedabble player gibt
Template.link.getPlayerWidget = function (data) {
	//Soundcloud: <a href="http://soundcloud.com/matas/hobnotropic" class="sc-player">My new dub track</a>
	//Youtube: schauen
	//zippyshare: testen: <script type="text/javascript" src="http://api.zippyshare.com/api/embed.js"></script>
	//vimeo: auch machen!
	
    // This is the oEmbed endpoint for Vimeo (we're using JSON)
    // (Vimeo also supports oEmbed discovery. See the PHP example.)
	
	if (this.status === 'on')
	{
		if (this.hoster === "soundcloud.com")
			return "<i class=\" icon-play\"><a href=\"" + this.url + "\" class=\"sc-player\"></a></i>";
		else if (this.hoster === "zippyshare.com")
			//Link aufsplitten, so dass wir die Bestandteile bekommen...
			return "<script type='text/javascript'>var zippywww='www49';var zippyfile='67788444';var zippydown='101010';var zippyfront='ffffff';var zippyback='101010';var zippylight='ffffff';var zippywidth=30;var zippyauto=false;var zippyvol=80;</script>";
		else if (this.hoster === "youtube.com")
			return undefined
		else if (this.hoster === "vimeo.com")
		{
			var vimeoEndpoint = 'http://www.vimeo.com/api/oembed.json';
			var callback = function (video) {
				return unescape(video.html);
			};
			var url = endpoint + '?url=' + encodeURIComponent(this.url) + '&callback=' + callback + '&width=30';
		}
	}
	else return "<i class=\"icon-ban-circle\"></i>";
};

//Connected-Status nutzen für Fehlermeldungsanzeige
Template.page.notConnected = function(){
	return !Meteor.status().connected;
};

 var openAccountSettingsDialog = function () {
	Session.set("showAccountSettingsDialog", true);
};

Template.page.showAccountSettingsDialog = function () {
  return Session.get("showAccountSettingsDialog");
};

 var openAddLinkDialog = function () {
	Session.set("showAddLinkDialog", true);
};

Template.page.showAddLinkDialog = function () {
  return Session.get("showAddLinkDialog");
};

Template.linklist.isLinksComplete = function () {
  return Session.get("links_completed");
};

var openAddSiteDialog = function () {
	Session.set("showAddSiteDialog", true);
};

Template.page.showAddSiteDialog = function () {
  return Session.get("showAddSiteDialog");
};

var openSitesDialog = function () {
	Session.set("showSitesDialog", true);
};

Template.page.showSitesDialog = function () {
  return Session.get("showSitesDialog");
};

//
//Eventhandler
//
//TODO geht noch nicht
//Linkfilter aktualisieren
Template.select_all_links.events({
'click': function (event, template) {
	if (event.srcElement.checked == true) $('[type=checkbox]').prop("checked", true);
	else $('[type=checkbox]').prop("checked", false);
}
});

Template.downloadlinksbutton.events({
'click' : function (event, template) {
	var selected = Array();
	$('input:checkbox:checked[class=link_checkbox]').each(function() {
		selected.push(this.id);
	});
	console.log(Links.find({_id : {$in : selected}}));
}
});

Template.link.rendered = function() {
		$('input:checkbox').click(function() {
		var buttonsChecked = $('input:checkbox:checked');
		console.log(buttonsChecked.length);
        if (buttonsChecked.length) $('.download').attr('disabled',false);
        else $('.download').attr('disabled',true);
    });
};

//TODO: bringt nichts
Template.header.preserve({
'input[id]': function (node) { return node.id; }
})

//TODO: testen
Template.header.events({
'submit #searchform': function (event, template) {
	event.preventDefault();
	var tmp_date = new Date();
	tmp_date.setDate(tmp_date.getDate()-365);
	Session.set("filter_date",tmp_date);
	Session.set("filter_status",['on','off','unknow']);
		
	var term = template.find('#searchfield').value;
		
	if (term && term != undefined && term != "")
	{
		Session.set("filter_term", term.replace("\s",".*"));
	} else Session.set("filter_term","");
}
});

Template.link_filter_status.events({
'click': function (context) {
	var tmp_status = Session.get("filter_status");
	
	if ($.inArray("off",tmp_status) == true) tmp_status=new Array("on");
	else {
		tmp_status.push("off");
		tmp_status.push("unknown");
	};
	Session.set("filter_status",tmp_status);
}
});

Template.terminateappbutton.events({
'click': function (context) {
	if ($.browser.opera || $.browser.mozilla) window.close(); 
	else {
			window.open('','_self','');
			window.close();
		};

}
});


//TODO: geht nicht
Template.comment_link.events({
'click': function (context) {
	   $('.popover').popover('show'); //initialize all tooltips in this template
}
});

Template.link.rendered = function() {
   $('.popover').popover(); //initialize all tooltips in this template
};

//Linkfilter(Date) aktualisieren
Template.linkfilter_items.events({
'click': function (context) {
	var tmp_date = new Date();
	tmp_date.setDate(tmp_date.getDate()-context.srcElement.id);
	Session.set("filter_date",tmp_date);
}
});

//Klick auf Login-Button
Template.user_loggedout.events({
    'click #login': function () {
		//wir loggen den User mit Facebook ein, erbitten Zugriff auf seine eMail-Adresse
		Meteor.loginWithFacebook({
		  requestPermissions: ['email']
		}, function (err) {
		  if (err)
			//TODO: Error-Handling
			console.log(err);
		  else {
			//wenn die User-IP geupdate werden soll...
			if (Meteor.user().profile.autoupdateip === true)
			{
				//JDOnlineStatus beim starten der app oder beim einloggen prüfen?? Eigentlich Start...aber Login geht auch...
			
				//dann rufen wir die neue IP ab und speichern sie im Profil
				Meteor.http.call("GET","http://api.hostip.info/get_json.php",
					function (error, result) {
						if (error)
							throw error;
						else {
							Meteor.users.update( { _id: Meteor.userId()}, {$set: {'profile.ip': result.data.ip} } );
						}
					}
				);			
			}
		  }
		});
	}	
});

//Logout-Eventhandler  
Template.user_loggedin.events({
'click #logout': function () {
  Meteor.logout(function (err) {
	  if (err) {
		//TODO: Error handling
		console.log(err);
	  } else {
		//ggf. Session-Variablen zurücksetzen...
	  }
   });
}
});

Template.addlinkbutton.events({
    'click': function () {
		openAddLinkDialog();
    }
});


Template.addsitebutton.events({
    'click': function (event) {
		openAddSiteDialog();
    }
});

Template.showsitesbutton.events({
    'click': function () {
		openSitesDialog();
		return false;
    }
});


//Kontoeinstellungen-Eventhandler  
Template.user_accountsettings.events({
    'click': function () {
		openAccountSettingsDialog();
		return false;
    }
});


Template.like_link.events({
    'click': function (context) {	
		// This query succeeds only if the voters array doesn't contain the user
		query   = {_id: context.srcElement.id, likers : {'$ne': Meteor.userId()}};
		// Update to add the user to the array and increment the number of votes.
		update  = {'$push': {'likers': Meteor.userId()}, '$inc': {likes: 1}}

		Links.update(query, update);
    }
});

Template.addLinkDialog.events({
  'click .addlink': function (event, template) {
	//TODO: Link checken und anzeigen
	var newurl;
	
	newurl = template.find(".linkurl").value;
	//es wurde gespeichert, Dialog schließen
    Session.set("showAddLinkDialog", false);
  },
  'click .cancel': function () {
	//User hat abgebrochen, Dialog schließen
    Session.set("showAddLinkDialog", false);
  },
  'input #newlinkurl': function(event, template) {
		if (!event.srcElement.validity.valid) {
			template.find('.addlink').disabled = true;
		} else {
			template.find('.addlink').disabled = false;
		};
	}		
});

Template.addSiteDialog.events({
  'click .addsite': function (event, template) {
	//TODO: Link checken und anzeigen
	var newurl;
	
	newurl = template.find(".siteurl").value;
	//es wurde gespeichert, Dialog schließen
    Session.set("showAddSiteDialog", false);
  },
  'click .cancel': function () {
	//User hat abgebrochen, Dialog schließen
    Session.set("showAddSiteDialog", false);
  },
  'input #newsiteurl': function(event, template) {
		if (!event.srcElement.validity.valid) {
			template.find('.addsite').disabled = true;
		} else {
			template.find('.addsite').disabled = false;
		};
	}		
});


Template.sitesDialog.events({
  'click .cancel': function () {
	//User hat abgebrochen, Dialog schließen
    Session.set("showSitesDialog", false);
  },	
});


Template.accountSettingsDialog.events({
  'click .save': function (event, template) {
    var aip = template.find(".ip").value;
    var aport = template.find(".port").value;
    var aupdateip = template.find(".autoupdate").checked;

	if (aupdateip === true)
	{
		Meteor.http.call("GET","http://api.hostip.info/get_json.php",
			function (error, result) {
				if (error)
					throw error;
				Meteor.users.update( { _id: Meteor.userId()}, {$set: {'profile.ip': result.data.ip , 'profile.port' : aport, 'profile.autoupdateip' : aupdateip}});
				//neue IP nutzen und checken, ob hier ein JD läuft...
				//
				Meteor.call("checkJDOnlineStatus", {ip : result.data.ip, port: aport} , 
					function (err, isOnline) {
					  if (err) {
					    console.log(err);
					  }
					  Session.set("JDOnlineStatus", isOnline); 
				  	}
				);
			}
		);
	}
	else {
		//wenn Aut-Update aus ist, nehmen wir die IP-Adresse, die der User im Formular eingetragen hat
		Meteor.users.update( { _id: Meteor.userId()}, {$set: {'profile.port' : aport, 'profile.ip': aip} } );
	}
	//es wurde gespeichert, Dialog schließen
    Session.set("showAccountSettingsDialog", false);
  },

  'click .cancel': function () {
	//User hat abgebrochen, Dialog schließen
    Session.set("showAccountSettingsDialog", false);
  }
});

//
//Startup-Funktion
//
//Startup-Eventhandler: wird aufgerufen, wenn der Client bzw. Server vollständig gestartet ist
//leider funktioniert das noch nicht ganz, das Meteor.user() Objekt steht dann noch nicht immer
//zur Verfügung. Workaround: Timer auf 5 Sekunden, dann ist das Objekt im Regelfall verfügbar.
Meteor.startup(function () {
	$('input:checkbox').click(function() {
		var buttonsChecked = $('input:checkbox:checked');
		console.log(buttonsChecked.length);
        if (buttonsChecked.length) $('.download').attr('disabled',false);
        else $('.download').attr('disabled',true);
    });
	
	if (! Session.get("filter_date")) {
		var tmp_date = new Date();
		tmp_date.setDate(tmp_date.getDate()-14);
		Session.set("filter_date",tmp_date);
    };
	
	if (! Session.get("filter_status")) {
		var filter_status = new Array();
		filter_status.push("on");
		Session.set("filter_status",filter_status);
    };
	
	if (! Session.get("filter_term")) {
		var filter_term = "";
		Session.set("filter_term",filter_term);
    };

	Meteor.setTimeout(
		function () {		
			//bei jedem Start schauen: wenn der User autoupdate wünscht, dann IP updaten
			if (Meteor.userId() && Meteor.user().profile.autoupdateip) {
				if (Meteor.user().profile.autoupdateip == true)
				{
					Meteor.http.call("GET","http://api.hostip.info/get_json.php",
						function (error, result) {
							if (error)
								//TODO error handling
								throw result.error;	
							Meteor.user().profile.ip = result.data.ip;
						}
					);
				}
				//unabhängig von autoupdate schauen wir, ob die gewünschte IP online ist
				Meteor.call("checkJDOnlineStatus", Meteor.user().profile.ip, Meteor.user().profile.port, function (err, isOnline) {
					  if (err) {
					    console.log(err);
					  }
					  Session.set("JDOnlineStatus", isOnline); 
				  }
				);
				
				//Link Counts holen...
			};
		},3000
	);
});