//= jQuery.js

Namespace('db.moz.plugin');

db.moz.plugin.gui = {
  dialogs: {
    preferences: {
      name: 'dbMozPluginDialogPreferences',
      options: 'centerscreen,chrome,modal,resizable'
    }
  },

  openDialog: function(dialog_name){
    var dialogs = this.dialogs;

    if(!(dialog_name in dialogs)) return false;
    var dialog = dialogs[dialog_name];

    try{
      return window.openDialog(
        "chrome://db.moz.plugin/content/gui/dialogs/"+dialog_name+".xul", 
        dialog.name, dialog.options
      );
    }catch(e){}

    return false;
  }
}

db.moz.plugin.gui.statusbar = function(event){
  if(event && event.button != 0) return;
  db.moz.plugin.gui.preferences.open();
}

db.moz.plugin.gui.statusbar.cmd_parse = function(event){
  db.moz.plugin.parser.parseSite();
}

db.moz.plugin.gui.statusbar.cmd_open_context_menu = function(event){
  const prefs = db.moz.plugin.preferences;

  var item = document.getElementById('dbMozPluginStatusParse'),
      disabled = db.moz.plugin.parser.is_disabled();

  item.setAttribute('disabled',disabled ? 'true': 'false')

  document.getElementById("dbMozPluginStatusContextMenu").
         openPopup(event.target,"before_start",0,0,true,true)
}

