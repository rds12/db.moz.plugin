db.moz.plugin.modules.register({
  // module description
  module_name:        'comm',
  module_author:      'rds12',
  module_version:     '2010-03-07',
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
    this.gui_extending_ajax();
  },
  
  od_outbox: function(){
    this.gui_extending_ajax();
  },
  
  gui_fixing_favorites_sidebar: function(){
    if(!this.modules.basic.is_premium) return;
    const $ = this.od.jQuery;
    // getting favorites sidebar, with the notice input
    $('input[name=submit2]').parents('div:first').css('width','185');
  },
  
  // adding comm numeration
  gui_extending_numeration: function(){
    const $ = this.od.jQuery;
    const self = this;

    var offset = this.modules.location.options.start + 1;
    $('form[method=post] div[style] tbody > tr').each(function(i,e){
      var even = i%2 == 0;
      if(even){
        // adding numer
        $(e).prepend(self.template('numeration',offset + i/2));
      }else{
        var td = $(e).find('td').attr('colspan',4);
        self.gui_extending_link_parser(td);
      }
    });
  },
  
  gui_extending_link_parser: function(element){
    const $ = this.od.jQuery;
    const parseToLink = db.moz.plugin.basics.parseToLink;
    var element = $(element);

    var html = element.html();
    element.html(parseToLink(html,this.template('parseLink'),function(link){
      var match = link.match(/spielgrafik/);
      return match === null;
    }));
  },

  gui_extending_ajax: function(){
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
  }
  
});