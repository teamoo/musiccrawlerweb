// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "links".
Links = new Meteor.Collection("links");

  Template.linklist.links = function () {
    return Links.find({}, {sort: {date: 1, name: 1}, limit:7});
  };

  Template.linklist.selected = function () {
    var link = Links.findOne(Session.get("selected_link"));
    return link && link.url;
  };

  Template.linklist.events({
    'click': function () {

    }
  });
  
  Template.link.selected = function () {
    return Session.equals("selected_link", this._id) ? "selected" : '';
  };

  Template.link.events({
    'click': function () {
      Session.set("selected_link", this._id);
    }
  });
  
 Template.user_loggedout.events({
    'click #login': function () {
		Meteor.loginWithFacebook({
		  requestPermissions: ['email']
		}, function (err) {
		  if (err)
			console.log(err);
		  else {
			Meteor.http.call("GET","http://api.hostip.info/get_json.php",
				function (error, result) {
					if (error)
						throw error;
					Meteor.users.update( { _id: Meteor.userId()}, {$set: {'profile.ip': result.data.ip} } );
				}
			);
		  }
		});
	}	
  });
  
Template.user_loggedin.events({
'click #logout': function () {
  Meteor.logout(function (err) {
	  if (err) {
		console.log(err);
	  } else {

	  }
   });
}
});
  
Template.user_accountsettings.events({
    'click': function () {
		openAccountSettingsDialog();
		return false;
    }
});

 var openAccountSettingsDialog = function () {
	Session.set("showAccountSettingsDialog", true);
};

Template.page.showAccountSettingsDialog = function () {
  return Session.get("showAccountSettingsDialog");
};
  
Template.accountSettingsDialog.events({
  'click .save': function (event, template) {
    var aip = template.find(".ip").value;
    var aport = template.find(".port").value;
    var aupdateip = template.find(".autoupdate").checked;

	if (aupdateip === true)
	{
		Meteor.http.call("GET","http://api.hostip.info/get_json.php",
			function (error, result) {
				if (error)
					throw error;
				Meteor.users.update( { _id: Meteor.userId()}, {$set: {'profile.ip': result.data.ip , 'profile.port' : aport, 'profile.autoupdateip' : aupdateip}})
			}
		);
	}
	else {
		Meteor.users.update( { _id: Meteor.userId()}, {$set: {'profile.port' : aport, 'profile.ip': aip} } );
	}

	
    Session.set("showAccountSettingsDialog", false);
  },

  'click .cancel': function () {
    Session.set("showAccountSettingsDialog", false);
  }
});



  
Meteor.setTimeout(
	function () {
		if (Meteor.user().profile.autoupdateip) {
			if (Meteor.user().profile.autoupdateip == true)
			{
				Meteor.http.call("GET","http://api.hostip.info/get_json.php",
					function (error, result) {
						if (error)
							throw result.error;	
						Meteor.user().profile.ip = result.data.ip;
					}
				);
			}
	
			Meteor.http.call("GET","http://" + Meteor.user().profile.ip + ":" + Meteor.user().profile.port + "/get/version",
				function (error, result) {
					if (error)
						throw result.error;
					console.log("RESULLTT:" + result.data);
					if (result.data == "JDownloader") {Session.set("JDownloaderActive",true);}
					else {Session.set("JDownloaderActive",false);};
				}
	
	
		};
	},5000
);
