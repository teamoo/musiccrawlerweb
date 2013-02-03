//Publishing - Meteor Collections, die Clients subscriben können

// Publish filtered list to all clients
Meteor.publish('links', function(filter_date, filter_status, filter_term, filter_limit) {
    var links_page_size = 50;
    
    var thelimit = links_page_size * filter_limit;
    //TODO die neuen Date Felder hier einbauen, wenn neue Daten drin sind.
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
		date_published : -1
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

// TODO: ausarbeiten
// Anzahl Links in den einzelnen Sub-Collections
Meteor.publish("counts", function() {
    if (this.userId) {    
    
	var self = this;
	var uuid = Meteor.uuid();
	var count = 0;

	var counts = {
	    1 : 0,
	    14 : 0,
	    30 : 0,
	    90 : 0,
	    365 : 0
	};

	_.each(counts, function(elem, index) {
	    //console.log(index);
	    //console.log(elem);
	    var tmp_date = new Date();
	    tmp_date.setDate(tmp_date.getDate() - index);
	    //console.log(Links.find({date:{$lte: tmp_date}}).fetch());
	});

	var handle = Links.find({}, {
	    fields : {
		_id : 1
	    }
	}).observe({
	    added : function() {
		count++;
		self.set("counts", uuid, {
		    365:count
		});
		self.flush();
	    },
	    removed : function() {
		count--;
		self.set("counts", uuid, {
		    365:count
		});
		self.flush();
	    }
	// don't care about moved or changed
	});

	// Observe only returns after the initial added callbacks have
	// run. Now mark the subscription as ready.
	self.complete();
	self.flush();

	// stop observing the cursor when client unsubs
	self.onStop(function() {
	    handle.stop();
	});
    }
});