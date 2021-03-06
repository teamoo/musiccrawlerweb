﻿//url = encodeURIComponent(searchHost) + "/ip" + ipprot_q_current + "%252C" + ipprot_a_current + "/ha" + hash_ + "/cs" + cs_ + "/u" + u_ + "/" + mp3_ + ".mp3?vkid=" + encodeURIComponent(s_vk_id[a] + "&vkoid=" + s_vk_oid[a] + "&us=" + encodeURIComponent(u_us_current))
  // Add access points for `GET`, `POST`, `PUT`, `DELETE`


moment.lang('de');
//Initialize Session Variables
Session.setDefault("loading_results", false);
Session.setDefault("wait_for_items", false);
Session.setDefault("sites_completed", false);
Session.setDefault("links_completed", false);
Session.setDefault("users_completed", false);
Session.setDefault("counts_completed", false);
Session.setDefault("status", undefined);
Session.setDefault("selected_links", []);
Session.setDefault("JDOnlineStatus", false);
Session.setDefault("temp_set", []);
Session.setDefault("showAccountSettingsDialog", false);
Session.setDefault("showAddLinkDialog", false);
Session.setDefault("showAddSiteDialog", false);
Session.setDefault("showSitesDialog", false);
Session.setDefault("showFilterSitesDialog", false);
Session.setDefault("showShareLinkDialog", false);
Session.setDefault("showBulkDownloadDialog", false);
Session.setDefault("progressActive", false);
Session.setDefault("progress", undefined);
Session.setDefault("progressState", undefined);
Session.setDefault("selected_navitem", 90);
Session.setDefault("filter_date", new Date(new Date().setDate(new Date().getDate() - 90)));
Session.setDefault("filter_status", ["on"]);
Session.setDefault("filter_term", "");
Session.setDefault("filter_limit", 1);
Session.setDefault("filter_skip", 0);
Session.setDefault("filter_sites", []);
Session.setDefault("filter_mixes", false);
Session.setDefault("temp_filter_sites", []);
Session.setDefault("filter_show_already_downloaded", false);
Session.setDefault("filter_id", undefined);
Session.setDefault("soundcloud_ready",false);
Session.setDefault("started",false);
Session.setDefault("filter_sort", "date_published");
[1, 14, 30, 90, 365].forEach(function (timespan) {
	Session.setDefault("links_count_" + timespan, undefined);
});

Session.setDefault("init",false);

