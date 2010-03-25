//= basics.js
//= console.js

Namespace('db.moz.plugin');

db.moz.plugin.templates = function(localepath){
  var locales   = db.moz.plugin.locales.get(localepath);
  var templates = db.moz.plugin.templates.get(localepath);
  var self = this;

  this.get_template_string = function(name){
    var string = templates[name];

    // if template is not existing, try to return local file
    if(!string) return locales[name];

    var matches = {}, match;
    var regex  = /#{(.+?)}/g;

    // maybe regex matches more than one time, therefore collect them 
    while(match = regex.exec(string)){
      matches[match[1]] = true;
    }

    for(var key in matches){
      var value = locales[key];
      if(typeof value == 'function' || !value) continue;

      var repl  = new RegExp('#{'+key+'}','g');
      string = string.replace(repl,value);
    }
    return string
  }

  this.parse = function(){
    // local_path to properties
    var args = db.moz.plugin.basics.flatt_args(arguments);

    if(args.length < 1){
      db.moz.plugin.console.error('templates.parse: no arguments');
      return '';
    }
    // loading the content of locales
    var test = args[0];
    args[0] = self.get_template_string(args[0]);

    if(args[0] == undefined){
      db.moz.plugin.console.error('templates.parse: invalid arguments');
      return '';
    }
    return db.moz.plugin.basics.sprintf.apply(null,args);
  }
}

db.moz.plugin.templates.cached = null;
db.moz.plugin.templates.get = function(location){
  const temp_path = db.moz.plugin.locations.templates;
  const loca = db.moz.plugin.locales;
  const temp = db.moz.plugin.templates;

  temp.cached = temp.cached || new loca(temp_path);
  return temp.cached.get(location);
}