//Meteor Server-Konfiguration
//Erstellung neuer Accounts zulassen
Accounts.config({forbidClientAccountCreation : false});

//Facebook-Konfiguration entfernen
Accounts.loginServiceConfiguration.remove({
	service: "facebook"
});

//Facebook-Konfiguration anlegen
Accounts.loginServiceConfiguration.insert({
	service: "facebook",
	appId: "529875863713376",
	secret: "a2292cfb6f3ef055183df1635c38dcb0"
});