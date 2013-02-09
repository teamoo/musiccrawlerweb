//Meteor Server-Konfiguration
//Erstellung neuer Accounts zulassen
Accounts.config({
    forbidClientAccountCreation : false
});

// Facebook-Konfiguration entfernen
Accounts.loginServiceConfiguration.remove({
    service : "facebook"
});

// Facebook-Konfiguration anlegen
Accounts.loginServiceConfiguration.insert({
    service : "facebook",
    appId : "402028639888899",
    secret : "190a4b1b849932d0da17bc3a6513b2a0"
});
