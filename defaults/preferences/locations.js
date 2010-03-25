
// pref can't be assigned like normal javascript
// the following won't work:
// pref('extensions.test.hi', 'hal' + 'lo');


// all basic locations of this plugin.
pref(
  "extensions.db.moz.plugin.locations.basic",  
  'chrome://db.moz.plugin/'
);
pref(
  "extensions.db.moz.plugin.locations.locale",
  'chrome://db.moz.plugin/locale/'
);
pref(
  "extensions.db.moz.plugin.locations.images",
  'chrome://db.moz.plugin/content/images/'
);
pref(
  "extensions.db.moz.plugin.locations.javascripts",
  'chrome://db.moz.plugin/content/javascripts/'
);
pref(
  "extensions.db.moz.plugin.locations.graphics_packet",
  'chrome://db.moz.plugin/content/images/graphics_packet/'
);
pref(
  "extensions.db.moz.plugin.locations.templates",
  'chrome://db.moz.plugin/content/templates/'
);