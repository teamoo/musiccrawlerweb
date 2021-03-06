//Meteor Server-Konfiguration
//Erstellung neuer Accounts zulassen
//Accounts.config({oauthSecretKey: Meteor.settings.oauthSecretKey});

Accounts.config({
	forbidClientAccountCreation: false
});
Meteor.AppCache.config({
	onlineOnly: ['/packages/'],
	chrome: false,
	chromium : false,
	firefox: false,
	ie: false,
	android: false,
	mobileSafari: false,
	safari: false,
	chromeMobileIOS : false
});
// Facebook-Konfiguration entfernen
ServiceConfiguration.configurations.remove({
    service : "facebook"
});
// Facebook-Konfiguration anlegen
ServiceConfiguration.configurations.insert({
    service : "facebook",
    appId : Meteor.settings.facebook.appId,
    secret : Meteor.settings.facebook.secret
});