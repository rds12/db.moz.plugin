//= namespace.js

Namespace('db.moz.plugin');

db.moz.plugin.console = {
  _console: null,
  _message_prefix : 'db.moz.plugin: ',

  init: function (){
    if(this._console != null) return;
    this._console = Components.classes["@mozilla.org/consoleservice;1"]
                    .getService(Components.interfaces.nsIConsoleService);
  },

  get_message: function(message,exception){
    if(!exception) return message;

    const prefs = db.moz.plugin.preferences;

    message += '\n' + 'error: '+exception;

    if(prefs && prefs.get('debug.enable')) 
      alert(message + '\n\n' + exception.stack);

    return message;
  },
  
  message: function(message,sourcename,sourceline,linenumber,
                    columnnumber,flags,category,exception
  ){
    this.init();

    message = this.get_message(this._message_prefix+message,exception);

    var error = Components.classes["@mozilla.org/scripterror;1"]
                .createInstance(Components.interfaces.nsIScriptError);
    error.init(message,sourcename,sourceline,linenumber,
                      columnnumber,flags,category);

    this._console.logMessage(error);
  },
  
  warn: function(message,exception){
    this.message(message,null,null,null,null,1,null,exception);
  },
  
  error: function(message,exception){
    this.message(message,null,null,null,null,4,null,exception);
  },
  
  log: function(message,exception){
    this.init();

    message = this.get_message(this._message_prefix+message,exception);

    this._console.logStringMessage(message);
  },
  
  info: function(message,exception){
    this.log(message,exception);
  }
}