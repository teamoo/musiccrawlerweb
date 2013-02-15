//Meteor Server-Konfiguration
//Erstellung neuer Accounts zulassen
Accounts.config({
    forbidClientAccountCreation : false
});

// Facebook-Konfiguration entfernen
//Accounts.loginServiceConfiguration.remove({
//    service : "facebook"
//});

// Facebook-Konfiguration anlegen
//Accounts.loginServiceConfiguration.insert({
//    service : "facebook",
//    appId : Meteor.settings.facebook.appId,
//    secret : Meteor.settings.facebook.secret
//});