//local Collection for external search results
SearchResults = new Meteor.Collection(null);
//Subscriptions
Deps.autorun(function () {
	if (Accounts.loginServicesConfigured() && DDP._allSubscriptionsReady() && !Session.equals("filter_term",""))  {
		var timer_start_search = Meteor.setInterval(function(){
		
				if (Session.equals('links_completed',true) && Links.find().count() <= 50 && Meteor.user() && Meteor.user().profile.searchproviders.length){
					Meteor.clearInterval(timer_start_search);

					var filter_term_external = Session.get("filter_term").replace(/\.\*/gi, "").replace(/\\/gi, "");
					if (filter_term_external != "" && Links.find().count() < 3) {

						Session.set("filter_term_external", filter_term_external);
						
						if (_.contains(Meteor.user().profile.searchproviders, "zippysharemusic")) {
							HTTP.get("https://www.googleapis.com/customsearch/v1?key=" + Meteor.settings.public.google.search_api_key + "&cx=partner-pub-9019877854699644%3At1iell5gp8b&alt=json&fields=items(pagemap)&q=" + encodeURIComponent(filter_term_external), function (error, result) {
								if (result && result.data && result.data.items) {
									var items = result.data.items;
									var pattern1 = /https?\:\/\/www\d{1,2}\.zippyshare.com/i;
									var pattern2 = /\d{3,8}(?=\/file\.html)/i;
									if (items && items.length) {
										for (var i = 0; i <= items.length; i++) {
											if (items[i]) {
												var theurl = items[i].pagemap.metatags[0]["og:url"].replace("\\");
												var stream_url = undefined;
												var match1 = pattern1.exec(theurl);
												var match2 = pattern2.exec(theurl);
												if (match1 && match2) stream_url = match1 + "/downloadMusic?key=" + match2;
												if (!SearchResults.findOne({
													url: theurl
												})) SearchResults.insert({
														hoster: "zippyshare.com",
														status: "unknown",
														name: unescape(items[i].pagemap.metatags[0]["og:title"].replace("null").replace("undefined").trim()),
														url: items[i].pagemap.metatags[0]["og:url"].replace("\\").replace('"').replace('"'),
														stream_url: stream_url.replace('"')
													});
											}
										}
										Session.set("loading_results", false);
									}
								}
							});
						}
						if (_.contains(Meteor.user().profile.searchproviders, "mp3monkey")) {
							Meteor.call('searchExternalService', encodeURIComponent(filter_term_external),"mp3monkey", function (error, result) {
								if (result) {

									var doc = document.implementation.createHTMLDocument("mp3monkey");
									doc.documentElement.innerHTML = result.content;
									
									//var iterartists = doc.evaluate( '//*[@id=\'glav_poisk\']/ul/li/table/tbody/tr/td/div/b', doc, null, XPathResult.ANY_TYPE, null );
									var itertitles = doc.evaluate( '//*[@id=\'glav_poisk\']/ul/li/table/tbody/tr/td[4]/div', doc, null, XPathResult.ANY_TYPE, null );
									//var iterstreamurls = doc.evaluate( '//div[@class=\'items\']//div[@class=\'track clearfix\']/@data-src', doc, null, XPathResult.ANY_TYPE, null );
									var iterurls = doc.evaluate( '//*[@id=\'glav_poisk\']/ul/li/table/tbody/tr/td/div/noindex/a/@href', doc, null, XPathResult.ANY_TYPE, null );
									var iterdurations = doc.evaluate( '//*[@id=\'glav_poisk\']/ul/li/table/tbody/tr/td/div/div/div[@class=\'track_time\']', doc, null, XPathResult.ANY_TYPE, null );
									
									try {
									  //var artistnode = iterartists.iterateNext();
									  var titlenode = itertitles.iterateNext();
									  //var stream_urlnode = iterstreamurls.iterateNext();
									  var urlnode = iterurls.iterateNext();
									  var durationnode = iterdurations.iterateNext();
									  
									  var counter = 0;
									  
									  while (titlenode &&  urlnode && durationnode && counter < 10) {		
										//stream_urlnode &&
										url = urlnode.textContent.replace("http//","http://");
										//stream_url = stream_urlnode.textContent;
										duration = durationnode.textContent;
										name = titlenode.textContent;
										
										if (!SearchResults.findOne({
											url: url
										})) SearchResults.insert({
											hoster: "mp3monkey.net",
											status: "on",
											name: name,
											url: url,
											//stream_url : url,
											duration: moment(duration,"mm:ss")
										});
										
										counter++;
										
										//artistnode = iterartists.iterateNext();
										titlenode = itertitles.iterateNext();
										//stream_urlnode = iterstreamurls.iterateNext();
										urlnode = iterurls.iterateNext();
										durationnode = iterdurations.iterateNext();
									  }	
									}
									catch (e) {
									  console.log( 'Error: Document tree modified during iteration ' + e );
									}
									
									Session.set("loading_results", false);
								}	
							});
						}
						if (_.contains(Meteor.user().profile.searchproviders, "muzofon")) {
							Meteor.call('searchExternalService', encodeURIComponent(filter_term_external),"muzofon", function (error, result) {
								
								if (result && result.content)
								{
									var doc = document.implementation.createHTMLDocument("example");
									doc.documentElement.innerHTML = result.content;
									
									var iternames = doc.evaluate( '//div[@class=\'title\']', doc, null, XPathResult.ANY_TYPE, null );
									
									var iterlinks = doc.evaluate( '//div[@class=\'controls\']/a[1]/@href', doc, null, XPathResult.ANY_TYPE, null );

									try {
									  var counter = 0;	
										
									  var thisNode1 = iternames.iterateNext();
									  var thisNode2 = iterlinks.iterateNext();
									  
									  while (thisNode1 && thisNode2 && counter < 10) {										
										durationmatch = thisNode1.textContent.replace(/\s+/g,' ').match(/\[.*\]/g)
										if (durationmatch && durationmatch.length === 1)
										{
											duration = durationmatch[0].replace("[","").replace("]","")
										}
										
										theurl = "http://muzofon.com" + thisNode2.textContent
										thename = thisNode1.textContent.replace(/\s+/g,' ').replace(/\[.*\]/g,"").trim();
										
										
										if (thename && thename.length && !SearchResults.findOne({
											url: theurl
										})) var theid = SearchResults.insert({
											hoster: "muzofon.com",
											status: "unknown",
											name: thename,
											url: theurl,
											duration: moment(duration,"mm:ss"),
											referer: "http://muzofon.com/search/" + encodeURIComponent(filter_term_external)
										});

										Meteor.call('getMuzofonDownloadLink', theurl, "http://muzofon.com/search/" + encodeURIComponent(filter_term_external), function (error, result) {
											if (result) {
											 	SearchResults.update({
											 		_id: theid
											 	}, {
											 		$set: {
											 			'url': result,
											 		}
											 	});
											}
															
										});
										
										
										thisNode1 = iternames.iterateNext();
										thisNode2 = iterlinks.iterateNext();
										counter++;
									  }	
									}
									catch (e) {
									  dump( 'Error: Document tree modified during iteration ' + e );
									}
								}				
							});
						}
						if (_.contains(Meteor.user().profile.searchproviders, "soundcloud") && Session.equals("soundcloud_ready",true)) {
							SC.get('/tracks', {
								filter: 'public',
								limit: 10,
								q: filter_term_external
							}, function (tracks) {
								if (tracks && tracks.length) {
									for (var i = 0; i <= tracks.length; i++) {
										if (tracks[i]) {
											if (!SearchResults.findOne({
												url: tracks[i].permalink_url
											})) SearchResults.insert({
													hoster: "soundcloud.com",
													status: "on",
													name: tracks[i].title,
													url: tracks[i].permalink_url,
													duration: moment(tracks[i].duration)
												});
										}
									}
									Session.set("loading_results", false);
								}
							});
						}
						if (_.contains(Meteor.user().profile.searchproviders, "youtube")) {
							var youtube_term = _.reduce(filter_term_external.split(" "), function (memo, token) {
								return String(memo + "+" + token);
							},"");
							HTTP.get("https://gdata.youtube.com/feeds/api/videos?q=" + youtube_term + "&max-results=10&v=2&alt=json", function (error, result) {
								if (result && result.data && result.data.feed && result.data.feed.entry) {
									var entry = result.data.feed.entry;
									for (var i = 0; i <= entry.length; i++) {
										if (entry[i]) {
											if (!SearchResults.findOne({
												url: entry[i].link[0].href
											})) SearchResults.insert({
													hoster: "youtube.com",
													status: "on",
													name: entry[i].title.$t,
													url: entry[i].link[0].href,
													duration: moment(entry[i].media$group.yt$duration.seconds * 1000)
												});
										}
									}
									Session.set("loading_results", false);
								}
							});
						}		
						if (_.contains(Meteor.user().profile.searchproviders, "ex.fm")) {
							HTTP.get("http://ex.fm/api/v3/song/search/" + filter_term_external, function (error, result) {
								if (result && result.data && result.data.status_code === 200) {
									var songs = result.data.songs;
									for (var i = 0; i <= songs.length; i++) {
										if (songs[i]) {
											if (!SearchResults.findOne({
												url: "http://ex.fm/api/v3/song/" + songs[i].id
											})) SearchResults.insert({
													hoster: "ex.fm",
													status: "on",
													name: unescape((songs[i].artist + " " + songs[i].title.replace("null").replace("undefined").trim())),
													url: "http://ex.fm/api/v3/song/" + songs[i].id,
													duration: moment(0)
												});
										}
									}
									Session.set("loading_results", false);
								}
							});
						}
						
						if (_.contains(Meteor.user().profile.searchproviders, "myfreemp3.eu")) {

							Meteor.call('searchExternalService', encodeURIComponent(filter_term_external),"myfreemp3", function (error, result) {
								if (result) {
									var doc = document.implementation.createHTMLDocument("myfreemp3.eu");
									doc.documentElement.innerHTML = result.content;
									
									//var iterartists = doc.evaluate( '//div[@class=\'items\']//div[@class=\'info\']//span[@class=\'artist\']', doc, null, XPathResult.ANY_TYPE, null );
									//var itertitles = doc.evaluate( '//div[@class=\'items\']//div[@class=\'info\']//span[@class=\'title\']', doc, null, XPathResult.ANY_TYPE, null );
									var iternames = doc.evaluate( '//a[@class=\'info\']/text()', doc, null, XPathResult.ANY_TYPE, null );
									var iterids = doc.evaluate( '//a[@class=\'info\']/@data-aid', doc, null, XPathResult.ANY_TYPE, null );
									var iterdurations = doc.evaluate( '//a[@class=\'info\']/@data-duration', doc, null, XPathResult.ANY_TYPE, null );
									
									try {
									  var namenode = iternames.iterateNext();
									  var idnode = iterids.iterateNext();
									  var durationnode = iterdurations.iterateNext();
									  
									  
									  var counter = 0;
									  
									  while (namenode && idnode && durationnode && counter < 10) {										
										url = "http://89.248.172.6/dvv.php?q=" + idnode.textContent + "_/";
										duration = durationnode.textContent;
										name = namenode.textContent.replace("mp3","").trim();
										
										if (!SearchResults.findOne({
											url: url
										})) SearchResults.insert({
											hoster: "myfreemp3.eu",
											status: "on",
											name: name,
											id: idnode.textContent,
											url: url,
											duration: moment(duration * 1000)
										});
										
										counter++;
										
										namenode = iternames.iterateNext();
										idnode = iterids.iterateNext();
										durationnode = iterdurations.iterateNext();
									  }	
									}
									catch (e) {
									  console.log( 'Error: Document tree modified during iteration ' + e );
									}
									
									Session.set("loading_results", false);
								}	
							});
						}		
						
								
						if (_.contains(Meteor.user().profile.searchproviders, "vk.com")) {
							var youtube_term = _.reduce(filter_term_external.split(" "), function (memo, token) {
								return String(memo + "+" + token);
							},"");
							
							VK.Api.call("audio.search",{q:filter_term_external,auto_complete:1,count:10}, function(result){								
								if (result && result.response && !result.error) {
									
									var entry = result.response;
									for (var i = 1; i <= entry.length; i++) {
										if (entry[i]) {																					
											if (!SearchResults.findOne({
												url: decodeURI(entry[i].url)
											})) SearchResults.insert({
													hoster: "vk.com",
													status: "on",
													name: htmlDecode(entry[i].artist) + " " + htmlDecode(entry[i].title),
													url: decodeURI(entry[i].url),
													duration: moment(entry[i].duration * 1000),
													aid : entry[i].aid,
													oid: entry[i].owner_id
												});
										}
									}
									Session.set("loading_results", false);
								}
								else
									console.log("Error getting results from vk.com: " + result.error["error_msg"]);
							});
						}
						if (_.contains(Meteor.user().profile.searchproviders, "beatport")) {
							Meteor.call("searchBeatport", filter_term_external, function(error,result) {
								if (result && result.results) {
									var songs = result.results;
									for (var i = 0; i <= songs.length; i++) {
										if (songs[i]) {
											thename = _.reduce(songs[i].artists, function(memo, token) {return memo + ", " + String(token.name)},new String()).substring(1).trim() + " - " + songs[i].title
										
											if (!SearchResults.findOne({
												name: thename
											})) SearchResults.insert({
													hoster: "beatport.com",
													status: "on",
													id: songs[i].id,
													name: _.reduce(songs[i].artists, function(memo, token) {return memo + ", " + String(token.name)},new String()).substring(1).trim() + " - " + songs[i].title,
													url: "http://www.beatport.com/track/" + songs[i].slug + "/" + songs[i].id,
													stream_url: "http://geo-samples.beatport.com/lofi/" + songs[i].id + ".LOFI.mp3",
													duration: moment(songs[i].lengthMs),
													date_published: moment(songs[i].releaseDate).toDate()
												});
										}
										
										console.log(SearchResults.find().fetch());
									}
									Session.set("loading_results", false);
								}
							});
						}
				} else {
					Session.set("loading_results", false);
				}
					
					
					
					
				}
			}, 1000);
	}

	//Admin-Flag
	Meteor.subscribe('userData');
	//User-Names and Facebook-IDs for display purposes
	Meteor.subscribe('allUserData', function onReady() {
		Session.set('users_completed', true);
	});
	//music source sites	
	Meteor.subscribe('sites', function onReady() {
		// set a session key to true to indicate that the subscription is
		// completed.
		Session.set('sites_completed', true);
	});
	//music links
	Meteor.subscribe('links', Session.get("filter_date"), Session.get("filter_status"), Session.get("filter_term"), Session.get("filter_limit"), //Session.get("filter_skip"), 
	Session.get("filter_show_already_downloaded"), Session.get("filter_sites"), Session.get("filter_sort"), Session.get("filter_mixes"), Session.get("filter_id"), function onReady() {
		// set a session key to true to indicate that the
		// subscription is completed.
		Session.set('links_completed', true);
		Session.set("wait_for_items", false);		
		
	});
	Meteor.subscribe('counts-by-timespan', Session.get("filter_status"), Session.get("filter_sites"), Session.get("filter_mixes"), function onReady() {
		//Session.set('counts_completed', true);
		[1, 14, 30, 90, 365].forEach(function (timespan) {
			var item = Counts.findOne({
				_id: timespan
			});
			if (item) Session.set("links_count_" + timespan, item.count);
		});
	});
	/*
	if (Session.equals("counts_completed", true)) {
		var query = Counts.find({});
		query.observeChanges({
			added: function (id, count) {
				[1, 14, 30, 90, 365].forEach(function (timespan) {
					var item = Counts.findOne({
						_id: timespan
					});
					if (item) Session.set("links_count_" + timespan, item.count);
				});
			},
			changed: function () {
				[1, 14, 30, 90, 365].forEach(function (timespan) {
					var item = Counts.findOne({
						_id: timespan
					});
					if (item) Session.set("links_count_" + timespan, item.count);
				});
			}
		});
	}
	*/
	if (Meteor.user() && Meteor.user().profile.showtooltips === false && Session.equals("started",true)) {
		$('#downloadbutton').tooltip("disable");
		$('#filter_links').tooltip("disable");
		$('#hide_selected_links').tooltip("disable");
		$('#select_all').tooltip("disable");
		$('.refreshlink').tooltip("disable");
		$('#share_links').tooltip("disable");
		$('.removelinkfromset').tooltip("disable");
		$('.addlinktoset').tooltip("disable");
		$('.like').tooltip("disable");
		$('.icon-comment').tooltip("disable");
		$('.icon-ok').tooltip("disable");
		$('.icon-question-sign').tooltip("disable");
		$('.icon-remove').tooltip("disable");
		$('.delete_link').tooltip("disable");
		$('.hide_link').tooltip("disable");
		$('#sort_like').tooltip("disable");
		$('#sort_date_published').tooltip("disable");
		$('#refreship').tooltip("disable");
		$('#port').tooltip("disable");
		$('#autoupdate').tooltip("disable");
		$('#showdownloadedlinks').tooltip("disable");
		$('#jdon').tooltip("disable");
		$('#jdoff').tooltip("disable");
		$('.remove_site').tooltip("disable");
		$('.icon-facebook').tooltip("disable");
		$('.icon-rss').tooltip("disable");
		$('.icon-time').tooltip("disable");
		$('.icon-ban-circle').tooltip("disable");
		$('.crawl_single_site').tooltip("disable");
	}	
	
	if (Meteor.user() && Meteor.user().profile.showtooltips === true && Session.equals("started",true)) {
		$('#downloadbutton').tooltip("enable");
		$('#filter_links').tooltip("enable");
		$('#hide_selected_links').tooltip("enable");
		$('#select_all').tooltip("enable");
		$('.refreshlink').tooltip("enable");
		$('#share_links').tooltip("enable");
		$('.removelinkfromset').tooltip("enable");
		$('.addlinktoset').tooltip("enable");
		$('.like').tooltip("enable");
		$('.icon-comment').tooltip("enable");
		$('.icon-ok').tooltip("enable");
		$('.icon-question-sign').tooltip("enable");
		$('.icon-remove').tooltip("enable");
		$('.delete_link').tooltip("enable");
		$('.hide_link').tooltip("enable");
		$('#sort_like').tooltip("enable");
		$('#sort_date_published').tooltip("enable");
		$('#refreship').tooltip("enable");
		$('#port').tooltip("enable");
		$('#autoupdate').tooltip("enable");
		$('#showdownloadedlinks').tooltip("enable");
		$('#jdon').tooltip("enable");
		$('#jdoff').tooltip("enable");
		$('.remove_site').tooltip("enable");
		$('.icon-facebook').tooltip("enable");
		$('.icon-rss').tooltip("enable");
		$('.icon-time').tooltip("enable");
		$('.icon-ban-circle').tooltip("enable");
		$('.crawl_single_site').tooltip("enable");
	}	
	
	if (Meteor.user() && Session.equals("init",false)) {
		Session.set("init",true);
		
		Meteor.logoutOtherClients();

		if (window.SCM && Meteor.user().profile.volume) {
			SCM.volume(Meteor.user().profile.volume);
		}
		
		moment.lang(Meteor.user().profile.locale.substr(0,2));
		
		Session.set("filter_show_already_downloaded", Meteor.user().profile.showdownloadedlinks);
		Session.set("filter_mixes", Meteor.user().profile.hidemixes);
		if (Meteor.user().profile.hidemixes === true) Session.set("filter_mixes", true);
		if (Meteor.user().profile.showunknownlinks === true) Session.set("filter_status", ["on", "unknown"]);
		else {
			Session.set("filter_status", ["on"]);
		}
		if (Meteor.user().profile.filteredsites !== undefined) {
			Session.set("filter_sites", Meteor.user().profile.filteredsites);
			Session.set("temp_filter_sites", Meteor.user().profile.filteredsites);
		}
		
		if (!VK.Auth.getSession() && _.contains(Meteor.user().profile.searchproviders, "vk.com"))
			VK.Auth.login(undefined,8)
		
		// update user IP and check if JD Remote is responding
		var oldip = Meteor.user().profile.ip;
	
		if (Meteor.user().profile.autoupdateip === true) {
			HTTP.call("GET", "http://api.hostip.info/get_json.php", function (error, result) {
				if (error) console.log("Fehler beim Ermitteln der Benutzer-IP");
				if (result && result.statusCode && result.statusCode === 200 && result.data && result.data.ip)
					Meteor.users.update({
						_id: Meteor.userId()
					}, {
						$set: {
							'profile.ip': result.data.ip,
						}
					});
			});
		}
		// unabhängig von autoupdate schauen wir, ob die gewünschte IP
		// online ist
		Meteor.call("checkJDOnlineStatus", {
			ip: Meteor.user().profile.ip,
			port: Meteor.user().profile.port
		}, function (error, isOnline) {
			if (error) 
			{
				if (Meteor.user().profile.autoupdateip === true && (oldip != Meteor.user().profile.ip))
					Meteor.call("checkJDOnlineStatus", {
						ip: oldip,
						port: Meteor.user().profile.port
					}, function (error2, isOnline2) {
						if (error2) console.log("Fehler beim Ermitteln des Online-Status");
						Session.set("JDOnlineStatus", isOnline2);
					});
				else console.log("Fehler beim Ermitteln des Online-Status");
			}
			Session.set("JDOnlineStatus", isOnline);
		});
	}
});

//
// Startup function
Meteor.startup(function () {	
	//initialize soundcloud API for external search with app key
	SC.initialize({
		client_id: Meteor.settings.public.soundcloud.client_id
	});
	
	SC.whenStreamingReady(function(){Session.set("soundcloud_ready", true)})
	
	VK.init({
		apiId: Meteor.settings.public.vk.apiId
	});
	
	VK.Observer.subscribe("auth.statusChange", function f() 
	{ 
		if (!VK.Auth.getSession()) {
			if (Meteor.user() && _.contains(Meteor.user().profile.searchproviders, "vk.com")) {
				var newproviders = _.without(Meteor.user().profile.searchproviders,"vk.com");
				
				Meteor.users.update({
					_id: Meteor.userId()
				}, {
					$set: {
						'profile.searchproviders': newproviders
					}
				});
			}
		}
	}); 
	
	$.fn.editable.defaults.validate = function (value) {
		if ($.trim(value) == '') {
			return 'Name darf nicht leer sein.';
		}
	};
	
	activateInput($('#searchfield'));
	
	didScroll = false;
	
	$(window).scroll(function () {
		didScroll = true;
	});

	Meteor.setInterval(function() {
		if (didScroll) {
			didScroll = false;
			
			bottomMargin = 49;
			itemHeight = 30;
			threshold = 10 * itemHeight + bottomMargin;
				
			if (
				Session.equals("showAccountSettingsDialog", false) &&
				Session.equals("showAddLinkDialog", false) &&
				Session.equals("showAddSiteDialog", false) &&
				Session.equals("showSitesDialog", false) &&
				Session.equals("showFilterSitesDialog", false) &&
				Session.equals("showShareLinkDialog", false) &&
				Session.equals("showBulkDownloadDialog", false) &&
				Links.findOne() &&
				$(document).height() - $(window).height() <= $(window).scrollTop() + threshold
			){
						if (Session.get("filter_limit") <= 4 && Session.equals("wait_for_items", false) && Links.find().count() === (Session.get("filter_limit") * Meteor.settings.public.itembadgesize)) {
							Session.set("wait_for_items", true);
							Session.set("filter_limit", Session.get("filter_limit") + 1);
						}
			}
		}
	}, 300);
	
	Session.set("started",true);
});
// Template-Helper für handlebars
// represent ISO Date as String from now (e.g. 3 minute before, in 1 hour)
// usage: {{dateFormatPretty creation_date}}
UI.registerHelper('dateFormatPretty', function (context) {
	if (window.moment) {
		if (context && moment(context).isValid()) return moment(context).fromNow();
		return "noch nie";
	}
	return context; // moment plugin not available. return data as is.;
});
UI.registerHelper('millisecondsFormatPretty', function (context) {
	if (window.moment) {
		if (context && moment(context).isValid()) return moment(context).format('mm:ss') + " min.";
		return "unbekannt";
	}
	return context; // moment plugin not available. return data as is.;
});
UI.registerHelper('searchProviderEnabled', function (context) {
	if (Meteor.user()) {
		return _.contains(Meteor.user().profile.searchproviders, context);
	}
	return true;
});
// Template-Helper für handlebars
// Session Objekt in Handlebars direkt nutzen
UI.registerHelper('session', function (input) {
	return Session.get(input);
});
//
// Handlebars-Funktionen
//
// Connected-Status nutzen für Fehlermeldungsanzeige
Template.page.notConnected = function () {
	return !Meteor.status().connected;
};
Template.page.searchresultsFound = function () {
	if (SearchResults.findOne()) return true;
	return false;
};
Template.page.linksFound = function () {
	if (Links.findOne()) return true;
	return false;
};

