//= library

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'location',
  module_author:      'rds12',
  module_version:     '2010-04-07',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,
  
  // location informations:
  
  query: {}, // original loaction query
  main: 'unknown', // main category
  sub:  'unknown', // sub  category
  options: { // options
    start: 0,
    end:   0
  },

  initialize: function(){
    const basics = this.lib.basics;
    const basic  = this.modules.basic;
    const $      = this.od.jQuery;

    if(basic == undefined) throw 'basic not avaible';
    if(!basic.is_logged_in) return;

    // bug#1:    
    // the following is not possible:
    // -> (new dom.String(dom.location.search)).parseQuery();
    // therefore we have to hack with this.evaluate

    var place  = basics.parseQuery(this.od.doc.location.search);
    this.query = basics.clone_all(place);

    //TODO: in sitterstate exclude pages where the user has no privileges 
    //TODO: after sitter logou: 404 error will be shown, 
    // set location to sitter logout

    if(basic.is_ad_page){
      this.main = 'commercial_break';
      this.sub  = '';
    }else if(this.is_start_page()){
      this.od_undefined();
    }else{
      // if place.op == planet than load function od_planet if defined
      this.call(this.query.op,this.query);
    }

    this.gui_extending_quickjump_highlighting();
    this.gui_extending_close_event();
    this.gui_extending_disable_quickjump_overflow();

    basic.log('module.location',null,true)
    basic.log(this.query.op  ,'op');
    basic.log(this.query     ,'query');
    basic.log(this.main      ,'main');
    basic.log(this.sub       ,'sub');
    basic.log(this.options   ,'options');
  },

  is_start_page: function(){
    // if vote button exists, it must be the startpage
    return !!this.od.jQuery('a[href^=http://www.galaxy-news.de/]').length;
  },

  gui_extending_quickjump_highlighting: function(){
    if(this.lib.preferences.get('preferences.overall.quickjump') !== true)
      return;

    const self = this,
          $ = this.od.jQuery;

    // if the planet order was changed, don't scroll to the first
    // planet
    var selected = false;
    var selectors = function(){
      selected = self.gui_extending_selected_planet_round5(selected) || selected;
      selected = self.gui_extending_selected_planet(selected) || selected;
      selected = self.gui_extending_selected_system(selected) || selected;
    }

    // quickjump will be loaded with xhr, therefore delay the gui extending
    // to be sure that the loading process is finished before this call.
    selectors();
    $('div.quickjump').bind('DOMNodeInserted',selectors);
  },
  
  gui_extending_close_event: function(){
    if(this.lib.preferences.get('preferences.overall.closeHandler') !== true)
      return;

    const win = this.od.doc;
    const $ = this.od.jQuery;

    // add the text '[Esc]' to all window closer
    $('a[href$=.closeDialog()]').prepend('[Esc] ');

    // register onkey event!
    $(win).keydown(function(event){
      if(event.which == 27) // on [Esc] hide all windows
      $('.dialogclass').each(function(i,e){
        $(e).css('visibility','hidden');
      });
    });
  },

  gui_highlight_quick_jump: function(element,selected){
    const $ = this.od.jQuery;
    const self = this;
    
    return !!$(element).each(function(i,e){
      // highlight the planet/system tr
      $(e).addClass('tablecolor');
      if(i == 0 && !selected) {
        // scroll to the first matched planet
        self.gui_quick_jump_scroll_to(e);
      }
    }).length;
  },
  
  gui_quick_jump_scroll_to: function(element){
    const $ = this.od.jQuery;
    var element = $(element);
    if(!element.length) return;
    var parent = $('.quickjump');
    
    var o1 = element.offset(), o2 = parent.offset(), 
       top = o1.top - o2.top;
    parent.scrollTop(top);
  },
  
  // highlight all systems in quickjump
  gui_extending_selected_system: function(selected){
    var system_id = this.options['system_id'];
    if(!system_id) return false;
    const $ = this.od.jQuery;
    
    var e = $('#xjx_quick_jump_cnt a[href$="sys='+system_id+'"]').map(function(){
      return $(this).parents('tr:first');
    });
    return this.gui_highlight_quick_jump(e,selected);
  },
  
  gui_extending_selected_planet: function(selected){
    var planet_id = this.options['planet_id']; 
    if(!planet_id) return false;
    
    return this.gui_highlight_quick_jump(
      '#xjx_planet_quick_jump\\['+planet_id+'_row\\]',selected
    );
  },
  
  // round 5, compatibility
  gui_extending_selected_planet_round5: function(selected){
    if(this.modules.basic.based_on != 'round5') return false;
    
    var planet_id = this.options['planet_id']; 
    if(!planet_id) return false;
    
    const $ = this.od.jQuery;
    
    var e = $('div.quickjump a[href$="index='+planet_id+'"]');
    return this.gui_highlight_quick_jump(e.parents('tr:eq(0)'),selected);
  },

  gui_extending_disable_quickjump_overflow: function(){
    if(this.lib.preferences.get('preferences.overall.disableQuickjumpOverflow') !== true)
      return;

    const $ = this.od.jQuery;
    $('div.quickjump').css({height: '', overflow: ''});
  },

  od_send: function(place){
    const $   = this.od.jQuery;
    
    this.main = 'fleet';
    this.sub  = 'dispatch_menu';
    
    this.options['warning'] = !!$('#message').length;
    
    // od encountered some problems in the dispatch-menu
    if(this.options['warning']) return;
    
    //checking if fleet was dispatched
    var dispatch = $('td#maincontent table div[style*="overflow: auto"]');
    if(dispatch.length){
      this.sub = 'dispatched';
      return;
    }
    
    var a = place['index'] || $('form[name=form1]').attr('action') || false;
    if(a !== false) a = a.match(/\d+/)[0];
    this.options['from_planet'] = a;
    this.options['fleet_ids']   = $('form input[name=ships]').val().split(',');
  },
  
  od_undefined: function(place){
    this.main = 'login';
    this.sub  = 'startpage';
  },
  
  od_logout: function(place){
    this.main = 'login';
    this.sub  = 'startpage';
  },
  
  od_comm: function(place){
    this.main = 'comm';
    this.sub  = place['subop'] == 'a' ? 'outbox' : 'inbox';
    
    if(this.sub == 'inbox'){
      var page = place['page'] || 1;
      if(page <= 0) page = 1;
      this.options.start = (page-1) * 15;
      this.options.end   = page * 15;
    }
    
    var cases = {
      normale:            'normal',
      nachrichtendienst:  'news',
      kampfbericht:       'battle',
      spionage:           'spies',
      system:             'system'
    };
    
    this.options['type'] = cases[place['nachrichtentyp']] || 'all';
  },
  
  od_planlist: function(place){
    this.main = 'planet';
    this.sub  = 'overview';
  },
  
  od_planet: function(place){
    this.main = 'planet';
    this.sub  = 'infrastructure';
    this.options['planet_id'] = place['index'];
    this.options['scan'] = place['scan'] != undefined;
  },
  
  od_renamer: function(place){
    this.main = 'planet';
    this.sub  = 'rename';
    this.options['planet_id'] = place['index'];
  },
  
  od_orbit: function(place){
    this.main = 'planet';
    this.sub  = 'orbit';
    this.options['planet_id'] = place['index'];
    
    var cases = {
      a: 'partners',
      f: 'enemies'
    };
    this.options['type'] = cases[place['typ']] || 'own';
  },
  
  od_main: function(place){
    const $   = this.od.jQuery;
    
    var html  = $('form input[name=page]');
    var flash = $('#Flashmain');
    
    this.main = 'galaxy';
    this.sub  = 'gui';
    if(!flash.length) this.sub  = 'flash';
    if(html.length > 0){
      this.sub  = 'html';
      this.options['start'] = place['first'] || 0;
      this.options['end']   = place['last']  || 30;
    }
    
    this.options['galaxy_id'] = $('form input[name=viewgalaxy]').val();
  },
  
  od_tech: function(place){
    var cases = {
      geb     : 'buildings',
      raum    : 'ships',
      sys     : 'ship_parts',
      kul     : 'culture',
      ras     : 'race'
    };
    this.main = 'research';
    this.sub  = cases[place['tree']] || cases['geb'];
  },
  
  od_werft2: function(place){
    this.main = 'shipyard';
    this.sub  = 'overview';
  },
  
  od_werft: function(place){
    this.main = 'shipyard';
    this.sub  = 'construction';
  },
  
  od_settings: function(place){
    this.main = 'settings';
    this.sub  = 'main';
    
    if(place['zuruck']){
      this.main = 'sitter';
      this.sub  = 'logout';
      return;
    }
    
    if(place['umloggen']){
      this.main = 'sitter';
      this.sub  = 'login';
      return;
    }
    
    if(place['umgelogged']){
      this.main = 'sitter';
      this.sub  = 'login-complete';
      return;
    }
  },
  
  od_shop: function(place){
    const $   = this.od.jQuery;
    
    this.main = 'shop';
    this.sub  = 'resources';
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
    this.options['galaxy_id'] = $('form input[name=gala]').val();
      
    var cases = {
      'checked+1': '0',
      'checked+2': '1k',
      'checked+3': '10k',
      'checked+4': '100k',
      'checked+5': '1m',
      'checked+6': '10m'
    };
    
    this.options['atleast'] = cases[place['selec1']] || '0' ;
    
    var cases = {
      'checked+7': 'alliance',
      'checked+8': 'meta'
    };
    this.options['intern']  = cases[place['selec1']] || 'no' ;
  },
  
  od_shop1: function(place){
    this.main = 'shop';
    this.sub  = 'create_shop';
  },
  
  od_docklist: function(place){
    this.main = 'shop';
    this.sub  = 'docks';
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
  },
  
  od_trade: function(place){
    const $   = this.od.jQuery;
    
    this.main = 'shop';
    this.sub  = 'ships';
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
    this.options['galaxy_id'] = $('form input[name=gala]').val();
      
    var cases = {
      'checked+1': 'all',
      'checked+2': 'colony_ships',
      'checked+3': 'transporters',
      'checked+4': 'scouts',
      'checked+5': 'invaders',
      'checked+6': 'battleships',
      'checked+7': 'emps',
      'checked+8': 'bioships',
      'checked+9': 'resonators'
    };
    
    this.options['type'] = cases[place['selec1']] || 'all';
    this.options['direct'] = place['selec1'] == 'checked+10';
  },
  
  od_ptrade: function(place){
    const $   = this.od.jQuery;
    
    this.main = 'shop';
    this.sub  = 'planets';
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
    this.options['galaxy_id'] = $('form input[name=gala]').val();
      
    var cases = {
      'checked+1': 'all',
      'checked+2': '1',
      'checked+3': '5',
      'checked+4': '9',
      'checked+5': '12',
      'checked+6': '13',
      'checked+17': '17',
      'checked+7': '21',
      'checked+8': '23',
      'checked+9': '27',
      'checked+10': '31'
    };
    this.options['type'] = cases[place['selec1']] || 'all';
    this.options['direct'] = place['selec1'] == 'checked+11';
    this.options['auction_sale'] = $('form input[name=showzwangsversteigerung]')
      .val();
  },
  
  od_logshow: function(place){
    this.main = 'log';
    var cases = {
      1:  'login_user',
      2:  'login_sitter'
    };
    this.sub  = cases['loginlog'] || 'login_counselor'; 
  },
  
  od_handp: function(place){
    this.main = 'log';
    this.sub  = 'trading';
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
    
    var cases = {
      1: 'sales',
      2: 'purchases'
    };
    
    this.options = cases[place['nur']] || 'all';
  },
  
  od_uberweisungen: function(place){
    this.main = 'log';
    this.sub  = 'money_transfer';
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
    
    var cases = {
      0: 'incoming',
      1: 'outgoing'
    };
    
    this.options['type'] = cases[place['ausgehende']] || 'incoming';
    this.options['alliance'] = place['allianzen'] == '1';
  },
  
  od_verluste: function(place){
    this.main = 'log';
    this.sub  = 'lost_ships';
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
  },
  
  od_allyfleetlog: function(place){
    this.main = 'log';
    this.sub  = 'alliance_fleet';
    this.options['alliance_id'] = place['welch'];
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
  },
  
  od_quesp: function(place){
    this.main = 'log';
    this.sub  = 'quests';
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
  },
  
  od_quesp: function(place){
    this.main = 'log';
    this.sub  = 'battles';
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
  },
  
  od_spy: function(place){
    this.main = 'spy';
    this.sub  = 'main';
  },
  
  od_to: function(place){
    const $   = this.od.jQuery;
    
    this.main = 'quest';
    this.sub  = 'main';
    this.options['galaxy_id'] = $('form input[name=gala]').val();
  },
  
  od_scanner: function(place){
    this.main = 'scanner';
    this.sub  = place['sub'] == 'tech' ? 'expanding' : 'main';
  },
  
  od_fleet: function(place){
    this.main = 'fleet';
    this.sub  = 'overview';

    this.options['start'] = place['first'] || place['first2'] || 0;
    this.options['end']   = place['last']  || place['last2']  || 75;
  },
  
  od_score: function(place){
    this.main = 'highscore';    
    var cases = {
      g:    'total',
      i:    'empire',
      k:    'war',
      q:    'quest',
      t:    'trading'
    };
    this.sub = cases[place['sub']] || 'total';
    
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
  },
  
  od_ally: function(place){
    this.main = 'highscore';    
    this.sub  = 'alliances';
    
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
  },
  
  od_metalist: function(place){
    this.main = 'highscore';    
    this.sub  = 'metas';
    
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
  },
  
  od_system: function(place){
    this.main = 'system';
    this.sub  = 'main';
    this.options['system_id'] = place['sys'];
  },
  
  od_renamersys: function(place){
    this.main = 'system';
    this.sub  = 'rename';
    this.options['planet_id'] = place['index'];
  },
  
  od_usershow: function(place){
    this.main = 'player';
    this.sub  = 'overview';
    this.options['player_id'] = place['welch'];
  },
  
  od_usdet: function(place){
    this.main = 'user';
    this.sub  = 'statistics';
  },
  
  od_allyshow: function(place){
    this.main = 'alliance';
    this.sub  = 'overview';
    this.options['alliance_id'] = place['welch'];
  },
  
  od_meta: function(place){
    this.main = 'meta';
    this.sub  = 'overview';
    this.options['meta_id'] = place['welch'];
  }
});