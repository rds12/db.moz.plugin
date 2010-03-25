//= basic
//= location

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'orbit',
  module_author:      'rds12',
  module_version:     '2010-03-17',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,
  
  initialize: function(){
    const basic = this.modules.basic;
    const location = this.modules.location;
    
    if(location == undefined) throw 'location not avaible';
    if(!basic.is_logged_in) return;
    
    // nothing to do with planet? -> exit
    if(!(location.main == 'planet' && location.sub == 'orbit')) return;
    
    this.gui_extending_shortcuts();
    this.gui_extending_ships_statistic();
  },
  
  get_ships: function(options){
    const $ = this.od.jQuery;
    const self = this;
    var ships = $('td[namsn]');

    // no options -> get all ships?
    if(!options) return ships;
    
    var get_range = function(ships){
      // check if range is avaible
      var range = options.range;

      if(!range) return ships;

      var start = range.start, end = range.end;

      if(!start && !end) return ships;

      return ships.filter(function( index ){
        // range = { start: 0, end: 1 } gets the first ship
        var a = index >= start, b = index < end;

        if(start && end) return a && b; 
        return start ? a : b;
      });
    }
    
    var filter = options['filter']; 
    
    // get all selected ships
    if(filter == 'selected'){
      var ships = ships.filter(function(i,e){
        return $(e).hasClass('tabletranslight');
      });
    }
    
    // get all unselected ships
    if(filter == 'unselected'){
      var ships = ships.filter(function(i,e){
        var e = $(e);
        return e.hasClass('opacity1') || e.hasClass('tabletrans');
      });
    }
    
    // if no valid settings are found, return all ships
    // or return matched ships
    return get_range(ships);
  },
  
  toggle_ship: function(shipid){
    //FIXME: use native function instead
    const dom = this.od.dom;
    const $ = this.od.jQuery;

    // toggle ship
    dom.clicks(shipid);

    // clicks won't remove ships background
    if($('td#'+shipid).is('.tabletrans'))
      $('td#'+shipid).attr({'class':'opacity1','bgcolor':''});
  },
  
  /**
   * type:
   *   none   - unselect all ships
   *   all    - select all ships
   *   invert - invert selection of all ships
   *   toggle - select all ships or unselect all ships
   *   first  - select only the first ship
   */
  select_ships: function(type,options){
    const self = this;
    const $ = this.od.jQuery;
    var type = type.toLowerCase();

    // unselect all ships
    if(type == 'none'){
      var ships = this.get_ships({filter:'selected'});
      ships.each(function(i,e){
        var shipid = $(e).attr('id');
        self.toggle_ship(shipid);
      });
      return;
    }

    // invert all ships
    if(type == 'invert'){
      var ships = this.get_ships();
      ships.each(function(i,e){
        var shipid = $(e).attr('id');
        self.toggle_ship(shipid);
      });
      return;
    }

    // un/select all ships
    if(type == 'toggle'){
      var selected = this.is_ship_selected();
      // if something is selected -> unselect it
      selected ? this.select_ships('none') : this.select_ships('all');
      return;
    }

    // get first ship
    var range = undefined;
    if(type == 'first'){
      range = { start: 0, end: 1 }
    }

    var ships = this.get_ships({'range': range});

    // toggle all matched ships
    ships.each(function(i,e){
      var shipid = $(e).attr('id');
      self.toggle_ship(shipid);
    });
  },
  
  is_ship_selected: function(){
    var selected = this.get_ships({filter:'selected'}).length;
    return !!selected;
  },
  
  get_statistics: function(){
    const $ = this.od.jQuery;
    
    var ships  = this.get_ships();
    var stats = {
      length: ships.length,
      ships:  ships,
      imgs:{}
    };
    ships.each(function(i,e){
      var img = $(e).find('img:eq(0)').attr('src');
      
      if(!stats.imgs[img]) stats.imgs[img]=0;
      stats.imgs[img]++;
    });
    
    return stats;
  },
  
  cmd_send_planet: function(){
    const dom = this.od.dom;

    var selected = this.is_ship_selected();
    if(!selected) this.select_ships('all');

    dom.sender();
  },

  cmd_camouflage_fleet: function(){
    const dom = this.od.dom;

    var selected = this.is_ship_selected();
    if(!selected) this.select_ships('all');

    dom.tarner();
  },

  cmd_attack_ship: function(){
    // FIXME: check if enemie ship exists
    const dom = this.od.dom;

    var selected = this.is_ship_selected();
    if(!selected) this.select_ships('first');

    dom.schoschip();
  },

  cmd_attack_planet: function(){ 
    const dom = this.od.dom;

    var selected = this.is_ship_selected();
    if(!selected) this.select_ships('first');

    dom.atackplan();
  },
  
  cmd_use_gate: function(){
    // FIXME: check if gate exists
    const dom = this.od.dom;

    var selected = this.is_ship_selected();
    if(!selected) this.select_ships('all');

    dom.jump();
  },
  
  cmd_load_materials: function(){
    // FIXME: select existing transporters
    const dom = this.od.dom;

    var selected = this.is_ship_selected();
    if(!selected) this.select_ships('all');

    dom.loader();
  },
  
  cmd_use_bioweapon: function(){
    // FIXME: select strongest bioweapon
    const dom = this.od.dom;

    dom.biolo();
  },
  
  cmd_use_emp: function(){
    // FIXME: select emp
    const dom = this.od.dom;

    dom.empfire();
  },
  
  cmd_scan_planet: function(){
    // FIXME: select strongest scanner, can you distinguish the power?
    const dom = this.od.dom;

    dom.scanit();
  },
  
  cmd_rename_ship: function(){
    // FIXME: if more than one ship was selected, do nothing!
    const dom = this.od.dom;

    dom.rename(); 
  },
  
  cmd_merge_into_fleet: function(){
    // FIXME: deselect all fleets
    const dom = this.od.dom;

    dom.fleeter();
  },
  
  gui_extending_shortcuts_handler: function(event){
    const self = this;
    var key = String.fromCharCode(event.which).toLowerCase();

    // checking if key is a alphabet-sign
    if(!/\w/.test(key)) return;

    var keys = {
      s: function(){ // ship camouflage
        self.cmd_camouflage_fleet();
      }, 
      w: function(){ // send ship
        self.cmd_send_planet();
      }, 
      e: function(){ // attack ship
        self.cmd_attack_ship();
      },
      q: function(){ // attack planet
        self.cmd_attack_planet();
      },
      t: function(){ // select all or unselect all
        self.select_ships('toggle');
      },
      a: function(){ // invert all ship selections
        self.select_ships('invert');
      },
      r: function(){ // un/load materials
        self.cmd_load_materials();
      },
      d: function(){  // use gate
        self.cmd_use_gate();
      },
      y: function(){ // bioweapon
        self.cmd_use_bioweapon();
      },
      x: function(){ // fire emp
        self.cmd_use_emp();
      },
      c: function(){ // scan planet
        self.cmd_scan_planet();
      },
      v: function(){ // rename ship
        self.cmd_rename_ship();
      },
      f: function(){ // merge into a fleet
        self.cmd_merge_into_fleet();
      }
    }
    var exists = key in keys;

    // doesn't exists -> wrong key
    if(!exists) return;
    keys[key]();
  },
  
  gui_extending_shortcuts: function(){
    const $ = this.od.jQuery;
    const win = this.od.doc;
    const self = this;

    // only if it is our own orbit.
    if(this.modules.location.options['type'] != 'own') return;

    // yeah we have ids for all fleet commands :D
    $('#200201').prepend('[w] '); // send ship
    $('#200208').prepend('[e] '); // attack ship
    $('#200203').prepend('[r] '); // un/load materials
    $('#200210').prepend('[d] '); // use gate
    $('#200207').prepend('[q] '); // attack planet
    $('#200212').prepend('[v] '); // rename ship
    $('#200217').prepend('[f] '); // merge into a fleet
    $('#200301').prepend('[s] '); // ship camoufalge
    $('#200215').prepend('[y] '); // use bioweapon
    $('#200219').prepend('[x] '); // fire emp
    $('#200202').prepend('[c] '); // scan planet

    $('a[href$=aller(1);]').prepend('[t] ').
    attr('href','javascript:').click(function(){
      // change behavior to a real un/select event
      self.select_ships('toggle');
    }).parent().append($(this.template('selectorInvert'))
    .click(function(){
      // add invert all event 
      self.select_ships('invert');
    }));

    // resize command panel and remove fixed width so that
    // the extended text won't screw up the layout
    $('#200201').parents('table:first').css('width','700px')
    .find('tr:first td').each(function(i,e){
      $(e).removeAttr('width');
    });

    // registering onkey event!
    $(win).keydown(function(event){
      var active = $(self.od.doc.activeElement);
      if(active.is(':input')) return;

      self.gui_extending_shortcuts_handler(event);
    });
  },
  
  gui_extending_ships_statistic: function(){
    const $ = this.od.jQuery;
    
    var stats = this.get_statistics();
    if(!stats.length) return;
    
    var win = $('td[namsn]:first').parents('div:first'),
        ele = $(this.template('statisticsWindow')),
        max = stats.length;

    win.parents(':first').prepend(ele);

    for(var key in stats.imgs){
      var count = stats.imgs[key];
      ele.append(this.template('statisticsEntry',key,count,count*100.0/max));
    }
    ele.append(this.template('statisticsLastEntry'));
  }
});