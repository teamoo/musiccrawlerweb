Package.describe({
	summary: "X-Editable 1.5.0 for Bootstrap3 with wysihtml5 rich text editor"
});

Package.on_use(function (api){
	// Package needs jQuery
	api.use(['jquery'], 'client')

	//x-editable
	api.add_files('lib/bootstrap3-editable/css/bootstrap-editable.css', 'client');
	api.add_files('lib/bootstrap3-editable/js/bootstrap-editable.js', 'client', {bare:true});
	api.add_files('lib/bootstrap3-editable/img/clear.png', 'client');
	api.add_files('lib/bootstrap3-editable/img/loading.gif', 'client');
	
	//address
	api.add_files('lib/address/address.css', 'client');
	api.add_files('lib/address/address.js', 'client', {bare:true});

	//wysihtml5
	api.add_files('lib/wysihtml5/wysihtml5.js', 'client', {bare:true});  
	api.add_files('lib/wysihtml5/bootstrap-wysihtml5-0.0.2/wysiwyg-color.css', 'client');
	api.add_files('lib/wysihtml5/bootstrap-wysihtml5-0.0.2/wysihtml5-0.3.0.js', 'client', {bare:true});
	api.add_files('lib/wysihtml5/bootstrap-wysihtml5-0.0.2/bootstrap-wysihtml5-0.0.2.css', 'client');
	api.add_files('lib/wysihtml5/bootstrap-wysihtml5-0.0.2/bootstrap-wysihtml5-0.0.2.js', 'client', {bare:true});

	//override image paths
	api.add_files('path-override.css', 'client');  
});