Template.user_loggedout.loginServicesConfigured = function () {
	return Accounts.loginServicesConfigured();
};

Template.page.linksFoundLessThanThree = function () {
	if (Links.find().count() < 3) return true;
	return false;
};

Template.page.isExternalSearch = function () {
	if (Meteor.user())
		return (!(Session.equals("filter_term", "")) && Meteor.user().profile.searchproviders.length);
	return false;
};
// Funktion um zu bestimmen, ob irgend ein Link ausgewählt ist
Template.navigation.isAnyLinkSelected = function () {
	if (Session.get("selected_links").length) return true;
	return false;
};
Template.linklist.isAnyLinkSelectedSet = function () {
	if (Session.get("temp_set").length) return true;
	return false;
};
Template.linklist.getNextLinksText = function () {
	return (parseInt(Session.get("filter_skip")) + 251) + "-" + (parseInt(Session.get("filter_skip")) + 300);
};
Template.linklist.sortLikes = function () {
	return Session.equals("filter_sort", "likes");
};
Template.linklist.sortPublished = function () {
	return Session.equals("filter_sort", "date_published");
};
Template.linklist.getCurrentLinksText = function () {
	if (Links.find().count() === 1) return undefined;
	if (Links.find().count() === (Session.get("filter_limit") * Meteor.settings.public.itembadgesize)) return (parseInt(Session.get("filter_skip")) + 1) + "-" + (parseInt(Session.get("filter_skip")) + 250);
	return (parseInt(Session.get("filter_skip")) + 1) + "-" + (parseInt(Session.get("filter_skip")) + Links.find().count());
};
Template.linklist.hasMoreLinks = function () {
	return (Links.find().count() === (Session.get("filter_limit") * Meteor.settings.public.itembadgesize));
};
Template.linklist.isLinksLimit = function () {
	return (Session.equals("filter_limit", 5));
};
Template.linklist.isAnyLinkSelected = function () {
	if (Session.get("selected_links").length) return true;
	return false;
};
// Funktion um den letzten Suchbegriff wieder ins Input Feld einzutragen
Template.navigation.getLastSearchTerm = function () {
	if (!Session.equals("filter_term","")) return Session.get("filter_term").replace(/\.\*/g, "").replace(/\\/g, "");
	return undefined;
};
Template.link.isSearch = function () {
	if (!Session.equals("filter_term","")) return true;
	return false;
};
// Funktion um die Anzahl der Seiten als badge anzuzeigen
Template.navigation.getActiveSitesCount = function () {
	return Sites.find({"active" : true}).count();
};
// Links-Outlet: alle Links, die gerade in der Subscription sind
Template.linklist.links = function () {
	return Links.find();
};
Template.searchresultlist.searchresults = function () {
	return SearchResults.find({});
};
Template.link.isNotAlreadyDownloaded = function () {
	if (this.downloaders && this.downloaders.length) return !_.contains(this.downloaders, Meteor.userId());
	return true;
};
// Link-Größe von Kilobyte in MB umwandeln
Template.link.getSizeinMB = function () {
	if (this.size && this.size > 0) {
		var sizeinMB = Math.round(this.size / 1048576);
		if (Math.ceil(Math.log(sizeinMB + 1) / Math.LN10) > 3) {
			var sizeinGB = sizeinMB / 1024;
			return sizeinGB.toFixed(1).toString().replace(".", ",") + " GB";
		}
		return sizeinMB + " MB";
	}
	return undefined;
};
// Status-Icon auswählen je nach Status des Links
Template.link.getStatusIcon = function () {
	return Template[this.status + "icon"];
};
// Funktion um zu bestimmen, ob ein Link ausgewählt ist
Template.link.isLinkSelected = function () {
	var selected = Session.get("selected_links");
	for (var i = 0; i < selected.length; i++) {
		if (EJSON.equals(this._id, selected[i])) return true;
	}
	return false;
};
Template.link.isLinkSelectedSet = function () {
	var selected = Session.get("temp_set");
	for (var i = 0; i < selected.length; i++) {
		if (EJSON.equals(this._id, selected[i])) return true;
	}
	return false;
};
// Funktion, die anhand der Source-URL im Link Objekt den zugehörigen Namen raussucht
Template.link.getSourceName = function () {
	if (Session.equals("sites_completed", true)) {
		if (this.source && this.source !== null) {
			var aSite = Sites.findOne({
				feedurl: this.source
			}, {
				fields: {
					name: 1
				}
			});
			if (aSite) return aSite.name;
		}
		if (Session.equals("users_completed", true)) {
			if (this.creator && this.creator !== null) {
				var aUser = Meteor.users.findOne({
					id: this.creator
				});
				if (aUser && aUser.profile) return aUser.profile['first_name'];
			}
		}
	}
	return undefined;
};