db.moz.plugin.gui.preferences = (function(){
  const $ = db.moz.plugin.jQuery.get_chrome(),
        ajax = db.moz.plugin.ajax,
        template = new db.moz.plugin.templates('modules/modules.fowapi'),
        editable = { checkbox: true, textbox: true };

  var log = function(entry){
    var log = document.getElementById('updateLog');

    if(entry === true){
       $(log).empty();
       return;
    }

    // if entry is not defined, create a new line 
    var text = !entry ? '' : template.parse.apply(null,arguments);
    $(log).append(text + '\n');

    log.scrollTop = log.scrollHeight;
  }

  var santitize = function(name){
    return ('configset.'+name).replace(/\./g,'\\.');
  }

  var save_value = function(branch,name,value){
    var old_value = branch.get(name),
        type = branch.type(name),
        invalid = true;

    // entry not existing?
    if(type == branch.INVALID) return {
      value: value,
      old_value: old_value,
      is_same: false,
      invalid: invalid
    };

    if(type == branch.BOOLEAN){
      // if not true or false -> no boolean -> invalid type
      invalid = !/true|false/.exec(value);

      if(!invalid) value = !!value.match(/true/);

    }else if(type == branch.INT){
      // true - no number, string - number
      invalid = (/\d+/.exec(value) || [true])[0];

      // invalid !== true - is number
      if(invalid !== true) value = parseInt(invalid);

      // if invalid == true -> no number -> invalid type
      invalid = invalid === true;

    }else if(type == branch.STRING){
      // because value is a string, we don't have to typecast
      invalid = false;
    }

    if(old_value != value) branch.set(name,value);

    return {
      value: value,
      old_value: old_value,
      is_same: old_value == value,
      invalid: invalid
    };
  }

  var update_configset_with_xhr = function(xhr,uri){
    var branch = db.moz.plugin.preferences.get_branch('configset.'),
        children = branch.get_children(),
        $ = xhr.responseHTML.$;

    var updates = 0, 
        inserts = 0,
        config_name = $('configName').text();
    
    if(!config_name){
      log('responseNoConfigName');
      return false;
    }

    log('responseConfigName',config_name);

    branch.set('source.uri',uri);
    branch.set('source.name',config_name);

    for(var i = 0, len = children.length; i<len; ++i){
      // search the tagnames within the xhr response
      var name = children[i],
          entry = $(name),
          avaible = !!entry.length;

      // check if not set
      if(!avaible) continue

      var saved = save_value(branch,name,entry.text());

      log();
      log('guiConfigEntry',name);

      if(saved.invalid){
        log('guiConfigValueInvalid', saved.value);
        continue;
      }

      log('guiConfigValueOld', saved.old_value);
      log('guiConfigValueNew', saved.value);

      saved.is_same ? ++updates : ++inserts;
    }

    log();
    log('guiStatistics');
    log();
    log('guiStatisticNew', inserts);
    log('guiStatisticUpdated', updates);

    return true;
  }

  var update_configset = function(){
    log(true);
    log('guiStartUpdate');
    log();

    var uri = $('#configset\\.source\\.uri').val(),
        status = ajax.check_url(uri);

    // something is fishy about the given url
    if(status[0] != 'requestUrlOk'){
      log.apply(null,status);
      return;
    }

    log('requestConnectWithoutLink');

    new ajax(uri,{
      timeout: 10* 1000, // wait 10 seconds
      contentType: 'text/xml',
      onSuccess: function(xhr){
        var status = ajax.od_helper_ok(xhr);

        log(status);
        if(status != 'responseStatusOK') return;

        // did update_configset_with_xhr success?
        var successed = update_configset_with_xhr(xhr,uri);

        if(successed)refresh_gui();
      },
      onFailure: function(xhr){
        if(xhr.timeout){
          log('requestTimeout');
        }
        log('requestConnectionFailer');
      }
    });
  }

  var set_value = function(e,value){
    var e = $(e);
    if(!e.length) return false;

    var tag_name = e.get(0).tagName.toLowerCase();
    if(!editable[tag_name]) return false;

    if(tag_name == 'checkbox')
      return e.attr('checked', value === true);

    return e.val(value);
  }

  var disable = function(e, boolean){
    var e = $(e);
    if(!e.length) return false;

    var tag_name = e.get(0).tagName.toLowerCase();
    if(!editable[tag_name]) return false;

    return boolean === true ? e.attr('disabled',boolean) : e.removeAttr('disabled');
  }

  var toggle_caption = function(elements){
    $(elements).each(function(i,e){
      var e = $(e), right_parent = e.parent().is('caption')
          checked = e.attr('checked') == 'true';

      if(!right_parent) return;

      e.parents('groupbox:first')
       .find(':not(caption > checkbox)')
       .each(function(i,e){ disable(e,!checked); });
    });
  }

  var refresh_gui = function(){
    var branch = db.moz.plugin.preferences.get_branch('configset.'),
        children = branch.get_children();

    for(var i = 0, len = children.length; i<len; ++i){
      var name = children[i],
          value = branch.get(name),
          id = santitize(name),
          e = $('#' + id);

      set_value(e,value);
    }

    // disable all elements in a groupbox if a checkbox in a 
    // caption exists and this checkbox is unchecked
    toggle_caption('caption > checkbox');
  }

  var onload = function(){
    // bind toggle events
    $('checkbox').click(function(){
      toggle_caption(this);
    });
    refresh_gui();
  }

  var wrapper = function(callback){
    return function(){
      try{
        return callback();
      }catch(e){
        alert(e);
      }
    }
  }

  var save = function(){
    var branch = db.moz.plugin.preferences.get_branch('configset.'),
        children = branch.get_children();

    for(var i = 0, len = children.length; i<len; ++i){
      var name = children[i],
          id = santitize(name),
          e = $('#' + id);

      if(!e.length) continue;

      var tag_name = e.get(0).tagName.toLowerCase()

      if(tag_name == 'checkbox'){
        save_value(branch,name,e.attr('checked') == 'true' ? 'true' : 'false');
        continue;
      }

      save_value(branch,name,e.val());
    }

    return true;
  }

  return {
    'openHomepage': function(){
      const browser= window.opener.gBrowser;
      browser.selectedTab = browser.addTab('http://db.wiki.seiringer.eu/plugin/');
    },
    'save': wrapper(save),
    'onload': wrapper(onload),
    'refresh_gui': wrapper(refresh_gui),
    'update_configset': wrapper(update_configset),
    'cmd_open': function(){
      db.moz.plugin.gui.openDialog("preferences");
    }
  }
})();