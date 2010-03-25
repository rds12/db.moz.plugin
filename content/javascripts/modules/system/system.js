//= basic
//= location

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'system',
  module_author:      'rds12',
  module_version:     '2010-03-09',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,

  // if fow is disabled
  viewable: false,

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
  
  gui_extending_orbit_clickable: function(){
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
  }
});