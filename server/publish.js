//Publishing - Meteor Collections, die Clients subscriben können
Meteor.publish("userData", function () {
	if (this.userId) return Meteor.users.find({
			_id: this.userId
		}, {
			fields: {
				'admin': 1,
				'profile' : 1
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
Meteor.publish("counts-by-timespan", function (filter_status, filter_sites, filter_mixes) {
	var self = this;
	var initializing = true;
	var thedownloaders = "dummy";
	if (this.userId) thedownloaders = this.userId;
	/*
	var handle = Links.find({
		status: {
			$in: filter_status
		}
	}).observeChanges({
		added: function (id) {
			var thedownloaders = "dummy";
			if (this.userId) thedownloaders = this.userId;
			if (!initializing)[1, 14, 30, 90, 365].forEach(function (timespan) {
					var count = Links.find({
						date_published: {
							$gte: new Date(new Date().setDate(new Date().getDate() - timespan))
						},
						status: {
							$in: filter_status
						},
						downloaders: {
							'$ne': thedownloaders
						}
					}).count(false);
					self.changed("counts", timespan, {
						count: count
					});
				});
		},
		removed: function (id) {
			var thedownloaders = "dummy";
			if (this.userId) thedownloaders = this.userId;
			[1, 14, 30, 90, 365].forEach(function (timespan) {
				var count = Links.find({
					date_published: {
						$gte: new Date(new Date().setDate(new Date().getDate() - timespan))
					},
					status: {
						$in: filter_status
					},
					downloaders: {
						'$ne': thedownloaders
					}
				}).count(false);
				self.changed("counts", timespan, {
					count: count
				});
			});
		},
		changed: function (id) {
			var thedownloaders = "dummy";
			if (this.userId) thedownloaders = this.userId;
			[1, 14, 30, 90, 365].forEach(function (timespan) {
				var count = Links.find({
					date_published: {
						$gte: new Date(new Date().setDate(new Date().getDate() - timespan))
					},
					status: {
						$in: filter_status
					},
					downloaders: {
						'$ne': thedownloaders
					}
				}).count(false);
				self.changed("counts", timespan, {
					count: count
				});
			});
		}
	});
	// Observe only returns after the initial added callbacks have
	// run.  Now return an initial value and mark the subscription
	// as ready.
	initializing = false;
	*/
	[1, 14, 30, 90, 365].forEach(function (timespan) {
		var count = Links.find({
			date_published: {
				$gte: new Date(new Date().setDate(new Date().getDate() - timespan))
			},
			status: {
				$in: filter_status
			},
			downloaders: {
				'$ne': thedownloaders
			},
			source: {
				$nin: filter_sites
			}
		}).count(false);
		self.added("counts", timespan, {
			count: count
		});
	});
	self.ready();
	// Stop observing the cursor when client unsubs.
	// Stopping a subscription automatically takes
	// care of sending the client any removed messages.
	/*
	self.onStop(function () {
		handle.stop();
	});
	*/
});
// Publish filtered list to all clients
Meteor.publish('links', function (filter_date, filter_status, filter_term, filter_limit, 
//filter_skip, 
filter_already_downloaded, filter_sites, filter_sort, filter_mixes, filter_id) {
	//XXX wenn Meteor (oder Mongo Driver??) projections kann, downloaders nicht komplett zurückgeben, sondern mit uns drin oder komplett leer
	if (filter_id) {
		var aid;
		try {
			aid = new Meteor.Collection.ObjectID(filter_id);
		} catch (error) {
			aid = "00000000000000000000000";
		}
		var set = Sets.findOne({
			_id: aid
		});
		if (set) return Links.find({
				_id: {
					$in: _.map(set.links, function (linkid) {
						return new Meteor.Collection.ObjectID(linkid);
					})
				}
			});
		return Links.find({
			_id: aid
		});
	}
	var thelimit = Meteor.settings.public.itembadgesize * filter_limit;
	var thedownloaders = "dummy";
	if (filter_term && filter_term.length > 0)
		searchterms = filter_term.trim().split(" ");
	for (var i = 0; i < searchterms.length; i++) {
		searchterms[i] = new RegExp(searchterms[i], "i");
	}
	if (filter_already_downloaded === false) thedownloaders = this.userId;
	
	if (filter_mixes && filter_mixes === true)
		query = {
			$and:[{
					name: {
						$regex: "(?=^((?!Live at).)*$)(?=^((?!Chart).)*$)(?=^(?!VA).*)" }
					},{
					size: {
						$lt : 80000000
					}
				}],
			date_published: {
				$gte: filter_date
			},
			status: {
				$in: filter_status
			},
			source: {
				$nin: filter_sites
			},
			downloaders: {
				$ne: thedownloaders
			},
			name: {
				$all: searchterms
			},
		}
	else
		query = {
			date_published: {
				$gte: filter_date
			},
			status: {
				$in: filter_status
			},
			source: {
				$nin: filter_sites
			},
			downloaders: {
				$ne: thedownloaders
			},
			name: {
				$all: searchterms
			},
		}
		
	fields = {
					_id: 1,
					name: 1,
					size: 1,
					likes: 1,
					likers: 1,
					downloaders: 1,
					//comments: 1,
					url: 1,
					hoster: 1,
					source: 1,
					date_published: 1,
					stream_url: 1,
					status: 1,
					creator: 1,
					aid: 1,
					oid: 1
				}
	
	if (filter_sort && (filter_sort == "likes"))
		sort = {
					likes: -1,
					_id: -1
		}
	else
		sort = 	{
					date_published: -1,
					_id: -1
				}
	
	projection = {fields: fields, sort: sort, limit: thelimit}//, skip: filter_skip}
	
	if (this.userId) 
		return Links.find(query, projection);	
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