
Namespace('db.moz.plugin');

// used guide https://developer.mozilla.org/en/Code_snippets/On_page_load
window.addEventListener("load", function(event) {
  db.moz.plugin.listener.setup(event);
}, false);

window.addEventListener("unload", function(event) {
  db.moz.plugin.listener.teardown(event);
}, false);

db.moz.plugin.listener = {
  events: [],
  progressListener: null,

  setup: function(){
    this.bindDOMContentLoaded();
    this.bindPageHide();
    this.bindTabSelect();
    this.bindProgressListener();

    // initialize browser
    db.moz.plugin.browser.onSetup();
  },

  teardown: function(event){
    // not used
  },

  addEvent: function(name,fn,element){
    this.events.push([name,fn,element]);
    element.addEventListener(name,fn,false);
  },

  bindDOMContentLoaded: function(){
    // bind firefox
    var appcontent = document.getElementById('appcontent');
    if(!appcontent) return;

    this.addEvent('DOMContentLoaded',function(event){
      db.moz.plugin.browser.onContentLoaded(event);
    },appcontent);
  },

  bindTabSelect: function(){
    if(!gBrowser || !gBrowser.tabContainer) return;

    this.addEvent('TabSelect',function(event){
      db.moz.plugin.browser.onTabSelection(event);
    },gBrowser.tabContainer);
  },

  bindPageHide: function(){
    // bind firefox
    this.addEvent('pagehide',function(event){
      db.moz.plugin.browser.onTeardown(event);
    },window);
  },

  bindProgressListener: function(){
    //@see: https://developer.mozilla.org/en/Code_snippets/Progress_Listeners
    const STATE_START = Components.interfaces.nsIWebProgressListener.STATE_START;
    const STATE_STOP  = Components.interfaces.nsIWebProgressListener.STATE_STOP;

    const a = Components.interfaces.nsIWebProgressListener;

    var analize = function(aFlag){
      var b = function(flag){
        var c = a[flag] & aFlag;
        return flag + ': ' + (c ? 'true': 'false');
      }
      var flags = ['STATE_START','STATE_STOP','STATE_TRANSFERRING',
        'STATE_REDIRECTING','STATE_NEGOTIATING','STATE_IS_REQUEST',
        'STATE_IS_DOCUMENT','STATE_IS_NETWORK','STATE_IS_WINDOW',
        'STATE_RESTORING','STATE_IS_INSECURE','STATE_IS_BROKEN',
        'STATE_IS_SECURE','STATE_SECURE_HIGH','STATE_SECURE_MED',
        'STATE_SECURE_LOW'],
          output = '';

      for(var i=0,length=flags.length;i<length;i++)
        output += '\n' + b(flags[i]);

      return 'hex:' + Number(aFlag).toString(16) + output;
    }

    this.progressListener = {
      QueryInterface: function(aIID){
        if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
          aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
          aIID.equals(Components.interfaces.nsISupports))
        return this;
        throw Components.results.NS_NOINTERFACE;
      },

      onStateChange: function(aWebProgress, aRequest, aFlag, aStatus){
        // If you use myListener for more than one tab/window, use
        // aWebProgress.DOMWindow to obtain the tab/window which triggers the state change

        if(aFlag & STATE_START){
          //db.moz.plugin.browser.onContentInitialize(aWebProgress.DOMWindow);
        }

        if(aFlag & STATE_STOP){
          // This fires when the load finishes
          db.moz.plugin.browser.onContentFinished(aWebProgress.DOMWindow);
        }
      },

      onLocationChange: function(aProgress, aRequest, aURI){
        const win = aProgress.DOMWindow;

        if(!('dbMozPluginContentInitialized' in win)){
          win['dbMozPluginContentInitialized'] = true;
          db.moz.plugin.browser.onContentInitialize(win);
        }

        // This fires when the location bar changes; i.e load event is confirmed
        // or when the user switches tabs. If you use myListener for more than one tab/window,
        // use aProgress.DOMWindow to obtain the tab/window which triggered the change.
        db.moz.plugin.browser.onLocationChange(win);
      },

      // For definitions of the remaining functions see related documentation
      onProgressChange: function(aWebProgress, aRequest, curSelf, maxSelf, curTot, maxTot) { },
      onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage) { },
      onSecurityChange: function(aWebProgress, aRequest, aState) { }
    }

    gBrowser.addProgressListener(this.progressListener,
      Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
  }
}