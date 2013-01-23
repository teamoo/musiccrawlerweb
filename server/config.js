Accounts.config({forbidClientAccountCreation : false});

Accounts.loginServiceConfiguration.remove({
	service: "facebook"
});

Accounts.loginServiceConfiguration.insert({
	service: "facebook",
	appId: "529875863713376",
	secret: "a2292cfb6f3ef055183df1635c38dcb0"
});