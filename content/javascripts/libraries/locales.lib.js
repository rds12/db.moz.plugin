//= basics
//= console
//= locations

// Never use ISO-8859-1 coded .property files
// they will fuck up everything!
// UTF-8 does the magic!
Namespace('db.moz.plugin');

/**
 * Provides loading locales with Javascript which are located in
 * chrome://db.moz.plugin/locale/name.properties <br>
 * <h3>Usage:</h3> 
 * <pre>
 * // loads the locale 'chrome://db.moz.plugin/locale/file.properties'  
 * var file_locales = db.moz.plugin.locales.get('file')
 * // access to the variable:
 * file_locales.pathMessage
 * </pre>
 * Due to internal chaching of the locales you can access them direct:
 * <pre>
 * db.moz.plugin.locales.get('file').pathMessage
 * </pre>
 * <h3>Format of the locale-File (/locale/file.properties):</h3>
 * pathMessage=Do you really wan't to change the Path?
 */

db.moz.plugin.locales = function(path){
  var service = Components.classes["@mozilla.org/intl/stringbundle;1"]
                .getService(Components.interfaces.nsIStringBundleService),
      cached_locales = {};

  this.get= function(location){
    const basics    = db.moz.plugin.basics;
    const console   = db.moz.plugin.console;
    const prefs     = db.moz.plugin.preferences;

    // if its not a string, than there will be no usefull output
    if(!basics.is_string(location))return {};

    var locale = cached_locales[location];

    // not defined yet? -> define and load all strings
    if(locale == undefined){
      var file = path + location + '.properties';
      // save the raw bundle and the achieved keys
      locale = {
        bundle: service.createBundle( file ),
        strings: {}
      };

      // load every key-value pair into values
      try{
        var items = locale.bundle.getSimpleEnumeration();
        while(items.hasMoreElements()){
          var item = items.getNext().QueryInterface(
            Components.interfaces.nsIPropertyElement
          );
          locale.strings[item.key]=item.value;
        }
      }catch(e){
        if(console && e.name != 'NS_ERROR_UNEXPECTED')
          console.error('locale-file: ' + file + ' throw error '+ e.name);
        else if(console && prefs && prefs.get('debug.enable'))
          console.error('locale-file: ' + file + ' wasn\'t found');
      }
      cached_locales[location] = locale;
    }

    return locale.strings;
  }
}

db.moz.plugin.locales.cached = null;
db.moz.plugin.locales.get = function(location){
  const locale_path = db.moz.plugin.locations.locale;
  const loca = db.moz.plugin.locales;

  loca.cached = loca.cached || new loca(locale_path);
  return loca.cached.get(location);
}