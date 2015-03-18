//TODO Logging einbauen. Notifications in adminnotifications db loggen mit zusätzlichen Metadaten
Meteor.startup(function () {
    winston = Meteor.npmRequire('winston');

	Facts.setUserIdFilter(function (userId) {
		console.log(userId);
	
		var user = Meteor.users.findOne(userId);
		
		if (user) console.log(user);
		
		return true;
	
	});
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
	Links._ensureIndex({
		"date_discovered": 1 }, {
			expireAfterSeconds: 31556926
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
//	Links._ensureIndex({
//		aid: 1, oid: 1
//	}, {
//		unique: 1, sparse: 1, dropDups: 1
//	});
});

Accounts.onLoginFailure(function(infoObject) {
	winston.log("Anmeldeversuch fehlgeschlagen.",{object: infoObject, action:"onLoginFailure"});
});

Accounts.onLogin(function(infoObject) {
	// Add user facebook token to groups of the user that should be crawled, so the crawl will work
	//winston.info("Benutzer hat sich angemeldet",{action:"onLogin",object: infoObject});
	Meteor.call('updateFacebookTokensForUser', infoObject);
	Meteor.call('updateFacebookPictureForUser', infoObject);
	// Update the number of links and sites the user contributed to the app and save it in his profile
	Meteor.call('updateLinkContributionCount', infoObject);
	
	winston.log("Benutzer erfolgreich angemeldet.",{object: infoObject, action:"onLogin"});
});

Accounts.onCreateUser(function (options, user) {
	if (options.profile) user.profile = options.profile;
	
	// Das Profilbild muessen wir extra abfragen...

	// Benutzerprofil mit den gesammelten Daten anreichen und
	// default-Werte setzen
	user.profile.autoupdateip = true;
	user.profile.showtooltips = true;
	user.profile.showdownloadedlinks = false;
	user.profile.showunknownlinks = false;
	user.profile.hidemixes = false;
	user.profile.filteredsites = [];
	user.profile.searchproviders = ["zippysharemusic", "soundcloud"];
	user.profile.ip = "";
	user.profile.port = 10025;
	user.profile.volume = 100;
	user.profile.linkcontributioncount = 0;
	
	// email und username werden direkt im Benutzer gesetzt, daher
	// loeschen wir diese Attribute auch aus dem Profil-Objekt
	var result;
	
	if (user.services.facebook) {
		var accessToken = user.services.facebook.accessToken;
				
		try {
			result = HTTP.get("https://graph.facebook.com/me/picture?access_token=&redirect=false&type=large", {
				params: {
					access_token: accessToken
				}
			});	
		}
		catch (e) {
			winston.error("Fehler bei der Benutzerprofil-Erstellung: Facebook-Foto konnte nicht abgerufen werden.",{title:"Fehler bei Facebook-Bildabruf",action:"onCreateUser",object:user});
			console.log("Error receiving user picture from facebook");
		}

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
	}
	else {
		//TODO Meteor Error erzeugen
		winston.error("Fehler bei der Benutzerprofil-Erstellung: Facebook-Konto-Objekt fehlerhaft.",{title:"Fehler bei Benutzeranlage",action:"onCreateUser",object:user});
	}
	
	if (result && result.data && result.data.data && result.data.data.url)
		user.profile.pictureurl = result.data.data.url;
	else {
		//TODO Meteor Error
		winston.error("Fehler bei der Benutzerprofil-Erstellung: Fehlerhafte Antwort vom Facebook-Server",{title:"Fehler bei Benutzeranlage",action:"onCreateUser",object:user});
	}
	
	user.admin = false;
	
	// fertigen Benutzer zurueckgeben, damit er in der Datenbank
	// gespeichert werden kann
	winston.info("Benutzerkonto erstellt.",{title:"Benutzer registriert" ,object: user, action:"onCreateUser"});
	return user;
});