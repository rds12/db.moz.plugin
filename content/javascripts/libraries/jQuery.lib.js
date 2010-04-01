//= basics.js

Namespace('db.moz.plugin');

db.moz.plugin.jQuery = {

  chromeWindow: undefined,
  
  new_query: function(doc,$){
    if(!$) $ = this.create().$;

    return (function(){
      return function(selector,specified){
        return new ($.fn.init)(selector,specified || doc)
      }
    })();
  },
  
  get_chrome: function(){
    this.chromeWindow = this.chromeWindow || this.new_query(window.document);

    return this.chromeWindow;
  },

  jQuerify: function(doc,win){
    const include = db.moz.plugin.include;
    const chromeWindow = window;

    return (function(){
      var scope = {};
      scope.window = win || {
        document: doc,
        addEventListener: function(){}
      }
      include.jsfile('jquery.1.4.2',scope);
      return scope.window;
    })();
  },

  create: function(aHTMLString){
    const service = Components.classes["@mozilla.org/feed-unescapehtml;1"]
       .getService(Components.interfaces.nsIScriptableUnescapeHTML);

    var dt = document.implementation.createDocumentType(
      'HTML', '-//W3C//DTD HTML 4.01 Transitional//EN', 
      'http://www.w3.org/TR/html4/loose.dtd'
    );

    var doc = document.implementation.createDocument (
      'http://www.w3.org/1999/html', 'html', dt
    );

    var body = document.createElement('body');
    doc.documentElement.appendChild(body);

    if(aHTMLString){
      var elements = service.parseFragment(aHTMLString, false, null, body);    
      body.appendChild(elements);
    }

    var win = this.jQuerify(doc);
    return win;
  }
}