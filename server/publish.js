//Publishing - Meteor Collections, die Clients subscriben können

// Publish filtered list to all clients
Meteor.publish('links', function(filter_date, filter_status, filter_term, filter_limit) {
    var links_page_size = 50;
    
    var thelimit = links_page_size * filter_limit;
    //TODO date austauschen durch date_created, wenn ddp-pre mal fertig ist
    if (this.userId)
	return Links.find({
	    date : {
		$gte : filter_date
	    },
	    status : {
		$in : filter_status
	    },
	    name : {
		$regex : filter_term,
		$options : 'i'
	    }
	}, {
	    fields : {
		_id : 1,
		name : 1,
		size : 1,
		likes : 1,
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
	    },
	    limit : thelimit
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