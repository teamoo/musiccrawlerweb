﻿//Publishing - Meteor Collections, die Clients subscriben können
Meteor.publish("userData", function () {
    if (this.userId) return Meteor.users.find({
        _id: this.userId
    }, {
        fields: {
            'admin': 1
        }
    });
});

Meteor.publish("allUserData", function () {
    if (this.userId) return Meteor.users.find({}, {
        fields: {
            'id': 1,
            'profile.first_name': 1
        }
    });
});


Meteor.publish("counts-by-timespan", function (filter_status) {
  var self = this;
  var initializing = true;  
  var thedownloaders = "dummy";
  
	if (this.userId)
		thedownloaders = this.userId;
  
  var handle = Links.find({
  	status: {
      $in: filter_status
  	}
  }).observeChanges({
    added: function (id) {
      if (!initializing)
      	[1, 14, 30, 90, 365].forEach(function (timespan) {
      		var count = Links.find({
      			date_published: {
      				$gte: new Date(new Date().setDate(new Date().getDate()-timespan))
      			},
      			status: {
      				$in: filter_status
      			},
      			downloaders: {
      				'$ne': thedownloaders
      			}
      		}).count(false);
      		self.changed("counts", timespan, {count: count});
      	});
    },
    removed: function (id) {
		[1, 14, 30, 90, 365].forEach(function (timespan) {
			var count = Links.find({
				date_published: {
					$gte: new Date(new Date().setDate(new Date().getDate()-timespan))
				},
				status: {
					$in: filter_status
				},
				downloaders: {
					'$ne': thedownloaders
				}
			}).count(false);
			self.changed("counts", timespan, {count: count});
		});
    },
    changed: function (id) {
    	[1, 14, 30, 90, 365].forEach(function (timespan) {
    		var count = Links.find({
    			date_published: {
    				$gte: new Date(new Date().setDate(new Date().getDate()-timespan))
    			},
    			status: {
    				$in: filter_status
    			},
    			downloaders: {
    				'$ne': thedownloaders
    			}
    		}).count(false);
    		self.changed("counts", timespan, {count: count});
    	});
    }
    // don't care about moved or changed
  });

  // Observe only returns after the initial added callbacks have
  // run.  Now return an initial value and mark the subscription
  // as ready.
  initializing = false;
  
  [1, 14, 30, 90, 365].forEach(function (timespan) {
  	var count = Links.find({
  		date_published: {
  			$gte: new Date(new Date().setDate(new Date().getDate()-timespan))
  		},
  		status: {
  			$in: filter_status
  		},
  		downloaders: {
  			'$ne': thedownloaders
  		}
  	}).count(false);
  	self.added("counts", timespan, {count: count});
  });
  self.ready();

  // Stop observing the cursor when client unsubs.
  // Stopping a subscription automatically takes
  // care of sending the client any removed messages.
  self.onStop(function () {
    handle.stop();
  });
});





// Publish filtered list to all clients
Meteor.publish('links', function (filter_date, filter_status, filter_term, filter_limit, filter_skip, filter_already_downloaded, filter_sites) {
//XXX wenn Meteor projections kann, downloaders nicht komplett zurückgeben, sondern mit uns drin oder komplett leer
	var thelimit = Meteor.settings.public.itembadgesize * filter_limit;
	
	var thedownloaders = "dummy";
	
	var searchterms = filter_term.trim().split(" ");
	
	for (var i = 0; i < searchterms.length; i++) {
		searchterms[i] = new RegExp(searchterms[i],"i");
	}
	
	if (filter_already_downloaded === false)
		thedownloaders = this.userId;
	
    if (this.userId) return Links.find({
        date_published: {
            $gte: filter_date
        },
        status: {
            $in: filter_status
        },
		source: {
			$ne: filter_sites
		},
		downloaders: {
			$ne: thedownloaders
		},
        name: {
            $all: searchterms
        },
		source: {
			$not: {
				$in: filter_sites
			}
		}
    }, {
        limit: thelimit,
        skip: filter_skip,
        fields: {
            _id: 1,
            name: 1,
            size: 1,
            likes: 1,
            likers: 1,
            downloaders : 1,
            comments: 1,
            url: 1,
			hoster: 1,
            source: 1,
            date_published: 1,
            stream_url: 1,
            status: 1,
            creator: 1
        },
        sort: {
            date_published: -1,
            name: 1
        }
    }

    );
});

// Quellen
// Publish all sites
Meteor.publish('sites', function () {
    if (this.userId) return Sites.find({}, {
        fields: {
            name: 1,
            url: 1,
            feedurl: 1,
            type: 1,
            creator: 1,
            last_crawled: 1,
            next_crawl: 1,
            active: 1,
			discovered_links: 1,
			last_post: 1,
			groupid: 1
        },
        sort: {
            name: 1
        }
    });
});