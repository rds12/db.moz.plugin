//= basics.js
//= jQuery.js

Namespace('db.moz.plugin');

db.moz.plugin.ajax = function(){
  this.initialize.apply(this,arguments);
};

db.moz.plugin.ajax.check_url = function(uri){
  if(!uri){
    return ['requestEmptyUrl'];
  }

  var regex = /^(\w+):/i,
      protocol = (regex.exec(uri) || ['',''])[1];
  regex = null;
  
  if(!protocol.match(/^http(|s)$/i)){
    return ['requestUnknownProtocol', protocol];
  }

  protocol = null;
  return ['requestUrlOk'];
};

db.moz.plugin.ajax.od_helper_ok = function(xhr){
  if(!xhr || !xhr.responseXML || !xhr.responseHTML || !xhr.responseHTML.$) 
    return 'responseStatusInvalidXHR';

  // request jQuery with loaded document
  const $ = xhr.responseHTML.$;

  var auth    = $.find('odh\\:auth').text(),
      status  = $.find('odh\\:status').text().match(/\d+/),
      version = $.find('odh\\:version').text();

  // is odh:header present?
  if(!$ || auth == '' || !status || version == '')
    return 'responseStatusInvalid';
  version = null;

  if(!auth.match(/true/))
    return 'responseStatusLogin';
  auth = null;

  var status = status[0];
  if(status != '200'){
    return 'responseStatusNotOK';
  }
  status = null;

  return 'responseStatusOK';
}

db.moz.plugin.ajax.toQueryString = function(object){
  const basics = db.moz.plugin.basics;

  var toQueryPair = function(key,value){
    if(basics.is_undefined(value)) return key;
    return key + '=' + encodeURIComponent(value);
  }

  if(typeof object == 'string') return object;
  if(typeof object == 'object'){
    var returning = [];
    for(var key in object){
      var key = encodeURIComponent(key),
          value = object[key];

      returning.push(toQueryPair(key,value));
    }
    return returning.join('&');
  }
  return null;
}

db.moz.plugin.ajax.prototype = {
  xmlhttp : null,
  timeoutHandler: null,
  options : {
    method:   'get',
    encoding: 'ISO-8859-1',
    toHtml:   true,     
    isRelativeUrl: false,
    timeout:     5000,
    postBody: '',
    contentType: 'text/plain',
    contentTypePost:  'application/x-www-form-urlencoded',
    onSuccess: function(){},
    onFailure : function(){}
  },

  querify: function(client){
    if(this.options.toHtml !== true) return;

    if(!client.responseXML){
      client.responseHTML = db.moz.plugin.jQuery.create(client.responseText);
      return;
    }

    var $ = db.moz.plugin.jQuery.new_query(client.responseXML);
    // FIXME: deprecated: just for compatible issues
    $.find = function(selector){
      return $(selector);
    }

    client.responseHTML = {
      '$': $,
      document: client.responseXML 
    };
  },

  initialize: function(url,options){
    const basics = db.moz.plugin.basics;

    var self = this;
    self.xmlhttp = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                  .createInstance();

    // begins url with http?
    if(!this.options.isRelativeUrl && !/^http([s]?)/.exec(url)){
      url = 'http://' + url;
    }

    self.xmlhttp.onreadystatechange = function(){
      self.onStateChange();
    }

    options.url = url;
    basics.extend(options,self.options);
    options.method = options.method.toUpperCase(); 
    self.options = options;

    // override content type; od uses by default latin-1
    self.xmlhttp.overrideMimeType(self.options.contentType
      +'; charset='+self.options.encoding);

    try{
      var postBody = null;

      self.xmlhttp.open(options.method,url,true);
      if(options.method == 'POST'){
        self.xmlhttp.setRequestHeader("Content-Type", 
          this.options.contentTypePost+";charset="+this.options.encoding
        );
        postBody = db.moz.plugin.ajax.toQueryString(this.options.postBody);
      }

      self.xmlhttp.timeout = false;
      self.xmlhttp.send(postBody);

      // set timeout limit
      self.timeoutHandler = window.setTimeout(function(){
        self.xmlhttp.timeout = true;
        self.options.onFailure(self.xmlhttp);
      },self.options.timeout);
    }catch(e){
      self.options.onFailure();
    }
  },

  onStateChange: function(){
    try{
      var client = this.xmlhttp;

      if(client.timeout == true) return false;
      if(client.readyState != 4) return true;

      // clear timeout
      if(this.timeoutHandler)
        window.clearTimeout(this.timeoutHandler);

      self.timeoutHandler = null;

      if(this.success()){
        client.responseHTML = undefined;

        this.querify(client);

        this.options.onSuccess(client);
        return; 
      }
      this.options.onFailure(client);
    }catch(e){
      db.moz.plugin.console.error('ajax: request failed',e);
    }
  },

  success: function(){
    var status = this.xmlhttp.status; 
    return (status >= 200 && status<300);
  }
};

