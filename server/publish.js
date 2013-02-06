//Publishing - Meteor Collections, die Clients subscriben können

// Publish filtered list to all clients
Meteor.publish('links', function(filter_date, filter_status, filter_term, filter_limit) {    
    var thelimit = itemBadgeSize * filter_limit;
	
    //TODO date wieder einschalten, sobald wir mit Date Objekten arbeiten können
    if (this.userId)
	return Links.find({
	    //date_discovered : {
		//$gte : filter_date
	    //},
	    status : {$in : filter_status},
	    name : {$regex : filter_term,$options : 'i'}
	},
	{
		limit : thelimit
	},
	{
	    fields : {
		_id : 1,
		name : 1,
		size : 1,
		likes : 1,
		likers : 1,
		comments : 1,
		url : 1,
		source : 1,
		date : 1,
		date_published : 1,
		date_discovered : 1,
		status : 1,
		creator : 1
	    }
	}, {
	    sort : {
		date_discovered : -1
	    }
	});
});

// Quellen
// Publish all sites
Meteor.publish('sites', function() {
    if (this.userId)
	return Sites.find({}, {
	    fields : {
		name : 1,
		url : 1,
		feedurl : 1,
		type : 1,
		creator : 1,
		last_crawled : 1,
		active : 1,
		date_created : 1
	    }
	});
});