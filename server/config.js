//Meteor Server-Konfiguration
//Erstellung neuer Accounts zulassen
Accounts.config({
	forbidClientAccountCreation: false
});
Meteor.AppCache.config({
	 onlineOnly: [
	    '/online/'
	  ],
	chrome: true,
	chromium : true,
	firefox: true,
	ie: true,
	android: true,
	mobileSafari: true,
	safari: true,
	chromeMobileIOS : true
});
// Facebook-Konfiguration entfernen
Accounts.loginServiceConfiguration.remove({
    service : "facebook"
});
// Facebook-Konfiguration anlegen
Accounts.loginServiceConfiguration.insert({
    service : "facebook",
    appId : Meteor.settings.facebook.appId,
    secret : Meteor.settings.facebook.secret
});