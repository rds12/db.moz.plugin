Namespace('db.moz.plugin');

db.moz.plugin.browser = {
  onSetup: function(){
    // set parse shortcut
    var key = document.getElementById('dbMozPluginKeyParse'),
        shortcut = db.moz.plugin.preferences.get('preferences.parserShortcutKey');

    if(key && shortcut != '')
      key.setAttribute('key',shortcut);

    this.register_modules();
  },

  onTeardown: function(event){
    // if you close a tab direct, this won't get fired
    if(!this.check_event(event,true)) return;

    var doc = event.originalTarget,
        win = doc.defaultView;

    delete win['dbMozPluginContentInitialized'];
  },

  onContentLoaded: function(event){
    // check if event was fired by a window
    // and test if omegaday host
    if(!this.check_event(event,true)) return;

    var doc = event.originalTarget;

    var win = doc.defaultView;
    var dom = win.wrappedJSObject;

    // load css here, because in Firefox 4 and later
    // onContentInitialize event won't be fired
    this.load_css(win.document);


    db.moz.plugin.browser.invoke_modules(dom,doc,win);

    delete win['dbMozPluginContentInitialized'];
  },

  // Firefox 3.6 and before: called _after_ every content initialization
  // Firefox 4 and later: called _before_ every content initialization
  // FIXME: find another event for this callback in Firefox 4
  onContentInitialize: function(win){
    if(!this.check_if_omega_day(win.document))
      return;

    // load css on document creation
    this.load_css(win.document);
  },

  // also fired on images
  onContentFinished: function(){
    // not used
  },

  onLocationChange: function(win){
    // set the visibility of statusbar
    this.check_if_omega_day(win.document);
  },

  onTabSelection: function(event){
    // not used
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

  load_css: function(doc){
    try{
      var link = doc.createElement('link');
      link.setAttribute('rel','stylesheet');
      link.setAttribute('type','text/css');
      link.setAttribute('href','chrome://db.moz.plugin.style/content/css/ingame.css');

      var head = doc.getElementsByTagName('head') || [doc.documentElement];
      if(!head || !head[0]) return false;
      head[0].appendChild(link);
    }catch(e){
      return false;
    }
  },

  invoke_modules: function(dom,doc,win){
    var runner = new db.moz.plugin.runner(dom,doc);

    // load the modules.basic
    runner.invoke_modules(['basic']);

    // only go further if page is od
    if(!runner.modules.basic.is_od) return;

    runner.invoke_modules(['location','fleet','research',
      'infrastructure','orbit','planet','system','comm','fowapi',
      'fleet_shop','toolbar']);
  },

  register_modules: function(){
    const require = db.moz.plugin.require;

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

    require.module('toolbar');

    require.module('research');
  },

  show_statusbar: function(show){
    var statusbar = document.getElementById('dbMozPluginStatusPanel');
    statusbar.setAttribute('collapsed',show === true ? 'false' : 'true' );
  }
};