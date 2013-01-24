//Methoden, die auf dem Server aufgerufen werden können
Meteor.methods({
	checkJDOnlineStatus : function (ip, port) {
		if (this.isSimulation) {
		  return true;
		}
	
	
		this.unblock();
		var result = Meteor.http.get("http://" + ip + ":" + port + "/get/version");
		
		if (result.statusCode === 200 && result.content == "JDownloader") return true;
		return false;
	},


  // options should include: title, description, x, y, public
  createLink: function (options) {
    options = options || {};
    if (! (typeof options.title === "string" && options.title.length &&
           typeof options.description === "string" &&
           options.description.length &&
           typeof options.x === "number" && options.x >= 0 && options.x <= 1 &&
           typeof options.y === "number" && options.y >= 0 && options.y <= 1))
      throw new Meteor.Error(400, "Required parameter missing");
    if (options.title.length > 100)
      throw new Meteor.Error(413, "Title too long");
    if (options.description.length > 1000)
      throw new Meteor.Error(413, "Description too long");
    if (! this.userId)
      throw new Meteor.Error(403, "You must be logged in");

    return Parties.insert({
      owner: this.userId,
      x: options.x,
      y: options.y,
      title: options.title,
      description: options.description,
      public: !! options.public,
      invited: [],
      rsvps: []
    });
  },

  invite: function (partyId, userId) {
    var party = Parties.findOne(partyId);
    if (! party || party.owner !== this.userId)
      throw new Meteor.Error(404, "No such party");
    if (party.public)
      throw new Meteor.Error(400,
                             "That party is public. No need to invite people.");
    if (userId !== party.owner && ! _.contains(party.invited, userId)) {
      Parties.update(partyId, { $addToSet: { invited: userId } });

      var from = contactEmail(Meteor.users.findOne(this.userId));
      var to = contactEmail(Meteor.users.findOne(userId));
      if (Meteor.isServer && to) {
        // This code only runs on the server. If you didn't want clients
        // to be able to see it, you could move it to a separate file.
        Email.send({
          from: "noreply@example.com",
          to: to,
          replyTo: from || undefined,
          subject: "PARTY: " + party.title,
          text:
"Hey, I just invited you to '" + party.title + "' on All Tomorrow's Parties." +
"\n\nCome check it out: " + Meteor.absoluteUrl() + "\n"
        });
      }
    }
  },

  rsvp: function (partyId, rsvp) {
    if (! this.userId)
      throw new Meteor.Error(403, "You must be logged in to RSVP");
    if (! _.contains(['yes', 'no', 'maybe'], rsvp))
      throw new Meteor.Error(400, "Invalid RSVP");
    var party = Parties.findOne(partyId);
    if (! party)
      throw new Meteor.Error(404, "No such party");
    if (! party.public && party.owner !== this.userId &&
        !_.contains(party.invited, this.userId))
      // private, but let's not tell this to the user
      throw new Meteor.Error(403, "No such party");

    var rsvpIndex = _.indexOf(_.pluck(party.rsvps, 'user'), this.userId);
    if (rsvpIndex !== -1) {
      // update existing rsvp entry

      if (Meteor.isServer) {
        // update the appropriate rsvp entry with $
        Parties.update(
          {_id: partyId, "rsvps.user": this.userId},
          {$set: {"rsvps.$.rsvp": rsvp}});
      } else {
        // minimongo doesn't yet support $ in modifier. as a temporary
        // workaround, make a modifier that uses an index. this is
        // safe on the client since there's only one thread.
        var modifier = {$set: {}};
        modifier.$set["rsvps." + rsvpIndex + ".rsvp"] = rsvp;
        Parties.update(partyId, modifier);
      }

      // Possible improvement: send email to the other people that are
      // coming to the party.
    } else {
      // add new rsvp entry
      Parties.update(partyId,
                     {$push: {rsvps: {user: this.userId, rsvp: rsvp}}});
    }
  }
});