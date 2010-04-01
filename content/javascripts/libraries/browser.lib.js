Namespace('db.moz.plugin');

// used guide https://developer.mozilla.org/en/Code_snippets/On_page_load
window.addEventListener("load", function() { 
  db.moz.plugin.browser.init();
}, false);

window.addEventListener("pagehide", function(event){
  db.moz.plugin.browser.teardown(event);
}, false);

db.moz.plugin.browser = {
  event_handler: null,
  
  init: function(){
    var appcontent = document.getElementById('appcontent');
    if(!appcontent)
      throw 'Your Browser/Application doesn\'t support db.moz.plugin';

    this.event_handler = appcontent.addEventListener('DOMContentLoaded', 
      function(event){db.moz.plugin.browser.setup(event);}, true
    );

    if(gBrowser && gBrowser.tabContainer){

      gBrowser.tabContainer.addEventListener("TabSelect", function(event){
        db.moz.plugin.browser.tab_selected(event);
      }, false);
    }

    // set parse shortcut
    var key = document.getElementById('dbMozPluginKeyParse'),
        shortcut = db.moz.plugin.preferences.get('preferences.parserShortcutKey');

    if(key && shortcut != '')
      key.setAttribute('key',shortcut);
  },
  
  check_if_omega_day: function(doc){
    const self = this;
    // only set statusbar visibility, if tab is focused
    var set_statusbar = function(is_omegaday){
      var focused = doc == window.content.document;
      if(focused) self.show_statusbar(is_omegaday);
      return is_omegaday;
    }

    try{
      var location = doc.location;

      // only http(s) is allowed
      if(!location.protocol.match(/^http(|s):/))
        return set_statusbar(false);

      var href = location.host;
      var regexp = /www(\d?).omega-day.com/i

      var is_omegaday = regexp.test(href);
      return set_statusbar(is_omegaday);
    }catch(e){
      return false;
    }
  },
  
  check_event: function(event, omegaday_check){
    var doc = event.originalTarget;

    // ensure that only documents are loaded, because
    // xul images are fireing this event, too
    if(doc.nodeName != '#document') return false;
    if(!(doc instanceof HTMLDocument)) return false;

    if( omegaday_check === true )
      return this.check_if_omega_day(doc);

    return true;
  },

  setup: function(event){
    // check if event was fired by a window
    if(!this.check_event(event,true)) return;

    var doc = event.originalTarget;

    //TODO: load me on the fly
    this.load_css(doc);

    const require = db.moz.plugin.require;

    var win = doc.defaultView;
    var dom = win.wrappedJSObject;

    // register basic modules
    require.module('basic');
    require.submodul('location','basic');

    require.module('fleet');
    require.submodul('shop','fleet');

    require.module('planet');
    require.submodul('infrastructure','orbit','planet');

    require.module('system');

    require.module('comm');

    require.module('fowapi');

    db.moz.plugin.browser.fire_modules(dom,doc);
  },

  load_css: function(doc){
    var link = doc.createElement('link');
    link.setAttribute('rel','stylesheet');
    link.setAttribute('type','text/css');
    link.setAttribute('href','chrome://db.moz.plugin.style/content/css/ingame.css');
    var head = doc.getElementsByTagName('head');
    if(!head) return false;
    head[0].appendChild(link);
  },

  fire_modules: function(dom,doc){
    var runner = new db.moz.plugin.runner(dom,doc);

    // load the modules.basic
    runner.load_basic_modules(['basic']);

    // only go further if page is od
    if(!runner.modules.basic.is_od) return;

    runner.load_basic_modules(['location','fleet',
      'infrastructure','orbit','planet','system','comm','fowapi',
      'fleet_shop']);
  },

  teardown: function(event){
    if(!this.check_event(event,true)) return;

    var doc = event.originalTarget;
    //TODO: some cleanup before leaving the site
  },

  show_statusbar: function(show){
    var statusbar = document.getElementById('dbMozPluginStatusPanel');
    statusbar.setAttribute('collapsed',show === true ? 'false' : 'true' );
  },

  tab_selected: function(event){
    // set the visibility of statusbar
    this.check_if_omega_day(window.content.document);
  }
};