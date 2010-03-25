//= basics
//= require

Namespace('db.moz.plugin');

db.moz.plugin.modules = {
  _registered_modules: {},
  
  // creating alias for original require
  require: function(){
    return db.moz.plugin.require.module(arguments);
  },
  
  matches_requirements: function (obj){
    const basics = db.moz.plugin.basics;
    const required_params = [
      'module_name',   'module_author','module_version',
      'module_website','module_enable','initialize'
    ];
    const error = 'db.moz.plugin.module: '+
      'this object (' + obj.module_name + 
      ') matches not the requirements';
    
    // matches module the requirements?
    if(!basics.is_object(obj)) throw error;
    
    for(var key in required_params){
      var require = required_params[key];
      if(basics.is_undefined(obj[require])) 
        throw error + ', '+ require +' undefined';
    }
    
    return true;
  },
  
  /**
   * register a module 
   * @param Object obj
   */
  register: function(obj){
    const basics = db.moz.plugin.basics;
    
    this.matches_requirements(obj);
    
    var registered = this._registered_modules; 
    
    if(registered[obj.module_name]) return false; 
    
    var klass = function(){};
    klass.prototype = obj;
    
    registered[obj.module_name] = klass;
  },

  get: function (module_name){
    const modules = this._registered_modules;
    const module  = modules[module_name];
    
    if(module == undefined)
      throw 'db.moz.plugin: module ('+module_name+') not founded';
      
    return module;
  }
};