Template.link.isPlayable = function () {
	if (this.status != 'off') {
		switch (this.hoster) {
			case "soundcloud.com":
			case "youtube.com":
			case "myfreemp3.eu":
			case "ex.fm":
				return true;
			case "beatport.com" :
			case "mp3monkey.net":
			case "zippyshare.com" :
				if (this.stream_url)
					return true;
				return false;
			case "vimeo.com":
			case "muzofon.com":
				return false;
			case "vk.com":
				if (this.aid && this.oid && Meteor.user() && _.contains(Meteor.user().profile.searchproviders, "vk.com"))
					return true;
				return false;
			default:
				return false;
		}
	}
	return false;
};
Template.link.isDownloadable = function () {
	if (this.status != 'off') {
		switch (this.hoster) {
			case "beatport.com":
				return false;
			default:
				return true;
		}
	}
	return false;
};
Template.searchresult.isPlayable = function () {
	if (this.status != 'off') {
		switch (this.hoster) {
			case "soundcloud.com":
			case "youtube.com":
			case "myfreemp3.eu":
			case "ex.fm":
				return true;
			case "beatport.com" :
			case "mp3monkey.net":
			case "zippyshare.com" :
				if (this.stream_url)
					return true;
				return false;
			case "muzofon.com":
			case "vimeo.com":
				return false;
			case "vk.com":
				if (this.aid && this.oid && Meteor.user() && _.contains(Meteor.user().profile.searchproviders, "vk.com"))
					return true;
				return false;
			default:
				return false;
		}
	}
	return false;
};
Template.searchresult.isDownloadable = function () {
	if (this.status != 'off') {
		switch (this.hoster) {
			case "beatport.com":
				return false;
			default:
				return true;
		}
	}
	return false;
};
Template.searchresult.getExternalSourceIcon = function () {
	return Template[this.hoster + "icon"];
};
// Funktion um alle Seiten ins Template zu geben (die subscription)
Template.sitesDialog.sites = function () {
	return Sites.find({});
};
Template.filterSitesDialog.sites = function () {
	return Sites.find({});
};
Template.filterSitesDialog.isSiteFiltered = function () {
	return _.contains(Session.get("temp_filter_sites"), this.feedurl);
};
Template.filterSitesDialog.noSitefiltered = function () {
	if (Session.get("temp_filter_sites")) return !Session.get("temp_filter_sites").length;
	return true;
};
// Funktion, um den Feed-Typ per Icon zu symbolisieren
Template.sitesDialog.getFeedTypeIcon = function () {
	return Template[this.type + "siteicon"]
};
// Funktion um zu überprüfen, ob eine Seite von einem User erstellt wurde
Template.sitesDialog.isOwner = function () {
	if (!Meteor.user()) return false;
	if (this.creator === Meteor.user().id) return true;
	return false;
};
// Funktion die prüft, ob der letzte Crawl einer Seite mehr als 24 Stunden her ist
Template.sitesDialog.canCrawlAgain = function () {
	if (!this.last_crawled || this.last_crawled == null) return true;
	if ((new Date() - this.last_crawled) > (1000 * 60 * 60 * 24)) return true;
	return false;
};
Template.shareLinkDialog.getUsereMail = function () {
	if (Meteor.user()) return Meteor.user().emails[0].address;
	return "housemusicpro@googlemail.com";
};
// Funktion, um ein Eingabeelement auszuwählen und den Focus drauf zu setzen
var activateInput = function (input) {
	input.focus();
	input.select();
};
// Session Variablen, um Dialoge anzuzeigen
var openAccountSettingsDialog = function () {
	if (Meteor.status().connected) Session.set("showAccountSettingsDialog", true);
};
var openAddLinkDialog = function () {
	if (Meteor.status().connected) Session.set("showAddLinkDialog", true);
};
var openAddSiteDialog = function () {
	if (Meteor.status().connected) Session.set("showAddSiteDialog", true);
};
var openSitesDialog = function () {
	if (Meteor.status().connected) Session.set("showSitesDialog", true);
};
var openFilterSitesDialog = function () {
	if (Meteor.status().connected) Session.set("showFilterSitesDialog", true);
};
var openShareLinkDialog = function () {
	if (Meteor.status().connected) Session.set("showShareLinkDialog", true);
};
var openBulkDownloadDialog = function () {
	if (Meteor.status().connected) Session.set("showBulkDownloadDialog", true);
};
//
// Eventhandler
//
UI.body.events({
	'click': function (event, target) {
		if (event.target.className.indexOf("icon-user") === -1) $('#accountbtn').popover('hide');
		
		if (!(event.target.form && event.target.form.className == "newcommentform")) {
			if (event.target.id.indexOf("comment") === -1) if (event.target.className.indexOf("popover") === -1) if (event.target.className.indexOf("comment") === -1) if (event.target.outerHTML.indexOf("comment") === -1) {
							$('.icon-comment').popover('hide');
						}
		}
	}
});
// Eventhandler, um das Fenster zu schließen, wenn der Beenden Knopf in der ConnectionWarning gedrückt wird
Template.connectionLostWarning.events({
	'click #terminateappbutton': function () {
		if ($.browser.opera || $.browser.mozilla) window.close();
		else {
			window.open('', '_self', '');
			window.close();
		}
	},
	'click #waitbutton': function (event, template) {
		event.preventDefault();
		event.target.disabled = true;
		event.target.innerHTML = "<i class='icon-loader'></i> Warten";
		Meteor.setTimeout(function () {
			event.target.innerHTML = "<i class='icon-warning-sign'></i> Verbindung verloren";
		}, 10000);
	}
});
// Klick auf Login-Button
Template.user_loggedout.events({
	'click #login': function () {
		// wir loggen den User mit Facebook ein, erbitten Zugriff auf seine
		// eMail-Addresse
		if (Accounts.loginServicesConfigured())
			Meteor.loginWithFacebook({
				requestPermissions: ['email']
			}, function (error) {
				if (error) {
					console.log("Beim Einloggen ist ein unerwarteter Fehler aufgetreten.");
					console.log(error);
				}		
			});
	}
});
// Logout-Eventhandler
Template.user_loggedin.events({
	'click #logout': function () {
		Session.set("init",false);
		if (VK.Auth.getSession()) VK.Auth.logout();
		Meteor.logout(function (error) {
			if (error) {
				alert("Fehler beim Ausloggen", "Beim Ausloggen ist ein unerwarteter Fehler aufgetreten. \nBitte schließ das Fenster und öffne den MusicCrawler erneut.");
			}
		});
	},
	//Accounteinstellungen anzeigen
	'click #showsettings': function (event, template) {
		event.preventDefault();
		if (Meteor.user())
			Session.set("filter_show_already_downloaded", Meteor.user().profile.showdownloadedlinks);
		openAccountSettingsDialog();
		return false;
	},
	'click #showsitefilter': function (event, template) {
		event.preventDefault();
		openFilterSitesDialog();
		return false;
	},
	'click #accountbtn': function (event, template) {
		event.preventDefault();
		event.stopPropagation();
		return false;
	},
	'click #cleandatabase': function (event, template) {
		event.preventDefault();
		event.target.innerHTML = "<i class='icon-loader'></i> Datenbank bereinigen";
		
		Meteor.call("scheduleCleanup", function (error, result) {
			if (result && result.data && result.data.status == "ok") {
				console.log("Successfully scheduled database cleanup.");
				event.target.innerHTML = "<i class='icon-ok'></i> Datenbank bereinigen";
			}
			if (error) {
				console.log("Error scheduling database cleanup.");
				event.target.innerHTML = "<i class='icon-remove'></i> Datenbank bereinigen";
			}
		});
		return false;
	}
});
Template.navigation.rendered = function () {
	this.$('li.linkfilter').removeClass("active");
	var activenumber = parseInt(Session.get("selected_navitem"));
	this.$('li.linkfilter #' + activenumber).parent().addClass("active");
	
	if (this.$('#downloadbutton').attr("disabled") == "disabled") 
		this.$('#downloadbutton').tooltip({
			title: "Dein JDownloader ist nicht erreichbar oder du hast keinen Link ausgewählt. Bitte wähle einen Link aus und überprüfe ggf. dein Profil.",
			placement: "bottom",
			disabled: true
	});
	else {
		this.$('#downloadbutton').tooltip({
			title: "Alle ausgewählten Links an JDownloader zum Download übergeben",
			placement: "bottom",
			disabled: true
		});
	}
	
	//var intrender = Meteor.setInterval(function() {
		straddress = "<address><strong>Thimo Brinkmann</strong><br>Tornberg 28<br>22337 Hamburg<br><a href='mailto:#'>thimo.brinkmann@googlemail.com</a></address>";
		strdonatebutton = "<small>Entwicklung und Betrieb dieser App kosten Geld und Zeit. Wenn dir die App gefällt, kannst du gerne etwas</small><form action='https://www.paypal.com/cgi-bin/webscr' method='post' target='_blank'><input type='hidden' name='cmd' value='_s-xclick'><input type='hidden' name='hosted_button_id' value='32N6Y5AVXSV8C'><input type='image' src='https://www.paypalobjects.com/de_DE/DE/i/btn/btn_donate_SM.gif' border='0' name='submit' alt='Jetzt einfach, schnell und sicher online bezahlen – mit PayPal.'><img alt='' border='0' src='https://www.paypalobjects.com/de_DE/i/scr/pixel.gif' width='1' height='1'></form>";
		if (Meteor.user()) {
	//		Meteor.clearInterval(intrender);
			
			this.$('#brand').popover({
				animation: true,
				placement: "bottom",
				trigger: "hover",
				title: "Impressum",
				html: true,
				content: straddress + strdonatebutton,
				delay: {
					show: 1000,
					hide: 3000
				}
			});
		
			var searchTracks = _.debounce(function(query, process) {
				Meteor.call("getSuggestionsForSearchTermV2", ".*" + query.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1") + ".*", function (error, result) {
					if (result && result.length) {
						result.unshift(query.trim());
					}
					process(result);
				});
			}, 300);
			
			$('#searchfield').typeahead({
				items: 11,
				minLength: 4,
				source: function (query, process) {
					searchTracks(query, process);
				},
				updater: function (name) {
					SearchResults.remove({});
					var term = name.trim();
					var prev_filter_date = Session.get("filter_date");
					var prev_filter_skip = Session.get("filter_skip");
					Session.set("links_completed", false);
					Session.set("filter_id", undefined);
					Session.set("prev_filter_skip", prev_filter_skip);
					Session.set("prev_filter_date", prev_filter_date);
					Session.set("filter_show_already_downloaded", true);
					Session.set("filter_date", new Date(new Date().setDate(new Date().getDate() - 365)));
					Session.set("filter_status", ["on", "off", "unknown"]);
					Session.set("filter_term", term.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1"));
					Session.set("filter_skip", 0);
					Session.set("filter_sites", []);
					Session.set("filter_mixes",false);

					return name;
				},
				matcher: function (item) {
					return true;
				},
				highlighter: function (item) {
					var badtag = /^s$|^t$|^r$|^o$|^n$|^g$|^s$|^s$|^st$|^str$|^stro$|^stron$|^strong$/gi
				
					var searchterms = this.query.trim().split(" ");
					var newitem = item;
					for (var i = 0; i < searchterms.length; i++) {
						var regex = new RegExp('(' + searchterms[i] + ')', 'i');
						if (!badtag.test(searchterms[i]))
							newitem = newitem.replace(regex, "<strong>$1</strong>");
					}
					return newitem;
				},
			});
		}
	//},1000);
};
//Eventhandler für die Navigationsleiste
Template.navigation.events({
	//Seite hinzufügen Dialog öffnen
	'click #addsitebutton': function (event, template) {
		event.preventDefault();
		openAddSiteDialog();
		Meteor.setTimeout(function () {
			activateInput($('#newsiteurl'));
		}, 250);
		return false;
	},
	//Seiten anzeigen Dialog öffnen
	'click #showsitesbutton': function (event, template) {
		event.preventDefault();
		openSitesDialog();
		return false;
	},
	//Links downloaden Aktion ausführen
	'click #downloadbutton': function (event, template) {
		var selected = Session.get("selected_links");
		if (selected.length && Session.equals("JDOnlineStatus", true)) {
			Session.set("progressActive", true);
			Session.set("progress", 5);
			var selectedurls = Links.find({
				_id: {
					$in: selected
				}
			}, {
				fields: {
					_id: 1,
					url: 1,
					aid: 1,
					oid: 1,
					hoster: 1
				}
			}).fetch();
			var urls_per_request = 20;
			var times = parseInt(Math.ceil(selectedurls.length / urls_per_request));
			var progressstep = 95 / (times * 2);
			var errorcount = 0;
			
			for (var i = 1; i <= times; i++) {
				Session.set("progressState", "progress-info");
				var oldprogress = Session.get("progress");
				Session.set("progress", parseInt(oldprogress + progressstep));
				var sel_links_raw = selectedurls.splice(0, urls_per_request);

				var selectedurls_vk = [];
				var selectedids_vk;
						
			
				if (VK.Auth.getSession())
				{	
					selectedids_vk = _.reduce(sel_links_raw, function(memo, item){ 
						if (item.hoster === "vk.com" && item.oid && item.aid)
							return item.oid+"_"+item.aid + "," + memo;
						return memo;
					},"");	
								
					VK.Api.call("audio.getById",{audios: selectedids_vk.substring(0, selectedids_vk.length - 1)}, function(result)
					{
						if (result)
						{
							if (result.response)
								selectedurls_vk = _.pluck(result.response,"url");
						}
							
						selectedurls = _.union(_.pluck(_.reject(sel_links_raw,function(item){return item.hoster === "vk.com"}),"url"),selectedurls_vk);
							
						var links_chained = _.reduce(selectedurls, function (memo, item) {
							return memo + "<br/>" + item;
						},"");	
						
						var grabberoption;
						if (links_chained.match(/youtube|vimeo/i)) grabberoption = "grabber1";
						else grabberoption = "grabber0";
						if (Meteor.user())
							var requeststring = "http://" + Meteor.user().profile.ip + ":" + Meteor.user().profile.port + "/action/add/links/" + grabberoption + "/start1/" + links_chained;
						requeststring = requeststring.replace("?", "%3F").replace("=", "%3D");
						Meteor.call("sendLinks", requeststring, function (error, result) {
							if (error) {
								errorcount++;
								if (errorcount > 2) {
									Session.set("progressState", "progress-danger");
									Session.set("progress", 100);
									Session.set("progressActive", false);
									Meteor.setTimeout(function () {
										Session.set("progress", undefined);
										Session.set("progressState", undefined);
									}, 3500);
									return;
								}
								console.log("Fehler beim Senden der Links an JDownloader. (" + error.details + ")");
								Session.set("progressState", "progress-warning");
							}
							if (result) {
								Meteor.call("markLinksAsDownloadedByURL", selectedurls, function (error2, result2) {
									if (error2) console.log("Error updating Links after Download.");
								});
							}
							var oldprogress = Session.get("progress");
							Session.set("progress", parseInt(oldprogress + progressstep));
							if (Session.get("progress") >= 99) {
								if (Session.equals("progressState", "progress-warning")) Session.set("progressState", "progress-danger");
								else Session.set("progressState", "progress-success");
								Session.set("progress", 100);
								Session.set("progressActive", false);
								Meteor.setTimeout(function () {
									Session.set("progress", undefined);
									Session.set("progressState", undefined);
								}, 3500);
								Session.set("selected_links", []);
							}
						});
					});			
				}
				else
				{
					selectedurls = _.pluck(_.reject(sel_links_raw,function(item){return item.hoster === "vk.com"}),"url");
					
					var links_chained = _.reduce(selectedurls, function (memo, item) {
							return memo + "<br/>" + item;
					},"");	
					
					var grabberoption;
					if (links_chained.match(/youtube|vimeo/i)) grabberoption = "grabber1";
					else grabberoption = "grabber0";
					if (Meteor.user())
						var requeststring = "http://" + Meteor.user().profile.ip + ":" + Meteor.user().profile.port + "/action/add/links/" + grabberoption + "/start1/" + links_chained;
					requeststring = requeststring.replace("?", "%3F").replace("=", "%3D");
					Meteor.call("sendLinks", requeststring, function (error, result) {
						if (error) {
							errorcount++;
							if (errorcount > 2) {
								Session.set("progressState", "progress-danger");
								Session.set("progress", 100);
								Session.set("progressActive", false);
								Meteor.setTimeout(function () {
									Session.set("progress", undefined);
									Session.set("progressState", undefined);
								}, 3500);
								return;
							}
							console.log("Fehler beim Senden der Links an JDownloader. (" + error.details + ")");
							Session.set("progressState", "progress-warning");
						}
						if (result) {
							Meteor.call("markLinksAsDownloadedByURL", selectedurls, function (error2, result2) {
								if (error2) console.log("Error updating Links after Download.");
							});
						}
						var oldprogress = Session.get("progress");
						Session.set("progress", parseInt(oldprogress + progressstep));
						if (Session.get("progress") >= 99) {
							if (Session.equals("progressState", "progress-warning")) Session.set("progressState", "progress-danger");
							else Session.set("progressState", "progress-success");
							Session.set("progress", 100);
							Session.set("progressActive", false);
							Meteor.setTimeout(function () {
								Session.set("progress", undefined);
								Session.set("progressState", undefined);
							}, 3500);
							Session.set("selected_links", []);
						}
					});
				}
			}
		}
	},
	//Link-URLs kopieren Aktion ausführen
	'click #copybutton': function (event, template) {
		var selected = Session.get("selected_links");
		
		if (selected.length) {
			var selectedurls_raw = Links.find({
				_id: {
					'$in': selected
				}
			}, {
				fields: {
					_id: 1,
					url: 1,
					aid: 1,
					oid: 1,
					hoster: 1
				}
			}).fetch();
			
			var selectedurls_vk = [];
			var selectedids_vk;
			
			if (VK.Auth.getSession())
			{	
				 selectedids_vk = _.reduce(selectedurls_raw, function(memo, item){ 
					if (item.hoster === "vk.com" && item.oid && item.aid)
						return item.oid+"_"+item.aid + "," + memo;
					return memo;
				},"");	
			
				VK.Api.call("audio.getById",{audios: selectedids_vk.substring(0, selectedids_vk.length - 1)}, function(result)
				{
						if (result)
						{
							if (result.response)
								selectedurls_vk = _.pluck(result.response,"url");
						}
						
						selectedurls = _.union(_.pluck(_.reject(selectedurls_raw,function(item){return item.hoster === "vk.com"}),"url"),selectedurls_vk);
						
						if (selectedurls.length)
							writeConsole(_.reduce(selectedurls, function (memo, item) {
								return memo + "<br/>" + item;
							}),"");
										
						var selected_str = _.pluck(selected,"_str")
			
						Meteor.call("markLinksAsDownloadedById", selected_str, function (error, result) {
							if (error) console.log("Error updating Links while copying to clipboard.");
						});
				});			
			}
			else
			{
				selectedurls = _.pluck(_.reject(selectedurls_raw,function(item){return item.hoster === "vk.com"}),"url");
				
				if (selectedurls.length)				
					writeConsole(_.reduce(selectedurls, function (memo, item) {
						return memo + "<br/>" + item;
					}),"");		

				var selected_str = _.pluck(_.pluck(_.reject(selectedurls_raw,function(item){return item.hoster === "vk.com"}),"_id"),"_str")
			
				Meteor.call("markLinksAsDownloadedById", selected_str, function (error, result) {
					if (error) console.log("Error updating Links while copying to clipboard.");
				});
			}

			Session.set("selected_links", []);
		}
	},
	'click #addlinkbutton': function (event, template) {
		event.preventDefault();
		openAddLinkDialog();
		Meteor.setTimeout(function () {
			activateInput($('#newlinkurl'));
		}, 250);
		return false;
	},
	'click #bulkdownloadbutton': function (event, template) {
		event.preventDefault();
		openBulkDownloadDialog();
		return false;
	},
	'click .linkfilter': function (event, template) {
		event.preventDefault();
		$("html, body").animate({
			scrollTop: 0
		}, "fast");
		Session.set("links_completed", false);
		Session.set("filter_id", undefined);
		var sitefilter = Session.get("filter_sites");
		if (Meteor.user())
		{
			Session.set("filter_show_already_downloaded", Meteor.user().profile.showdownloadedlinks);
			Session.set("filter_mixes", Meteor.user().profile.hidemixes);
		}
			
		Session.set("filter_sites", _.without(sitefilter, Meteor.user().id));
		Session.set("filter_limit", 1);
		Session.set("filter_skip", 0);
		Session.set("filter_term", "");
		Session.set("filter_term_external", undefined);
		Session.set("filter_date", new Date(new Date().setDate(new Date().getDate() - event.target.id)));
		Session.set("selected_navitem", parseInt(event.target.id));
		$('li.linkfilter').removeClass("active");
		var activenumber = parseInt(Session.get("selected_navitem"));
		$('li.linkfilter #' + activenumber).parent().addClass("active");
		SearchResults.remove({});

	},
	'submit #searchform': function (event, template) {
		event.preventDefault();
		event.stopPropagation();
		Session.set("links_completed", false);
		Session.set("filter_id", undefined);
		var term = template.find('#searchfield').value.trim();
		Session.set("filter_limit", 1);
		Session.set("filter_skip", 0);
		var sitefilter = Session.get("filter_sites");
		Session.set("filter_sites", _.without(sitefilter, Meteor.user().id));
		if (term && term != undefined && term != "") {
			SearchResults.remove({});
			var prev_filter_date = Session.get("filter_date");
			var prev_filter_skip = Session.get("filter_skip");
			Session.set("prev_filter_skip", prev_filter_skip);
			Session.set("prev_filter_date", prev_filter_date);
			Session.set("filter_sites", []);
			Session.set("filter_mixes", false);
			Session.set("filter_show_already_downloaded", true);
			Session.set("filter_date", new Date(new Date().setDate(new Date().getDate() - 365)));
			Session.set("filter_status", ["on", "off", "unknown"]);
			Session.set("filter_term", term.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1"));
		} else {
			if (Meteor.user())
				Session.set("filter_show_already_downloaded", Meteor.user().profile.showdownloadedlinks);
				Session.set("filter_mixes", Meteor.user().profile.hidemixes);
			Session.set("filter_term", "");
			if (Meteor.user() && Meteor.user().profile.filteredsites) {
				Session.set("filter_sites", Meteor.user().profile.filteredsites);
				Session.set("temp_filter_sites", Meteor.user().profile.filteredsites);
			}
			if (Session.get("prev_filter_date")) {
				Session.set("filter_date", Session.get("prev_filter_date"));
				Session.set("filter_skip", Session.get("prev_filter_skip"));
				Session.set("selected_navitem", Math.round((new Date().getTime() - Session.get("prev_filter_date").getTime()) / (24 * 3600 * 1000)));
				$('li.linkfilter').removeClass("active");
				var activenumber = parseInt(Session.get("selected_navitem"));
				$('li.linkfilter #' + activenumber).parent().addClass("active");
			} else {
				Session.set("filter_date", new Date(new Date().setDate(new Date().getDate() - 14)));
				Session.set("selected_navitem", 14);
				$('li.linkfilter').removeClass("active");
				var activenumber = Session.get("selected_navitem");
				$('li.linkfilter #' + activenumber).parent().addClass("active");
			}
			if (Meteor.user() && Meteor.user().profile.showunknownlinks === true) Session.set("filter_status", ["on", "unknown"]);
			else {
				Session.set("filter_status", ["on"]);
			}
		}
		if (Meteor.user() && Meteor.user().profile.searchproviders.length && term && term != undefined && term != "") Session.set("loading_results", true);
		
		Meteor.setTimeout(function () {
			Session.set("loading_results", false);
		}, 8000);
		
		return false;
	}
});
//Events für das Template der Linkliste
Template.linklist.events = ({
	//Links teilen
	'click #share_links': function (event, template) {
		event.preventDefault();
		openShareLinkDialog();
		Meteor.setTimeout(function () {
			activateInput($('#sharelinkaddress'));
		}, 250);
		return false;
	},
	'click #sort_like': function (event, template) {
		Session.set("filter_sort", "likes");
	},
	'click #sort_date_published': function (event, template) {
		Session.set("filter_sort", "date_published");
	},
	'click #paginate': function (event, template) {
		$("html, body").animate({
			scrollTop: 0
		}, "fast");
		Session.set("filter_limit", 1);
		Session.set("filter_skip", Session.get("filter_skip") + 250);
		Session.set("selected_links", []);
	},
	//Links filtern (alle / auch unbekannte)
	'click #filter_links': function (event, template) {
		event.preventDefault();
		Session.set("filter_limit", 1);
		Session.set("filter_skip", 0);
		var tmp_status = Session.get("filter_status");
		if (_.indexOf(tmp_status, "unknown") != -1) {
			tmp_status = _.without(tmp_status, "off", "unknown");
			event.target.className = "icon-filter hand";
			Meteor.users.update({
				_id: Meteor.userId()
			}, {
				$set: {
					'profile.showunknownlinks': false,
				}
			});
		} else {
			tmp_status = new Array("on", "unknown");
			event.target.className = "icon-filter hand icon-white";
			Meteor.users.update({
				_id: Meteor.userId()
			}, {
				$set: {
					'profile.showunknownlinks': true,
				}
			});
		}
		Session.set("filter_status", _.uniq(tmp_status));
	},
	//alle Links anhaken, die gerade zu sehen sind
	'click #select_all': function (event, template) {
		if (event.target.checked === true) {
			if (VK.Auth.getSession()) {
				var selected = _.pluck(Links.find({}, {
					fields: {
						_id: 1
					}
				}).fetch(), '_id');
			}
			else {
				var selected = _.pluck(Links.find({"hoster":{$ne: "vk.com"}}, {
					fields: {
						_id: 1
					}
				}).fetch(), '_id');
			}
			Session.set("selected_links", selected);
		} else Session.set("selected_links", []);
	},
	'click #hide_selected_links': function (event, template) {
		var selected = _.map(Session.get("selected_links"), function (linkobj) {
			return linkobj._str;
		});
		if (selected.length) {
			Meteor.call("markLinksAsDownloadedById", selected, function (error, result) {
				if (error) console.log("Error updating Links while marking as read.");
			});
			Session.set("selected_links", []);
		}
	}
});
/*
Template.link.rendered = function () {
	link = this.data;
	htmlstr = "<form class='newcommentform' id=" + link._id._str + "><textarea id='new_comment' name='new_comment' placeholder='Kommentar eingeben' rows='5' style='width:248px' type='text' required></textarea><button class='btn btn-small btn-primary' id='postcomment' type='submit'>Posten</button></form>";
	var commentsstr = "";
	if (link.comments && link.comments !== null && link.comments.length) {
		for (var i = 0; i <= link.comments.length; i++) {
			if (link.comments[i]) {
				var creatorname = Meteor.users.findOne({
					id: link.comments[i].creator
				}).profile['first_name'];
				var strdate = moment(link.comments[i].date_created).fromNow();
				commentsstr = commentsstr + "<p id='comment_text' style='margin-bottom:5px;width:248px'><small id='comment_creator' style='font-size:10px'>" + creatorname + " " + "</small><i id='comment_date' style='color:grey;font-size:10px'>" + strdate + "</i><br/><small id='comment_message'>" + link.comments[i].message + "</small></p>";
			}
		}
	} else commentsstr = "<small id='no_comments_label'>noch keine Kommentare vorhanden</small>";
	$("#" + link._id._str + '_comments').popover({
		animation: true,
		placement: "bottom",
		trigger: "click",
		title: "Kommentare",
		html: true,
		content: commentsstr + htmlstr,
		delay: {
			show: 300,
			hide: 100
		}
	});
};
*/
Template.linklist.rendered = function () {
	this.$('.linkname').editable();
	this.$('#filter_links').tooltip({
		title: "nur Links mit Status (online) oder alle Links anzeigen",
		placement: "left",
		disabled: true
	});
	this.$('#hide_selected_links').tooltip({
		title: "ausgewählte Links verbergen",
		placement: "left",
		disabled: true
	});
	this.$('#select_all').tooltip({
		title: "alle Links zum Download auswählen",
		placement: "right",
		disabled: true
	});
	this.$('.refreshlink').tooltip({
		title: "Linkinformationen aktualisieren",
		placement: "right",
		disabled: true
	});
	this.$('#share_links').tooltip({
		title: "Set (ausgewählte Links) teilen",
		placement: "right",
		disabled: true
	});
	this.$('.removelinkfromset').tooltip({
		title: "Link aus dem aktuellen Set entfernen",
		placement: "right",
		disabled: true
	});
	this.$('.addlinktoset').tooltip({
		title: "Link zum aktuellen Set hinzufügen",
		placement: "right",
		disabled: true
	});
	this.$('.like').tooltip({
		title: "Gefällt mir",
		placement: "left",
		disabled: true
	});
	this.$('.icon-comment').tooltip({
		title: "Kommentar(e) anzeigen/hinzufügen",
		placement: "left",
		disabled: true
	});
	this.$('.icon-ok').tooltip({
		title: "verfügbar",
		placement: "left",
		disabled: true
	});
	this.$('.icon-question-sign').tooltip({
		title: "unbekannt",
		placement: "left",
		disabled: true
	});
	this.$('.icon-remove').tooltip({
		title: "nicht verfügbar",
		placement: "left",
		disabled: true
	});
	this.$('.delete_link').tooltip({
		title: "Link aus der Datenbank löschen",
		placement: "left",
		disabled: true
	});
	this.$('.hide_link').tooltip({
		title: "Link ausblenden",
		placement: "left",
		disabled: true
	});
	this.$('#sort_like').tooltip({
		title: "nach 'Gefällt mir' Angaben sortieren",
		placement: "left",
		disabled: true
	});
	this.$('#sort_date_published').tooltip({
		title: "nach Datum der Veröffentlichung sortieren",
		placement: "left",
		disabled: true
	});
};
Template.accountSettingsDialog.rendered = function () {
	//XXX seit Bootstrap 2.3 sind die Tooltips abgeschnitten...
	this.$('#refreship').tooltip({
		title: "Wenn du auf 'Aktualisieren' klickst, wird die IP-Adresse des Rechners ermittelt, an dem du gerade bist und gespeichert. Du kannst dann Links auf diesem Rechner empfangen, wenn JDownloader läuft hast und der Port offen ist.",
		placement: "right",
		disabled: true
	});
	this.$('#port').tooltip({
		title: "Bitte gebe den Port an, über den JDownloader Remote aus dem Internet erreichbar ist. (Standard: 10025)",
		placement: "bottom",
		disabled: true
	});
	this.$('#autoupdate').tooltip({
		title: "Wenn du diese Option aktivierst, wird beim Starten dieser App automatisch deine IP-Adresse aktualisiert. Setz diese Option, wenn du keine feste IP-Adresse hast oder JDownloader immer auf dem Rechner nutzt, auf dem du auch diese App aufrufst.",
		placement: "right",
		disabled: true
	});
	this.$('#showdownloadedlinks').tooltip({
		title: "Wenn du diese Option aktivierst, werden auch Links angezeigt, die du bereits heruntergeladen, kopiert oder ausgeblendet hast.",
		placement: "right",
		disabled: true
	});
	this.$('#jdon').tooltip({
		title: "Dein JDownloader kann Links empfangen.",
		placement: "bottom",
		disabled: true
	});
	this.$('#jdoff').tooltip({
		title: "Dein JDownloader kann keine Links empfangen. Bitte überprüfe, ob der angebene Port aus dem Internet erreichbar ist. Wenn du einen Proxy-Server nutzt, musst du die IP-Adresse ggf. manuell eintragen.",
		placement: "bottom",
		disabled: true
	});
};
Template.user_loggedin_profile.rendered = function () {
	if (Meteor.user()) {
		if (isNaN(Meteor.user().profile.linkcontributioncount))
			var contribcount = 0;
		else
			var contribcount = Meteor.user().profile.linkcontributioncount;
			
		htmlstr = "<img class='img-polaroid pull-left' src=" + Meteor.user().profile.pictureurl + "></img><br/><br/><br/><ul class='unstyled'><li><i class='icon-facebook'></i><small><b>   " + Meteor.user().username + "</b></li><li><br/></li><li><b>Dein JDownloader</b></li><li>IP: " + Meteor.user().profile.ip + "</li><li>Port: " + Meteor.user().profile.port + "</li><li><b>Dein Beitrag</b></li><li>gemeldete Seiten: " + Sites.find({
			creator: Meteor.user().id
		}).count() + "</li><li>gemeldete Links: " + contribcount + "</li></small>";
		this.$('#accountbtn').popover({
			animation: true,
			placement: "bottom",
			trigger: "click",
			title: Meteor.user().profile.name,
			html: true,
			content: htmlstr,
			delay: {
				show: 200,
				hide: 100
			}
		});
	}
};
//Events für die einzelnen Link-Objekte
Template.link.events({
	'click .player': function (event, template) {
		if (this.status != 'off') {
			switch (this.hoster) {
				case "soundcloud.com":
					event.target.className = "icon-loader";
					if (window.SCM) {
						if (this.url.indexOf("/sets") !== -1 && Session.equals("soundcloud_ready",true)) {
							SC.get('/resolve', {
								url: this.url
							}, function (result) {
								if (result.errors) {
									event.target.className = "icon-remove";
									return;
								}
								if (result.tracks && result.tracks.length) {
									var tracks = result.tracks;
									SCM.play({
										title: tracks[0].title,
										url: tracks[0].permalink_url
									});
									for (var i = 1; i <= tracks.length; i++) {
										if (tracks[i]) {
											SCM.queue({
												title: tracks[i].title,
			
									url: tracks[i].permalink_url
											});
										}
									}
									event.target.className = "icon-list";
									return;
								}
								event.target.className = "icon-remove";
								return;
							});
							break;
						} 
						SCM.play({
							title: this.name,
							url: this.url.replace("/download", "")
						});
						event.target.className = "icon-list";
						return;
					}
					event.target.className = "icon-remove";
					break;
				case "youtube.com","myfreemp3.eu":
					event.target.className = "icon-loader";
					if (window.SCM) {
						SCM.play({
							title: this.name,
							url: this.url
						});
						event.target.className = "icon-list";
					} else event.target.className = "icon-remove";
					break;
				case "vk.com":
					event.target.className = "icon-loader";
					if (window.SCM && VK.Auth.getSession()) {
						var atitle = this.name;
					
						VK.Api.call("audio.getById",{audios: this.oid+"_"+this.aid}, function(result)
							{
								if (result.response && result.response[0].url)
								{
									SCM.play({
										title: atitle,
										url: result.response[0].url
									});
									
									Links.update({
											_id: this._id
										}, {
											$set: {
												url: result.response[0].url,
												status: "on"
											}
										});
								}
								else event.target.className = "icon-remove"
							}
						)
						event.target.className = "icon-list";
					} else event.target.className = "icon-remove";
					if (!VK.Auth.getSession()) alert("Du benötigst einen VK.com Account, um diesen Link hören oder downloaden zu können.\nWenn du bereits einen VK.com Account besitzt, kannst du dich in deinen Accounteinstellungen jetzt anmelden.")
					break;
				case "zippyshare.com":
					event.target.className = "icon-loader";
					if (window.SCM) {
						var pattern1 = /https?\:\/\/www\d{1,2}\.zippyshare.com/i;
						var pattern2 = /\d{3,8}(?=\/file\.html)/i;
						var match1 = pattern1.exec(this.url);
						var match2 = pattern2.exec(this.url);
						if (match1 && match2) {
							var stream_url = match1 + "/downloadMusic?key=" + match2;
							SCM.play({
								title: this.name,
								url: stream_url,
							});
							event.target.className = "icon-list";
						} else event.target.className = "icon-remove";
						return;
					}
					event.target.className = "icon-remove";
					break;
				case "beatport.com":
					event.target.className = "icon-loader";
					if (window.SCM && this.stream_url) {
						SCM.play({
							title: this.name,
							url: this.stream_url
						});
						event.target.className = "icon-list";
					} else event.target.className = "icon-remove";
					break;
				case "vimeo.com":
					event.target.className = "icon-remove";
					break;
				default:
					event.target.className = "icon-remove";
					break;
			}
		} else event.target.className = "icon-remove";
	},
	'input #new_comment': function (event, template) {
		if (!event.target.validity.valid) {
			template.find('#postcomment').disabled = true;
		} else {
			template.find('#postcomment').disabled = false;
		}
	},
	'click #postcomment': function (event, template) {
		linkid = this._id;
		event.preventDefault();
		event.stopPropagation();
		var newmessage = template.find('#new_comment').value;
		Meteor.call('createComment', linkid, newmessage, function (error, result) {
			if (error) console.log("Kommentar konnte nicht erstellt werden. (" + error.details + ")");
			Meteor.setTimeout(function () {
				$('#' + linkid + '_comments').popover('show');
			}, 10);
		});
		return false;
	},
	//Anhaken eines Links
	'click .link_checkbox': function (event, template) {
		var selected = Session.get("selected_links");
		if (event.target.checked) {
			var contains = false;
			selectedloop: for (var i = 0; i < selected.length; i++) {
				if (EJSON.equals(this._id, selected[i])) {
					contains = true;
					break selectedloop;
				}
			}
			if (contains === false) {
				if (this.hoster != "vk.com" || VK.Auth.getSession()) {
					selected.push(this._id);
					Session.set("selected_links", selected);
				}
				else {
					alert("Du benötigst einen VK.com Account, um diesen Link hören oder downloaden zu können.\nWenn du bereits einen VK.com Account besitzt, kannst du dich in deinen Accounteinstellungen jetzt anmelden.")
					event.preventDefault();
					return false;
				}
			}
		} else {
			selectedloop: for (var i = 0; i < selected.length; i++) {
				if (EJSON.equals(this._id, selected[i])) {
					selected.splice(i, 1);
					Session.set("selected_links", selected);
					break selectedloop;
				}
			}
		}
		if (!selected.length) $('#select_all').prop("checked", false);
	},
	'click .addlinktoset': function (event, template) {
		var selected = Session.get("temp_set");
		selected.push(this._id);
		Session.set("temp_set", selected);
	},
	'click .removelinkfromset': function (event, template) {
		var selected = Session.get("temp_set");
		selectedloop: for (var i = 0; i < selected.length; i++) {
			if (EJSON.equals(this._id, selected[i])) {
				selected.splice(i, 1);
				Session.set("temp_set", selected);
				break selectedloop;
			}
		}
	},
	//Link-Status aktualisieren
	'click .icon-refresh': function (event, template) {
		event.target.className = "icon-refreshing";
		var linkurl = this.url;
		
		if (this.hoster === "vk.com")
		{
			if (VK.Auth.getSession() && this.aid && this.oid)
			{
				VK.Api.call("audio.getById",{audios: this.oid+"_"+this.aid}, function(result)
				{
					if (result && result.response && result.response[0].url)
					{
						Links.update({
							_id: this._id
						}, {
							$set: {
								url: result.response[0].url,
								status: "on"
							}
						});
						event.target.className = "icon-refresh";
					}
					else
					{
						event.target.className = "icon-remove"
						console.log("Fehler beim Aktualisieren des Links " + linkurl + ": Fehler bei der vk.com Kommunikation");
					}
				})
			}
			else
			{
				event.target.className = "icon-remove";
				console.log("Fehler beim Aktualisieren des Links " + linkurl + ": kein VK-Zugang oder keine VK-Objektinformationen");
			}
		}		
		else
		{
			Meteor.call("refreshLink", this._id, function (error, result) {
				if (error) {
					console.log("Fehler beim Aktualisieren des Links " + linkurl + ": " + error.reason);
					event.target.className = "icon-remove";
				}
				if (result) {
					event.target.className = "icon-refresh";
				}
			});
		}
	},
	//X-Editable Formular - Namensänderung übernehmen
	'submit .form-inline, click .editable-submit': function (event, template) {
		event.preventDefault();
		var newName = template.find('.editable-input input').value;
		if (newName != "") Links.update({
				_id: this._id
			}, {
				$set: {
					name: newName
				}
			});
	},
	'click .icon-comment': function (event, template) {
		event.stopPropagation();
		$('.icon-comment:not(#' + event.target.id + ')').popover('hide');
		return false;
	},
	//Link liken
	'click .like': function (context) {
		// This query succeeds only if the voters array doesn't contain the user
		query = {
			_id: this._id
		};
		// Update to add the user to the array and increment the number of
		// votes.
		update = {
			'$addToSet': {
				'likers': Meteor.userId()
			},
			'$inc': {
				likes: 1
			}
		};
		Links.update(query, update);
	},
	'click .delete_link': function (event, template) {
		Links.remove({
			_id: this._id
		});
	},
	'click .hide_link': function (event, template) {
		Meteor.call("markLinksAsDownloadedById", new Array(this._id._str), function (error, result) {
			if (error) console.log("Error updating Links while marking as read.");
		});
//		single version, no intelligent removing of duplicates when one is being downloaded		
//		query = {
//			_id: this._id,
//		};
//		update = {
//			'$addToSet': {
//				'downloaders': Meteor.userId()
//			}
//		};
//		Links.update(query, update);
	}
});
//Events im Link hinzufügen Dialog
Template.addLinkDialog.events({
	//Dialog schließen
	'click .cancel': function () {
		// User hat abgebrochen, Dialog schließen
		Session.set("showAddLinkDialog", false);
		Session.set("status", undefined);
	},
	//Link validieren - ist das eine gültige URL
	'input #newlinkurl': function (event, template) {
		if (!event.target.validity.valid) {
			template.find('.addlink').disabled = true;
		} else {
			template.find('.addlink').disabled = false;
		}
	},
	//Link in die Datenbank aufnehmen, bzw. vorher prüfen
	'click .addlink': function (event, template) {
		event.preventDefault();
		Session.set("status", '<p class="pull-left statustext"><small><i class="icon-loader">' + " " + '</i>Link wird überprüft</small></p>');
		var newlinkurl = template.find("#newlinkurl").value;
		Meteor.call('createLink', undefined, newlinkurl, undefined, undefined, undefined, undefined, function (error, result) {
			if (error) switch (error.error) {
					case 409:
						Session.set("status", '<p class="pull-left statustext"><i class="icon-warning-sign"></i><small>' + " " + error.details + "</small></p>");
						break;
					default:
						Session.set("status", '<p class="pull-left statustext"><i class="icon-remove"></i><small>' + " " + error.details + "</small></p>");
			}
			if (result) {
				Meteor.call('updateLinkContributionCount');
				Session.set("status", '<p class="pull-left statustext"><i class="icon-ok"></i><small>' + " " + "Link hinzugefügt!</small></p>");
				Meteor.setTimeout(function () {
					Session.set("showAddLinkDialog", false);
					Session.set("status", undefined);
				}, 3000);
			}
		});
		return false;
	}
});
Template.searchresult.events({
	'click .player': function (event, template) {
		if (this.status != 'off') {
			switch (this.hoster) {
				case "soundcloud.com":
				case "youtube.com":
				case "vk.com":
				case "myfreemp3.eu":
				case "ex.fm":
					event.target.className = "icon-loader";
					if (window.SCM) {
						SCM.play({
							title: this.name,
							url: this.url
						});
						event.target.className = "icon-list";
					} else event.target.className = "icon-remove";
					break;
				case "zippyshare.com":
				case "beatport.com":
					event.target.className = "icon-loader";
					if (window.SCM && this.stream_url) {
						SCM.play({
							title: this.name,
							url: this.stream_url
						});
						event.target.className = "icon-list";
					} else event.target.className = "icon-remove";
					break;
				default:
					event.target.className = "icon-remove";
					break;
			}
		} else event.target.className = "icon-remove";
	},
	'click .download_external_link': function (event, template) {
		event.preventDefault();
		event.stopPropagation();
		
		if (event.target.className.indexOf("icon") === -1)
			event.target.disabled = true;
		else
			event.target.parentElement.disabled = true;
		
		if (event.target.className.indexOf("icon") === -1)
			event.target.innerHTML = "<i class='icon-loader'></i> Link zur Datenbank hinzufügen";
		else 
			event.target.className = "icon-loader";

		if (this.hoster === "muzofon.com") {
			if (this.url.indexOf("dwl2.php") === -1)
				Meteor.call('getMuzofonDownloadLink', this.url, this.referer, function (error, result) {
					if (result) {
					 	writeConsole(result);
					 	if (event.target.className.indexOf("icon") === -1)
					 		event.target.innerHTML = "<i class='icon-ok'></i>";
					 	else 
					 		event.target.className = "icon-ok";
					}
									
				});
			else
			{
				writeConsole(this.url);
				if (event.target.className.indexOf("icon") === -1)
					event.target.innerHTML = "<i class='icon-ok'></i>";
				else 
					event.target.className = "icon-ok";
			}
			return;
		}
	
		if (this.hoster === "myfreemp3.eu")
		{
			window.open(this.url,'_blank');
			return;
		}
		
		if (Session.equals("JDOnlineStatus", true)) {
			var grabberoption;
			if (this.url.match(/youtube|vimeo/i)) grabberoption = "grabber1";
			else grabberoption = "grabber0";
			
			if (Meteor.user())
				var requeststring = "http://" + Meteor.user().profile.ip + ":" + Meteor.user().profile.port + "/action/add/links/" + grabberoption + "/start1/" + this.url;
			requeststring = requeststring.replace("?", "%3F").replace("=", "%3D");
			Meteor.call("sendLinks", requeststring, function (error, result) {
				if (error) {
					if (event.target.className.indexOf("icon") === -1)
						event.target.innerHTML = "<i class='icon-remove'></i>";
					else 
						event.target.className = "icon-remove";
					console.log("Fehler beim Senden der Links an JDownloader. (" + error.details + ")");
				}
				if (result) {
					if (event.target.className.indexOf("icon") === -1)
						event.target.innerHTML = "<i class='icon-ok'></i>";
					else 
						event.target.className = "icon-ok";
				}
			});
		} else {
			writeConsole(this.url);
			if (event.target.className.indexOf("icon") === -1)
				event.target.innerHTML = "<i class='icon-ok'></i>";
			else 
				event.target.className = "icon-ok";
		}
		return false;
	},
	'click .add_external_link': function (event, template) {
		event.preventDefault();
		event.stopPropagation();
		
		if (event.target.className.indexOf("icon") === -1)
			event.target.disabled = true;
		else
			event.target.parentElement.disabled = true;
		
		if (event.target.className.indexOf("icon") === -1)
			event.target.innerHTML = "<i class='icon-loader'></i> Link zur Datenbank hinzufügen";
		else 
			event.target.className = "icon-loader";
			
		var sitefilter = Session.get("filter_sites");
		sitefilter.push(Meteor.user().id);
		Session.set("filter_sites", sitefilter);
		
		var aid = undefined;
		var oid = undefined;
		if (this.aid) aid = this.aid;
		if (this.oid) oid = this.oid;
		
		Meteor.call('createLink', this, this.url, this.stream_url, this.name, aid, oid, function (error, result) {
			if (error) {
				console.log("externer Link konnte nicht hinzugefügt werden ( " + error.details + " )");
				if (event.target.className.indexOf("icon") === -1)
					event.target.innerHTML = "<i class='icon-remove'></i> Link zur Datenbank hinzufügen";
				else 
					event.target.className = "icon-remove";				
			}
			if (result) {
				if (event.target.className.indexOf("icon") === -1)
					event.target.innerHTML = "<i class='icon-ok'></i> Link zur Datenbank hinzufügen";
				else 
					event.target.className = "icon-ok";
				Meteor.call('updateLinkContributionCount');
			}
		});
		return false;
	}
});
//Events für den "Seite hinzufügen"-Dialog
Template.addSiteDialog.events({
	// User hat abgebrochen, Dialog schließen
	'click .cancel': function () {
		Session.set("showAddSiteDialog", false);
		Session.set("status", undefined);
	},
	// Seiten-URL validieren
	'input #newsiteurl': function (event, template) {
		if (!event.target.validity.valid) {
			template.find('.addsite').disabled = true;
		} else {
			template.find('.addsite').disabled = false;
		}
	},
	//Seite prüfen und hinzufügen
	'submit #addsiteform': function (event, template) {
		event.preventDefault();
		Session.set("status", '<p class="pull-left statustext"><i class="icon-loader"></i><small>' + " " + 'Seite wird überprüft</small></p>');
		var newsiteurl = template.find('#newsiteurl').value;
		Meteor.call('createSite', newsiteurl, function (error, result) {
			Meteor.call('updateFacebookTokensForUser');
			if (error) switch (error.error) {
					case 401:
						Session.set("status", '<p class="pull-left statustext"><i class="icon-ok"></i><small>' + " " + error.details + "</small></p>");
						var siteid = error.reason;
						Meteor.setTimeout(function () {
							Meteor.loginWithFacebook({
								requestPermissions: ['user_groups']
							}, function (error2) {
								if (error2) {
									if (error2.type == "OAuthException") {
										alert("Du hast den Zugriff auf deine Facebook-Gruppen verweigert oder widerrufen.\nDeine Gruppen können nicht mehr durchsucht werden.");
										Meteor.call("removeFacebookTokensForUser");
									}
								} else {
									Meteor.call("updateFacebookGroupName", newsiteurl.split("groups/")[1].split("/")[0]);
									Meteor.call("scheduleCrawl", siteid, function (error3, result3) {
										if (result3 && result3.data && result3.data.status == "ok") console.log("Successfully scheduled crawl for Site " + newsiteurl);
										if (error3) console.log("Error scheduling crawl for Site " + newsiteurl);
									});
								}
							});
						}, 3000);
						break;
					case 409:
						Session.set("status", '<p class="pull-left statustext"><i class="icon-warning-sign"></i><small>' + " " + error.details + "</small></p>");
						break;
					case 415:
						Session.set("status", '<p class="pull-left statustext"><i class="icon-ok"></i><small>' + " " + error.details + "</small></p>");
						Meteor.setTimeout(function () {
							Session.set("showAddSiteDialog", false);
							Session.set("status", undefined);
						}, 3000);
						break;
					default:
						Session.set("status", '<p class="pull-left statustext"><i class="icon-remove"></i><small>' + " " + error.details + "</small></p>");
						break;
			}
			if (result && result._str) {
				var aid = new Meteor.Collection.ObjectID(result._str);
				newsite = Sites.findOne({
					_id: aid
				});
				if (newsite && newsite.type == "facebook-group") Meteor.call("updateFacebookGroupName", newsite.groupid);
				Session.set("status", '<p class="pull-left statustext"><i class="icon-ok"></i><small>' + " " + "Seite hinzugefügt! Die Seite wird automatisch beim nächsten Suchlauf durchsucht.</small></p>");
				Meteor.setTimeout(function () {
					Session.set("showAddSiteDialog", false);
					Session.set("status", undefined);
				}, 3000);
				if (newsite) Meteor.call("scheduleCrawl", newsite._id, function (error2, result2) {
						if (result2 && result2.data && result2.data.status == "ok") console.log("Successfully scheduled crawl for Site " + newsite.url);
						if (error2) console.log("Error scheduling crawl for Site " + newsite.url);
					});
			}
		});
		return false;
	}
});
//Wenn der Seitendialog gerendered wurde, UI Widgets aktivieen
Template.sitesDialog.rendered = function () {
	this.$('.sitename').editable();

	this.$('.remove_site').tooltip({
		title: "Seite aus der Datenbank löschen",
		placement: "top",
		disabled: true
	});
	this.$('.icon-facebook').tooltip({
		title: "Facebook-Gruppe",
		placement: "left",
		disabled: true
	});
	this.$('.icon-rss').tooltip({
		title: "RSS-Feed",
		placement: "left",
		disabled: true
	});
	this.$('.icon-time').tooltip({
		title: "Durchsuchen der Seite ist eingeplant",
		placement: "left",
		disabled: true
	});
	this.$('.icon-ban-circle').tooltip({
		title: "Seite wurde innerhalb der letzten 24h durchsucht und kann noch nicht wieder durchsucht werden.",
		placement: "left",
		disabled: true
	});
	this.$('.crawl_single_site').tooltip({
		title: "Seite erneut durchsuchen",
		placement: "left",
		disabled: true
	});
};
Template.shareLinkDialog.rendered = function () {
	//var intrender = Meteor.setInterval(function(){
		if (Meteor.user()) {
	//		Meteor.clearInterval(intrender);
			
			$('#sharelinkaddress').typeahead({
				items: 3,
				minLength: 3,
				source: function (aquery, process) {
					searchterm = aquery.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1").split(",");
					if (searchterm[searchterm.length - 1].trim().length > 2) Meteor.call("getSuggestionsForEmail", ".*" + searchterm[searchterm.length - 1].trim().replace(" ", ".*") + ".*", function (error, result) {
							console.log(result);
							process(_.map(result, function (asuggest) {
								return asuggest.name + " - " + asuggest.email;
							}));
					});
				},
				updater: function (name) {
					var previousterms = this.query.substring(0, this.query.lastIndexOf(",") + 1);
					var term = name.trim().split(" - ")[1];
					$('#sharelink').prop("disabled", false);
					if (previousterms != "") return previousterms + term;
					return term;
				},
				matcher: function (item) {
					return true;
				},
				highlighter: function (item) {
					var searchterms = this.query.trim().split(",");
					searchterms = searchterms[searchterms.length - 1].split(" ");
					var newitem1 = item;
					for (var i = 0; i < searchterms.length; i++) {
						var regex = new RegExp('(' + searchterms[i] + ')', 'i');
						newitem1 = newitem1.replace(regex, "<strong>$1</strong>");
					}
					return newitem1;
				},
			});
		}
	//},1000);
};
Template.shareLinkDialog.events({
	'input #sharelinkaddress': function (event, template) {
		if (!event.target.validity.valid) {
			template.find('#sharelink').disabled = true;
		} else {
			template.find('#sharelink').disabled = false;
		}
	},
	'click .cancel': function () {
		Session.set("showShareLinkDialog", false);
		Session.set("status", undefined);
	},
	'submit #sharelinkform': function (event, template) {
		event.preventDefault();
		Session.set("status", '<p class="pull-left" style="margin:0px"><i class="icon-loader" style="margin-top:5px"></i>Links werden gesendet</p>');
		var targetemail = template.find("#sharelinkaddress").value;
		if (targetemail.indexOf(",") !== -1) targetemail = targetemail.split(",");
		Meteor.call('shareLinks', targetemail, _.pluck(Session.get("temp_set"), "_str"), function (error, result) {
			if (error) {
				Session.set("status", '<p class="pull-left statustext"><i class="icon-remove"></i>' + " " + error.details + "</p>");
			}
			if (result) {
				Session.set("status", '<p class="pull-left statustext"><i class="icon-ok"></i>' + " " + "Links geteilt</p>");
				Meteor.setTimeout(function () {
					Session.set("showShareLinkDialog", false);
					Session.set("status", undefined);
					Session.set("temp_set", []);
				}, 3000);
			}
		});
	}
});
//Events des Seiten anzeigen Dialogs
Template.sitesDialog.events({
	// User hat abgebrochen, Dialog schließen
	'click .cancel': function () {
		Session.set("showSitesDialog", false);
	},
	'click #crawl_all_sites': function (event, template) {
		if (Meteor.user().admin && Meteor.user().admin === true) {
			event.target.className = "icon-refreshing";
			Sites.find().forEach(function (site) {
				if ((!site.next_crawl || site.next_crawl == null) && site.active === true && (new Date() - site.last_crawled) > (1000 * 60 * 60 * 24)) {
					Meteor.call("scheduleCrawl", site._id, function (error, result) {
						if (error) {
							event.target.className = "icon-remove";
							console.log("Error scheduling crawl for site " + site.name + " (" + error.reason + ")");
							$('#' + site._id._str + '_crawlstatus').removeClass("icon-search");
							$('#' + site._id._str + '_crawlstatus').removeClass("hand");
							$('#' + site._id._str + '_crawlstatus').addClass("icon-remove");
						}
						if (result && result.data && result.data.status == "ok") {
							event.target.className = "icon-time";
							$('#' + site._id._str + '_crawlstatus').removeClass("icon-search");
							$('#' + site._id._str + '_crawlstatus').removeClass("hand");
							$('#' + site._id._str + '_crawlstatus').addClass("icon-time");
						} else {
							event.target.className = "icon-remove";
							$('#' + site._id._str + '_crawlstatus').removeClass("icon-search");
							$('#' + site._id._str + '_crawlstatus').removeClass("hand");
							$('#' + site._id._str + '_crawlstatus').addClass("icon-remove");
						}
					});
				}
			});
		}
	},
	'click .crawl_single_site': function (event, template) {
		if (Meteor.user().admin && Meteor.user().admin === true) {
			event.target.className = "icon-refreshing";
			if ((!this.next_crawl || this.next_crawl == null) && this.active === true) {
				Meteor.call("scheduleCrawl", this._id, function (error, result) {
					if (error) {
						event.target.className = "icon-remove";
						console.log("Error scheduling crawl for site " + this.name + " (" + error.reason + ")");
					}
					if (result && result.data && result.data.status == "ok") {
						event.target.className = "icon-time";
					} else event.target.className = "icon-remove";
				});
			} else {
				Meteor.call("cancelCrawl", this._id, function (error, result) {
					if (error) {
						event.target.className = "icon-remove";
						console.log("Error canceling crawl for site " + this.name + " (" + error.reason + ")");
					}
					if (result && result.data && result.data.status == "ok") {
					
						event.target.className = "icon-search";
					} else event.target.className = "icon-remove";
				});
			}
		}
	},
	// Hilfsfunktion, um die Eingaben in X-Editable in der Meteor DB einzutragen	
	'submit .form-inline, click .editable-submit': function (event, template) {
		event.preventDefault();
		var newName = template.find('.editable-input input').value;
		if (Meteor.userId() && newName != "") Sites.update({
				_id: this._id
			}, {
				$set: {
					name: newName
				}
			});
	},
	'click .remove_site': function (event, template) {
		Sites.remove({
			_id: this._id
		});
	},
	'click .site_active': function (event, template) {
		if (this.active === true && Meteor.user().admin && Meteor.user().admin === true) {
			Sites.update({_id: this._id},{$set: {active: false}});
		};
		if (this.active === false && Meteor.user().admin && Meteor.user().admin === true) {
			Sites.update({_id: this._id},{$set: {active: true}});
		};
	}
});
//Events des Einstellungs-Dialogs
Template.accountSettingsDialog.events({
	'input #port': function (event, template) {
		if (!event.target.validity.valid || !template.find('#ip').validity.valid) {
			template.find('.cancel').disabled = true;
			$('.cancel').prop("disabled", true);
		} else {
			template.find('.cancel').disabled = false;
			$('.cancel').prop("disabled", false);
		}
	},
	'input #ip': function (event, template) {
		if (!event.target.validity.valid && !template.find('#autoupdate').checked || !template.find('#port').validity.valid) {
			template.find('.cancel').disabled = true;
			$('.cancel').prop("disabled", true);
		} else {
			template.find('.cancel').disabled = false;
			$('.cancel').prop("disabled", false);
		}
	},
	//IP-Adresse aktualisieren Button - IP checken und anzeigen
	'click #refreship': function (event, template) {		
		Session.set("status", '<p class="pull-left" style="margin:0px"><i class="icon-loader" style="margin-top:5px"></i></p>');

		if (Meteor.user())
			var aport = Meteor.user().profile.port;
		if (template.find("#autoupdate").checked)
		{		
			HTTP.call("GET", "http://api.hostip.info/get_json.php", function (error, result) {
				if (error) console.log("Fehler beim Ermitteln der Benutzer-IP");
				if (result && result.statusCode && result.statusCode === 200 && result.data && result.data.ip) {
					Meteor.users.update({
						_id: Meteor.userId()
					}, {
						$set: {
							'profile.ip': result.data.ip,
						}
					});
					template.find("#ip").value = result.data.ip;
					// neue IP nutzen und checken, ob hier ein JD läuft...			
					Meteor.call("checkJDOnlineStatus", {
						ip: result.data.ip,
						port: aport
					}, function (error2, isOnline) {
						if (error2) {
							console.log("Fehler beim Ermitteln des Online-Status");
						}
						Session.set("JDOnlineStatus", isOnline);
						Session.set("status", undefined);
					});
				} else {
					console.log("Fehler beim Ermitteln des Online-Status: ungültige Anwort vom Server");
					Session.set("JDOnlineStatus", false);
					Session.set("status", undefined);
				}
			});
		}
		else
		{
			Meteor.call("checkJDOnlineStatus", {
				ip: template.find('#ip').value,
				port: template.find('#port').value
			}, function (error3, isOnline) {
				if (error3) {
					console.log("Fehler beim Ermitteln des Online-Status");
				}
				Session.set("JDOnlineStatus", isOnline);
				Session.set("status", undefined);
			});
		}
	},
	//IP-Feld für Eingbae aktivieren/deaktivieren, je nachdem ob autoupdate eingeschaltet ist
	'click #autoupdate': function (event, template) {
		if (template.find("#autoupdate").checked) {
			Meteor.users.update({
				_id: Meteor.userId()
					}, {
				$set: {
					'profile.autoupdateip': true,
					}
			});
			
			if (template.find('#port').validity.valid && template.find('#ip').validity.valid) {
				template.find('.cancel').disabled = false;
				$('.cancel').prop("disabled", false);
			}
		} else {
			Meteor.users.update({
				_id: Meteor.userId()
					}, {
				$set: {
					'profile.autoupdateip': false,
					}
			});
		}
	},
	//eingaben speichern und IP nochmal updaten, falls der User was komisches eingegeben hat
	'click #searchvk' : function (event, template) {
		if (template.find("#searchvk").checked) {
			VK.Auth.login(undefined,8);
		}
		else {
			if (VK.Auth.getSession()) VK.Auth.logout();
		}
	},
	
	'click .cancel': function (event, template) {
		var aip = template.find('#ip').value;
		var aport = template.find("#port").value;
		var aupdateip = template.find("#autoupdate").checked;
		var ashowtooltips = template.find("#showtooltips").checked;
		var ashowdownloadedlinks = template.find("#showdownloadedlinks").checked;
		var ahidemixes = template.find("#hidemixes").checked;
		var searchzippysharemusic = template.find("#searchzippysharemusic").checked;
		var searchmuzofon = template.find("#searchmuzofon").checked;
		var searchsoundcloud = template.find("#searchsoundcloud").checked;
		var searchyoutube = template.find("#searchyoutube").checked;
		var searchexfm = template.find("#searchexfm").checked;
		var searchvk = template.find("#searchvk").checked;
		var searchbeatport = template.find("#searchbeatport").checked;
		var searchmpmonkey = template.find("#searchmp3monkey").checked;
		var searchmyfreemp3 = template.find("#searchmyfreemp3").checked;
		
		var searchproviders = [];
		if (searchzippysharemusic) searchproviders.push("zippysharemusic");
		if (searchmuzofon) searchproviders.push("muzofon");
		if (searchsoundcloud) searchproviders.push("soundcloud");
		if (searchyoutube) searchproviders.push("youtube");
		if (searchexfm) searchproviders.push("ex.fm");
		if (searchvk && VK.Auth.getSession()) searchproviders.push("vk.com");
		if (searchbeatport) searchproviders.push("beatport");
		if (searchmyfreemp3) searchproviders.push("myfreemp3.eu");
		if (searchmp3monkey.checked) searchproviders.push("mp3monkey");
		Session.set("filter_show_already_downloaded", ashowdownloadedlinks);
		Session.set("filter_mixes", ahidemixes);
		
		if (aupdateip === true) {
			HTTP.call("GET", "http://api.hostip.info/get_json.php", function (error, result) {
				if (error) console.log("Fehler beim Ermitteln der Benutzer-IP");
				if (result && result.statusCode && result.statusCode === 200 && result.data && result.data.ip) {
					Meteor.users.update({
						_id: Meteor.userId()
					}, {
						$set: {
							'profile.ip': result.data.ip,
						}
					});
					// neue IP nutzen und checken, ob hier ein JD läuft...
					//
					Meteor.call("checkJDOnlineStatus", {
						ip: result.data.ip,
						port: aport
					}, function (error2, isOnline) {
						if (error2) {
							console.log("Fehler beim Ermitteln des Online-Status");
						}
						Session.set("JDOnlineStatus", isOnline);
					});
				}
			});
		} else {
			// wenn Aut-Update aus ist, nehmen wir die IP-Adresse, die der User
			// im Formular eingetragen hat
			Meteor.users.update({
				_id: Meteor.userId()
			}, {
				$set: {
					'profile.ip': aip,
				}
			});
		}
		Meteor.users.update({
			_id: Meteor.userId()
		}, {
			$set: {
				'profile.port': aport,
				'profile.autoupdateip': aupdateip,
				'profile.showtooltips': ashowtooltips,
				'profile.showdownloadedlinks': ashowdownloadedlinks,
				'profile.hidemixes': ahidemixes,
				'profile.searchproviders': searchproviders
			}
		});
		// es wurde gespeichert, Dialog schließen
		Session.set("showAccountSettingsDialog", false);
	}
});
Template.filterSitesDialog.events({
	'click #filter_all': function (event, template) {
		if (!event.target.checked === true) {
			var selected = _.pluck(Sites.find({}, {
				fields: {
					feedurl: 1
				}
			}).fetch(), 'feedurl');
			Session.set("temp_filter_sites", selected);
		} else Session.set("temp_filter_sites", []);
	},
	'click .site_checkbox': function (event, template) {
		var selected = Session.get("temp_filter_sites");
		if (event.target.checked) selected = _.without(selected, this.feedurl);
		else selected.push(this.feedurl);
		Session.set("temp_filter_sites", _.uniq(selected));
		if (!selected.length) $('#filter_all').prop("checked", false);
	},
	'click .save': function () {
		Meteor.users.update({
			_id: Meteor.userId()
		}, {
			$set: {
				'profile.filteredsites': Session.get("temp_filter_sites")
			}
		});
		Session.set("filter_sites", Session.get("temp_filter_sites"));
		// User hat abgebrochen, Dialog schließen
		Session.set("showFilterSitesDialog", false);
	}
});
Template.bulkDownloadDialog.events({
	'click .cancel': function () {
		Session.set("showBulkDownloadDialog", false);
		Session.set("status", undefined);
	},
	
	'click #bulkdownloadselect' : function (event, template) {
		if (event.target.selectedOptions[0].value > 0)
			template.find("#bulkcopy").disabled = false;
		else
			template.find("#bulkcopy").disabled = true;
	},
	'submit #bulkdownloadform': function (event, template) {
		event.preventDefault();
		template.find("#bulkcopy").disabled = true;
		
		var sel_days;
		
		switch(template.find("#bulkdownloadselect").selectedIndex)
		{
		case 0:
		  sel_days = 1;
		  break;
		case 1:
		  sel_days = 14;
		   break;
		case 2:
		  sel_days = 30;
		  break;
		case 3:
		  sel_days = 90;
		  break;
		case 4:
		  sel_days = 365;
		  break;
		default:
		  sel_days = 1;
		}
		
		untildate = new Date(new Date().setDate(new Date().getDate() - sel_days));
		
		var include_vk;
		
		if (VK.Auth.getSession()) include_vk = true;
		else include_vk = false;
		
		Meteor.call("getLinkURLsByDate", untildate, Session.get("filter_sites"), Session.get("filter_mixes"), function (error, result) {
			if (result && result.length) {
				var selectedurls_raw = result;				
				var newurls_vk = [];
				var urls_per_request = 30;
				
				var selectedurls_vk = _.filter(selectedurls_raw, function(item){return item.hoster === "vk.com"});
				var times = parseInt(Math.ceil(selectedurls_vk.length / urls_per_request));
				
				var remaining = times;
				
				if (selectedurls_vk.length && VK.Auth.getSession())
				{
					for (var i = 1; i <= times; i++) {
						var sel_links_raw_vk = selectedurls_vk.splice(0, urls_per_request);
						
						selectedids_vk = _.reduce(sel_links_raw_vk, function(memo, item){ 
							if (item.hoster === "vk.com" && item.oid && item.aid)
								return item.oid+"_"+item.aid + "," + memo;
							return memo;
						},"");	

						VK.Api.call("audio.getById",{audios: selectedids_vk.substring(0, selectedids_vk.length - 1)}, function(result2)
						{
							if (result2 && result2.response)
								newurls_vk = newurls_vk.concat(_.pluck(result2.response,"url"));
							
							--remaining
							
							if (remaining <= 0)
							{
								selectedurls = _.union(_.pluck(_.reject(selectedurls_raw,function(item){return item.hoster === "vk.com"}),"url"),newurls_vk);
								if (selectedurls.length)
									writeConsole(_.reduce(selectedurls, function (memo, item) {
										return memo + "<br/>" + item;
									}),"");	
							}
						});
					}	

				}
				else 
				{
					alert("Du benötigst einen VK.com Account, um Links auf vk.com herunterzuladen.\nDiese Links wurden bisher ausgelassen.\nWenn du bereits einen VK.com Account besitzt, kannst du dich in deinen Accounteinstellungen jetzt anmelden.")
					
					selectedurls = _.pluck(_.reject(selectedurls_raw,function(item){return item.hoster === "vk.com"}),"url");
					
					if (selectedurls.length)					
						writeConsole(_.reduce(selectedurls, function (memo, item) {
							return memo + "<br/>" + item;
						}),"");				
				}
				
				Meteor.call("markLinksAsDownloadedByDate", untildate, Session.get("filter_sites"), Session.get("filter_mixes"), include_vk ,function (error, result) {
					if (result) Session.set("links_count_" + sel_days, 0);
					if (error) console.log("Error updating Links while copying to clipboard.");
				});
			}
			if (error) console.log("Error getting Links while copying to clipboard.");
		});
	}
});
//Hilfsfunktion für die Kopierenfunktion von Links - alle Link URLs in einem neuen Fenster anzeigen

function writeConsole(content) {
	top.consoleRef = window.open('', 'Links', 'width=250,height=500' + ',menubar=0' + ',toolbar=0' + ',status=0' + ',scrollbars=0' + ',resizable=1');
	top.consoleRef.document.writeln('<html><head><title>Console</title></head>' + '<body bgcolor=white onLoad="self.focus()">' + content + '</body></html>');
	alert("Bitte JDownloader starten und alles markieren und kopieren.\nJDownloader erkennt dann die Links");
	top.consoleRef.document.close();
}

function htmlDecode(input){
  var e = document.createElement('div');
  e.innerHTML = input;
  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}