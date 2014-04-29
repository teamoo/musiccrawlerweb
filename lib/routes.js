Router.configure({
	autoRender:true,
	//layoutTemplate: 'layout',
	notFoundTemplate: 'notFound'
	//loadingTemplate: 'loading'
});

Router.map(function() {
  this.route('home', {
		path: '/'
	});
  this.route('admin');
  this.route('search', {
	path: '/search/:searchterm',
	data: function() {
		Session.set("filter_term",this.params.searchterm);
	}
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
  
  //TODO friendly names, ggf. für links aus soundcloud übernehmen, aber besser selber bauen
});