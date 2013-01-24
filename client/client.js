//Clientseitige Methoden
//Hier muss später die Subscription gemacht werden, ja nach Benutzerauswahl
Links = new Meteor.Collection("links");

//Template-Helper für handlebars
//Hier kommt alles rein, was an Logik nicht ins Template soll



//  format an ISO date using Moment.js
//  http://momentjs.com/
//  moment syntax example: moment(Date("2011-07-18T15:50:52")).format("MMMM YYYY")
//  usage: {{dateFormat creation_date format="MMMM YYYY"}}
Handlebars.registerHelper('dateFormat', function(context, block) {
  if (window.moment) {
	moment().lang('de');
    var f = block.hash.format || "MMM Do, YYYY";
    return moment(Date(context)).format(f);
  }else{
    return context;   //  moment plugin not available. return data as is.
  };
});


//Links-Outlet: alle Links, später ggf. jeweils andere Subscriptions anhängen
Template.linklist.links = function () {
    return Links.find({}, {sort: {date: 1, name: 1}, limit:7});
};

//Event-Handler für die Linkliste und die Links...
//brauchen wir momentan nicht, ggf. später, ist ein Relikt aus dem Beispiel
Template.linklist.selected = function () {
var link = Links.findOne(Session.get("selected_link"));
return link && link.url;
};

Template.linklist.events({
'click': function () {

}
});

Template.link.selected = function () {
return Session.equals("selected_link", this._id) ? "selected" : '';
};

Template.link.events({
'click': function () {
  Session.set("selected_link", this._id);
}
});

Template.link.getSizeinMB = function (data) {
	if (this.size && this.size > 0)
	{
		return Math.round(this.size/1048576) + " MB";
	}
	return undefined;
};

Template.link.getStatusIcon = function (data) {
	switch (this.status)
	{
		case 'on':	return "icon-ok"
		case 'off': return  "icon-remove"
		case 'unknown':	return "icon-remove"
	}
};

Template.link.getPlayerWidget = function (data) {
	//Soundcloud: <a href="http://soundcloud.com/matas/hobnotropic" class="sc-player">My new dub track</a>
	//Youtube: schauen
	//zippyshare: testen: <script type="text/javascript" src="http://api.zippyshare.com/api/embed.js"></script>
	//vimeo: auch machen!
	
    // This is the oEmbed endpoint for Vimeo (we're using JSON)
    // (Vimeo also supports oEmbed discovery. See the PHP example.)
    var vimeoEndpoint = 'http://www.vimeo.com/api/oembed.json';
		
	if (this.hoster === "soundcloud.com")
		return "<a href=" + this.url + " class='sc-player'></a>";
	else if (this.hoster === "zippyshare.com")
		//Link aufsplitten, so dass wir die Bestandteile bekommen...
		return "<script type='text/javascript'>var zippywww='www49';var zippyfile='67788444';var zippydown='101010';var zippyfront='ffffff';var zippyback='101010';var zippylight='ffffff';var zippywidth=30;var zippyauto=false;var zippyvol=80;</script>"
	else if (this.hoster === "youtube.com")
		return undefined
	else if (this.hoster === "vimeo.com")
	{
        var callback = function (video) {
			return unescape(video.html);
		};
        var url = endpoint + '?url=' + encodeURIComponent(this.url) + '&callback=' + callback + '&width=30';
	}
	else return undefined
};


Template.page.notConnected = function(){
	return !Meteor.status().connected;
};

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
  
Template.user_loggedin.events({
'click #logout': function () {
  Meteor.logout(function (err) {
	  if (err) {
		console.log(err);
	  } else {

	  }
   });
}
});
  
Template.user_accountsettings.events({
    'click': function () {
		openAccountSettingsDialog();
		return false;
    }
});

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

Template.addlinkbutton.events({
    'click': function () {
		openAddLinkDialog();
		return false;
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
  }
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
				Meteor.call("checkJDOnlineStatus", result.data.ip, aport, 
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

//Startup-Eventhandler: wird aufgerufen, wenn der Client bzw. Server vollständig gestartet ist
//leider funktioniert das noch nicht ganz, das Meteor.user() Objekt steht dann noch nicht immer
//zur Verfügung. Workaround: Timer auf 5 Sekunden, dann ist das Objekt im Regelfall verfügbar.
Meteor.startup(function () {
	Meteor.setTimeout(
		function () {		
			//bei jedem Start schauen: wenn der User autoupdate wünscht, dann IP updaten
			if (Meteor.user().profile.autoupdateip) {
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
				//
				Meteor.call("checkJDOnlineStatus", Meteor.user().profile.ip, Meteor.user().profile.port, function (err, isOnline) {
					  if (err) {
					    console.log(err);
					  }
					  Session.set("JDOnlineStatus", isOnline); 
				  }
				);
			};
		},3000
	);
});