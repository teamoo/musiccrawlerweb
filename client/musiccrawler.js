// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "links".

Links = new Meteor.Collection("links");

if (Meteor.isClient) {
  Template.linklist.links = function () {
    return Links.find({}, {sort: {date: 1, name: 1}, limit:3});
  };

  Template.linklist.selected_name = function () {
    var link = Links.findOne(Session.get("selected_player"));
    return link && link.url;
  };

  Template.link.selected = function () {
    return Session.equals("selected_player", this._id) ? "selected" : '';
  };

  Template.linklist.events({
    'click input.inc': function () {
      Links.update(Session.get("selected_player"), {$inc: {score: 5}});
    }
  });

  Template.link.events({
    'click': function () {
      Session.set("selected_player", this._id);
    }
  });
  
 Template.user_loggedout.events({
    'click #login.hand': function () {
		Meteor.loginWithFacebook({
		  requestPermissions: ['email']
		}, function (err) {
		  if (err)
			console.log(err);
		});
	}	
  });
  
  Template.user_loggedin.events({
    'click #logout.hand': function () {
      Meteor.logout(function (err) {
		  if (err) {
			console.log(err);
		  } else {
			//show message
		  }
	   });
    }
  });
}
