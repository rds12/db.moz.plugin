db.moz.plugin.modules.register({
  // module description
  module_name:        'comm',
  module_author:      'rds12',
  module_version:     '2011-02-17',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,

  initialize: function(){
    const basic    = this.modules.basic;
    const location = this.modules.location;

    if(location == undefined) throw 'location not avaible';
    if(!basic.is_logged_in) return;

    if(location.main != 'comm') return;

    if(basic.is_debug_enabled) {
        basic.log('modules.comm',null,true);
    }    

    this.call(location.sub);
  },

  od_inbox: function(){
    this.gui_fixing_favorites_sidebar();
    this.gui_extending_link_parser();
    this.gui_fixing_input_width();
  },

  od_outbox: function(){
    this.gui_fixing_input_width();
  },

  gui_fixing_favorites_sidebar: function(){
    if(this.lib.preferences.get('preferences.comm.fixFavorites') !== true)
      return;

    if(!this.modules.basic.is_premium) return;

    const $ = this.od.jQuery;

    // get favorites sidebar, with the notice input
    $('input[name=submit2]').parents('div:first').css('width','185');
  },

  gui_extending_link_parser: function(element){
    if(this.lib.preferences.get('preferences.comm.parseLinks') !== true)
      return;

    const parseToLink = db.moz.plugin.basics.parseToLink,
          self = this,
          $ = this.od.jQuery;

    $('form[method=post] div[style] tbody > tr').each(function(i,e){
      var odd = i%2 == 1;
      if(!odd) return;
      odd = null;

      var element = $(e).find('td').attr('colspan',4),
          html = element.html();

      element.html(parseToLink(html,self.template('parseLink'),function(link){
        // forbid links that include an image path to an smiley,
        // because this would screw up the image
        var match = link.match(/spielgrafik/);
        return match === null;
      }));
      element = null;
      html = null;
    });
  },

  gui_fixing_input_width: function(){
    if(this.lib.preferences.get('preferences.comm.fixWidth') !== true) return;
    const $ = this.od.jQuery;

    $('#maincontent table[width]:eq(0)').attr('width','90%');
    $('#maincontent table[width]:eq(1)').removeAttr('width');
    $('textarea[name=nachricht]').css({width: '600px'});
  }
});