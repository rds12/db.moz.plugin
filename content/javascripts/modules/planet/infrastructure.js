//= basic
//= location

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'infrastructure',
  module_author:      'rds12',
  module_version:     '2011-02-17',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,
  
  production: {
    ore: 0,
    metal: 0,
    tungsten: 0,
    crystal: 0,
    fluoride: 0,
    credits: 0,
    industry: 0,
    research: 0
  },

  deposit: {
    ore: 0,
    metal: 0,
    tungsten: 0,
    crystal: 0,
    fluoride: 0,
    credits: 0,
    tax: 0,
    research: 0,
    population: 0,
    max_population: 0,
    smallish_population: 0
  },
  
  initialize: function(){
    const basic = this.modules.basic;
    const location = this.modules.location;
    
    if(location == undefined) throw 'location not avaible';
    if(!basic.is_logged_in) return;
    
    if(!(location.main == 'planet' && location.sub == 'infrastructure')) return;
    
    // get all planet
    this.retrieve_infrastructure_values();

    if(basic.is_debug_enabled) {
        this.modules.basic.log('modules.infrastructure',null,true);
        this.modules.basic.log(this.production,'production');
        this.modules.basic.log(this.deposit,'deposit');
    }

    this.gui_extending_post_symbol();
    this.gui_extending_buildable_ships();
    this.gui_extending_buildable_buidings();
  },

  retrieve_infrastructure_values: function(){
    const dom = this.od.dom;

    this.deposit.ore = dom['erzvor'];
    this.deposit.metal = dom['metallvor'];
    this.deposit.tungsten = dom['wolframvor'];
    this.deposit.crystal = dom['kristallvor'];
    this.deposit.fluoride = dom['flourvor'];
    this.deposit.credits = dom['creditsvorratgradda'];
    this.deposit.tax = dom['credstundenw'];
    this.deposit.research = 0; // TODO: parse dom;
    this.deposit.population = dom['ppl'];
    this.deposit.max_population = dom['pplmax'];

    var smallish = Math.floor(this.deposit.population / 100000);
    this.deposit.smallish_population = smallish;

    var production = function(name){
      return dom[name+'prog'] * dom[name+'faktor'] * smallish / 100;
    }
    smallish = null;

    this.production.ore = production('erz');
    this.production.metal = production('metall');
    this.production.tungsten = production('wolfram');
    this.production.crystal = production('kristall');
    this.production.fluoride = production('flour');
    this.production.credits = 0; // TODO: parse dom;
    this.production.industry = 0; // TODO: parse dom;
    this.production.research = 0; // TODO: parse dom;
    production = null;
  },

  gui_extending_buildable_ships: function(){
    if(this.lib.preferences.get('preferences.infrastructure.buildableShips') !== true)
      return;

    if(this.modules.location.options['scan']) return;

    const $ = this.od.jQuery;
    const self = this;

    // we have to delay the calculation of the buildable ships
    // because omega-day is using javascript to set the content
    // of the ship-build-window. only god knows why...

    // we have to do a little trick here, because append_values will
    // be called by the event 'DOMNodeInserted', but it will manipulate
    // the dom, and this will trigger the event 'DOMNodeInserted'
    // so it would be an infinite loop. so only bind the event once. 
    // due to users can close and open the window more than once,
    // we have to rebind the event afterwards

    var append_values = function(){
      $('a[onclick^=buildship]').each(function(i,e){
        e = $(e);
        e.parents('td:first').prepend(self.template('numberBuildableShips',self.get_minimal_material(e)));
        e = null;
      });
    }

    var rebind = function(){
      // let the event only be called once
      var window = $('#shipDialog_c');
      window.one('DOMNodeInserted',function(){
        window.unbind();
        append_values();
        rebind();
      });
    }
    rebind();
  },

  gui_extending_buildable_buidings: function(){
    if(this.lib.preferences.get('preferences.infrastructure.buildableBuildings') !== true)
      return;

    if(this.modules.location.options['scan']) return;
    const $ = this.od.jQuery;
    const self = this;

    var append_values = function(){
      $('img[onclick^=planet_techklick]').each(function(i,e){
        e = $(e);
        var min = self.get_minimal_material(e);

        var regex = /planet_picover\((.+?), '(.+?)', '(.+?)'\)/,
            pic_hover = e.attr('onmouseover') || '',
            match = pic_hover.match(regex) || [,'',''];

        regex = null;
        pic_hover = null;
        
        // delete first element
        match.shift();

        match[1] = self.template('numberBuildableBuildings',min) + match[1];
        e.attr('onmouseover','planet_picover(' + match[0] + ",'" + match[1] + "','" + match[2] + "')");

        min = null;
        match = null;
      });
    }
    append_values();
  },

  
  get_minimal_material: function(e){
    const self = this;
    var min = Number.MAX_VALUE;

    var ress_min = function(dividend,divisor){
      var tmp = divisor == 0? Number.MAX_VALUE : dividend / divisor;
      min = Math.min(min,tmp);
    }

    ress_min(self.deposit.credits, e.attr('credits'));
    ress_min(self.deposit.ore, e.attr('erzhaus'));
    ress_min(self.deposit.metal, e.attr('metall'));
    ress_min(self.deposit.crystal, e.attr('kristall'));
    ress_min(self.deposit.tungsten, e.attr('wolfram'));
    ress_min(self.deposit.fluoride, e.attr('flour'));

    ress_min = null;
    return min;
  },

  truncate_rpg_text: function(text,img){
    var match = text.match(/(picover\(\d+,\s+')(.+?)(')/);
    if(!match) return text;

    var min = this.get_minimal_material(img);
    var factor = this.template('numberBuildableShips',min);
    min = null;

    return match[1] + factor + match[2] + match[3] + ",'')";
  },

  gui_extending_post_symbol: function(){
    if(this.lib.preferences.get('preferences.infrastructure.postSymbol') !== true)
      return;

    const $   = this.od.jQuery;
    const dom = this.od.dom;
    const img = dom['old'];
    
    var matches = /post.gif/.test(img);
    if(!matches) return;
    matches = null;
    
    $('#lefttop').wrap('<div style="position:relative"/>').parents('div:eq(0)')
                 .prepend(this.template('postsymbol',img));
  }
});
