//= basics

Namespace('db.moz.plugin');

db.moz.plugin.preferences = {
  branch: null,
  branch_path: 'extensions.db.moz.plugin.',

  init: function(){
    if(this.branch != null) return;
    // adopted from
    // https://developer.mozilla.org/en/Adding_preferences_to_an_extension

    // getting only the preferences for this plugin 
    // extensions.db.moz.plugin, the other preferences
    // won't be needed
    this.branch = this.get_branch('');
  },

  extern: function(prefname){
    return this.get_branch(null).get(prefname);
  },
  
  get_branch: function(branch_name){
    const self = this;
    var branch = Components.classes["@mozilla.org/preferences-service;1"]
       .getService(Components.interfaces.nsIPrefService)
       .getBranch( branch_name !== null ? self.branch_path + branch_name : null );
    return {
      branch: branch,

      INVALID: branch.PREF_INVALID,
      BOOLEAN: branch.PREF_BOOL,
      STRING:  branch.PREF_STRING,
      INT:     branch.PREF_INT,

      type: function(prefname){
        return this.branch.getPrefType(prefname.toString());
      },

      get: function(prefname){
        const prefs = this.branch;

        var type = this.type(prefname),
            value = undefined;

        if(type == this.INVALID) return undefined;

        if(type == this.STRING) value = prefs.getCharPref(prefname);
        if(type == this.BOOLEAN)   value = prefs.getBoolPref(prefname);
        if(type == this.INT)    value = prefs.getIntPref(prefname);

        return value;
      },

      set: function(name,value){
        const basics = db.moz.plugin.basics;
        const type   = basics.get_type(value);
        const prefs  = this.branch;

        switch(type){
          case 'Boolean': prefs.setBoolPref(name,value); return true;
          case 'Number' : prefs.setIntPref (name,value); return true;
          case 'String' : prefs.setCharPref(name,value); return true;
        }

        return false;
      },

      get_children: function(){
        return this.branch.getChildList('',{});
      }
    }
  },

  get: function(){
    this.init();
    
    const prefs = this.branch;
    const basics = db.moz.plugin.basics;
    
    // if no string is given, then return the complete preference object
    if(arguments.length == 0) return prefs;
    
    var args = db.moz.plugin.basics.flatt_args(arguments);
    // assigned was only one variable, and this variable wasn't a array.
    var complex_assigned = 
        !(arguments.length == 1 && !(basics.is_array(arguments[0])));
    var returning = {};
    
    for(var i=0,len=args.length;i<len;++i){
      var prefname = args[i],
          value = prefs.get(prefname);

      if(value === undefined) continue;

      if(!complex_assigned) return value;
      returning[prefname] = value;
    }    
    return (complex_assigned ? returning:undefined);
  },
  
  set: function(name,value){
    this.init();
    return this.branch.set(name,value);
  }
}