// @see http://helper.omega-day.com/man/configset

/*** >> Basic */

// configset name
pref("extensions.db.moz.plugin.preferences.configset.source.name",'');

// uri from which the configset was downloaded 
pref("extensions.db.moz.plugin.preferences.configset.source.uri",'');

/*** >> Parser */

// use parser interface?  
pref("extensions.db.moz.plugin.preferences.configset.parserUseExt",false);

// uri for parser interface 
pref("extensions.db.moz.plugin.preferences.configset.parserTargetUri",'');

// name of textarea
pref("extensions.db.moz.plugin.preferences.configset.parserTargetElement",'');

// source method of odhelper, db.moz.plugin don't support this
pref("extensions.db.moz.plugin.preferences.configset.extSrcMeth",0);

// copy source code to clipboard 
pref("extensions.db.moz.plugin.preferences.configset.parserClipboardCopy",false);

// 'ctrl + alt + key' to trigger site parsing
pref("extensions.db.moz.plugin.preferences.parserShortcutKey",'P');

// form number of parser interface, db.moz.plugin don't support this
// for what reason does odhelper needs this? i mean we have the
// textarea name Ò.ó
pref("extensions.db.moz.plugin.preferences.configset.parserTargetForm",0);

/*** >> Toolbar */

/** > internal toolbar */

// db.moz.plugin don't support this option
// true  - input is number:id or string:name 
// false - input is number:id
pref("extensions.db.moz.plugin.preferences.configset.tbIntToolUserNick",false);

// system search uri for od 
pref("extensions.db.moz.plugin.preferences.configset.tbIntToolSysUri",
     'http://%h/game/?op=system&sys=%s');

// planet search uri for od 
pref("extensions.db.moz.plugin.preferences.configset.tbIntToolPlanUri",
     'http://%h/game/?op=orbit&index=%s');

// shop search uri for od 
pref("extensions.db.moz.plugin.preferences.configset.tbIntToolShopUri",
     'http://%h/game/?op=shop2&welch=%s');

// user search (only id) uri for od 
pref("extensions.db.moz.plugin.preferences.configset.tbIntToolUserUri",
     'http://%h/game/?op=usershow&welch=%s');

// user search (only name) uri for od 
pref("extensions.db.moz.plugin.preferences.configset.tbIntToolUserNickUri",
     'http://%h/game/?op=score&findstring=%s');

// alliance search (only id) uri for od 
pref("extensions.db.moz.plugin.preferences.configset.tbIntToolAllyUri",
     'http://%h/game/?op=allyshow&welch=%s');

// alliance search (only name) uri for od 
pref("extensions.db.moz.plugin.preferences.configset.tbIntToolAllyNickUri",
     'http://%h/game/?op=ally&findstring=%s');

/** > external toolbar */

// system search uri for od 
pref("extensions.db.moz.plugin.preferences.configset.tbExtToolSysUri",'');

// planet search (only id) uri for od 
pref("extensions.db.moz.plugin.preferences.configset.tbExtToolPlanUri",'');

// planet search (only name) uri for od
pref("extensions.db.moz.plugin.preferences.configset.tbExtToolPlanNameUri",'');

// user search (only id) uri for od 
pref("extensions.db.moz.plugin.preferences.configset.tbExtToolUserUri",'');

// user search (only name) uri for od 
pref("extensions.db.moz.plugin.preferences.configset.tbExtToolUserNickUri",'');

// alliance search (only id) uri for od 
pref("extensions.db.moz.plugin.preferences.configset.tbExtToolAllyUri",'');

// alliance search (only name) uri for od 
pref("extensions.db.moz.plugin.preferences.configset.tbExtToolAllyNickUri",'');

/*** >> Fow Api */

// true - api not avaible, false - api avaible
pref("extensions.db.moz.plugin.preferences.configset.extDisableFow",false);

// fow uri to extend a systems informations
pref("extensions.db.moz.plugin.preferences.configset.extFowApiUri",'');

// use this api in systems without fow, too
// but don't use planet materials
pref("extensions.db.moz.plugin.preferences.configset.extFowKnown",false);

/*** >> IRC */

// should irc link be fixed?
pref("extensions.db.moz.plugin.preferences.configset.extFixIrc",true);

// irc host
pref("extensions.db.moz.plugin.preferences.configset.extFixIrcHost",'irc.euirc.net');

// irc port
pref("extensions.db.moz.plugin.preferences.configset.extFixIrcPort",6667);

// irc channel
pref("extensions.db.moz.plugin.preferences.configset.extFixIrcChan",'#omega-day');

