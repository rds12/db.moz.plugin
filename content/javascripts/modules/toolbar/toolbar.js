//= basic
//= location

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'toolbar',
  module_author:      'rds12',
  module_version:     '2010-04-17',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,

  initialize: function(){
    const basic = this.modules.basic;
    const location = this.modules.location;

    if(location == undefined) throw 'location not avaible';
    if(!basic.is_logged_in) return;

    // call '<main>_<sub>'
    this.call(location.main + '_' + location.sub);
  },

  od_player_overview: function(){
    this.gui_extending_database_player_search();
  },

  od_alliance_overview: function(){
    this.gui_extending_database_alliance_search();
  },

  od_system_main: function(){
    this.gui_extending_database_system_search();
  },

  od_planet_orbit: function(){
    this.gui_extending_database_orbit_search();
  },

  gui_extending_database_player_search: function(){
    if(this.modules.basic.is_debug_enabled) {
      this.modules.basic.log('modules.toolbar',null,true);
    }

    const prefs = this.lib.preferences,
          $ = this.od.jQuery;

    if(prefs.get('preferences.player.searchInDatabase') !== true)
      return;

    var header = $('#maincontent table table tr:first td'),
        player_id = this.modules.location.options.player_id,
        url = prefs.get('preferences.configset.tbExtToolUserUri');

    if(player_id) {
      url = this.modules.fowapi.replace_placeholders(url,player_id);
      header.append(this.template('searchInDatabase',url));
      header.wrapInner(this.template('relativize'));
    }

    header = null;
    player_id = null;
    url = null;
  },

  gui_extending_database_alliance_search: function(){
    const prefs = this.lib.preferences,
          $ = this.od.jQuery;

    if(prefs.get('preferences.alliance.searchInDatabase') !== true)
      return;

    var header = $('#maincontent .view');
        alliance_id = this.modules.location.options.alliance_id,
        url = prefs.get('preferences.configset.tbExtToolAllyUri');

    if(alliance_id) {
      url = this.modules.fowapi.replace_placeholders(url,alliance_id);
      header.append(this.template('searchInDatabase',url));
      header.wrapInner(this.template('relativize'));
    }

    header = null;
    alliance_id = null;
    url = null;
  },

  gui_extending_database_system_search: function(){
    if(this.modules.basic.is_debug_enabled) {
      this.modules.basic.log('modules.toolbar',null,true);
    }

    const prefs = this.lib.preferences,
          $ = this.od.jQuery;

    if(prefs.get('preferences.system.searchInDatabase') !== true)
      return;

    var header = this.modules.system.get_overview_bar(),
        system_id = this.modules.location.options.system_id,
        url = prefs.get('preferences.configset.tbExtToolSysUri');

    if(system_id) {
      url = this.modules.fowapi.replace_placeholders(url,system_id);
      header.append(this.template('searchInDatabaseShort',url));
    }

    header = null;
    system_id = null;
    url = null;
  },

  gui_extending_database_orbit_search: function(){
    if(this.modules.basic.is_debug_enabled) {
      this.modules.basic.log('modules.toolbar',null,true);
    }

    const prefs = this.lib.preferences,
          $ = this.od.jQuery;

    if(prefs.get('preferences.orbit.searchInDatabase') !== true)
      return;

    var header = this.modules.orbit.get_overview_bar(),
        planet_id = this.modules.location.options.planet_id,
        url = prefs.get('preferences.configset.tbExtToolPlanUri');

    if(planet_id) {
      url = this.modules.fowapi.replace_placeholders(url,planet_id);
      header.append(this.template('searchInDatabaseShort',url));
    }

    header = null;
    planet_id = null;
    url = null;
  }
});