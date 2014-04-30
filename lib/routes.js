Router.configure({
	autoRender:true,
	layoutTemplate: 'layout',
	notFoundTemplate: 'notFound',
	loadingTemplate: 'circularProgress'
});


Router.map(function() {
  this.route('home', {path: '/', loginRequired: 'login', redirectOnLogin: true});
  this.route('login', {redirectOnLogin:true});
  this.route('admin',{loginRequired: 'login'});
  this.route('search', {
	path: '/search/:searchterm',
	data: function() {
		Session.set("filter_term",this.params.searchterm);
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