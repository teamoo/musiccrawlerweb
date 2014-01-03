Template._houston_navbar.events
  'click .houston-logout': (e) ->
    e.preventDefault()
    Meteor.logout()

Template._houston_navbar.helpers
  'bugreport_url': ->
    message = encodeURIComponent """
To make sure we can help you quickly, please include the version of Houston
you are using, steps to replicate the issue, a description of what you were
expecting and a screenshot if relevant.

Thanks!
"""
    "https://github.com/gterrono/houston/issues/new?body=#{message}"
