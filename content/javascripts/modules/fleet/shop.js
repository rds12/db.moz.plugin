//= basic
//= location

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'fleet_shop',
  module_author:      'rds12',
  module_version:     '2010-03-30',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,

  initialize: function(){
    const basic = this.modules.basic;
    const location = this.modules.location;

    if(location == undefined) throw 'location not avaible';
    if(!basic.is_logged_in) return;

    if(location.main != 'shop') return;
    if(location.sub  != 'ships') return;

    this.gui_extending_convert_javascript_to_link();
  },

  gui_extending_convert_javascript_to_link: function(){
    if(this.lib.preferences.get('preferences.shop.convertFleetLinks') !== true)
      return;

    const $ = this.od.jQuery;

    $('a[href^=javascript:kauf]').each(function(i,e){
      var e = $(e),
          link = e.siblings('form:first').attr('action');

      e.attr({'href': link, 'target':'_blank'});
    });
  }
});