db.moz.plugin.ajax.autocompleter = function($,options){
  const basics = db.moz.plugin.basics;
  const ajax   = db.moz.plugin.ajax;

  var input     = $(options.input);
  var response_id = options.response;
  var response  = $(response_id);
  var get_url   = options.get_url;
  var parse_items = options.parse_items;

  // response isn't existing
  if(!response.length){
    $('body').append('<div id="'+response_id+'" '
          +'class="dbMozPluginBox" style="display:none;"/>');
    response = $('#'+response_id);
  }

  // if mouse leaves response Window, hide it
  response.mouseleave(function(){
    response.hide();
  });

  // make default selection
  response.attr('selected',-1);

  var make_position = function(){
    var o = input.offset();
    o.top = o.top + input.outerHeight(true);
    o.width = input.width();

    // set position of ajax response window
    response.css(o);
  }

  var get_item = function(index){
    var item = response.children('div:eq('+index+')');
    return item;
  }

  var append_item = function(text_or_element,value){
    var div = $('<div/>').attr('value',value).append(text_or_element);
    response.append(div);
    return div;
  }

  var Event    = new basics.event();

  var success = function(xhr){
    if(!xhr.responseHTML||!xhr.responseHTML.$) return;
    const $jq = xhr.responseHTML.$;
    // update position of response
    make_position();

    // delete old content
    response.html('').show();

    // creating our own selecting attribute
    response.attr('selected',-1);

    // returns array from the callback function
    var items = parse_items($jq) || [];

    // first element is always the 'not found' message
    if(items.length == 1){
      append_item(items[0],'');
    }

    // append all parsed items
    for(var i = 1,len = items.length; i<len; ++i){
      var text = items[i];
      var a = $('<a>'+text+'</a>').click(function(){
        // getting value of clicked element
        var text = $(this).parents('div[value]:first').attr('value'); 

        input.val(text);
        response.hide();
      });
      append_item(a,text);
    }
  }

  var fn = function(){
    // get actual value
    var value = input.val();

    // if value is empty do nothing
    if(value == ''){
      response.hide();
      return;
    }

    // get request url
    var url = get_url(value);

    // send request
    new ajax(url,{
      onSuccess : success
    });
  }

  // set autocomplete to off to disable firefox input history
  input.attr('autocomplete','off').keyup(function(event){
    var o = basics.event.keys(event);
    // don't reload the request:
    // 1) if response is visible and down key was pressed 
    // 2) or if any control sign was pressed, except the down key
    if((response.is(':visible') && o.isKeyDown) || 
       (o.isControl && !o.isKeyDown)) return false;

    Event.delay(function(){fn();},600);
    return false;
  });

  input.keydown(function(event){
    var o = basics.event.keys(event);

    // if response is hidden, don't select an item
    if(response.is(':hidden') || !o.isControl)
    return o.isEnter == false;

    // if key 'esc' was pressed, hide response Window
    if(o.isEsc){
      response.hide();
      return false;
    }

    var maxItems = response.children('div').length;
    // if only one item exists and this items value
    // is empty, than nothing was found
    if(maxItems == 1 && get_item(0).attr('value') == '')
    return o.isEnter == false;

    // getting selected item
    var selected = response.attr('selected');

    var origItem = get_item(selected);

    // getting new selection
    if(o.isKeyDown) selected++;
    if(o.isKeyUp)   selected--;
    if(selected >= maxItems) selected = maxItems-1;
    if(selected < 0) selected = -1;
    var item = get_item(selected);

    // gui update
    origItem.removeAttr('hover','');
    item.attr('hover','hover');

    // if key 'enter' was pressed, update gui 
    // and select the current item 
    if(selected > -1 && o.isEnter){
      var value = item.attr('value');
      input.val(value);
      response.hide();
    }

    // setting new selection
    response.attr('selected',selected);

    // ignore enter key
    return o.isEnter == false;
  });
}