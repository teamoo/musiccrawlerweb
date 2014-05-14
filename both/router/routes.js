function isValidObjectID(str) {
  // coerce to string so the function can be generically used to test both strings and native objectIds created by the driver
  str = str + '';
  var len = str.length, valid = false;
  if (len == 12 || len == 24) {
    valid = /^[0-9a-fA-F]+$/.test(str);
  }
  return valid;
}

isAdmin = function() {
	if ((Meteor.user() !== null) && (Meteor.user().admin) && (Meteor.user().admin === true))
		return true;
	else {
		Session.set('ir.loginRedirectRoute','unauthorized');
		return false;
	}
}

Router.configure({
	autoRender:true,
	layoutTemplate: 'layout',
	notFoundTemplate: 'notFound',
	loadingTemplate: 'spinner'
});
	
Router.map(function() {
  this.route('home', {path: '/',
  	loginRequired: 'login'
  });
  this.route('login', {
  	redirectOnLogin:true
  });
  this.route('logout', {
  	action: function() {
  		Session.set("init",false);
  		if (VK.Auth.getSession()) VK.Auth.logout();
  		Meteor.logout(function (error) {
  			if (error) {
  				alert("Fehler beim Ausloggen", "Beim Ausloggen ist ein unerwarteter Fehler aufgetreten. \nBitte schließ das Fenster und öffne den MusicCrawler erneut.");
  			}
  		});
  		Router.go('login');
  	}
  });
  this.route('admin',{
	template: 'adminstatistics',
  	layoutTemplate: 'adminlayout',
  	loginRequired: true,
  	waitOn: function() {
  		return [Meteor.subscribe('admin_notifications')]
  	},
  	isLoggedIn: isAdmin,
  });
  this.route('statisticsShow',{
	template: 'adminstatistics',
  	layoutTemplate: 'adminlayout',
	path: '/admin/stats',
  	loginRequired: true,
  	waitOn: function() {
  		return [Meteor.subscribe('admin_notifications'),Meteor.subscribe('admin_statistics'), Meteor.subscribe('admin_counts')]
  	},
  	isLoggedIn: isAdmin,
  });
  this.route('userInfoShow',{
  	layoutTemplate: 'adminlayout',
  	template:"userinfo",
  	path:'/admin/users/:id',
  	loginRequired: true,
  	data: function() {
  		return {user: Meteor.users.findOne({"id": this.params.id})};
  	},
  	waitOn: function() {
  		return [Meteor.subscribe('allUsers'),Meteor.subscribe('admin_notifications')]
  	},
  	isLoggedIn: isAdmin,
  });
  this.route('dataTableShow',{
  	layoutTemplate: 'adminlayout',
  	template:"table_component",
  	path:'/admin/data/:collection',
  	loginRequired: true,
	data: function() {
		switch (this.params.collection) {
			case "links":
				return {
					tableoptions :
					{
					  columns: [{
						title: "URL",
						data: "url"
					  },{
						title: "Status",
						data: "status"
					  },{
						title: "Veröffentlicht",
						data: "date_published"
					  },{
						title: "Quelle",
						data: "source"
					  }],
					  subscription: "all_" + this.params.collection
					}
				}
			case "sites":
				return {
					tableoptions :
					{
						  columns: [{
							title: "Seite",
							data: "name"
						  },{
							title: "URL",
							data: "feedurl"
						  },{
							title: "Veröffentlicht",
							data: "date_published"
						  }],
						  subscription: "all_" + this.params.collection
					}
				}
			case "sets":
				return {
					tableoptions :
					{
					  columns: [{
						title: "URL",
						data: "url"
					  },{
						title: "Status",
						data: "status"
					  },{
						title: "Veröffentlicht",
						data: "date_published"
					  },{
						title: "Quelle",
						data: "source"
					  }],
					  subscription: "all_" + this.params.collection
					}
				}
			case "users":
				return {
					tableoptions :
					{
					  columns: [{
						title: "Name",
						data: "name"
					  },{
						title: "Facebook ID",
						data: "id"
					  },{
						title: "erstellt",
						data: "createdAt"
					  },{
						title: "MongoID",
						data: "_id"
					  }],
					  subscription: "all_" + this.params.collection
					}
				}
		}
	},
  	waitOn: function() {
		return [Meteor.subscribe(this.params.collection),Meteor.subscribe('admin_notifications')] ;
  	},
  	isLoggedIn: isAdmin,
  });
  this.route('userListShow',{
  	layoutTemplate: 'adminlayout',
  	template:"userlist",
  	path:'/admin/users',
  	loginRequired: true,
  	waitOn: function() {
  		return [Meteor.subscribe('allUsers'),Meteor.subscribe('admin_notifications')]
  	},
  	isLoggedIn: isAdmin,
  });
    this.route('notificationsShow',{
  	layoutTemplate: 'adminlayout',
  	template:"notificationlist",
  	path:'/admin/notifications',
  	loginRequired: true,
  	waitOn: function() {
  		return [Meteor.subscribe('admin_notifications')]
  	},
  	isLoggedIn: isAdmin,
  });
  
  this.route('search', {
	path: '/search/:searchterm',
	waitOn: function() {
		Session.set("filter_term",this.params.searchterm);
		return [Meteor.subscribe('links'),Session.get("filter_date"), Session.get("filter_status"), Session.get("filter_term"), Session.get("filter_limit"), Session.get("filter_show_already_downloaded"), Session.get("filter_sites"), Session.get("filter_sort"), Session.get("filter_mixes"), Session.get("filter_id")]
	},
	loginRequired: 'login'
  });
  this.route('link/:id?', {
	path: /^[0-9a-fA-F]{24}$/
  });
  this.route('links/:id?', {
	path: /^[0-9a-fA-F]{24}$/
  });
  this.route('links/:page?', {
	path: /^[0-9]*$/
  });
  this.route('links/recent/:page?', {
  	path: /^[0-9]*$/
  });
  this.route('site/:id?', {
	path: /^[0-9a-fA-F]{24}$/
  });
  this.route('sites/:id?', {
	path: /^[0-9a-fA-F]{24}$/
  });
  this.route('sites/:page?', {
	path: /^[0-9]*$/
  });
  this.route('set/:id?', {
	path: /^[0-9a-fA-F]{24}$/
  });
  this.route('sets/:id?', {
	path: /^[0-9a-fA-F]{24}$/
  });
  
  this.route("REST", {path: "/api/links/:id?",
    where: "server",
    action: function(){
      console.log(this.request.method);
      console.log(this.request.headers);
      console.log('this.params.id: ' + this.params.id);

      console.log('------------------------------');
      console.log(this.request.body);
      console.log('------------------------------');
	  
      this.response.setHeader("Content-Type", "application/json");
      this.response.setHeader("Access-Control-Allow-Origin", "*");
      this.response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		
	//TODO Fehlerhafte Anfragen begründen
		var userToken = this.params.token;
		
		// Check the userToken before adding it to the db query
		// Set the this.userId
		//TODO update for oauth-encrypted
		if (userToken) {
			var user = Meteor.users.findOne({ 'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(userToken)});
		
			if (user)
			{
			  if (this.request.method == 'GET' && this.params.id && isValidObjectID(this.params.id)) {
				// GET
				var item = Links.findOne(new Meteor.Collection.ObjectID(this.params.id))
				
				if (this.params.live && JSON.parse(this.params.live) === true)
				{
					try {
						var result = Meteor.call("refreshLink", new Meteor.Collection.ObjectID(this.params.id));
						
						if (result)
							item = Links.findOne(new Meteor.Collection.ObjectID(this.params.id))
					}
					catch (exception)
					{
						console.log("Error refreshing Link with ID " + this.params.id);
					}
				}
					
				if (item._id)
					item._id = item._id.toJSONValue();
					
				this.response.statusCode = 200;
				this.response.end(EJSON.stringify(
					item
				));
			  }else if (this.request.method == 'GET' && !this.params.id) {
					//LIST
					var result = Links.find({},{limit: 100}).fetch()
					
					if (result.length)
						result.forEach(function(item) {
							if (item._id)
								item._id = item._id.toJSONValue();
						});
					
					this.response.statusCode = 200;
					this.response.end(EJSON.stringify(
						result
					));
			  }else if (this.request.method == 'POST') {
				// INSERT
				this.response.statusCode = 200;
				this.response.end(EJSON.stringify(
				//TODO: Create Link Methode nutzen
				  Links.insert(this.request.body)
				));
			  }else if (this.request.method == 'OPTIONS') {
				// OPTIONS
				//TODO Antwort zurückgeben wie in http://zacstewart.com/2012/04/14/http-options-method.html beschrieben
				this.response.statusCode = 200;
				this.response.setHeader("Access-Control-Allow-Methods", "POST, PUT, GET, DELETE, OPTIONS");
				this.response.end("OPTIONS Response");
			  }else if (this.request.method == 'PUT') {
			    // UPDATE
			  	//TODO: Felder auswählen und schreiben, ansonsten default-Werte nehmen. Oder lassen wir nur die URL angeben und den Titel? Überlegen, auch wer das darf
			    this.response.end(JSON.stringify(
			      Links.update({_id: new Meteor.Collection.ObjectID(this.params.id) },{$set:{
			        title: this.request.body.title,
			        text: this.request.body.text
			      }})
			    ));
			    this.response.end("UPDATE Response");
			    //TODO: Darf nicht jeder, einbauen
			  }else if (this.request.method == 'DELETE') {
			    // REMOVE
			    this.response.end(JSON.stringify(
			      Links.remove({_id: new Meteor.Collection.ObjectID(this.params.id)})
			    ));
			  }
			}
			else {
				this.response.statusCode = 401;
				this.response.end("Invalid Login Token");
			}
		}
		else {
			this.response.statusCode = 403;
			this.response.end("Login Token required");
		}
    }
  });
});