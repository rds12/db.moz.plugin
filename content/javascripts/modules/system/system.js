//= basic
//= location

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'system',
  module_author:      'rds12',
  module_version:     '2010-04-17',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,

  // if fow is disabled
  viewable: false,
  identified_orbit: false,

  initialize: function(){
    const basic = this.modules.basic;
    const location = this.modules.location;
    
    if(location == undefined) throw 'location not avaible';
    if(!basic.is_logged_in) return;
    
    // nothing to do with system? -> exit
    if(!(location.main == 'system' && location.sub == 'main')) return;

    this.retrieve_is_system_viewable();
    this.gui_extending_orbit_clickable();

    basic.log('modules.system',null,true);
    basic.log(this.viewable,'viewable');
  },

  get_overview_bar: function(){
    const $ = this.od.jQuery;

    var header = $('#dbMozPluginSystemOverviewBar');
    if(header.length) return header;

    header = $('#sysid').parents('td:first');

    // input not found? maybe planet is not existing anymore
    if(!header.length)header = $('#message .messageBox_Middle');

    header.wrapInner(this.template('overviewBar'));

    return $('#dbMozPluginSystemOverviewBar');
  },

  retrieve_is_system_viewable: function(){
    const self = this;
    const $ = this.od.jQuery;

    var planets = $('#maincontent img[src$=grafik/leer.gif]');
    planets.each(function(i,e){
      var e = $(e);
      if(!/^\d+$/.test(e.attr('id'))) return;
      var hover = e.parents('a:first').attr('onmouseover');
      self.viewable = !/setter\('\s*','\s*','\s*','\s*','\s*'\)/.test(hover);
      return false;
    });
  },

  gui_extending_orbit_clickable: function(force){
    const prefs = this.lib.preferences;

    if(!force && prefs.get('preferences.system.clickableOrbit') !== true)
      return;

    // orbit already identified?
    // a little hack for fowapi
    if(this.identified_orbit === true)
      return;

    const self = this;
    const $ = this.od.jQuery;

    var planets = $('#maincontent img[src$=grafik/leer.gif]');
    planets.each(function(i,e){
      var e = $(e);
      if(!/^\d+$/.test(e.attr('id'))) return;
      
      var hover = e.parents('a:first'),
          regex = /dlt\('.+?','(.+?):'\);setter/,
          pid = e.attr('id'),
          pname = (hover.attr('onmouseover').match(regex) || ['','undefined'])[1], 
          orbit = e.parents('tr:first').siblings().find('td');

      // if orbit is none existing, append it
      if(!orbit.find('a:first').length)
        orbit.append(self.template('clickableOrbit',pname,pid));

      orbit.find('a:first').attr('id','orbit-'+pid);
    });
    this.identified_orbit = true;
  }
});