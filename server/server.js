// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "links".

Accounts.onCreateUser(function (options, user) {
	var accessToken = user.services.facebook.accessToken,
	result,
	profile;
	
	result = Meteor.http.get("https://graph.facebook.com/me?access_token=", {
		params: {
			access_token: accessToken
		}
	});
	
	if (result.error)
		throw result.error;
	
	profile = _.pick(result.data,
		"name",
		"first_name",
		"username",
		"email");
	
	result = Meteor.http.get("https://graph.facebook.com/me/picture?access_token=&redirect=false", {
		params: {
			access_token: accessToken
		}
	});
	
	if (result.error)
		throw result.error;
	
	profile.autoupdateip = true;
	profile.ip = "";
	profile.port = 10025;
	profile.pictureurl = result.data.data.url;
	
	user.emails = profile.email;
	user.username = profile.username;
	delete profile.username;
	delete profile.email;
	
	user.profile = profile;
	
	return user;
});
