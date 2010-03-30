//= library

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'basic',
  module_author:      'rds12',
  module_version:     '2010-03-11',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,
  
  // od informations
  is_od:              false, // if page is really an full loaded od page
  is_logged_in:       false, // determines if player is logged on
  is_slim:            false, // is player slim?
  is_premium:         false, // is player premium?
  is_ad_page:         false, // is this page the advertisement page?
  is_sitter:          false,
  is_debug_enabled:   false,
  is_odhelper_enabled: false,
  round_relation:   {
    'en1':     'round5',
    'de7':     'round7'
  },
  world:              'unknown',
  host:               '',
  based_on:           'unknown',
  player_id:          undefined, // which id   has the logged on player
  player_name:        undefined, // which name has the logged on player
  race_id:            undefined, // which race has the logged on player
  alliance_id:        undefined, // which aid  has the logged on player
  alliance_name:      undefined, 

  
  // important OD HTMLNodes
  player_panel:       undefined,
  debug_window:       undefined,
  
  initialize: function(){
    var dom = this.od.dom;
    this.is_debug_enabled = !!this.lib.preferences.get('debug.enable');
    
    this.retrieve_od_whereabouts();
    
    if(!this.is_od) return;    
    if(!this.is_logged_in) return;

    // trying to access ODHelpers instance
    try {
      this.is_odhelper_enabled = !!ODHELP;
    }catch(e){}
    
    // retrieving site informations
    try{
      this.retrieve_common_informations();
    }catch(e){
      this.is_logged_in = false;
      return;
    }
    this.retrieve_page_status();
    
    // loading guis
    this.gui_extending_logo();
    this.gui_extending_debug();
    this.gui_extending_configurator_links();

    // logging variables

    this.log('module.basic',null,true)
    this.log(this.is_od              ,'is_od');
    this.log(this.is_logged_in       ,'is_logged_in');
    this.log(this.is_premium         ,'is_premium');
    this.log(this.is_slim            ,'is_slim');
    this.log(this.is_sitter          ,'is_sitter');
    this.log(this.is_ad_page         ,'is_ad_page');
    this.log(this.is_odhelper_enabled,'is_odhelper_enabled');
    this.log(this.world              ,'world');
    this.log(this.host               ,'host');
    this.log(this.based_on           ,'based_on');
    this.log(this.player_id          ,'player_id');
    this.log(this.player_name        ,'player_name');
    this.log(this.race_id            ,'race_id');
    this.log(this.alliance_id        ,'alliance_id');
    this.log(this.alliance_name      ,'alliance_name');

  },
  
  format_time: function(time){
    const basics = db.moz.plugin.basics;
    var matches = /(\d+):(\d+):(\d+):(\d+)/.exec(time);
    if(!matches) return false;
    var ints = ['%02d:%02d:%02d:%02d'];
    for(var i=1;i<5;++i) 
      ints.push(parseInt(matches[i]));
    return basics.sprintf.apply(this,ints);
  },
  
  parse_time: function(time){
    var match = /(\d+):(\d+):(\d+):(\d+)/.exec(time),
    value = match[1] * 24 * 60 * 60 +
            match[2] * 60 * 60 +
            match[3] * 60 +
            match[4];
    return value;
  },
  
  retrieve_od_whereabouts:function(){
    const dom = this.od.dom;
    const $   = this.od.jQuery;
    
    this.player_panel = undefined;
    try{
      // required, in cases there the url is correct
      // but od wasn't loaded
      // e.g: offline modus or you don't have a internet connection
      if(
        dom.Sekunde == undefined ||
        dom.Minute  == undefined ||
        dom.stunde  == undefined
      )throw 'db.moz.plugin: not in od';
      
      this.is_od = true;

      // references to the player_panel 
      this.player_panel = $('body table table table[height=66]');
      
      if( this.player_panel.length ){
        this.is_logged_in = true;
      }
    }catch(e){
      if(this.is_debug_enabled)
      this.lib.console.error('modules.basic.retrieve_od_whereabouts: not in od',e);
    }
  },
  
  retrieve_common_informations: function(){
    const dom = this.od.dom;
    const $   = this.od.jQuery;
    
    // which round and world?
    var debug = $('head').html();
    this.world    = (/Debug:\s+.*?W:(\w+)/.exec(debug) || ['','unknown'])[1];
    this.host     = this.od.doc.location.host;
    this.based_on = this.round_relation[this.world] || 'unknown';
    
    // retrieving player informations
    var status = this.player_panel.find('tr:eq(2) td:eq(2) font');
    var status_text = status.html();
    
    this.is_premium = /premium/i.exec(status_text) != undefined;
    this.is_slim    = !this.is_premium;
    this.is_sitter  = /op=settings/.exec(status_text) != undefined;
    
    var player       = this.player_panel.find('a[href*=usershow]');
    this.player_id   = /(\d+)/.exec(player.attr('href'))[1];
    this.player_name = player.html();

    var alliance       = this.player_panel.find('a[href*=allyshow]');
    this.alliance_id   = /(\d+)/.exec(alliance.attr('href'))[1];
    this.alliance_name = alliance.html();
    
    if(this.based_on == 'round5'){
      var race = this.player_panel.find('a[href*="anznummer"]');
      if(race.length)
      this.race_id = /anznummer=(\d+)/.exec(race.attr('href'))[1];
    }else{// this works for >=round7
      var race = this.player_panel.find('a[onclick*="op=rassen"]');
      this.race_id = /func=(\d+)/.exec(race.attr('onclick'))[1];
    }
  },
  
  retrieve_page_status: function(){ 
    const dom = this.od.dom;
    const $   = this.od.jQuery;
    
    // checking if the form with the name Interruptform
    // is existing, than it is the ad page
    try{
      var form = $('form[name=Interruptform]');
      this.is_ad_page = !!form.length;
    }catch(e){}
    
    // reload page if ad apears. only for test purpose
    var value = this.lib.preferences.get('reload_page_if_ad');
    if(this.is_ad_page && value){
      this.reload_page();
    }
  },
  
  reload_page: function(){
    this.is_od        = false;
    this.is_logged_in = false;
    this.od.dom.location.reload();
  },
  
  log: function(message,label,header){
    if(!this.debug_window) return;

    const basics = this.lib.basics;
    var template = ''; 
    
    if(header){
      template = this.template('debugHeader',message);
    }else{
      template = this.template('debugMessage',label,basics.inspect(message));
    }
    
    this.debug_window.append(template);
  },
  
  /*******
   * GUI Section
   *******/
  
  gui_extending_logo : function(){
    var status = this.player_panel.find('tr:eq(1) td:eq(2)');    
    
    // wrapping div around font
    status.find('font').wrap('<div style="float:left;"></div>');
    
    // adding info that db.moz.plugin was loaded
    status.append(this.template('logo'));
  },
  
  gui_extending_debug : function(){
    const dom = this.od.dom;
    const $   = this.od.jQuery;
    const prefs = this.lib.preferences;
    
    // if debug is disabled -> return
    if(!this.is_debug_enabled){return;}
    
    const visibilty = prefs.get('debug.visible');
    
    var debug = $('body');
    debug.append(this.template('debugWindow'));

    this.debug_window = $('#odMozPluginDebugWindow');
    if(!visibilty) this.debug_window.hide();

    // adding listener for toggling
    $('#odMozPluginDebugToggler').click(function(event){
      var element = $('#odMozPluginDebugWindow').toggle();
      prefs.set('debug.visible',element.is(':visible'));
    });
  },

  gui_extending_configurator_links: function(){
    const $   = this.od.jQuery;

    $('#dbMozPluginLogo').prepend(this.template('configuratorLinks'));
  }
});