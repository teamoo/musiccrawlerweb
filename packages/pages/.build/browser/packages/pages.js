(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages\pages\lib\pages.coffee.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var Pages,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

this.__Pages = Pages = (function() {
  Pages.prototype.availableSettings = {
    dataMargin: [Number, 3],
    divWrapper: [true, false],
    filters: [Object, {}],
    itemTemplate: [String, "_pagesItemDefault"],
    navShowEdges: [Boolean, false],
    navShowFirst: [Boolean, true],
    navShowLast: [Boolean, true],
    resetOnReload: [Boolean, false],
    paginationMargin: [Number, 3],
    perPage: [Number, 10],
    requestTimeout: [Number, 2],
    route: [String, "/page/"],
    router: [true, false],
    routerTemplate: [String, "pages"],
    sort: [Object, {}],
    fields: [Object, {}]
  };

  Pages.prototype.fastRender = false;

  Pages.prototype.infinite = false;

  Pages.prototype.infiniteItemsLimit = 30;

  Pages.prototype.infiniteTrigger = .8;

  Pages.prototype.infiniteRateLimit = 1;

  Pages.prototype.pageSizeLimit = 60;

  Pages.prototype.rateLimit = 1;

  Pages.prototype.homeRoute = "/";

  Pages.prototype.pageTemplate = "_pagesPageCont";

  Pages.prototype.navTemplate = "_pagesNavCont";

  Pages.prototype.table = false;

  Pages.prototype.tableItemTemplate = "_pagesTableItem";

  Pages.prototype.tableTemplate = "_pagesTable";

  Pages.prototype.templateName = false;

  Pages.prototype._ninstances = 0;

  Pages.prototype._currentPage = 1;

  Pages.prototype.collections = {};

  Pages.prototype.instances = {};

  Pages.prototype.subscriptions = [];

  Pages.prototype.currentSubscription = null;

  Pages.prototype.methods = {
    "CountPages": function() {
      return Math.ceil(this.Collection.find(this.filters, {
        sort: this.sort
      }).count() / this.perPage);
    },
    "Set": function(k, v) {
      var changes, _k, _v;
      if (v == null) {
        v = void 0;
      }
      if (v != null) {
        changes = this.set(k, v, false, true);
      } else {
        changes = 0;
        for (_k in k) {
          _v = k[_k];
          changes += this.set(_k, _v, false, true);
        }
      }
      return changes;
    },
    "Unsubscribe": function() {
      var i, _results;
      _results = [];
      while (this.subscriptions.length) {
        i = this.subscriptions.shift();
        if (i == null) {
          continue;
        }
        _results.push(i.stop());
      }
      return _results;
    }
  };

  function Pages(collection, settings) {
    if (!(this instanceof Meteor.Pagination)) {
      throw "Please use the `new` constructor style " + (new Error).stack.split("\n")[2].trim();
    }
    this.setCollection(collection);
    this.setDefaults();
    this.applySettings(settings);
    this.setRouter();
    this[(Meteor.isServer ? "server" : "client") + "Init"]();
    this.registerInstance();
    this;
  }

  Pages.prototype.serverInit = function() {
    var self;
    this.setMethods();
    self = this;
    return Meteor.publish(this.name, function(page) {
      return self.publish.call(self, page, this);
    });
  };

  Pages.prototype.clientInit = function() {
    this.requested = [];
    this.received = [];
    this.queue = [];
    this.setTemplates();
    this.countPages();
    if (this.infinite) {
      this.setInfiniteTrigger();
    }
    return this.syncSettings((function(err, changes) {
      if (changes > 0) {
        return this.reload();
      }
    }).bind(this));
  };

  Pages.prototype.reload = function() {
    return this.unsubscribe((function() {
      this.requested = [];
      this.received = [];
      this.queue = [];
      return this.call("CountPages", (function(e, total) {
        var p;
        this.sess("totalPages", total);
        p = this.currentPage();
        if ((p == null) || this.resetOnReload || p > total) {
          p = 1;
        }
        this.sess("currentPage", false);
        return this.sess("currentPage", p);
      }).bind(this));
    }).bind(this));
  };

  Pages.prototype.unsubscribe = function(cb) {
    return this.call("Unsubscribe", (function() {
      if (cb != null) {
        return cb();
      }
    }).bind(this));
  };

  Pages.prototype.setDefaults = function() {
    var k, v, _ref, _results;
    _ref = this.availableSettings;
    _results = [];
    for (k in _ref) {
      v = _ref[k];
      if (v[1] != null) {
        _results.push(this[k] = v[1]);
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Pages.prototype.applySettings = function(settings) {
    var key, value, _results;
    _results = [];
    for (key in settings) {
      value = settings[key];
      _results.push(this.set(key, value, false, true));
    }
    return _results;
  };

  Pages.prototype.syncSettings = function(cb) {
    var S, k;
    S = {};
    for (k in this.availableSettings) {
      S[k] = this[k];
    }
    return this.set(S, void 0, true, false, cb.bind(this));
  };

  Pages.prototype.setMethods = function() {
    var f, n, nm, _ref;
    nm = {};
    _ref = this.methods;
    for (n in _ref) {
      f = _ref[n];
      nm[this.id + n] = f.bind(this);
    }
    this.methods = nm;
    return Meteor.methods(this.methods);
  };

  Pages.prototype.getMethod = function(name) {
    return this.id + name;
  };

  Pages.prototype.call = function(method, cb) {
    return Meteor.call(this.getMethod(method), cb.bind(this));
  };

  Pages.prototype.sess = function(k, v) {
    k = "" + this.id + "." + k;
    if (v != null) {
      return Session.set(k, v);
    } else {
      return Session.get(k);
    }
  };

  Pages.prototype.set = function(k, v, onServer, init, cb) {
    var changes, _k, _v;
    if (v == null) {
      v = void 0;
    }
    if (onServer == null) {
      onServer = true;
    }
    if (init == null) {
      init = false;
    }
    if (cb != null) {
      cb = cb.bind(this);
    } else {
      cb = this.reload.bind(this);
    }
    if (Meteor.isClient && onServer) {
      Meteor.call(this.getMethod("Set"), k, v, cb);
    }
    if (v != null) {
      changes = this._set(k, v, init);
    } else {
      changes = 0;
      for (_k in k) {
        _v = k[_k];
        changes += this._set(_k, _v, init);
      }
    }
    return changes;
  };

  Pages.prototype._set = function(k, v, init) {
    var ch;
    if (init == null) {
      init = false;
    }
    ch = 0;
    if (init || k in this.availableSettings) {
      if ((this.availableSettings[k] != null) && this.availableSettings[k][0] !== true) {
        check(v, this.availableSettings[k][0]);
      }
      if (JSON.stringify(this[k]) !== JSON.stringify(v)) {
        ch = 1;
      }
      this[k] = v;
    } else {
      new Meteor.Error(400, "Setting not available.");
    }
    return ch;
  };

  Pages.prototype.setId = function(name) {
    var n;
    if (this.templateName) {
      name = this.templateName;
    }
    if (name in Pages.prototype.instances) {
      n = name.match(/[0-9]+$/);
      if (n != null) {
        name = name.slice(0, +n[0].length + 1 || 9e9) + parseInt(n) + 1;
      } else {
        name = name + "2";
      }
    }
    this.id = "pages_" + name;
    return this.name = name;
  };

  Pages.prototype.registerInstance = function() {
    Pages.prototype._ninstances++;
    return Pages.prototype.instances[this.name] = this;
  };

  Pages.prototype.setCollection = function(collection) {
    var e, isNew;
    if (typeof collection === 'object') {
      Pages.prototype.collections[collection._name] = collection;
      this.Collection = collection;
    } else {
      isNew = true;
      try {
        this.Collection = new Meteor.Collection(collection);
        Pages.prototype.collections[this.name] = this.Collection;
      } catch (_error) {
        e = _error;
        isNew = false;
        this.Collection = Pages.prototype.collections[this.name];
        console.log(this.Collection instanceof Meteor.Collection);
        this.Collection instanceof Meteor.Collection || (function() {
          throw "The '" + collection + "' collection was created outside of <Meteor.Pagination>. Pass the collection object instead of the collection's name to the <Meteor.Pagination> constructor.";
        })();
      }
    }
    this.setId(this.Collection._name);
    return this.PaginatedCollection = new Meteor.Collection(this.id);
  };

  Pages.prototype.setRouter = function() {
    var pr, self, t;
    if (this.router === "iron-router") {
      pr = "" + this.route + ":n";
      t = this.routerTemplate;
      self = this;
      return Router.map(function() {
        if (self.homeRoute) {
          this.route("home", {
            path: self.homeRoute,
            template: t,
            onBeforeAction: function() {
              self.sess("oldPage", 1);
              return self.sess("currentPage", 1);
            }
          });
        }
        if (!self.infinite) {
          this.route("page", {
            path: pr,
            template: t,
            onBeforeAction: function() {
              return self.onNavClick(parseInt(this.params.n));
            }
          });
        }
        if (Meteor.isServer && this.fastRender) {
          return FastRender.route("" + this.route + ":n", function(params) {
            return Meteor.subscribe(this.name, page);
          });
        }
      });
    }
  };

  Pages.prototype.setPerPage = function() {
    return this.perPage = this.pageSizeLimit < this.perPage ? this.pageSizeLimit : this.perPage;
  };

  Pages.prototype.setTemplates = function() {
    var i, name, _i, _len, _ref;
    name = this.templateName || this.name;
    if (this.table && this.itemTemplate === "_pagesItemDefault") {
      this.itemTemplate = this.tableItemTemplate;
    }
    _ref = [this.navTemplate, this.pageTemplate, this.itemTemplate, this.tableTemplate];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      i = _ref[_i];
      Template[i].pagesData = this;
    }
    return _.extend(Template[name], {
      pagesData: this,
      pagesNav: Template[this.navTemplate],
      pages: Template[this.pageTemplate]
    });
  };

  Pages.prototype.countPages = function() {
    return Meteor.call(this.getMethod("CountPages"), (function(e, r) {
      return this.sess("totalPages", r);
    }).bind(this));
  };

  Pages.prototype.publish = function(page, subscription) {
    var c, handle, init, n, self, skip;
    this.setPerPage();
    skip = (page - 1) * this.perPage;
    if (skip < 0) {
      skip = 0;
    }
    init = true;
    c = this.Collection.find(this.filters, {
      sort: this.sort,
      fields: this.fields,
      skip: skip,
      limit: this.perPage
    });
    self = this;
    handle = this.Collection.find().observeChanges({
      changed: (function(subscription, id, fields) {
        var e;
        try {
          return subscription.changed(this.id, id, fields);
        } catch (_error) {
          e = _error;
        }
      }).bind(this, subscription),
      added: (function(subscription, id, fields) {
        var e;
        try {
          if (!init) {
            return subscription.added(this.id, id, fields);
          }
        } catch (_error) {
          e = _error;
        }
      }).bind(this, subscription),
      removed: (function(subscription, id) {
        var e;
        try {
          return subscription.removed(this.id, id);
        } catch (_error) {
          e = _error;
        }
      }).bind(this, subscription)
    });
    init = false;
    n = 0;
    c.forEach((function(doc, index, cursor) {
      n++;
      doc["_" + this.id + "_p"] = page;
      doc["_" + this.id + "_i"] = index;
      return subscription.added(this.id, doc._id, doc);
    }).bind(this));
    subscription.onStop(function() {
      return handle.stop();
    });
    this.ready();
    this.subscriptions.push(subscription);
    return c;
  };

  Pages.prototype.loading = function(p) {
    if (!this.fastRender && p === this.currentPage() && (typeof Session !== "undefined" && Session !== null)) {
      return this.sess("ready", false);
    }
  };

  Pages.prototype.now = function() {
    return (new Date()).getTime();
  };

  Pages.prototype.log = function(msg) {
    return console.log("" + this.name + " " + msg);
  };

  Pages.prototype.logRequest = function(p) {
    this.timeLastRequest = this.now();
    this.loading(p);
    if (__indexOf.call(this.requested, p) < 0) {
      return this.requested.push(p);
    }
  };

  Pages.prototype.logResponse = function(p) {
    if (__indexOf.call(this.received, p) < 0) {
      return this.received.push(p);
    }
  };

  Pages.prototype.clearQueue = function() {
    return this.queue = [];
  };

  Pages.prototype.neighbors = function(page) {
    var d, np, pp, _i, _ref;
    this.n = [page];
    if (this.dataMargin === 0) {
      return this.n;
    }
    for (d = _i = 1, _ref = this.dataMargin; 1 <= _ref ? _i <= _ref : _i >= _ref; d = 1 <= _ref ? ++_i : --_i) {
      np = page + d;
      if (np <= this.sess("totalPages")) {
        this.n.push(np);
      }
      pp = page - d;
      if (pp > 0) {
        this.n.push(pp);
      }
    }
    return this.n;
  };

  Pages.prototype.paginationNavItem = function(label, page, disabled, active) {
    if (active == null) {
      active = false;
    }
    return {
      p: label,
      n: page,
      active: active ? "active" : "",
      disabled: disabled ? "disabled" : ""
    };
  };

  Pages.prototype.paginationNeighbors = function() {
    var from, i, k, n, p, page, to, total, _i, _j, _len;
    page = this.currentPage();
    total = this.sess("totalPages");
    from = page - this.paginationMargin;
    to = page + this.paginationMargin;
    if (from < 1) {
      to += 1 - from;
      from = 1;
    }
    if (to > total) {
      from -= to - total;
      to = total;
    }
    if (from < 1) {
      from = 1;
    }
    if (to > total) {
      to = total;
    }
    n = [];
    if (this.navShowFirst || this.navShowEdges) {
      n.push(this.paginationNavItem("«", 1, page === 1));
    }
    n.push(this.paginationNavItem("<", page - 1, page === 1));
    for (p = _i = from; from <= to ? _i <= to : _i >= to; p = from <= to ? ++_i : --_i) {
      n.push(this.paginationNavItem(p, p, page > total, p === page));
    }
    n.push(this.paginationNavItem(">", page + 1, page >= total));
    if (this.navShowLast || this.navShowEdges) {
      n.push(this.paginationNavItem("»", total, page >= total));
    }
    for (k = _j = 0, _len = n.length; _j < _len; k = ++_j) {
      i = n[k];
      n[k]['_p'] = this;
    }
    return n;
  };

  Pages.prototype.onNavClick = function(n) {
    if (n <= this.sess("totalPages") && n > 0) {
      Deps.nonreactive((function() {
        return this.sess("oldPage", this.sess("currentPage"));
      }).bind(this));
      return this.sess("currentPage", n);
    }
  };

  Pages.prototype.setInfiniteTrigger = function() {
    return window.onscroll = (_.throttle(function() {
      var l, oh, t;
      t = this.infiniteTrigger;
      oh = document.body.offsetHeight;
      if (t > 1) {
        l = oh - t;
      } else if (t > 0) {
        l = oh * t;
      } else {
        return;
      }
      if ((window.innerHeight + window.scrollY) >= l) {
        if (this.lastPage < this.sess("totalPages")) {
          return this.sess("currentPage", this.lastPage + 1);
        }
      }
    }, this.infiniteRateLimit * 1000)).bind(this);
  };

  Pages.prototype.checkQueue = function() {
    var i;
    if (this.queue.length) {
      while (!(__indexOf.call(this.neighbors(this.currentPage()), i) >= 0 || !this.queue.length)) {
        i = this.queue.shift();
      }
      if (__indexOf.call(this.neighbors(this.currentPage()), i) >= 0) {
        return this.requestPage(i);
      }
    }
  };

  Pages.prototype.currentPage = function() {
    if (Meteor.isClient && (this.sess("currentPage") != null)) {
      return this.sess("currentPage");
    } else {
      return this._currentPage;
    }
  };

  Pages.prototype.isReady = function() {
    return this.sess("ready");
  };

  Pages.prototype.ready = function(p) {
    if (p === true || p === this.currentPage() && (typeof Session !== "undefined" && Session !== null)) {
      return this.sess("ready", true);
    }
  };

  Pages.prototype.getPage = function(page) {
    var c, n, p, total, _i, _len, _ref;
    if (Meteor.isClient) {
      if (page == null) {
        page = this.currentPage();
      }
      page = parseInt(page);
      if (page === NaN) {
        return;
      }
      total = this.sess("totalPages");
      if (total === 0) {
        return this.ready(true);
      }
      if (page <= total) {
        _ref = this.neighbors(page);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          p = _ref[_i];
          if (__indexOf.call(this.received, p) < 0) {
            this.requestPage(p);
          }
        }
      }
      if (this.infinite) {
        n = this.PaginatedCollection.find({}, {
          fields: this.fields,
          sort: this.sort
        }).count();
        c = this.PaginatedCollection.find({}, {
          fields: this.fields,
          sort: this.sort,
          skip: this.infiniteItemsLimit !== Infinity && n > this.infiniteItemsLimit ? n - this.infiniteItemsLimit : 0,
          limit: this.infiniteItemsLimit
        }).fetch();
      } else {
        c = this.PaginatedCollection.find(_.object([["_" + this.id + "_p", page]]), {
          fields: this.fields
        }).fetch();
      }
      return c;
    }
  };

  Pages.prototype.requestPage = function(page) {
    if (__indexOf.call(this.requested, page) >= 0) {
      return;
    }
    if (page === this.currentPage()) {
      this.clearQueue();
    }
    this.queue.push(page);
    this.logRequest(page);
    return Meteor.defer((function(page) {
      return this.subscriptions[page] = Meteor.subscribe(this.name, page, {
        onReady: (function(page) {
          return this.onPage(page);
        }).bind(this, page),
        onError: (function(e) {
          return new Meteor.Error(e.message);
        }).bind(this)
      });
    }).bind(this, page));
  };

  Pages.prototype.onPage = function(page) {
    this.logResponse(page);
    this.ready(page);
    if (this.infinite) {
      this.lastPage = page;
    }
    return this.checkQueue();
  };

  return Pages;

})();

Meteor.Pagination = Pages;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages\pages\client\template.templates.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
                                                                                                                       // 1
Template.__define__("pages", (function() {                                                                             // 2
  var self = this;                                                                                                     // 3
  var template = this;                                                                                                 // 4
  return "";                                                                                                           // 5
}));                                                                                                                   // 6
                                                                                                                       // 7
Template.__define__("pagesNav", (function() {                                                                          // 8
  var self = this;                                                                                                     // 9
  var template = this;                                                                                                 // 10
  return "";                                                                                                           // 11
}));                                                                                                                   // 12
                                                                                                                       // 13
Template.__define__("_pagesLoading", (function() {                                                                     // 14
  var self = this;                                                                                                     // 15
  var template = this;                                                                                                 // 16
  return HTML.Raw('<div class="pagesLoadingDefaultCont">\n    <div class="pagesLoadingDefault"><img src="/packages/pages/public/loader.gif"></div>\n  </div>');
}));                                                                                                                   // 18
                                                                                                                       // 19
Template.__define__("_pagesPageCont", (function() {                                                                    // 20
  var self = this;                                                                                                     // 21
  var template = this;                                                                                                 // 22
  return UI.If(function() {                                                                                            // 23
    return Spacebars.dataMustache(self.lookup("divWrapper"), self.lookup("pagesData"));                                // 24
  }, UI.block(function() {                                                                                             // 25
    var self = this;                                                                                                   // 26
    return [ "\n    ", HTML.DIV({                                                                                      // 27
      "class": function() {                                                                                            // 28
        return Spacebars.mustache(self.lookup("divWrapper"), self.lookup("pagesData"));                                // 29
      }                                                                                                                // 30
    }, "\n      ", Spacebars.TemplateWith(function() {                                                                 // 31
      return Spacebars.call(self.lookup("pagesData"));                                                                 // 32
    }, UI.block(function() {                                                                                           // 33
      var self = this;                                                                                                 // 34
      return Spacebars.include(self.lookupTemplate("_pagesPage"));                                                     // 35
    })), "\n    "), "\n  " ];                                                                                          // 36
  }), UI.block(function() {                                                                                            // 37
    var self = this;                                                                                                   // 38
    return [ UI.If(function() {                                                                                        // 39
      return Spacebars.dataMustache(self.lookup("table"), self.lookup("pagesData"));                                   // 40
    }, UI.block(function() {                                                                                           // 41
      var self = this;                                                                                                 // 42
      return [ "\n    ", UI.If(function() {                                                                            // 43
        return Spacebars.dataMustache(self.lookup("tableWrapper"), self.lookup("pagesData"));                          // 44
      }, UI.block(function() {                                                                                         // 45
        var self = this;                                                                                               // 46
        return [ "\n      ", HTML.DIV({                                                                                // 47
          "class": function() {                                                                                        // 48
            return Spacebars.mustache(self.lookup("tableWrapper"), self.lookup("pagesData"));                          // 49
          }                                                                                                            // 50
        }, "\n        ", Spacebars.TemplateWith(function() {                                                           // 51
          return Spacebars.call(self.lookup("pagesData"));                                                             // 52
        }, UI.block(function() {                                                                                       // 53
          var self = this;                                                                                             // 54
          return Spacebars.include(self.lookupTemplate("_pagesTable"));                                                // 55
        })), "\n      "), "\n    " ];                                                                                  // 56
      }), UI.block(function() {                                                                                        // 57
        var self = this;                                                                                               // 58
        return [ "\n        ", Spacebars.TemplateWith(function() {                                                     // 59
          return Spacebars.call(self.lookup("pagesData"));                                                             // 60
        }, UI.block(function() {                                                                                       // 61
          var self = this;                                                                                             // 62
          return Spacebars.include(self.lookupTemplate("_pagesTable"));                                                // 63
        })), "\n    " ];                                                                                               // 64
      })), "\n  " ];                                                                                                   // 65
    }), UI.block(function() {                                                                                          // 66
      var self = this;                                                                                                 // 67
      return [ "\n  ", Spacebars.TemplateWith(function() {                                                             // 68
        return Spacebars.call(self.lookup("pagesData"));                                                               // 69
      }, UI.block(function() {                                                                                         // 70
        var self = this;                                                                                               // 71
        return Spacebars.include(self.lookupTemplate("_pagesPage"));                                                   // 72
      })), "\n  " ];                                                                                                   // 73
    })), "\n  " ];                                                                                                     // 74
  }));                                                                                                                 // 75
}));                                                                                                                   // 76
                                                                                                                       // 77
Template.__define__("_pagesTable", (function() {                                                                       // 78
  var self = this;                                                                                                     // 79
  var template = this;                                                                                                 // 80
  return HTML.TABLE({                                                                                                  // 81
    "class": function() {                                                                                              // 82
      return Spacebars.mustache(self.lookup("class"), self.lookup("pagesData"));                                       // 83
    }                                                                                                                  // 84
  }, "\n    ", HTML.THEAD("\n      ", HTML.TR("\n        ", UI.Each(function() {                                       // 85
    return Spacebars.dataMustache(self.lookup("header"), self.lookup("pagesData"));                                    // 86
  }, UI.block(function() {                                                                                             // 87
    var self = this;                                                                                                   // 88
    return [ "\n          ", HTML.TH(function() {                                                                      // 89
      return Spacebars.mustache(self.lookup("value"));                                                                 // 90
    }), "\n        " ];                                                                                                // 91
  })), "\n      "), "\n    "), "\n    ", HTML.TBODY("\n      ", Spacebars.TemplateWith(function() {                    // 92
    return Spacebars.call(self.lookup("pagesData"));                                                                   // 93
  }, UI.block(function() {                                                                                             // 94
    var self = this;                                                                                                   // 95
    return Spacebars.include(self.lookupTemplate("_pagesPage"));                                                       // 96
  })), "\n    "), "\n  ");                                                                                             // 97
}));                                                                                                                   // 98
                                                                                                                       // 99
Template.__define__("_pagesTableItem", (function() {                                                                   // 100
  var self = this;                                                                                                     // 101
  var template = this;                                                                                                 // 102
  return HTML.TR("\n    ", UI.Each(function() {                                                                        // 103
    return Spacebars.dataMustache(self.lookup("attrs"), self.lookup("pagesData"));                                     // 104
  }, UI.block(function() {                                                                                             // 105
    var self = this;                                                                                                   // 106
    return [ "\n      ", HTML.TD(function() {                                                                          // 107
      return Spacebars.mustache(self.lookup("value"));                                                                 // 108
    }), "\n    " ];                                                                                                    // 109
  })), "\n  ");                                                                                                        // 110
}));                                                                                                                   // 111
                                                                                                                       // 112
Template.__define__("_pagesPage", (function() {                                                                        // 113
  var self = this;                                                                                                     // 114
  var template = this;                                                                                                 // 115
  return [ UI.If(function() {                                                                                          // 116
    return Spacebars.call(self.lookup("ready"));                                                                       // 117
  }, UI.block(function() {                                                                                             // 118
    var self = this;                                                                                                   // 119
    return "\n  ";                                                                                                     // 120
  }), UI.block(function() {                                                                                            // 121
    var self = this;                                                                                                   // 122
    return [ "\n    ", Spacebars.include(self.lookupTemplate("_pagesLoading")), "\n  " ];                              // 123
  })), "\n  ", UI.Each(function() {                                                                                    // 124
    return Spacebars.call(self.lookup("items"));                                                                       // 125
  }, UI.block(function() {                                                                                             // 126
    var self = this;                                                                                                   // 127
    return [ "\n    ", Spacebars.include(self.lookupTemplate("item")), "\n  " ];                                       // 128
  })) ];                                                                                                               // 129
}));                                                                                                                   // 130
                                                                                                                       // 131
Template.__define__("_pagesNavCont", (function() {                                                                     // 132
  var self = this;                                                                                                     // 133
  var template = this;                                                                                                 // 134
  return Spacebars.TemplateWith(function() {                                                                           // 135
    return Spacebars.call(self.lookup("pagesData"));                                                                   // 136
  }, UI.block(function() {                                                                                             // 137
    var self = this;                                                                                                   // 138
    return Spacebars.include(self.lookupTemplate("_pagesNav"));                                                        // 139
  }));                                                                                                                 // 140
}));                                                                                                                   // 141
                                                                                                                       // 142
Template.__define__("_pagesNav", (function() {                                                                         // 143
  var self = this;                                                                                                     // 144
  var template = this;                                                                                                 // 145
  return UI.If(function() {                                                                                            // 146
    return Spacebars.call(self.lookup("show"));                                                                        // 147
  }, UI.block(function() {                                                                                             // 148
    var self = this;                                                                                                   // 149
    return [ "\n    ", HTML.DIV({                                                                                      // 150
      style: "text-align:center",                                                                                      // 151
      "data-pages": function() {                                                                                       // 152
        return Spacebars.mustache(self.lookup("name"));                                                                // 153
      },                                                                                                               // 154
      "class": "pagination-cont"                                                                                       // 155
    }, "\n      ", HTML.UL({                                                                                           // 156
      "class": "pagination"                                                                                            // 157
    }, "\n      ", UI.Each(function() {                                                                                // 158
      return Spacebars.call(self.lookup("paginationNeighbors"));                                                       // 159
    }, UI.block(function() {                                                                                           // 160
      var self = this;                                                                                                 // 161
      return [ "\n        ", HTML.LI({                                                                                 // 162
        "class": [ function() {                                                                                        // 163
          return Spacebars.mustache(self.lookup("active"));                                                            // 164
        }, " ", function() {                                                                                           // 165
          return Spacebars.mustache(self.lookup("disabled"));                                                          // 166
        } ]                                                                                                            // 167
      }, "\n          ", HTML.A({                                                                                      // 168
        href: function() {                                                                                             // 169
          return Spacebars.mustache(self.lookup("link"));                                                              // 170
        }                                                                                                              // 171
      }, function() {                                                                                                  // 172
        return Spacebars.mustache(self.lookup("p"));                                                                   // 173
      }), "\n        "), "\n      " ];                                                                                 // 174
    })), "\n      "), "\n    "), "\n  " ];                                                                             // 175
  }));                                                                                                                 // 176
}));                                                                                                                   // 177
                                                                                                                       // 178
Template.__define__("_pagesItemDefault", (function() {                                                                 // 179
  var self = this;                                                                                                     // 180
  var template = this;                                                                                                 // 181
  return HTML.DIV({                                                                                                    // 182
    "class": "pagesItemDefault"                                                                                        // 183
  }, UI.Each(function() {                                                                                              // 184
    return Spacebars.call(self.lookup("properties"));                                                                  // 185
  }, UI.block(function() {                                                                                             // 186
    var self = this;                                                                                                   // 187
    return [ "\n    ", HTML.DIV(HTML.I(function() {                                                                    // 188
      return Spacebars.mustache(self.lookup("name"));                                                                  // 189
    }), ": ", function() {                                                                                             // 190
      return Spacebars.mustache(self.lookup("value"));                                                                 // 191
    }) ];                                                                                                              // 192
  })), "\n  ");                                                                                                        // 193
}));                                                                                                                   // 194
                                                                                                                       // 195
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages\pages\client\controllers.coffee.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
_.extend(Template['_pagesPageCont'], {
  divWrapper: function(self) {
    return self.divWrapper;
  },
  table: function(self) {
    return self.table;
  },
  tableWrapper: function(self) {
    return self.table.wrapper;
  }
});

_.extend(Template['_pagesTable'], {
  "class": function(self) {
    return self.table["class"] || "";
  },
  fields: function(self) {
    return _.map(self.table.fields, function(v) {
      return {
        value: v
      };
    });
  },
  header: function(self) {
    return _.map(self.table.header || self.table.fields, function(v) {
      return {
        value: v
      };
    });
  }
});

_.extend(Template['_pagesPage'], {
  ready: function() {
    if (this.fastRender) {
      return true;
    }
    return this.sess("ready");
  },
  items: function() {
    var i, k, p, _i, _len;
    p = this.getPage(this.sess((this.sess("ready") ? "currentPage" : "oldPage")));
    if (p == null) {
      return [];
    }
    for (k = _i = 0, _len = p.length; _i < _len; k = ++_i) {
      i = p[k];
      p[k]['_t'] = this.itemTemplate;
    }
    return p;
  },
  item: function() {
    return Template[this._t];
  }
});

_.extend(Template['_pagesNav'], {
  show: function() {
    return !this.infinite && 1 < this.sess("totalPages");
  },
  link: function() {
    var p, self, total;
    self = this._p;
    if (self.router) {
      p = this.n;
      if (p < 1) {
        p = 1;
      }
      total = self.sess("totalPages");
      if (p > total) {
        p = total;
      }
      return self.route + p;
    }
    return "#";
  },
  paginationNeighbors: function() {
    this.sess("currentPage");
    return this.paginationNeighbors();
  },
  events: {
    "click a": function(e) {
      var n, self;
      n = e.target.parentNode.parentNode.parentNode.getAttribute('data-pages');
      self = Meteor.Pagination.prototype.instances[n];
      return (_.throttle(function(e, self, n) {
        if (!self.router) {
          e.preventDefault();
          return self.onNavClick.call(self, n);
        }
      }, self.rateLimit * 1000))(e, self, this.n);
    }
  }
});

_.extend(Template['_pagesTableItem'], {
  attrs: function(self) {
    return _.map(self.table.fields, (function(n) {
      return {
        value: this[n] != null ? this[n] : ""
      };
    }).bind(this));
  }
});

_.extend(Template['_pagesItemDefault'], {
  properties: function() {
    return _.compact(_.map(this, function(v, k) {
      if (k[0] !== "_") {
        return {
          name: k,
          value: v
        };
      } else {
        return null;
      }
    }));
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
