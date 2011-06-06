//= basic
//= location

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'orbit',
  module_author:      'rds12',
  module_version:     '2011-02-17',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,

  shortcuts:          {},
  commands:           {},
  
  initialize: function(){
    const basic = this.modules.basic;
    const location = this.modules.location;

    if(location == undefined) throw 'location not avaible';
    if(!basic.is_logged_in) return;

    // nothing to do with planet? -> exit
    if(!(location.main == 'planet' && location.sub == 'orbit')) return;

    if(basic.is_debug_enabled) {
        basic.log('modules.orbit',null,true);
    }    

    this.retrieve_shortcuts();
    this.gui_extending_shortcuts();
    this.gui_extending_ships_statistic();
  },

  retrieve_shortcuts: function(){
    const prefs = this.lib.preferences;

    var branch = prefs.get_branch('preferences.shortcuts.orbit.'),
        childs = branch.get_children();

    // load shortcut modifiers as keys and name as value
    for(var i = 0, len = childs.length; i < len; ++i){
      var name = childs[i],
          value = branch.get(name).toLowerCase();

      this.shortcuts[value] = name;
      this.commands[name] = value;
      name = null;
      value = null;
    }
    branch = null;
    childs = null;
  },

  get_overview_bar: function(){
    const $ = this.od.jQuery;

    var header = $('#dbMozPluginOrbitOverviewBar');
    if(header.length) return header;

    header = $('input[name=index]:text').parents('td:first');

    // input not found? maybe planet is not existing anymore
    if(!header.length)header = $('#message .messageBox_Middle');

    header.wrapInner(this.template('overviewBar'));

    return $('#dbMozPluginOrbitOverviewBar');
  },

  /**
   * // get all ships:
   *
   * var ships = get_ships();
   * 
   * // get the first ship or no ship:
   * 
   * var ship = get_ships({
   *   range: {start: 0, end: 1}
   * });
   * 
   * // get all unselected ships
   * 
   * var ship = get_ships({
   *   filter: 'unselected'
   * });
   * 
   * // get all selected ships
   * 
   * var ship = get_ships({
   *   filter: 'selected'
   * });
   * 
   * // get all unselected ships, where the index is greter than 3
   * 
   * var ship = get_ships({
   *   filter: 'unselected'
   *   range: {start: 4}
   * });
   * 
   * @return {jQuery} jQuery of td entries
   */
  get_ships: function(options){
    const $ = this.od.jQuery;
    const self = this;
    var ships = $('td[namsn]');

    // no options -> get all ships!
    if(!options) return ships;

    var start = false,
        end = false;

    var range_avaible = (function(){
      // check if range is avaible
      // if not return true
      if(!options.range) return false;

      start = options.range.start;
      end   = options.range.end;

      // if start and end position is invalid
      // return true
      if(!start && !end) return false;

      return true;
    })();

    var is_in_range = function(index){
      // if range is not set, every ship is in range
      if(!range_avaible) return true;

      var a = index >= start,
          b = index < end;

      // if start and end position is set
      // return ships within range
      if(start > 0 && end > 0){
        // if index is greater than start and
        // index is greater than end
        // return 'exceeded' to indicate that the range
        // was exceeded
        if(a && !b) return 'exceeded';
        return a && b;
      }

      if(start > 0)
        return a;

      a = null;

      // if end position exceeded return 'exceeded'
      return b ? true : 'exceeded';
    }

    var get_range = function(ships, callback){
      // no range and callback avaible, return ships untouched
      if(!range_avaible && !callback){
        return ships;
      }

      // default callback, collect all ships that matches
      // the range
      callback = callback || function(ship){return true;}

      var number_of_added_ships = 0;
      var exceeded = false;

      var select = function( index, ship ){
        // if range was exceeded, don't collect anymore
        if(exceeded) return false;

        var ship_added = callback($(ship)),
            in_range = is_in_range(number_of_added_ships);

        // abort immediately if range exceeded
        if(in_range == 'exceeded'){
          exceeded = true;
          return false;
        }

        // ship doesn't fit the callback selector? don't collect it
        if(!ship_added){
          return false;
        }
        ship_added = null;

        // increase the counter of the matched ships
        number_of_added_ships++;

        // not in range? don't collect this ship
        if(!in_range) return false;
        in_range = null;

        return true;
      }

      // instead of filtering the ships, we add
      // them to another stack to improve performance
      // by ranged selection
      var stack = [];

      ships.each(function(index,ship){
        var selected = select(index,ship);

        if(self.modules.basic.is_debug_enabled){
          // just some optical highlighting
          var background = selected ? 'green' : 'blue';
          $(ship).find('a').css('background-color',background);
          background = null;
        }

        // add ship to the new stack
        if(selected){
          stack.push(ship);
        }
        selected = null;

        // abort collection if exceeded!
        if(exceeded){
          return false;
        }
      });

      // convert stack into jQuery
      return $(stack);
    }
    
    var filter = options['filter'];
    // get all selected ships
    if(filter == 'selected'){
      return get_range(ships,function(ship){
        return ship.hasClass('tabletranslight');
      });
    }
    // get all unselected ships
    if(filter == 'unselected'){
      return get_range(ships,function(ship){
        return ship.hasClass('opacity1') ||
               ship.hasClass('tabletrans');
      });
    }
    filter = null;
    
    // if no valid settings are found, return all ships
    // or return matched ships
    return get_range(ships);
  },

  update_gui_and_stack: function(){
    // FIXME: use native function instead
    this.od.dom.set_action();
  },

  toggle_ship_selection: function(shipid){
    //FIXME: use native function instead
    // 2010-04-01@rds12: improved selection script by using 'clickfast',
    // but we have to use 'set_action' after all selections to
    // update the gui and the ship stack, so that fixme is still active

    const $ = this.od.jQuery;

    // toggle ship selection
    this.od.dom.clickfast(shipid);

    // clicks won't remove ships background
    if($('#'+shipid).is('.tabletrans'))
      $('#'+shipid).attr({'class':'opacity1','bgcolor':''});

    // 2010-04-01@rds12: changed 'td#shipid' to '#shipid'
    // to perform faster ship selection
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
        self.toggle_ship_selection(shipid);
      });
      ships = null;
      self.update_gui_and_stack();
      return;
    }
    // invert all ships
    if(type == 'invert'){
      var ships = this.get_ships();
      ships.each(function(i,e){
        var shipid = $(e).attr('id');
        self.toggle_ship_selection(shipid);
      });
      ships = null;
      self.update_gui_and_stack();
      return;
    }

    // un/select all ships
    if(type == 'toggle'){
      var selected = this.is_ship_selected();
      // if something is selected -> unselect it
      selected ? this.select_ships('none') : this.select_ships('all');
      selected = null;
      return;
    }

    // get first ship
    var range = undefined;
    if(type == 'first'){
      range = { start: 0, end: 1 };
    }

    var ships = this.get_ships({'range': range});
    range = null;

    // toggle all matched ships
    ships.each(function(i,e){
      self.toggle_ship_selection($(e).attr('id'));
    });
    ships = null;
    self.update_gui_and_stack();
  },
  
  is_ship_selected: function(){
    var selected = this.get_ships({
      filter:'selected', range: { start: 0, end: 1 }
    }).length;
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
    ships = null;
    
    return stats;
  },
  
  cmd_send_ships: function(){
    if(!this.is_ship_selected()) this.select_ships('all');
    this.od.dom.sender();
  },

  cmd_camouflage_ships: function(){
    if(!this.is_ship_selected()) this.select_ships('all');
    this.od.dom.tarner();
  },

  cmd_attack_ship: function(){
    // FIXME: check if enemie ship exists
    if(!this.is_ship_selected()) this.select_ships('first');
    this.od.dom.schoschip();
  },

  cmd_attack_planet: function(){ 
    if(!this.is_ship_selected()) this.select_ships('first');
    this.od.dom.atackplan();
  },
  
  cmd_use_gate: function(){
    // FIXME: check if gate exists
    if(!this.is_ship_selected()) this.select_ships('all');
    this.od.dom.jump();
  },
  
  cmd_un_load_materials: function(){
    // FIXME: select existing transporters
    if(!this.is_ship_selected()) this.select_ships('all');
    this.od.dom.loader();
  },
  
  cmd_use_bioweapon: function(){
    // FIXME: select strongest bioweapon
    this.od.dom.biolo();
  },
  
  cmd_use_emp: function(){
    // FIXME: select emp
    this.od.dom.empfire();
  },
  
  cmd_scan_planet: function(){
    // FIXME: select strongest scanner, can you distinguish the power?
    this.od.dom.scanit();
  },
  
  cmd_rename_ship: function(){
    // FIXME: if more than one ship was selected, do nothing!
    this.od.dom.rename(); 
  },
  
  cmd_merge_into_fleet: function(){
    // FIXME: deselect all fleets
    this.od.dom.fleeter();
  },

  cmd_uncamouflage: function(){
    // append query for uncamouflage
    this.od.dom.location.search += '&enttarnen=all'; 
  },

  cmd_un_select_ships: function(){
    this.select_ships('toggle');
  },

  cmd_invert_ships: function(){
    this.select_ships('invert');
  },

  gui_extending_shortcuts_handler: function(event){
    var key = String.fromCharCode(event.which).toLowerCase();

    // checking if key is a alphabet-sign
    if(!/\w/.test(key)) return;

    var keys = this.shortcuts,
        exists = key in keys;

    // doesn't exists -> wrong key
    if(!exists) return;
    exists = null;

    var keys = this.shortcuts;
    try{
      //cmd_<orbit-operation>
      this['cmd_'+ keys[key]]();
      key = null;
      keys = null;
    }catch(e){
      alert('failed to load: '+ keys[key]);
    }
  },
  
  gui_extending_shortcuts: function(){
    if(this.lib.preferences.get('preferences.orbit.shortcuts') !== true)
      return;

    const $ = this.od.jQuery;
    const doc = this.od.doc;
    const self = this;
    const basics = this.lib.basics;

    if(self.modules.basic.is_debug_enabled){
      //FIXME: remove me
      this.od.dom.get_ships = function(options){
        return self.get_ships(options).length;
      }
    }

    // only if it is our own orbit.
    if(this.modules.location.options['type'] != 'own') return;

    var allnone = $('a[href$=aller(1);],a[href$=allerF(1);]')
                  .attr('id','dbMozPluginAllNone');
    // yeah we have ids for all fleet commands :D
    // what happens if a command and ship id matches?
    var cmds = { 
      'un_load_materials': '#200203',
      'rename_ship': '#200212',
      'attack_planet': '#200207',
      'send_ships': '#200201',
      'attack_ship': '#200208',
      'scan_planet': '#200202',
      'use_bioweapon': '#200215',
      'camouflage_ships': '#200301',
      'merge_into_fleet': '#200217',
      'use_gate': '#200210',
      'use_emp': '#200219',
      'uncamouflage': function(prepend){
        // operation 'camouflage ships' has no ingame id

        // get td bioweapon and then go up a td
        $('#200215').parents('tr:first').find('td:first font')
                    .prepend(prepend);
      },
      'invert_ships': function(a,shortcut){
        // add shortcut and new text
        allnone.parent().append(
          $(self.template('selectorInvert',shortcut)).click(function(){
            // add invert all event 
            self.select_ships('invert');
          })
        );
      },
      'un_select_ships': function(shortcut){
        // add [shortcut] to all/none
        allnone.prepend(shortcut).
        attr('href','javascript:').click(function(){
          // change behavior to a real un/select event
          self.select_ships('toggle');
        });
      }
    }

    for(var key in this.commands){
      var name = this.commands[key];
      // command is a word?
      if(!name.match(/\w/i)) continue;

      var selector = cmds[key],
          prepend = '['+ name +'] ';
      
      if(basics.is_function(selector)){
        selector(prepend, name);
        name = null;
        continue;
      }
      $(selector).prepend(prepend);
      selector = null;
      prepend = null;
    }
    allnone = null;
    cmds = null;

    // resize command panel and remove fixed width so that
    // the extended text won't screw up the layout
    $('#200201').parents('table:first').css('width','700px')
    .find('tr:first td').each(function(i,e){
      $(e).removeAttr('width');
    });

    // registering onkey event!
    $(doc).keydown(function(event){
      // if an input element is active, do nothing
      if($(doc.activeElement).is(':input')) return;

      // if ctrl, alt, etc.. was pressed, do nothing
      if(self.lib.basics.event.keys(event).isControl) return;

      self.gui_extending_shortcuts_handler(event);
    });
  },
  
  gui_extending_ships_statistic: function(){
    if(this.lib.preferences.get('preferences.orbit.shipStatistics') !== true)
      return;

    const $ = this.od.jQuery;

    var stats = this.get_statistics();
    if(!stats.length) return;

    var ele = $(this.template('statisticsWindow')),
        max = stats.length;

    $('td[namsn]:first').parents('div:first').parents(':first').prepend(ele);

    for(var key in stats.imgs){
      var count = stats.imgs[key];
      ele.append(this.template('statisticsEntry',key,count,count*100.0/max));
    }
    ele.append(this.template('statisticsLastEntry'));
    stats = null;
    ele = null;
    max = null;
    count = null;
  }
});