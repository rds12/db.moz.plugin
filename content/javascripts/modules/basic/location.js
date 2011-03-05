//= library

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'location',
  module_author:      'rds12',
  module_version:     '2011-02-16',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,
  
  // location informations:
  
  query: {}, // original loaction query
  jsfile: {}, // db.moz js file
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

    if(basic.is_ad_page){
      this.main = 'commercial_break';
      this.sub  = '';
    }else if(this.is_start_page()){
      this.od_undefined();
    }else{
      if(this.query.url != undefined) {
        var match = this.query.url.split('/');
        this.call(match[1],match);
        match = null;
      } else {
        // if place.op == planet than load function od_planet if defined
        this.call(this.query.op,this.query);
      }
      
    }

    this.gui_extending_close_event();
    this.gui_extending_disable_quickjump_overflow();

    if(basic.is_debug_enabled) {
        basic.log('module.location',null,true);
        basic.log(this.query.op  ,'op');
        basic.log(this.query     ,'query');
        basic.log(this.jsfile    ,'jsfile');
        basic.log(this.main      ,'main');
        basic.log(this.sub       ,'sub');
        basic.log(this.options   ,'options');
    }
  },

  is_start_page: function(){
    // if vote button exists, it must be the startpage
    return !!this.od.jQuery('a[href^=http://www.galaxy-news.de/]').length;
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

  gui_extending_disable_quickjump_overflow: function(){
    if(this.lib.preferences.get('preferences.overall.disableQuickjumpOverflow') !== true)
      return;

    this.od.jQuery('div.quickjump').css({height: '', overflow: ''});
  },

  od_send: function(place){
    const $ = this.od.jQuery;
    
    this.jsfile = ['fleet'];
    this.main = 'fleet';
    this.sub  = 'dispatch_menu';
    
    this.options['warning'] = !!$('#message').length;
    
    // od encountered some problems in the dispatch-menu
    if(this.options['warning']) return;
    
    //checking if fleet was dispatched
    var dispatch = $('td#maincontent table div[style*="overflow: auto"]');
    if(dispatch.length){
      this.sub = 'dispatched';
    } else {
      var a = place['index'] || $('form[name=form1]').attr('action') || false;
      if(a !== false) a = a.match(/\d+/)[0];
      this.options['from_planet'] = a;
      this.options['fleet_ids']   = $('form input[name=ships]').val().split(',');
      a = null;
    }

    dispatch = null;
  },
  
  od_undefined: function(place){
    this.jsfile = [];
    this.main = 'login';
    this.sub  = 'startpage';
  },
  
  od_logout: function(place){
    this.jsfile = [];
    this.main = 'login';
    this.sub  = 'startpage';
  },
  
  od_comm: function(place){
    this.jsfile = ['comm'];
    this.main = 'comm';
    this.sub  = place['subop'] == 'a' ? 'outbox' : 'inbox';
    
    if(this.sub == 'inbox'){
      var page = place['page'] || 1;
      if(page <= 0) page = 1;
      this.options.start = (page-1) * 15;
      this.options.end   = page * 15;
      page = null;
    }
    
    var cases = {
      normale:            'normal',
      nachrichtendienst:  'news',
      kampfbericht:       'battle',
      spionage:           'spies',
      system:             'system'
    };
    
    this.options['type'] = cases[place['nachrichtentyp']] || 'all';
    cases = null;
  },
  
  od_planlist: function(place){
    this.jsfile = ['planet'];
    this.main = 'planet';
    this.sub  = 'overview';
  },
  
  od_planet: function(place){
    this.jsfile = ['planet','infrastructure'];
    this.main = 'planet';
    this.sub  = 'infrastructure';
    this.options['planet_id'] = place['index'];
    this.options['scan'] = place['scan'] != undefined;
  },
  
  od_renamer: function(place){
    this.jsfile = ['planet'];
    this.main = 'planet';
    this.sub  = 'rename';
    this.options['planet_id'] = place['index'];
  },
  
  od_orbit: function(place){
    this.jsfile = ['orbit','planet','fowapi','toolbar'];
    this.main = 'planet';
    this.sub  = 'orbit';
    this.options['planet_id'] = place['index'];
    
    var cases = {
      a: 'partners',
      f: 'enemies'
    };
    this.options['type'] = cases[place['typ']] || 'own';
    cases = null;
  },
  
  od_main: function(place){
    const $   = this.od.jQuery;

    this.jsfile = [];
    this.main = 'galaxy';
    this.sub  = 'gui';
    
    var flash = $('#Flashmain');
    if(!flash.length) this.sub  = 'flash';
    flash = null;

    var html  = $('form input[name=page]');
    if(html.length > 0){
      this.sub  = 'html';
      this.options['start'] = place['first'] || 0;
      this.options['end']   = place['last']  || 30;
    }
    html = null;
    
    this.options['galaxy_id'] = $('form input[name=viewgalaxy]').val();
  },
  
  od_tech: function(place){
    this.jsfile = ['research'];
    var cases = {
      geb     : 'buildings',
      raum    : 'ships',
      sys     : 'ship_parts',
      kul     : 'culture',
      ras     : 'race'
    };
    this.main = 'research';
    this.sub  = cases[place['tree']] || cases['geb'];
    cases = null;
  },
  
  od_werft2: function(place){
    this.jsfile = [];
    this.main = 'shipyard';
    this.sub  = 'overview';
  },
  
  od_werft: function(place){
    this.jsfile = [];
    this.main = 'shipyard';
    this.sub  = 'construction';
  },
  
  od_settings: function(place){
    this.jsfile = [];
    this.main = 'settings';
    this.sub  = 'main';
  },
  
  od_sitter: function(place) {
    this.jsfile = [];
    this.main = 'sitter';
    
    if(place['auftraege']){
      this.sub = 'auftraege';
      return
    }
    
    if(place['zuruck']){
      this.sub  = 'logout';
      return;
    }
    
    if(place['umloggen']){
      this.sub  = 'login';
      return;
    }
    
    if(place['umgelogged']){
      this.sub  = 'login-complete';
      return;
    }
  },
  
  od_shop: function(place){
    this.jsfile = [];
    this.main = 'shop';
    this.sub  = 'resources';
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
    this.options['galaxy_id'] = this.od.jQuery('form input[name=gala]').val();
      
    var cases = {
      'checked+1': '0',
      'checked+2': '1k',
      'checked+3': '10k',
      'checked+4': '100k',
      'checked+5': '1m',
      'checked+6': '10m'
    };
    
    this.options['atleast'] = cases[place['selec1']] || '0' ;
    cases = null;
    
    var cases = {
      'checked+7': 'alliance',
      'checked+8': 'meta'
    };
    this.options['intern']  = cases[place['selec1']] || 'no' ;
    cases = null;
  },
  
  od_shop1: function(place){
    this.jsfile = [];
    this.main = 'shop';
    this.sub  = 'create_shop';
  },
  
  od_docklist: function(place){
    this.jsfile = [];
    this.main = 'shop';
    this.sub  = 'docks';
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
  },
  
  od_trade: function(place){
    this.jsfile = ['shop'];
    this.main = 'shop';
    this.sub  = 'ships';
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
    this.options['galaxy_id'] = this.od.jQuery('form input[name=gala]').val();
      
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
    cases = null;
  },
  
  od_ptrade: function(place){
    this.jsfile = [];
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
    this.options['auction_sale'] = $('form input[name=showzwangsversteigerung]').val();
    cases = null;
  },
  
  od_logshow: function(place){
    this.jsfile = [];
    this.main = 'log';
    var cases = {
      1:  'login_user',
      2:  'login_sitter'
    };
    this.sub  = cases[place['loginlog']] || 'login_counselor'; 
    cases = null;
  },
  
  od_handp: function(place){
    this.jsfile = [];
    this.main = 'log';
    this.sub  = 'trading';
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
    
    var cases = {
      1: 'sales',
      2: 'purchases'
    };
    
    this.options = cases[place['nur']] || 'all';
    cases = null;
  },
  
  od_uberweisungen: function(place){
    this.jsfile = [];
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
    cases = null;
  },
  
  od_verluste: function(place){
    this.jsfile = [];
    this.main = 'log';
    this.sub  = 'lost_ships';
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
  },
  
  od_allyfleetlog: function(place){
    this.jsfile = [];
    this.main = 'log';
    this.sub  = 'alliance_fleet';
    this.options['alliance_id'] = place['welch'];
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
  },
  
  od_quesp: function(place){
    this.jsfile = [];
    this.main = 'log';
    this.sub  = 'quests';
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
  },

  od_warp: function(place){
    this.jsfile = [];
    this.main = 'log';
    this.sub  = 'battles';
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
  },
  
  od_spy: function(place){
    this.jsfile = [];
    this.main = 'spy';
    this.sub  = 'main';
  },
  
  od_to: function(place){
    this.jsfile = [];
    this.main = 'quest';
    this.sub  = 'main';
    this.options['galaxy_id'] = this.od.jQuery('form input[name=gala]').val();
  },
  
  od_scanner: function(place){
    this.jsfile = [];
    this.main = 'scanner';
    this.sub  = place['sub'] == 'tech' ? 'expanding' : 'main';
  },
  
  od_fleet: function(place){
    this.jsfile = ['fleet'];
    this.main = 'fleet';
    this.sub  = 'overview';

    this.options['start'] = place['first'] || place['first2'] || 0;
    this.options['end']   = place['last']  || place['last2']  || 75;
  },
  
  od_score: function(place){
    this.jsfile = [];
    this.main = 'highscore';
    var cases = {
      g:    'total',
      i:    'empire',
      k:    'war',
      q:    'quest',
      t:    'trading'
    };
    this.sub = cases[place['sub']] || 'total';
    cases = null;
    
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
  },
  
  od_ally: function(place){
    this.jsfile = [];
    this.main = 'highscore';
    this.sub  = 'alliances';
    
    this.options['start'] = place['first'] || 0;
    this.options['end']   = place['last']  || 30;
  },
  
  od_system: function(place){
    this.jsfile = ['system','fowapi','toolbar'];
    this.main = 'system';
    this.sub  = 'main';
    this.options['system_id'] = place['sys'];
  },
  
  od_renamersys: function(place){
    this.jsfile = [];
    this.main = 'system';
    this.sub  = 'rename';
    this.options['planet_id'] = place['index'];
  },
  
  od_usershow: function(place){
    this.jsfile = ['fowapi','toolbar'];
    this.main = 'player';
    this.sub  = 'overview';
    this.options['player_id'] = place['welch'];
  },
  
  od_usdet: function(place){
    this.jsfile = [];
    this.main = 'user';
    this.sub  = 'statistics';
  },
  
  od_alliances: function(match){
    this.jsfile = ['fowapi','toolbar'];
    this.main = 'alliance';
    this.sub  = 'overview';
    this.options['alliance_id'] = match[2];
  }
});