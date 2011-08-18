//= library

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'basic',
  module_author:      'rds12',
  module_version:     '2011-02-17',
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
    // Debug enabled?
    this.is_debug_enabled = !!this.lib.preferences.get('debug.enable');
    // get extension version!
    this.extension_version = this.lib.basics.get_version();

    this.retrieve_od_whereabouts();

    if(!this.is_od || !this.is_logged_in) return;

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

    this.player_panel = undefined;

    // logging variables
    
    if(this.is_debug_enabled) {
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
    }
  },

  format_time: function(time){
    var matches = /(\d+):(\d+):(\d+):(\d+)/.exec(time);
    if(!matches) return false;
    
    var ints = ['%02d:%02d:%02d:%02d'];
    for(var i=1;i<5;++i) 
      ints.push(parseInt(matches[i]));
    
    const basics = db.moz.plugin.basics;
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

    var value = match[0] + match[1] + match[2] + match[3];
    return value;
  },

  retrieve_od_whereabouts:function(){
    const dom = this.od.dom;

    this.player_panel = undefined;
    try{
      // required, in cases there the url is correct
      // but od wasn't loaded
      // e.g: offline modus or you don't have a internet connection
      if(
        dom.Clock == undefined
      )throw 'db.moz.plugin: not in od';

      this.is_od = true;
      const $   = this.od.jQuery;
      // references to the player_panel
      this.player_panel = $('.statusbar > table');
      if( this.player_panel.length ){
        this.is_logged_in = true;
      } else {
          var useZip = $('input[name=useZIP]');
          if( useZip.length ) {
              if(this.lib.preferences.get('preferences.login.useZip') === true)
                  useZip.attr('checked',true);
          }
          useZip = null;
      }

    }catch(e){
      this.player_panel = undefined;
//      if(this.is_debug_enabled)
//          this.lib.console.error('modules.basic.retrieve_od_whereabouts: not in od',e);
    }
  },

  is_login_page: function() {
  },

  retrieve_common_informations: function(){
    const $   = this.od.jQuery;

    // which round and world?
    this.world    = (/Debug:\s+.*?W:(\w+)/.exec($('head').html()) || ['','unknown'])[1];
    this.host     = this.od.doc.location.host;
    this.based_on = this.round_relation[this.world] || 'unknown';

    // retrieving player status informations
    this.is_premium = !!this.player_panel.find('.status .premium').length;
    this.is_slim    = !!this.player_panel.find('.status .slim').length;
    this.is_sitter  = !!this.player_panel.find('.status .logout').length;

    var player       = this.player_panel.find('.user');
    this.player_id   = /(\d+)/.exec(player.attr('href'))[1];
    this.player_name = player.html();
    player = null;

    var alliance       = this.player_panel.find('.alliance');
    this.alliance_id   = /(\d+)/.exec(alliance.attr('href'))[1];
    this.alliance_name = alliance.html();
    alliance = null;

    var race = this.player_panel.find('.race');
    this.race_id = /func=(\d+)/.exec(race.attr('href'))[1];
    race = null;
  },

  retrieve_page_status: function(){ 
    const $   = this.od.jQuery;

    // checking if the form with the name Interruptform
    // is existing, than it is the ad page
    try{
      this.is_ad_page = !!$('form[name=Interruptform]').length;
    }catch(e){
      this.is_ad_page = false;
    }

    // reload page if ad apears. only for test purpose
    var value = this.lib.preferences.get('reload_page_if_ad');

    if(this.is_ad_page && value)
      this.reload_page();

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

    var template = null;
    if(header){
      var template = this.template('debugHeader',message);
    }else{
      var template = this.template('debugMessage',label,basics.inspect(message));
    }
    this.debug_window.append(template);
    template = null;
  },

  /*******
   * GUI Section
   *******/

  gui_extending_logo : function(){
    var status = this.player_panel.find('tr:eq(1) td:eq(1)');
    status.find('font').wrap('<div style="float:left;"></div>');
    status.append(this.template('logo',this.extension_version));
    status = null;
  },

  gui_extending_debug : function(){
    // if debug is disabled -> return
    if(!this.is_debug_enabled) return;

    const $   = this.od.jQuery;
    const prefs = this.lib.preferences;
    const visibilty = prefs.get('debug.visible');

    $('body').append(this.template('debugWindow'));

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

    const $ = this.od.jQuery;
    $('#dbMozPluginLogo').prepend(this.template('configuratorLinks'));
  }
});