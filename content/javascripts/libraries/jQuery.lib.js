//= basics.js

Namespace('db.moz.plugin');

db.moz.plugin.jQuery = {

  chromeWindow: undefined,
  jQueryDefault: undefined,

  new_query: function(doc,$){
    if(!$) $ = this.jQueryDefault.$;

    return (function(){
      return function(selector,specified){
        return new ($.fn.init)(selector,specified || doc)
      }
    })();
  },

  get_chrome: function(){
    this.chromeWindow = this.chromeWindow || 
                        this.new_query(window.document);

    return this.chromeWindow;
  },

  _querify: function(doc,win){
    const include = db.moz.plugin.include;
    const chromeWindow = window;

    return (function(){
      var scope = {};
      scope.window = win || {
        document: doc,
        addEventListener: function(){}
      }
      include.jsfile('jquery.1.4.2',scope);
      // seems to be a failer of recognition
      scope.window.$.support.opacity = true;
      return scope.window;
    })();
  },

  stringToDocument: function(aHTMLString){
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

    return doc;
  },

  create: function(aHTMLString){
    var doc = this.stringToDocument(aHTMLString);
    var $ = this.new_query(doc);

    return {'$' : $, 'jQuery' : $, 'doc': doc};
  }
}

db.moz.plugin.jQuery.jQueryDefault = (function(){
  const that = db.moz.plugin.jQuery;
  document = that.stringToDocument();
  return that._querify(document);
})();