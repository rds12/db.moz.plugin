

// works like a charme
// note: this file and all those libraries will only be called once!
(function(){
  // loading namespace, console and basics.
  var   libs   = ['namespace','console','basics'];
  const loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
               .getService(Components.interfaces.mozIJSSubScriptLoader);
  const path = 'chrome://db.moz.plugin/content/javascripts/libraries/';

  for(var key in libs){
    loader.loadSubScript( path + libs[key] + '.lib.js');
  }

  // here loading the other libraries
  var   libs    = ['jQuery','preferences','locations','locales',
                   'modules','ajax','templates','notifier','parser','gui'];
  const require = db.moz.plugin.require;
  require.library(libs);
})();