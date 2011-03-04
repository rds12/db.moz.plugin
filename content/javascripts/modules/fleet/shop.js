//= basic
//= location

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'fleet_shop',
  module_author:      'rds12',
  module_version:     '2011-02-17',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,

  initialize: function(){
    const basic = this.modules.basic;
    const location = this.modules.location;

    if(location == undefined) throw 'location not avaible';
    if(!basic.is_logged_in) return;

    if(location.main != 'shop') return;
    if(location.sub  != 'ships') return;

    if(basic.is_debug_enabled) {
        basic.log('modules.shop',null,true);
    }    
    
    this.gui_extending_convert_javascript_to_link();
  },

  gui_extending_convert_javascript_to_link: function(){
    if(this.lib.preferences.get('preferences.shop.convertFleetLinks') !== true)
      return;

    const $ = this.od.jQuery;

    $('a[href^=javascript:kauf]').each(function(i,e){
      e = $(e);
      var link = e.siblings('form:first').attr('action') + '&ships=' +
                 e.siblings('form:first').find('input[name=ships]').val();

      e.attr({'href': link, 'target':'_blank'});
      e = null;
    });
  }
});