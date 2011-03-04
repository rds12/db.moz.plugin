//= basic
//= location

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'research',
  module_author:      'rds12',
  module_version:     '2010-05-01',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,
  
  initialize: function(){
    const basic = this.modules.basic;
    const location = this.modules.location;

    if(location == undefined) throw 'location not avaible';
    if(!basic.is_logged_in) return;

    // nothing to do with research? -> exit
    if(location.main != 'research') return;

    this.gui_extending_research();
  },

  gui_extending_research: function(){
    if(this.lib.preferences.get('preferences.research.totalPoints') !== true) return;

    // player is not premium? do nothing
    if(!this.modules.basic.is_premium) return;

    const $ = this.od.jQuery;

    // get reference point
    var research_box = $('#returntim').parent('td');
    var span = research_box.find('span');
    if(!span.length) return;

    var addends = span.attr('title').split('+');
    // length must be 2, otherwise something failed
    if(addends.length != 2) return;

    // type cast strings to integers and sum them
    var format = this.lib.basics.format_number,
        x = parseInt(addends[0].replace(/[^\d]/g,'')),
        y = parseInt(addends[1].replace(/[^\d]/g,'')),
        sum = x + y;
    // append new sum
    span.html(this.template('totalResearchPoints',format(x),format(y),format(sum)));
    
    research_box = null;
    span = null;
    addends = null;
    format = null;
    x = null;
    y = null;
    sum = null;
  }
});