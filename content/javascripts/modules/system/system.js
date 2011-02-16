//= basic
//= location

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'system',
  module_author:      'rds12',
  module_version:     '2011-02-16',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,

  // if fow is disabled
  viewable: false,
  planets: [],
  regex_pname: /dlt\('.+?','(.+?):'\);setter/,

  initialize: function(){
    const basic = this.modules.basic;
    const location = this.modules.location;
    
    if(location == undefined) throw 'location not avaible';
    if(!basic.is_logged_in) return;
    
    // nothing to do with system? -> exit
    if(!(location.main == 'system' && location.sub == 'main')) return;

    this.retrieve_planets();
    this.retrieve_is_system_viewable();

    basic.log('modules.system',null,true);
    basic.log(this.viewable,'viewable');
    for(var i = 0; i < this.planets.length; ++i)
      basic.log(this.planets[i],'planets['+i+']');
  },

  get_overview_bar: function(){
    const $ = this.od.jQuery;

    var header = $('#dbMozPluginSystemOverviewBar');
    if(header.length) return header;

    header = $('#sysid').parents('td:first');

    // input not found? maybe planet is not existing anymore
    if(!header.length)header = $('#message .messageBox_Middle');

    header.wrapInner(this.template('overviewBar'));
    header = null;
    return $('#dbMozPluginSystemOverviewBar');
  },

  retrieve_is_system_viewable: function(){
    const $ = this.od.jQuery;

    if(!this.planets.length) return;

    var planet = $('#' + this.planets[0].planet_id);
    var hover = planet.parents('a:first').attr('onMouseover');
    this.viewable = !/setter\('\s*','\s*','\s*','\s*','\s*'\)/.test(hover);
    planet = null;
    hover = null;
  },

  retrieve_planets: function(){
    const self = this;
    const $ = this.od.jQuery;

    // system table
    var system = $('#maincontent table[width="800"]:last');
    system.attr('id','system-'+this.modules.location.options.system_id);

    system.find('table td a img').each(function(i,e){
      var e = $(e), pid = e.attr('id');
      if(!/^\d+$/.test(pid)) return;

      var text = e.parents('a:first').attr('id','planet-'+pid)
                  .attr('onMouseover');
      var pname = (text.match(self.regex_pname) || ['','undefined'])[1];

      self.planets.push({
        planet_id: pid,
        planet_name: pname
      });
      e = null;
      pid = null;
      text = null;
      pname = null;
    });
    system = null;
  }
  
/* OLD 
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

    $(this.planets).each(function(i,planet){
      var e = $('#planet-'+planet.planet_id), 
          orbit = e.parents('tr:first').siblings().find('td');

      // if orbit is none existing, append it
      if(!orbit.find('a:first').length)
        orbit.append(self.template(
          'clickableOrbit', planet.planet_name, planet.planet_id
        ));

      orbit.find('a:first').attr('id','orbit-'+planet.planet_id);
    });
    this.identified_orbit = true;
  }
*/
});