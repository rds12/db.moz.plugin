//= basic
//= location

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'planet',
  module_author:      'rds12',
  module_version:     '2010-03-03',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,
  
  initialize: function(){
    const basic = this.modules.basic;
    const location = this.modules.location;
    
    if(location == undefined) throw 'location not avaible';
    if(!basic.is_logged_in) return;
    
    // nothing to do with planet? -> exit
    if(location.main != 'planet') return;
    
    this.call(location.sub);
  },
  
  od_overview: function(){
    this.gui_extending_agressor_statistics();
  },
  
  gui_extending_agressor_statistics: function(){
    const $ = this.od.jQuery;
    
    var /*div = $('#9999992'),*/ trs = $('#planlist tr[id]');
    if(/*!div.length ||*/ !trs.length) return;

    var regex = {
      stats: { inva: 0, reso: 0, occupiers: 0},
      is_reso: function(text){return /reso/i.test(text)},
      is_inva: function(text){return /inva/i.test(text)},
      is_occupant: function(text){return /bes/i.test(text)},
      add: function(text){
        if(this.is_inva(text)) this.stats.inva++;
        if(this.is_reso(text)) this.stats.reso++;
        if(this.is_occupant(text)) this.stats.occupiers++;
      }
    }
    
    trs.each(function(i,e){
      regex.add($(e).children('td:eq(5)').html());
    });
    
    /*div.parents('td:eq(0)').prepend*/
    $('body').append(this.template(
      'invacount',regex.stats.inva,regex.stats.reso,regex.stats.occupiers
    ));
  }
});