//Eventhandler User wird erstellt auf dem Server
Accounts.onCreateUser(function (options, user) {
	var accessToken = user.services.facebook.accessToken,
	result,
	profile;
	
	//Informationen von Facebook abfragen, wir verwenden das mitgegebene user-spezifische Token
	result = Meteor.http.get("https://graph.facebook.com/me?access_token=", {
		params: {
			access_token: accessToken
		}
	});
	
	//TODO: Fehlerbehandlung
	if (result.error)
		throw result.error;
	
	//Wir holen uns nur die wichtigsten Daten, die wir wirklich benötigen
	profile = _.pick(result.data,
		"name",
		"first_name",
		"username",
		"email",
		"id");
	
	//Das Profilbild müssen wir extra abfragen...
	result = Meteor.http.get("https://graph.facebook.com/me/picture?access_token=&redirect=false", {
		params: {
			access_token: accessToken
		}
	});
	
	//TODO: Fehlerbehandlung
	if (result.error)
		throw result.error;
	
	//Benutzerprofil mit den gesammelten Daten anreichen und default-Werte setzen
	profile.autoupdateip = true;
	profile.ip = "";
	profile.port = 10025;
	profile.pictureurl = result.data.data.url;
	
	//email und username werden direkt im Benutzer gesetzt, daher löschen wir diese Attribute auch aus dem Profil-Objekt
	user.emails.push(profile.email);
	user.username = profile.username;
	delete profile.username;
	delete profile.email;
	
	//erstelltes Profil dem Benutzerobjekt anhängen
	user.profile = profile;
	
	//fertigen Benutzer zurückgeben, damit er in der Datenbank gespeichert werden kann
	return user;
});
