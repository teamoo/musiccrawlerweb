//Beim Start des Servers Daten einfügen, falls keine vorhanden sind.
Meteor
	.startup(function() {
	    if (Links.find().count() === 0) {
		Links.insert({
		    status : "on",
		    hoster : "novafile.com",
		    name : "0501.rar",
		    url : "http://novafile.com/0zrcryg69wr1",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:37:10",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 432537600
		});
		Links.insert({
		    status : "unknown",
		    hoster : "novafile.com",
		    name : "0xns50f73duc",
		    url : "http://novafile.com/0xns50f73duc",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:37:10",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "on",
		    hoster : "novafile.com",
		    name : "17.rar",
		    url : "http://novafile.com/9wwmgtj1bw55",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:37:18",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 785278566
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www1.zippyshare.com/v/70205052/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:37:19",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www11.zippyshare.com/v/56228087/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:37:19",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "on",
		    hoster : "novafile.com",
		    name : "2412.rar",
		    url : "http://novafile.com/mcmhddaqw66i",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:37:20",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 348441805
		});
		Links.insert({
		    status : "unknown",
		    hoster : "novafile.com",
		    name : "zfk1cl4dc3eg",
		    url : "http://novafile.com/zfk1cl4dc3eg",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:37:20",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "on",
		    hoster : "novafile.com",
		    name : "0412.rar",
		    url : "http://novafile.com/rbutcuh9802l",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:37:21",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 580177101
		});
		Links.insert({
		    status : "unknown",
		    hoster : "novafile.com",
		    name : "w00lef2mj61q",
		    url : "http://novafile.com/w00lef2mj61q",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:37:21",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "novafile.com",
		    name : "5ud6js5w6cmw",
		    url : "http://novafile.com/5ud6js5w6cmw",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:37:22",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "novafile.com",
		    name : "ol1yo9kx8d6k",
		    url : "http://novafile.com/ol1yo9kx8d6k",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:37:23",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "novafile.com",
		    name : "2ykjb27fjvo3",
		    url : "http://novafile.com/2ykjb27fjvo3",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:37:23",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www26.zippyshare.com/v/47758713/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:00",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www26.zippyshare.com/v/697605/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:00",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www26.zippyshare.com/v/85281500/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:01",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www26.zippyshare.com/v/48415180/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:02",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www26.zippyshare.com/v/55016153/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:03",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www26.zippyshare.com/v/58576808/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:03",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www26.zippyshare.com/v/94192039/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:03",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www26.zippyshare.com/v/34402365/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:03",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www26.zippyshare.com/v/98234789/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:03",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www26.zippyshare.com/v/9130038/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:08",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www26.zippyshare.com/v/61563657/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:08",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www26.zippyshare.com/v/95482932/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:09",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www26.zippyshare.com/v/74082866/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:09",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www26.zippyshare.com/v/51700434/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:09",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www26.zippyshare.com/v/3063814/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:10",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www26.zippyshare.com/v/7293501/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:11",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www26.zippyshare.com/v/94918541/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:11",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www26.zippyshare.com/v/79895890/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:12",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www39.zippyshare.com/v/67732871/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:12",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
		Links.insert({
		    status : "unknown",
		    hoster : "zippyshare.com",
		    name : "file.html",
		    url : "http://www39.zippyshare.com/v/1341575/file.html",
		    metainfo : "",
		    source : "http://bestclubsound.com",
		    date_discovered : "2013-01-21 19:38:12",
		    date_published : null,
		    password : "",
		    
		    likes : 0,
		    
		    size : 0
		});
	    }
	    if (Sites.find().count() === 0) {
		Sites
			.insert({
			    name : "Boards of Electronica",
			    url : "http://boardsofelectronica.blogspot.de",
			    feedurl : "http://boardsofelectronica.blogspot.com/feeds/posts/default",
			    domain : "boardsofelectronica.blogspot.com",
			    active : true,next_crawl : null,			date_created : new Date(),
			    last_crawled : null,
			    type : "feed",
			    creator : "100001073713967"
			});
		Sites.insert({
		    name : "Digital Eargasm",
		    url : "http://digitaleargasm1.blogspot.de",
		    feedurl : "http://feeds.feedburner.com/DigitalEargasm1",
		    domain : "feeds.feedburner.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites
			.insert({
			    name : "DJ Theofrias",
			    url : "http://djtheofrias.blogspot.de",
			    feedurl : "http://djtheofrias.blogspot.com/feeds/posts/default",
			    domain : "djtheofrias.blogspot.com",
			    active : true,next_crawl : null,			date_created : new Date(),
			    last_crawled : null,
			    type : "feed",
			    creator : "100001073713967"
			});
		Sites.insert({
		    name : "electrostation",
		    url : "http://electrostation.net",
		    feedurl : "http://electrostation.net/feed",
		    domain : "electrostation.net",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "Fuckin' House",
		    url : "http://fuckinhouse.com",
		    feedurl : "http://feeds.feedburner.com/fuckinhousefeed",
		    domain : "feeds.feedburner.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "Minimalistica",
		    url : "http://minimalistica.org",
		    feedurl : "http://minimalistica.org/feed",
		    domain : "minimalistica.org",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites
			.insert({
			    name : "Projekt 1408",
			    url : "http://projekt1408.blogspot.de",
			    feedurl : "http://projekt1408.blogspot.com/feeds/posts/default",
			    domain : "projekt1408.blogspot.com",
			    active : true,next_crawl : null,			date_created : new Date(),
			    last_crawled : null,
			    type : "feed",
			    creator : "100001073713967"
			});
		Sites.insert({
		    name : "Vibe4Me",
		    url : "http://vibe4me.blogspot.de",
		    feedurl : "http://vibe4me.blogspot.de/feeds/posts/default",
		    domain : "vibe4me.blogspot.de",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "Beat My Day",
		    url : "http://beatmyday.com",
		    feedurl : "http://www.beatmyday.com/feed",
		    domain : "beatmyday.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "BestClubSound",
		    url : "http://bestclubsound.com",
		    feedurl : "http://bestclubsound.com/feed",
		    domain : "bestclubsound.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites
			.insert({
			    name : "Hungy 4 Music",
			    url : "http://hungry4music.com",
			    feedurl : "http://feeds.feedburner.com/Itfeelslikesundaytous",
			    domain : "feeds.feedburner.com",
			    active : true,next_crawl : null,			date_created : new Date(),
			    last_crawled : null,
			    type : "feed",
			    creator : "100001073713967"
			});
		Sites
			.insert({
			    name : "Minimaland",
			    url : "http://minimaland.blogspot.de",
			    feedurl : "http://minimaland.blogspot.com/feeds/posts/default",
			    domain : "minimaland.blogspot.com",
			    active : true,next_crawl : null,			date_created : new Date(),
			    last_crawled : null,
			    type : "feed",
			    creator : "100001073713967"
			});
		Sites.insert({
		    name : "Minimalfreaks",
		    url : "http://minimalfreaks.com",
		    feedurl : "http://feeds.feedburner.com/minimalfreaks",
		    domain : "feeds.feedburner.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "Progressive House Worldwide",
		    url : "http://progressivehouseworldwide.com",
		    feedurl : "http://www.progressivehouseworldwide.com/feed",
		    domain : "progressivehouseworldwide.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "Tanz durch den Kiez",
		    url : "http://tanzdurchdenkiez.de",
		    feedurl : "http://www.tanzdurchdenkiez.de/feed",
		    domain : "tanzdurchdenkiez.de",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "Deep and Beat",
		    url : "http://deep-and-beat.com",
		    feedurl : "http://feeds.feedburner.com/DeepAndBeat",
		    domain : "feeds.feedburner.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "ElectronicFresh",
		    url : "http://electronicfresh.com",
		    feedurl : "http://electronicfresh.com/feed",
		    domain : "electronicfresh.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "Electrobuzz",
		    url : "http://electrobuzz.org",
		    feedurl : "http://www.electrobuzz.org/feed",
		    domain : "electrobuzz.org",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "What DJ plays",
		    url : "http://whatdjplays.com",
		    feedurl : "http://whatdjplays.com/feed",
		    domain : "whatdjplays.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "ElectroPeople",
		    url : "http://electropeople.org",
		    feedurl : "http://electropeople.org/rss.xml",
		    domain : "electropeople.org",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "My Promosound",
		    url : "http://mypromosound.com",
		    feedurl : "http://mypromosound.com/feed",
		    domain : "mypromosound.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "0-Day Music",
		    url : "http://site.0daymusic.biz",
		    feedurl : "http://site.0daymusic.biz/feed",
		    domain : "site.0daymusic.biz",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "888 Music",
		    url : "http://888music.com",
		    feedurl : "http://www.888music.com/feed",
		    domain : "888music.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "House4Deejay",
		    url : "http://house4deejay.com",
		    feedurl : "http://www.house4deejay.com/feed",
		    domain : "house4deejay.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "Technoface",
		    url : "http://technoface.hu/new/",
		    feedurl : "http://technoface.hu/new/feed",
		    domain : "technoface.hu",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "Grizzlis",
		    url : "http://grizzlis.lt",
		    feedurl : "http://grizzlis.lt/feed",
		    domain : "grizzlis.lt",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "4Music",
		    url : "http://4music.lt",
		    feedurl : "http://www.4music.lt/rss.xml",
		    domain : "4music.lt",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "dwmp3",
		    url : "http://dwmp3.com",
		    feedurl : "http://www.dwmp3.com/feed",
		    domain : "dwmp3.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "nusiolek",
		    url : "http://nusiolek.eu",
		    feedurl : "http://nusiolek.eu/feed",
		    domain : "nusiolek.eu",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "LivingElectro",
		    url : "http://livingelectro.com",
		    feedurl : "http://www.livingelectro.com/rss",
		    domain : "livingelectro.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "HouseZone",
		    url : "http://housezone.lt",
		    feedurl : "http://www.housezone.lt/feed",
		    domain : "housezone.lt",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "Downsong",
		    url : "http://downsong.com",
		    feedurl : "http://downsong.com/feed",
		    domain : "downsong.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "That DJ",
		    url : "http://that-dj.com/",
		    feedurl : "http://www.that-dj.com/feed",
		    domain : "that-dj.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "htrk",
		    url : "http://htrk.org",
		    feedurl : "http://htrk.org/feed",
		    domain : "htrk.org",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "electrouniverse",
		    url : "http://electrouniverse.net",
		    feedurl : "http://electrouniverse.net/feed",
		    domain : "electrouniverse.net",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "HouseRavers",
		    url : "http://houseravers.com",
		    feedurl : "http://feeds.feedburner.com/HouseRavers",
		    domain : "feeds.feedburner.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites.insert({
		    name : "Exclusive Music DJ",
		    url : "http://exclusive-music-dj.com",
		    feedurl : "http://www.exclusive-music-dj.com/feed",
		    domain : "exclusive-music-dj.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites
			.insert({
			    name : "Orade Clubmusic",
			    url : "http://oradeaclubmusic.blogspot.de",
			    feedurl : "http://oradeaclubmusic.blogspot.de/feeds/posts/default",
			    domain : "oradeaclubmusic.blogspot.de",
			    active : true,next_crawl : null,			date_created : new Date(),
			    last_crawled : null,
			    type : "feed",
			    creator : "100001073713967"
			});
		Sites
			.insert({
			    name : "DJ Robson Michel",
			    url : "http://djrobsonmichel.com",
			    feedurl : "http://feeds.feedburner.com/djrobsonmichel/YSqR",
			    domain : "feeds.feedburner.com",
			    active : true,next_crawl : null,			date_created : new Date(),
			    last_crawled : null,
			    type : "feed",
			    creator : "100001073713967"
			});
		Sites.insert({
		    name : "Cahul House Mafia",
		    url : "http://cahulhousemafia.net",
		    feedurl : "http://cahulhousemafia.net/feed",
		    domain : "cahulhousemafia.net",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites
			.insert({
			    name : "Club Box",
			    url : "http://club-box-11.blogspot.de",
			    feedurl : "http://www.club-box-11.blogspot.com/feeds/posts/default",
			    domain : "club-box-11.blogspot.com",
			    active : true,next_crawl : null,			date_created : new Date(),
			    last_crawled : null,
			    type : "feed",
			    creator : "100001073713967"
			});
		Sites
			.insert({
			    name : "AllDJ",
			    url : "http://alldj.org",
			    feedurl : "http://feeds.feedburner.com/Only-New-Music-Releases_download-mediafire?format=xml",
			    domain : "feeds.feedburner.com",
			    active : true,next_crawl : null,			date_created : new Date(),
			    last_crawled : null,
			    type : "feed",
			    creator : "100001073713967"
			});
		Sites
			.insert({
			    name : "House Music With Love",
			    url : "http://hmwl.org",
			    feedurl : "http://feeds.feedburner.com/housemusicwithlove?format=xml",
			    domain : "feeds.feedburner.com",
			    active : true,next_crawl : null,			date_created : new Date(),
			    last_crawled : null,
			    type : "feed",
			    creator : "100001073713967"
			});
		Sites
			.insert({
			    name : "Somdefora",
			    url : "http://somdefora.blogspot.de/",
			    feedurl : "http://somdefora.blogspot.de/feeds/posts/default",
			    domain : "somdefora.blogspot.de",
			    active : true,next_crawl : null,			date_created : new Date(),
			    last_crawled : null,
			    type : "feed",
			    creator : "100001073713967"
			});
		Sites
			.insert({
			    name : "Dunproofin'",
			    url : "http://dunproofin.blogspot.de",
			    feedurl : "http://dunproofin.blogspot.de/feeds/posts/default",
			    domain : "dunproofin.blogspot.de",
			    active : true,next_crawl : null,			date_created : new Date(),
			    last_crawled : null,
			    type : "feed",
			    creator : "100001073713967"
			});
		Sites
			.insert({
			    name : "Supperbubbles",
			    url : "http://supperbubbles.blogspot.de",
			    feedurl : "http://supperbubbles.blogspot.de/feeds/posts/default",
			    domain : "supperbubbles.blogspot.de",
			    active : true,next_crawl : null,			date_created : new Date(),
			    last_crawled : null,
			    type : "feed",
			    creator : "100001073713967"
			});
		Sites
			.insert({
			    name : "Electroever",
			    url : "http://electroever.blogspot.de",
			    feedurl : "http://electroever.blogspot.de/feeds/posts/default",
			    domain : "electroever.blogspot.de",
			    active : true,next_crawl : null,			date_created : new Date(),
			    last_crawled : null,
			    type : "feed",
			    creator : "100001073713967"
			});
		Sites.insert({
		    name : "Techno Minimal Bit",
		    url : "http://techno-minimal-bit.com",
		    feedurl : "http://techno-minimal-bit.com/feed",
		    domain : "techno-minimal-bit.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites
			.insert({
			    name : "Community Music DJ",
			    url : "http://community-music-dj.com",
			    feedurl : "http://www.community-music-dj.com/feeds/posts/default",
			    domain : "community-music-dj.com",
			    active : true,next_crawl : null,			date_created : new Date(),
			    last_crawled : null,
			    type : "feed",
			    creator : "100001073713967"
			});
		Sites
			.insert({
			    name : "Housemusic Fever",
			    url : "http://housemusicfever.blogspot.de",
			    feedurl : "http://housemusicfever.blogspot.de/feeds/posts/default",
			    domain : "housemusicfever.blogspot.de",
			    active : true,next_crawl : null,			date_created : new Date(),
			    last_crawled : null,
			    type : "feed",
			    creator : "100001073713967"
			});
		Sites.insert({
		    name : "4 DJs online",
		    url : "http://www.4djsonline.com",
		    feedurl : "http://www.4djsonline.com/feeds/posts/default",
		    domain : "4djsonline.com",
		    active : true,next_crawl : null,			date_created : new Date(),
		    last_crawled : null,
		    type : "feed",
		    creator : "100001073713967"
		});
		Sites
			.insert({
			    name : "Elektrobriefkasten",
			    url : "https://www.facebook.com/groups/137328326321645",
			    feedurl : "https://www.facebook.com/groups/137328326321645",
			    domain : "facebook.com",
			    active : true,next_crawl : null,			date_created : new Date(),
			    last_crawled : null,
			    type : "facebook-group",
			    creator : "100001073713967"
			});
	    }
	});