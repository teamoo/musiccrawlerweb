//Eventhandler User wird erstellt auf dem Server
Meteor.startup(function () {
	Links._ensureIndex({
		date_published: 1
	});
	Links._ensureIndex({
		url: 1
	}, {
		unique: 1
	});
	Links._ensureIndex({
		source: 1
	});
	Links._ensureIndex({
		status: 1
	});
	Links._ensureIndex({
		downloaders: 1
	});
	Sites._ensureIndex({
		last_crawled: 1
	});
	Sites._ensureIndex({
		creator: 1
	});
	Sites._ensureIndex({
		feedurl: 1
	}, {
		unique: 1
	});
	Sites._ensureIndex({
		url: 1
	}, {
		unique: 1
	});
	Sites._ensureIndex({
		url: 1
	}, {
		groupid: 1
	});
	Meteor.users._ensureIndex({
		id: 1
	}, {
		unique: 1
	});
});
Accounts.onCreateUser(function (options, user) {
	if (options.profile) user.profile = options.profile;
	var accessToken = user.services.facebook.accessToken,
		result;
	// Das Profilbild muessen wir extra abfragen...
	
	try {
		result = Meteor.http.get("https://graph.facebook.com/me/picture?access_token=&redirect=false", {
			params: {
				access_token: accessToken
			}
		});	
	}
	catch (e) {
		console.log("Error receiving user picture from facebook");
	}
	// Benutzerprofil mit den gesammelten Daten anreichen und
	// default-Werte setzen
	user.profile.autoupdateip = true;
	user.profile.showtooltips = true;
	user.profile.showdownloadedlinks = false;
	user.profile.showunknownlinks = false;
	user.profile.filteredsites = [];
	user.profile.searchproviders = ["zippysharemusic", "muzon", "soundcloud"];
	user.profile.ip = "";
	user.profile.port = 10025;
	user.profile.volume = 100;
	user.profile.pictureurl = result.data.data.url;
	// email und username werden direkt im Benutzer gesetzt, daher
	// loeschen wir diese Attribute auch aus dem Profil-Objekt
	user.emails = new Array({
		address: user.services.facebook.email,
		verified: false
	});
	user.username = user.services.facebook.username;
	user.id = user.services.facebook.id;
	user.profile.first_name = user.services.facebook.first_name;
	user.profile.last_name = user.services.facebook.last_name;
	user.profile.gender = user.services.facebook.gender;
	user.profile.locale = user.services.facebook.locale;
	user.admin = false;
	// fertigen Benutzer zurueckgeben, damit er in der Datenbank
	// gespeichert werden kann
	return user;
});