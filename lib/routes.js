Router.configure({
	autoRender:true,
	layoutTemplate: 'layout',
	notFoundTemplate: 'notFound',
	loadingTemplate: 'spinner'
});

setupHook = function() {
	Holder.run();
}
	
Router.map(function() {
  this.route('home', {path: '/',
  	loginRequired: 'login',
  	onAfterAction: setupHook
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
  	loginRequired: true,
  	waitOn: function() {
  		return [Meteor.subscribe('allUsers'),Meteor.subscribe('admin_notifications'),Meteor.subscribe('admin_statistics')]
  	},
  	isLoggedIn: function() {
  		if ((Meteor.user() !== null) && (Meteor.user().admin) && (Meteor.user().admin === true))
  			return true;
  		else {
  			Session.set('ir.loginRedirectRoute','unauthorized');
			return false;
  		}
  	},
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
  
  this.route("apiRoute", {path: "/api/",
    where: "server",
    action: function(){
      console.log(this.request.method);
      console.log(this.request.headers);
      console.log('this.params.id: ' + this.params.id);

      console.log('------------------------------');
      console.log(this.request.body);
      console.log('------------------------------');

      this.response.statusCode = 200;
      this.response.setHeader("Content-Type", "application/json");
      this.response.setHeader("Access-Control-Allow-Origin", "*");
      this.response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

      if (this.request.method == 'GET') {
        // LIST
        this.response.end(JSON.stringify(
          Links.find({},{limit: 100}).fetch()
        ));
      }else if (this.request.method == 'POST') {
        // INSERT
        this.response.end(JSON.stringify(
          Links.insert(this.request.body)
        ));
      }else if (this.request.method == 'OPTIONS') {
        // OPTIONS
        this.response.setHeader("Access-Control-Allow-Methods", "POST, PUT, GET, DELETE, OPTIONS");
        this.response.end("OPTIONS Response");
      }
    }
  });

  this.route("apiRouteWithParameter", {path: "/api/:id",
    where: "server",
    action: function(){
      console.log('################################################');
      console.log(this.request.method);
      console.log(this.request.headers);
      console.log('this.params.id: ' + this.params.id);

      console.log('------------------------------');
      console.log(this.request.body);
      console.log('------------------------------');

      this.response.statusCode = 200;
      this.response.setHeader("Content-Type", "application/json");
      this.response.setHeader("Access-Control-Allow-Origin", "*");
      this.response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

      //Access-Control-Allow-Origin: http://foo.example
      //Access-Control-Allow-Methods: POST, GET, OPTIONS
      //Access-Control-Allow-Headers: X-PINGOTHER

      if (this.request.method == 'GET') {
        this.response.end(JSON.stringify(
          Links.findOne({_id: new Meteor.Collection.ObjectID(this.params.id) })
        ));
      }else if (this.request.method == 'PUT') {
        // UPDATE
		//TODO: Felder auswählen und schreiben, ansonsten default-Werte nehmen. Oder lassen wir nur die URL angeben und den Titel? Überlegen
        this.response.end(JSON.stringify(
          Links.update({_id: new Meteor.Collection.ObjectID(this.params.id) },{$set:{
            title: this.request.body.title,
            text: this.request.body.text
          }})
        ));
        this.response.end("UPDATE Response");
      }else if (this.request.method == 'DELETE') {
        // REMOVE
        this.response.end(JSON.stringify(
          Links.remove({_id: new Meteor.Collection.ObjectID(this.params.id) })
        ));
      }else if (this.request.method == 'OPTIONS') {
        // OPTIONS
        this.response.setHeader("Access-Control-Allow-Methods", "POST, PUT, GET, DELETE, OPTIONS");
        this.response.end("OPTIONS Response With Parameter");
      }
    }
  });
});