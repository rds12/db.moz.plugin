Namespace('db.moz.plugin',{
  locations:{
    basic:   db.moz.plugin.preferences.get('locations.basic'),
    locale:  db.moz.plugin.preferences.get('locations.locale'),
    content: db.moz.plugin.preferences.get('locations.content'),
    javascripts: db.moz.plugin.preferences.get('locations.javascripts'),
    images: db.moz.plugin.preferences.get('locations.images'),
    templates: db.moz.plugin.preferences.get('locations.templates'),
    graphics_packet: db.moz.plugin.preferences.get('locations.graphics_packet')
  }
});