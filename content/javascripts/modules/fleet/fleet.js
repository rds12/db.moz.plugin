//= basic
//= location

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'fleet',
  module_author:      'rds12',
  module_version:     '2010-05-01',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,
  
  // fleet properties
  is_flying: false,
  
  initialize: function(){
    const basic = this.modules.basic;
    const location = this.modules.location;
    
    if(location == undefined) throw 'location not avaible';
    if(!basic.is_logged_in) return;
    
    // nothing to do with fleet? -> exit
    if(location.main != 'fleet') return;
    
    this.call(location.sub);
    
    basic.log('module.fleet',null,true);
    basic.log(this.is_flying ,'is_flying');
    //FIXME: retrieve flying state without #gui_dispatch_menu_extending_flytimes 
    //> could be disabled!
  },
  
  is_fleet_overview:function(){
    const l = this.modules.location;
    return l.main == 'fleet' && l.sub == 'overview'; 
  },
  
  select_same: function(fleet_id,event){
    if(!this.is_fleet_overview()) return false;
    const $ = this.od.jQuery;
    const self = this;
    
    this.select_reset();
    
    var element = $('input[type=checkbox][value="'+fleet_id+'"]');
    
    // retrieving place and time
    var place = null, time = null, counter = 0;
    place = element.parents('tr:eq(0)').find('td:eq(2)').html();
    time  = element.parents('tr:eq(0)').find('td:eq(4)').html();
    
    // now select all checkboxes which have this location
    var parent_form = element.parents('form:eq(0)');
    
    parent_form.find('tr:visible').each(function(i,e){
      var e = $(e);
      var box = e.find('input[type=checkbox]');
      if(!box.length) return true;
      
      var place2 = e.find('td:eq(2)').html();
      var  time2 = e.find('td:eq(4)').html();
      if(!(place == place2 && time == time2)) return true;
      box.attr('checked',true);
      counter++;
    });
    
    // show send window, if event was set
    if(!event) return;

    // set new input button with the number of selected fleets
    var offset = element.offset(), 
        send = $('#dbMozPluginFleetQuickSend').empty()
               .append(self.template('sendWindowInput',counter));

    var button = send.css({
      // align left from the checkbox and on the same height 
      top: offset.top, left: (offset.left - send.width() - element.width()) 
    }).show().find(':button');
    
    // Bug#6: 
    // $('form:first').submit();
    // has no effect, im not sure why, but it won't work,
    // therefore we have to inject the onclick event

    var name = parent_form.attr('name');
    button.attr('onclick','document.'+name+'.submit();')
  },
  
  select_reset: function(){
    if(!this.is_fleet_overview()) return false;
    const $ = this.od.jQuery;
    
    $('#dbMozPluginFleetQuickSend').hide();
    
    $('input[type=checkbox]').each(function(i,e){
      $(e).attr('checked',false);
    });
  },

  gui_overview_extending_buttons: function(){
    if(this.lib.preferences.get('preferences.fleet.unselectButton') !== true)
      return;

    const $    = this.od.jQuery;
    const self = this;

    var form = $('form[name="AllyFlform"]');
    if(!form.length) return;

    form.find('tr.tablecolor input:submit').each(function(i,e){
      var s = $(self.template('unselectButton'));
      s.click(function(){
        self.select_reset();
      });

      $(e).parents('td:eq(0)').prepend(s);
    });
  },

  gui_overview_extending_checkboxes: function(){
    if(this.lib.preferences.get('preferences.fleet.dblClickSendButton') !== true)
      return;

    const $ = this.od.jQuery;
    var self = this;
    // create window for the dynamic send button
    $('body').append(self.template('sendWindow'));

    // event select same!
    $('input:checkbox').each(function(){
      $(this).dblclick(function(e){
        self.select_same($(this).val(),e);
      });
    });
  },
  
  gui_dispatch_menu_extending_flytimes: function(){
    if(this.lib.preferences.get('preferences.fleet.flytimes') !== true)
      return;

    const dom = this.od.dom;
    const $   = this.od.jQuery;
    
    function get_times(fncode){
      var times = /flytime[ab]?\s+=\s+new\s+MakeArray\((.+?)\);/.exec(fncode);
      if(!times) return undefined;
      times = times[1].split(',');
      
      for(var key in times){
        var temp = /<b>(.*?)<\/b>/.exec(times[key]);
        times[key] = temp == undefined ? '' : temp[1] ;
      }
      return times;
    }
    
    var self = this;
    
    function write_in_select(select_event,times){
      if(self.is_flying) return;
      
      // select_event = switch_page([ab]?)
      var select = $('form select[onchange="'+select_event+'();"]');
      if(!select.length) return;
      
      var fncode = dom[select_event].toString(); 
      var times  = get_times(fncode);
      
      if(!times){
        self.is_flying = true;
        return;
      }
      
      // [Index,MinMaxValue]
      var pos = {min: [[],Number.MAX_VALUE],max: [[],0]}
      
      // * first option will be ignored, only a info text
      // * adding time to the options of select
      // * hide all options which aren't in the same galaxie as
      //   the ship
      select.find('option:gt(0)').each(function(index,e){
        //shift index, due to gt(0)
        index++;

        var format = self.modules.basic.format_time(times[index]);

        // hide option, if ship is not in galaxy, but let the
        // options index intact, so that omega-day can use
        // his static array construction
        if(!format){
          $(e).hide();
          return;
        }

        var time = self.modules.basic.parse_time(times[index]);

        if(time == 0){
          $(e).attr('class','dbMozPluginPlanetActual');
        }

        if(time > 0){
          // determine nearest planet
          if(time < pos.min[1]){
            pos.min = [[index],time];
          }else if(time == pos.min[1]){
            // if time is matching the current nearest
            // add a index to the stack
            pos.min[0].push(index);
          }

          // determine farthest planet
          if(time > pos.max[1]){
            pos.max = [[index],time];
          }else if(time == pos.max[1]){
            // if time is matching the current farthest
            // add a index to the stack
            pos.max[0].push(index);
          }
        }

        // add time as attribute
        $(e).attr('time',time).html(
          format + '&nbsp;&nbsp;' + $(e).text()
        );
      });
      
      // set nearest planet
      $.each(pos.min[0],function(i,value){
        select.find('option:eq('+value+')')
              .attr('class','dbMozPluginPlanetNearest');
      });

      // set farthest planet
      $.each(pos.max[0],function(i,value){
        select.find('option:eq('+value+')')
              .attr('class','dbMozPluginPlanetFarthest');
      });
    }
    
    write_in_select('switch_page');
    write_in_select('switch_pagea');
    write_in_select('switch_pageb');
  },
  
  gui_dispatch_menu_extending_orbit_link: function(){
    if(this.lib.preferences.get('preferences.fleet.orbitLink') !== true)
      return;

    const $ = this.od.jQuery;

    var e = $('#maincontent td.messageBox_Middle:first td');
    var pid = this.modules.location.options['from_planet'];
    
    if(!pid || !e.length) return;
    
    e.wrapInner(this.template('goToOrbitDiv'));
    $('#dbMozPluginDispatchMenuSelections').append(
      this.template('goToOrbitLink',pid)
    );
  },

  gui_overview_extending_hide_merged_ships: function(){
    if(true !== this.lib.preferences.get('preferences.fleet.hideMergedShips'))
      return;

    const self = this,
          $ = this.od.jQuery;

    $('#div3 table tr:eq(1) td').append(self.template('hiddenShips'));

    var is_fleet_hidden = false,
        window = $('#dbMozPluginHiddenShips'),
        link = window.find('a').click(function(){
          toggle_merged_fleets();
        });

    var toggle_merged_fleets = function(){
      var number_of_hidings = 0;

      $('#div3 table table table:first tr').each(function(){
        // check if galaxy is set
        // if not, ship belongs to a fleet
        var tr = $(this),
            is_merged = !tr.find('td:eq(2)').text();

        // is ship merged in fleet?
        if(!is_merged) return;
  
        if(is_fleet_hidden) tr.show();
        else tr.hide();

        number_of_hidings++;
      });

      is_fleet_hidden = !is_fleet_hidden;

      var text = is_fleet_hidden ? 'showHiddenShips' : 'hideMergedShips';
      link.html(self.template(text,number_of_hidings));
    }

    toggle_merged_fleets();
  },

  gui_dispatch_menu_extending_focus_direct_input: function(){
    if(true !== this.lib.preferences.get('preferences.fleet.focusDirectInput'))
      return;

    const $ = this.od.jQuery;

    /* yet another case where a jQuery build in function won't 
     * do what it should do:
     *   $('selector').focus();
     */
    var input = $('input[name=direktid]').get(0);
    if(!input) return;

    input.focus();
  },

  od_overview: function(){
    this.gui_overview_extending_checkboxes();
    this.gui_overview_extending_buttons();
    this.gui_overview_extending_hide_merged_ships();
  },

  od_dispatch_menu: function(){
    this.gui_dispatch_menu_extending_focus_direct_input();
    this.gui_dispatch_menu_extending_orbit_link();
    this.gui_dispatch_menu_extending_flytimes();
  },

  od_dispatched: function(){
    //
  }
});