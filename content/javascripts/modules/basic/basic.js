//= library

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'basic',
  module_author:      'rds12',
  module_version:     '2011-02-09',
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

  extension_version: 'unknown',

  round_relation:   {
    'en1':     'round5',
    'de7':     'round7',
    'int8':    'round8'
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

    // get extension version!
    this.extension_version = this.lib.basics.get_version();

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

    if(!this.is_od) return;

    // loading guis
    this.gui_extending_logo();
    this.gui_extending_debug();
    this.gui_extending_configurator_links();

    // logging variables

    this.log('module.basic',null,true);
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
    matches = null;
    return basics.sprintf.apply(this,ints);
  },

  parse_time: function(time){
    var match = /(\d+):(\d+):(\d+):(\d+)/.exec(time);

    if(!match) return Number.NaN;

    //remove first element
    match.shift();

    var factors = [86400, 3600, 60, 1];
    match = this.od.jQuery(match).map(function(i,e){
      return parseInt(e) * factors[i];
    });
    factors = null;

    var value = match[0] + match[1] + match[2] + match[3];
    match = null;
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
        dom.Stunde  == undefined
      )throw 'db.moz.plugin: not in od';

      this.is_od = true;

      // references to the player_panel 
      this.player_panel = $('body table table[width=410]');

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
    debug = null;

    // retrieving player informations
    var status = this.player_panel.find('tr:eq(2) td:eq(1) font');
    var status_text = status.html();
    status = null;

    // rds12@2011-02-10 NOTE:
    // the substring 'premium' also exists in the wiki link, therefore
    // we test a bit more detailed
    //this.is_premium = /Premium/i.exec(status_text) != undefined;
    this.is_premium = />Premium/i.exec(status_text) != undefined;
    this.is_slim    = !this.is_premium;
    this.is_sitter  = /op=sitter/.exec(status_text) != undefined;
    status_text = null;

    var player       = this.player_panel.find('a[href*=usershow]');
    this.player_id   = /(\d+)/.exec(player.attr('href'))[1];
    this.player_name = player.html();
    player = null;

    var alliance       = this.player_panel.find('a[href*=alliances]');
    this.alliance_id   = /(\d+)/.exec(alliance.attr('href'))[1];
    this.alliance_name = alliance.html();
    alliance = null;

    if(this.based_on == 'round5'){
      var race = this.player_panel.find('a[href*="anznummer"]');
      if(race.length)
      this.race_id = /anznummer=(\d+)/.exec(race.attr('href'))[1];
    }else{// this works for >=round7
      var race = this.player_panel.find('a[onclick*="op=rassen"]');
      this.race_id = /func=(\d+)/.exec(race.attr('onclick'))[1];
    }
    race = null;
  },

  retrieve_page_status: function(){ 
    const dom = this.od.dom;
    const $   = this.od.jQuery;

    // checking if the form with the name Interruptform
    // is existing, than it is the ad page
    try{
      var form = $('form[name=Interruptform]');
      this.is_ad_page = !!form.length;
      form = null;
    }catch(e){}

    // reload page if ad apears. only for test purpose
    var value = this.lib.preferences.get('reload_page_if_ad');
    if(!this.is_ad_page)return;

    if(value) this.reload_page();
    value = null;
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
    template = null;
  },

  /*******
   * GUI Section
   *******/

  gui_extending_logo : function(){
    var status = this.player_panel.find('tr:eq(1) td:eq(1)');

    // wrapping div around font
    status.find('font').wrap('<div style="float:left;"></div>');

    // adding info that db.moz.plugin was loaded
    status.append(this.template('logo',this.extension_version));
    status = null;
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
    debug = null;

    this.debug_window = $('#odMozPluginDebugWindow');
    if(!visibilty) this.debug_window.hide();

    // adding listener for toggling
    $('#odMozPluginDebugToggler').click(function(event){
      var element = $('#odMozPluginDebugWindow').toggle();
      prefs.set('debug.visible',element.is(':visible'));
      element = null;
    });
  },

  gui_extending_configurator_links: function(){
    if(this.lib.preferences.get('preferences.overall.configurators') !== true)
      return;

    const $   = this.od.jQuery;

    $('#dbMozPluginLogo').prepend(this.template('configuratorLinks'));
  }
});