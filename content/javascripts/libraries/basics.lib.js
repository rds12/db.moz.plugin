//= namespace.js
//= console.js

Namespace('db.moz.plugin');

db.moz.plugin.basics = {
  is_undefined: function(mixed){
    return mixed === null||mixed === undefined;
  },
  is_string: function(mixed){
    return typeof mixed == 'string' || mixed instanceof String;
  },
  is_boolean: function(mixed){
    return typeof mixed == 'boolean' || mixed instanceof Boolean;
  },
  is_function: function(mixed){
    return typeof mixed == 'function';
  },
  is_number: function(mixed){
    return typeof mixed == 'number' || mixed instanceof Number;
  },
  is_object: function(mixed){
    return typeof mixed == 'object';
  },
  is_array: function(mixed){
    return this.is_object(mixed) && mixed instanceof Array;
  },
  is_reg_exp: function(mixed){
    return this.is_object(mixed) && mixed instanceof RegExp;
  },
  is_elementar_type: function(mixed){
    return this.is_boolean(mixed) || this.is_number(mixed) || 
           this.is_string(mixed) || this.is_array(mixed);
  },
  
  extend: function(obj,extension){
    for(var key in extension){
      // has already the element
      if(obj[key]) continue;
      obj[key] = extension[key];
    }
    
    return obj;
  },
  
  clone: function(object){
    if(this.is_array(object))  return object.slice(0);
    if(this.is_object(object)) return this.extend({ }, object);
    
    return object;
  },
  
  clone_all: function(object){
    if(this.is_array(object))   return object.slice(0);
    if(!this.is_object(object)) return object;
    if(this.is_reg_exp(object)) return new RegExp(object);
    
    var cloned = {};
    
    for(var key in object){
      cloned[key] = this.clone_all(object[key]);
    }
    return cloned;
  },

  get_version: function(){
    // get cached version
    if(this.version !== undefined)
      return this.version;

    var self = this;

    try {
      // Firefox 4 and later; Mozilla 2 and later
      Components.utils.import("resource://gre/modules/AddonManager.jsm");
      AddonManager.getAddonByID("rds12sog@gmail.com", function(addon) {
        self.version = addon.version;
      });
    } catch (ex) {
      // Firefox 3.6 and before; Mozilla 1.9.2 and before
      const em = Components.classes["@mozilla.org/extensions/manager;1"]
                 .getService(Components.interfaces.nsIExtensionManager);
      var addon = em.getItemForID("rds12sog@gmail.com");
      self.version = addon ? addon.version : null;
      
    }

    return self.version ? self.version : 'unknown';
  },

  /**
   * Getting the Type in String format from a Object.
   * @param {mixed} object
   * @return {String}
   */
  get_type: function(object){
    if(this.is_undefined(object)) return 'Undefined';
    if(this.is_boolean(object)) return 'Boolean';
    if(this.is_function(object)) return 'Function';
    if(this.is_string(object)) return 'String';
    if(this.is_number(object)) return 'Number';
    if(this.is_object(object)){
      if(this.is_array(object))  return 'Array';
      if(this.is_reg_exp(object)) return 'RegExp';
      return 'Object';
    }
    return '';
  },
  
  /**
   * Get the classname of the given object.
   * @param {mixed} obj
   * @return {String|false}
   */
  get_class: function(obj){
    if (!this.is_object(obj) || obj === null) return false;
    return /(\w+)\(/.exec(obj.constructor.toString())[1];
  },
  
  /**
   * 
   * @param array args
   * @return array
   */
  flatt_args: function(args){
    var flatted = [];
    for(var i=0,len=args.length;i<len;++i){
      var value = args[i];
      if(!this.is_elementar_type(value)) continue;
      
      if(this.is_array(value)){
        flatted = flatted.concat(this.flatt_args(value));
        continue;
      }
      
      flatted.push(value);
    }
    return flatted;
  },
  
  inspect: function(obj,with_type,no_recursion){
    var type = this.get_type(obj);
    
    var prefix = (with_type == true ? type + ': ' : '');
    switch(type){
      case 'String':    return prefix + "'"+ obj + "'";
      case 'Boolean':   return prefix + obj.toString();
      case 'Function':  return prefix + 'function';
      case 'Undefined': return prefix + 'undefined';
      case 'Number':    return prefix + obj.toString();
      case 'RegExp':    return prefix + obj.toString();
      case 'Array':     
        var output = '';
        for(var i=0,len=obj.length;i<len;++i){
          if(i != 0) output += ',';
          output += this.inspect(obj[i],false,true);
        }
        return prefix + '['+output+']';
      case 'Object':    
        if(no_recursion) return obj.toString();
        
        var output = '';
        var bool   = false;
        for(var key in obj){
          if(this.is_function(obj[key])) continue;
          
          if(bool) output += ', ';
          output += key+': '+this.inspect(obj[key],false,true);
          bool = true;
        }
        return prefix + '{ '+output+' }'; 
    }
    return 'not supported';
  },

  merge_hashes: function(hash1,hash2){
    for(var key in hash2){
      if(this.is_function(hash2[key])) continue;
      hash1[key] = hash2[key];
    }
    return hash1;
  },

  update: function(array, args) {
    var arrayLength = array.length, length = args.length;
    while (length--) array[arrayLength + length] = args[length];
    return array;
  },
  
  strip: function(string){
    return string.replace(/^\s+/, '').replace(/\s+$/, '');
  },
  
  /**
   * adopted from prototype.js
   * @param {String} string
   * @param {String} separator
   * @return {Hash}
   */
  parseQuery: function(string,separator){
    const basics = db.moz.plugin.basics;
    var match = basics.strip(string).match(/([^?#]*)(#.*)?$/);
    if (!match) return { };
    
    var splitted = match[1].split(separator || '&');
    var hash = {};
    
    for(var i=0,len = splitted.length;i<len;++i){
      var pair = splitted[i].split('=');
      if(!pair[0]) continue;
      
      var key   = decodeURIComponent(pair.shift());
      var value = pair.length > 1 ? pair.join('=') : pair[0];
      
      if (value != undefined) value = decodeURIComponent(value);
      
      if (key in hash) {
        if (!basics.is_array(hash[key])) 
          hash[key] = [hash[key]];
        hash[key].push(value);
      } else {
        hash[key] = value;
      }
    }
    
    return hash;
  },
  
  parseToLink: function(string,template,callback){
    // defining defaults
    template = template || '<a href="%1$s">%1$s</a>';
    callback = callback || function(original){return true;}

    // function for parsing links in a line
    var parse_line = function(line){
      var html = '';
      while(match = /^(.*?)((https?:\/\/.*?)(\s|<|$))/i.exec(line)){
        var link = match[3];
        if(callback(link))
          link = db.moz.plugin.basics.sprintf(template,link);
        
        html += match[1] + link + match[4];
        line = line.substr(match[0].length, line.length);
      }
      html += line;
      return html == '' ? line : html;
    }

    var html = [], regex = /^.+$/img, bool = false, line = '', i = 0;
    // abort if more than 1000 lines were accessed
    while(++i < 1000 && (line = regex.exec(string))){
      html.push(parse_line(line[0]));
    }
    
    if(i > 999) 
    db.moz.plugin.console.warn(
      'db.moz.plugin.basics.parseToLink',
      'i exceeded 1000'
    );

    return html.join("\n");
  },

  event: function(){
    this.id = this.id || null;
    var self = this;
    
    this.delay = function(fn,delay){
      this.destroy();
      self.id = window.setTimeout(fn,delay);
    }
    
    this.destroy = function(){
      if(!self.id) return;
      window.clearTimeout(self.id);
      self.id = null;
    }
  }
  
}

db.moz.plugin.basics.event.keys = function(event){
  var o = {
    isKeyLeft: event.which == 37,
    isKeyRight: event.which == 39,
    isKeyUp  : event.which == 38,
    isKeyDown: event.which == 40,
    isEnter  : event.which == 13,
    isEsc    : event.which == 27,
    isCtr    : event.which == 17 || event.ctrlKey,
    isAlt    : event.which == 18 || event.altKey,
    isShift  : event.which == 16 || event.shiftKey,
    isControl: false
  }
  // check if any of the above events were triggered
  for(var key in o){ 
    if(!o[key]) continue;
    o.isControl = true;
    break;
  }
  return o;
}

db.moz.plugin.include = {
  _subscript_loader: Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader),
                     
  jspath: function(js_name){
    return 'chrome://db.moz.plugin/content/javascripts/'+ js_name +'.js'; 
  },
  
  jsfile: function(js_name,scope){
    var file = this.jspath(js_name);
    
    // try to load the sub script
    try{
      this._subscript_loader.loadSubScript(file,scope);
    }catch(e){
      // failed
      db.moz.plugin.console.error(
        "require: file '"+file+"' couldn't be included",e
      );
      return false;
    }
    return true;
  }
}

db.moz.plugin.require = {
  // the defaults must be loaded, to be able to run this unit.
  _loaded_javascripts: {
//    'libraries/namespace.lib': true,
    'libraries/console.lib'  : true,
    'libraries/basics.lib'   : true
  },
  
  jspath: function(js_name){
    return db.moz.plugin.include.jspath(js_name);
  },
  
  /**
   * Loading a Javascript file, if it wasn't loaded before.
   * returns:
   * Wheter the javascript could be loaded or not.
   * @param String js_name
   * @return boolean 
   */
  jsfile : function(js_name,scope){
    var loaded = this._loaded_javascripts;
    
    // this file was already loaded
    if(!db.moz.plugin.basics.is_undefined(loaded[js_name])) return true;
    
    var returning = db.moz.plugin.include.jsfile(js_name,scope);
    
    if(!returning) return false;

    // loaded succesfull
    this._loaded_javascripts[js_name] = true;
    
    return true;
  },
  
  // loading library
  library : function(){
    var returning = true;
    var args = db.moz.plugin.basics.flatt_args(arguments);
    var len = args.length;

    if(len == 0) return false;

    for(var i=0;i<len; ++i){
      var arg = args[i];
      var status = this.jsfile('libraries/'+args[i]+'.lib');
      returning = returning && status;
    }
    return returning;
  },
  
  // loading submodule: modules/ajax/basic.js
  submodul: function(){
    var args = db.moz.plugin.basics.flatt_args(arguments);
    var len = args.length;
    var returning = true;
    if(len < 2) return false;

    var module_name = args.pop();
    --len;
    
    for(var i=0; i<len; ++i){
      var status = this.jsfile('modules/'+module_name+'/'+args[i]);
      returning = returning && status;
    }
    
    return returning;
  },
  
  // loading module: modules/ajax/ajax.js
  module: function(){
    var args = db.moz.plugin.basics.flatt_args(arguments);
    var len = args.length;
    var returning = true;
    if(len == 0) return false;
    
    for(var i=0;i<len; ++i){
      var status = this.submodul(args[i],args[i]);
      returning = returning && status;
    }
    return returning;
  }
}

db.moz.plugin.basics.format_number = function(number){
  var number = parseInt(number),
      numbers = [],
      group_digits = 3,
      divisor = Math.pow(10,group_digits),
      sprintf = db.moz.plugin.basics.sprintf,
      format = '%0' + group_digits + 'd',
      modulo = '',
      signed = '';

  if(number == 0 || isNaN(number)) return '0';

  if(number < 0){
    number *= -1;
    signed = '-';
  }

  while(number > 0){
    modulo = number % divisor;
    number = parseInt(number / divisor);

    if(number > 0)
      modulo = sprintf(format,modulo);
    else
      modulo = modulo.toString();

    numbers.unshift(modulo);
  }

  return signed + numbers.join('.')
}

/**
 * sprintf() for JavaScript v.0.4
 *
 * Copyright (c) 2007 Alexandru Marasteanu <http://alexei.417.ro/>
 * Thanks to David Baird (unit test and patch).
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation; either version 2 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, write to the Free Software Foundation, Inc., 59 Temple
 * Place, Suite 330, Boston, MA 02111-1307 USA
 */
// @see http://code.google.com/p/sprintf/
db.moz.plugin.basics.str_repeat = function(i, m) { 
  for (var o = []; m > 0; o[--m] = i); return(o.join('')); 
}

// modified to be a bit more fault-tolerant
db.moz.plugin.basics.sprintf = function () {
  var i = 0, a, f = arguments[i++], o = [], m, p, c, x;
  while (f) {
    if (m = /^[^\x25]+/.exec(f)) o.push(m[0]);
    else if (m = /^\x25{2}/.exec(f)) o.push('%');
    else if (m = /^\x25(?:(\d+)\$)?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(f)) {
      if (((a = arguments[m[1] || i++]) == null) || (a == undefined)){
        return o.join('') + f;
      }
      if (/[^s]/.test(m[7]) && (typeof(a) != 'number')){
        var bool = false, b = null;
        if(typeof(a) == 'string'){
          b = parseInt(a)
          bool = b.toString() == a;
        }
        if(!bool) throw("Expecting number but found " + typeof(a));
        a = b;
      }
      switch (m[7]) {
        case 'b': a = a.toString(2); break;
        case 'c': a = String.fromCharCode(a); break;
        case 'd': a = parseInt(a); break;
        case 'e': a = m[6] ? a.toExponential(m[6]) : a.toExponential(); break;
        case 'f': a = m[6] ? parseFloat(a).toFixed(m[6]) : parseFloat(a); break;
        case 'o': a = a.toString(8); break;
        case 's': a = ((a = String(a)) && m[6] ? a.substring(0, m[6]) : a); break;
        case 'u': a = Math.abs(a); break;
        case 'x': a = a.toString(16); break;
        case 'X': a = a.toString(16).toUpperCase(); break;
      }
      a = (/[def]/.test(m[7]) && m[2] && a > 0 ? '+' + a : a);
      c = m[3] ? m[3] == '0' ? '0' : m[3].charAt(1) : ' ';
      x = m[5] - String(a).length;
      p = m[5] ? db.moz.plugin.basics.str_repeat(c, x) : '';
      o.push(m[4] ? a + p : p + a);
    }
    else throw ("Huh ?!");
    f = f.substring(m[0].length);
  }
  return o.join('');
}