 //Beim Start des Servers Daten einfügen, falls keine vorhanden sind.
 Meteor.startup(function () {	
	if (Links.find().count() === 0) {
		Links.insert({ status: "on", hoster: "novafile.com", name: "0501.rar", url: "http://novafile.com/0zrcryg69wr1", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:37:10", password: "", size: 432537600 });
		Links.insert({ status: "unknown", hoster: "novafile.com", name: "0xns50f73duc", url: "http://novafile.com/0xns50f73duc", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:37:10", password: "", size: 0 });
		Links.insert({ status: "on", hoster: "novafile.com", name: "17.rar", url: "http://novafile.com/9wwmgtj1bw55", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:37:18", password: "", size: 785278566 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www1.zippyshare.com/v/70205052/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:37:19", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www11.zippyshare.com/v/56228087/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:37:19", password: "", size: 0 });
		Links.insert({ status: "on", hoster: "novafile.com", name: "2412.rar", url: "http://novafile.com/mcmhddaqw66i", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:37:20", password: "", size: 348441805 });
		Links.insert({ status: "unknown", hoster: "novafile.com", name: "zfk1cl4dc3eg", url: "http://novafile.com/zfk1cl4dc3eg", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:37:20", password: "", size: 0 });
		Links.insert({ status: "on", hoster: "novafile.com", name: "0412.rar", url: "http://novafile.com/rbutcuh9802l", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:37:21", password: "", size: 580177101 });
		Links.insert({ status: "unknown", hoster: "novafile.com", name: "w00lef2mj61q", url: "http://novafile.com/w00lef2mj61q", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:37:21", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "novafile.com", name: "5ud6js5w6cmw", url: "http://novafile.com/5ud6js5w6cmw", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:37:22", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "novafile.com", name: "ol1yo9kx8d6k", url: "http://novafile.com/ol1yo9kx8d6k", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:37:23", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "novafile.com", name: "2ykjb27fjvo3", url: "http://novafile.com/2ykjb27fjvo3", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:37:23", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www26.zippyshare.com/v/47758713/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:00", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www26.zippyshare.com/v/697605/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:00", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www26.zippyshare.com/v/85281500/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:01", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www26.zippyshare.com/v/48415180/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:02", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www26.zippyshare.com/v/55016153/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:03", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www26.zippyshare.com/v/58576808/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:03", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www26.zippyshare.com/v/94192039/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:03", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www26.zippyshare.com/v/34402365/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:03", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www26.zippyshare.com/v/98234789/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:03", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www26.zippyshare.com/v/9130038/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:08", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www26.zippyshare.com/v/61563657/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:08", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www26.zippyshare.com/v/95482932/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:09", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www26.zippyshare.com/v/74082866/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:09", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www26.zippyshare.com/v/51700434/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:09", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www26.zippyshare.com/v/3063814/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:10", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www26.zippyshare.com/v/7293501/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:11", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www26.zippyshare.com/v/94918541/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:11", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www26.zippyshare.com/v/79895890/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:12", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www39.zippyshare.com/v/67732871/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:12", password: "", size: 0 });
		Links.insert({ status: "unknown", hoster: "zippyshare.com", name: "file.html", url: "http://www39.zippyshare.com/v/1341575/file.html", metainfo: "", source: "http://www.bestclubsound.com", date: "2013-01-21 19:38:12", password: "", size: 0 });
    }
});