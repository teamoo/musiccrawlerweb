// This file exposes livestamp so that it works with Meteor's package system after v0.6.5
if (typeof Package !== "undefined") {
  livestamp = this.livestamp;
}
