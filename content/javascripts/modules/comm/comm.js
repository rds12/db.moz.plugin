db.moz.plugin.modules.register({
  // module description
  module_name:        'comm',
  module_author:      'rds12',
  module_version:     '2010-04-15',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,

  initialize: function(){
    const basic    = this.modules.basic;
    const location = this.modules.location;

    if(location == undefined) throw 'location not avaible';
    if(!basic.is_logged_in) return;

    this.call(location.sub);
  },

  od_inbox: function(){
    this.gui_fixing_favorites_sidebar();
    this.gui_extending_numeration();
    this.gui_extending_link_parser();

    // both
    this.gui_extending_ajax();
    this.gui_fixing_input_width();
  },

  od_outbox: function(){
    this.gui_extending_ajax();
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

  // adding comm numeration
  gui_extending_numeration: function(){
    if(this.lib.preferences.get('preferences.comm.numeration') !== true)
      return;

    const $ = this.od.jQuery;
    const self = this;

    var offset = this.modules.location.options.start + 1;
    $('form[method=post] div[style] tbody > tr').each(function(i,e){
      var even = i%2 == 0;
      if(!even) return;

      // adding numer
      $(e).prepend(self.template('numeration',offset + i/2));
    });
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

      var element = $(e).find('td').attr('colspan',4),
          html = element.html();

      element.html(parseToLink(html,self.template('parseLink'),function(link){
        // forbid links that include an image path to an smily,
        // because this would screw up the image
        var match = link.match(/spielgrafik/);
        return match === null;
      }));
    });
  },

  gui_extending_ajax: function(){
    if(this.lib.preferences.get('preferences.comm.autocompletion') !== true)
      return;

    const world = this.modules.basic.world; 
    const $ = this.od.jQuery;
    const autocompleter = this.lib.ajax.autocompleter;
    const self = this;

    new autocompleter($, {
      input: $('#anschrift'),
      response: 'dbMozPluginCommAjaxResponse',
      get_url: function(username){
        username = escape(username);
        return self.template('ajaxUrl_'+world,username);
      },
      parse_items: function($jq){
        var items = [self.template('playerNotFound')];
        $jq('a[href*=eintrag_now]:lt(5)').each(function(i,e){
          items.push($jq(e).html());
        });
        return items;
      }
    });
  },

  gui_fixing_input_width: function(){
    if(this.lib.preferences.get('preferences.comm.fixWidth') !== true)
      return;

    const $ = this.od.jQuery;

    $('textarea[name=nachricht]').css({width: '600px'});
    $('#maincontent table[width]:eq(1)').removeAttr('width')
  }

});