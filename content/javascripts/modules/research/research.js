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
    if(this.lib.preferences.get('preferences.research.totalPoints') !== true)
      return;

    // player is not premium? do nothing
    if(!this.modules.basic.is_premium) return;

    const $ = this.od.jQuery;

    // get reference point
    var research_box = $('#returntim').parents('p:first');

    var br = research_box.find('br:last');
    if(!br.length) return;

    // get text from br sibling
    var text = $(br.get(0).nextSibling);
    br = null;

    // text has format: 'some_text: 123.435.565 + 123424'
    var points = text.text().split(':')

    // length must be 2, otherwise something failed 
    if(points.length != 2) return;

    // split '123.435.565 + 123424' into ['123.435.565','123424']
    var addends = points[1].split('+');

    // length must be 2, otherwise something failed
    if(addends.length != 2) return;

    // type cast strings to integers and sum them
    var format = this.lib.basics.format_number,
        x = parseInt(addends[0].replace(/[^\d]/g,'')),
        y = parseInt(addends[1].replace(/[^\d]/g,'')),
        sum = x + y;
    addends = null;

    // delete old entry
    text.remove();

    // append new sum
    var text = this.template('totalResearchPoints',points[0],format(x),format(y),format(sum));
    research_box.append(text);
    
    research_box = null;    
    points = null;
    format = null;
    x = null;
    y = null;
    sum = null;
    text = null;
  }
});