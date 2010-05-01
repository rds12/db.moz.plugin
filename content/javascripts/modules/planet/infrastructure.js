//= basic
//= location

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'infrastructure',
  module_author:      'rds12',
  module_version:     '2010-05-01',
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

    this.modules.basic.log('infrastructure',null,true);
    this.modules.basic.log(this.production,'production');
    this.modules.basic.log(this.deposit,'deposit');

    this.gui_extending_images();
    this.gui_extending_post_symbol();
    this.gui_extending_day_tax_income();
    this.gui_extending_buildable_ships();
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
      return dom[name+'prog'] * dom[name+'faktor'] * smallish / 100
    }

    this.production.ore = production('erz');
    this.production.metal = production('metall');
    this.production.tungsten = production('wolfram');
    this.production.crystal = production('kristall');
    this.production.fluoride = production('flour');
    this.production.credits = 0; // TODO: parse dom;
    this.production.industry = 0; // TODO: parse dom;
    this.production.research = 0; // TODO: parse dom;
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
        var e = $(e),
            min = self.get_minimal_material(e);

        e.parents('td:first').prepend(
          self.template('numberBuildableShips',min));
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

    return min;
  },

  truncate_rpg_text: function(text,img){
    var match = text.match(/(picover\(\d+,\s+')(.+?)(')/);
    if(!match) return text;

    var min = this.get_minimal_material(img),
        factor = this.template('numberBuildableShips',min);

    return match[1] + factor + match[2] + match[3] + ",'')";
  },

  gui_extending_images: function(){
    if(this.lib.preferences.get('preferences.infrastructure.resizeImages') !== true)
      return;

    if(this.modules.location.options['scan']) return;
    // Bug#5:
    // if odhelper is installed and the building resize option is set,
    // odhelper will remove the building-table, but our plugin is a bit 
    // faster, which leads to complete deletion of the infrastructure.
    // And because odhelper does the exact same thing, we do nothing
    if(this.modules.basic.is_odhelper_enabled && 
       true == this.lib.preferences.extern('extensions.odhelp.extResizeBuild')) 
    return false;

    const $ = this.od.jQuery;
    const self = this;
    
    var div  = $('#1000').parents('div:eq(0)').css('position','relative');

    // group the buildings
    div.append('<div id="dbMozPluginInfrastructurePlanet"/>');
    div.append('<div id="dbMozPluginInfrastructureOrbit"/>')

    var planet = $('#dbMozPluginInfrastructurePlanet');
    var orbit  = $('#dbMozPluginInfrastructureOrbit');

    div.css('text-align','left').find('img').each(function(i,img){
      img = $(img)
      // group building into orbit or planet
      if(img.attr('onclick').match(/\d+\,\'w/)){
        orbit.append(img);
      }else{
        planet.append(img)
      }
      // resize image by half
      img.attr({width: '50', height: '45'});
      
      // remove rpg text
      var text = self.truncate_rpg_text(img.attr('onmouseover'),img)
      img.attr('onmouseover',text);
    });
  },
  
  gui_extending_post_symbol: function(){
    if(this.lib.preferences.get('preferences.infrastructure.postSymbol') !== true)
      return;

    const $   = this.od.jQuery;
    const dom = this.od.dom;
    const img = dom['old'];
    
    var matches = /post.gif/.test(img);
    if(!matches) return;
    
    $('#lefttop').wrap('<div style="position:relative"/>')
                 .parents('div:eq(0)').prepend(this.template('postsymbol',img));
  },
  
  gui_extending_day_tax_income: function(){
    if(this.lib.preferences.get('preferences.infrastructure.dailyIncome') !== true)
      return;

    if(this.modules.location.options['scan']) return;
    
    const $   = this.od.jQuery;
    const dom = this.od.dom;
    
    var entry = $('img[src*=credits_us]:last');
    if(!entry.length) return;

    var income = this.deposit.tax * 24,
        format = this.lib.basics.format_number;
    entry.next('font').find('b').append(' * 24 &rarr; '+ format(income));
  }
});