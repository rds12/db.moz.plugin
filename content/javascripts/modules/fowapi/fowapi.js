//= basic
//= location

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'fowapi',
  module_author:      'rds12',
  module_version:     '2011-02-16',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,
  
  window : null,
  system_viewable: false,
  
  log: function(message){
    if(!this.window) return;
    this.window.append('<div>'+message+'</div>');
  },
  
  initialize: function(){
    const basic = this.modules.basic;
    const location = this.modules.location;

    if(location == undefined) throw 'location not avaible';
    if(!basic.is_logged_in) return;

    // nothing to do with planet? -> exit
    if(!(location.main == 'system' && location.sub == 'main')) return;

    this.system_viewable = this.modules.system.viewable;

    this.gui_extending_fow(location.options.system_id);

    basic.log('modules.fowapi',null,true);
    basic.log(this.system_viewable,'system_viewable');
  },
  
  replace_placeholders: function(string,id){
    const holders = this.modules.basic;
    return string.replace('%s', id || '%s').
           replace('%w', holders.world || '%w').
           replace('%h', holders.host || '%h');
  },
  
  format_scan_date: function(time,scantype){
    var css = {1: 'dbMozPluginFowNewerScan', 2:'dbMozPluginFowOlderScan'};
    return this.template('responseScanDateFormat',css[scantype] || '',time);
  },

  parse_system_unless_updated: function(odh){
    if(true !== this.lib.preferences.get('preferences.system.autoParsing'))
      return;

    // don't parse fow systems
    if(!this.system_viewable) return false;

    var current = odh.find('system > scanDate').attr('current');

    // 1 - up-to-date, 2 - _not_ up-to-date
    if(current != '2') return;

    this.log(this.template('responseAutoParse'));
    var doc = this.od.doc;

    /*
     * We have a Site named A.
     * Every time the Location of A changes, all instances of modules
     * get a reference to A.document.
     *
     * This ajax request is async.
     * In the meantime of loading Process the pages location can change
     * to Site named B.
     *
     * The new B.document will be binded to all instances of modules
     * but the async. request is still in memory and the A.document
     * is still avaible, but the A.document.location is now undefined.
     *
     * So we can determine with A.document.location, if the originial
     * Page A is still active.
     */
    // force parsing, because location is unset
    db.moz.plugin.parser.parseSite(doc,!doc.location);
  },

  mask_text: function(text){
    text = text || '';
    return text.replace(/&/g,'&amp;')
               .replace(/</g,'&lt;')
               .replace(/>/g,'&gt;')
               .replace(/'/g,'&#34;')
               .replace(/"/g,'&quot;');
  },

  is_fow_response_ok: function(xhr,debug){
    const self = this;

    var invalid = function(){
      if(debug) self.log(self.template.apply(self,arguments));
      return false;
    }

    var valid = function(){
      return !invalid.apply(null,arguments);
    }

    var odh_status = this.lib.ajax.od_helper_ok(xhr);

    if(odh_status == 'responseStatusNotOK'){
      var $ = xhr.responseHTML.$,
          // extend with | as delimitter to use individual status messages
          status = ($.find('odh\\:status').text().match(/\d+/) || [''])[0],
          defaultText = !/204/.exec(status),
          message = 'responseStatus' + (defaultText ? 'Default' : status);

      return invalid(message,status);
    }

    if(odh_status != 'responseStatusOK')
      return invalid(odh_status);
    odh_status = null;

    var $ = xhr.responseHTML.$; 
    valid('responseStatusOK');

    var sid = this.modules.location.options.system_id,
        xhr_sid = self.mask_text($.find('system').attr('sid'));

    if(sid != xhr_sid)
      return invalid('responseStatusMismatch',sid,xhr_sid);
    sid = null;
    xhr_sid = null;

    if(!$.find('system > planet').length)
      valid('responseStatusUnscouted');

    if(!$.find('system > systemInfo').length)
      valid('responseStatusNoSystemTable');

    if(!self.system_viewable)
      valid('responseStatusFowSystem');

    var scanDate = $.find('system > scanDate'),
        scanText = this.format_scan_date(
          self.mask_text(scanDate.text()),
          self.mask_text(scanDate.attr('current')));

    return valid('responseLastScan', scanText);
  },

  gui_extending_fow_datas: function(odh){
    this.parse_system_unless_updated(odh);
    this.gui_extending_system(odh);
    this.gui_extending_system_table(odh.find('system > systemInfo'));
    this.gui_extending_planet_hover(odh.find('system > planet'));
  },

  gui_extending_system: function(odh){
    const $ = this.od.jQuery;
    const self = this; 

    var comment = this.mask_text(odh.find('system > comment').text());
    // if system comment is avaible, append it 
    if(!comment.match(/^\s*$/)){
      $('#sysid').parents('div:first').append(
        self.template('systemComment',comment)
      );
    }
  },

  gui_extending_planet_hover: function(planets){
    const $ = this.od.jQuery;
    const self = this; 
    const prefs = this.lib.preferences;

    if(!planets.length) return;

    // force orbit to get identified, for gate pictures
    // because user can disable this feature
//    this.modules.system.gui_extending_orbit_clickable(true);

    planets.each(function(i,element){
      var element = $(element),
          pid = element.attr('pid'),
          planet = $('#'+pid);

      if(!planet.length) return;

      var hover = planet.parents('a:first'),
          text = hover.attr('onmouseover'),
          regex = ["dlt\\('",
                   ".+?", // #1: planet values
                   "','",
                   ".+?", // #3: planetname
                   "'\\);setter\\('",
                   ".+?", // #5: player informations
                   "'\\);kringler\\(",
                   "\\d+", // #7: planetid
                   "\\);"],
          info = new RegExp('^(' + regex.join(')(') + ')$'),
          parsed = text.match(info);

      if(!parsed) return;

      var mask_text= function(text){
        return self.mask_text(text);
      }

      var mask = function(element){
        return mask_text(element.text());
      }

      // delete the first element
      parsed.shift();

      var owner = mask(element.find('userName')),
          owner_id = mask(element.find('userid')),
          race = mask(element.find('userRace')),
          alliance = mask(element.find('userAlliance')),
          alliance_tag = mask(element.find('userAllianceTag')),
          alliance_id = mask(element.find('userAllianceId')),
          scanDate = element.find('scanDate'),
          scanDateText = mask(scanDate),
          scanDateCurrent = mask_text(scanDate.attr('current')),
          scanImg = mask(element.find('scanImg')),
          orbit = element.find('orbit'),
          orbitText = mask(orbit),
          orbitType = mask_text(orbit.attr('type')),
          size = mask_text(element.attr('size')),
          comment = mask(element.find('comment')),
          population = mask(element.find('population')),
          ore = mask(element.find('erz')),
          crystal = mask(element.find('kristall')),
          tungsten = mask(element.find('wolfram')),
          fluoride = mask(element.find('fluor'));

      // is system in fow, replace api-datas with od-datas
      if(!self.system_viewable){
        parsed[1] = self.template('fowPlanetMouseover', owner,
          ore, crystal, tungsten, fluoride, population, size
        );
        // #0: owner, #1: owner_id, #2: alliance_tag
        // #3: alliance_id, #4: race
        parsed[5] = [owner,owner_id,alliance_tag,alliance_id,race].join("','");
      }

      // adding a picture bar to every planet
      hover.addClass('dbMozPluginPlanet').append('<div/>');
      var picture_bar = hover.children('div:first');

      // if scan picture is avaible, append it! 
      if(!scanImg.match(/^\s*$/)){
        parsed[1] += self.template('fowPlanetScanPic',
          scanImg,self.format_scan_date(scanDateText,scanDateCurrent)
        );

        picture_bar.prepend(self.template('planetToolbarScanned'));
      }

      // if comment is avaible, append it 
      if(!comment.match(/^\s*$/)){
        // 2010.05.04: disabled inline comments in planet-overviews 
        //parsed[1] += self.template('fowPlanetComment',comment);

        picture_bar.prepend(self.template('planetToolbarComment',comment));
      }

      var type = (orbitType.match(/M|G|R/i) || [''])[0].toUpperCase() , 
      pictures = {
        G: 'http://www.omega-day.com/spielgrafik/grafik/allgemein/tor.gif',
        M: 'http://www.omega-day.com/spielgrafik/grafik/allgemein/sprung.gif',
        R: 'http://www.omega-day.com/spielgrafik/grafik/allgemein/riss.gif'
      };

      var orbit = $('#orbit-'+pid);
      // if fow-system and gate type was set
      if(!self.system_viewable && type != '' && orbit.length){

        // change orbit picture

        // odhelper size the planet with 100px and 70px, so we have to
        // resize it to normal size
        orbit.find('img').attr('src',pictures[type])
             .css({width: '100px', height: '90px'});

        // extending orbit text
        var regex = /^(dlt\(')(.+?)(','.+)$/,
            orbit_hover = orbit.attr('onmouseover') || '',
            match = orbit_hover.match(regex) || ['','','',''];

        // delete first element
        match.shift();

        // append gate message
        if(!/^\s*$/.test(orbitText))
          match[1] += '<br><br>' + orbitText;

        // new mouseover
        orbit.attr('onmouseover',match.join(''))
      }

      hover.attr('onmouseover',parsed.join(''));
    })
  },
  
  gui_extending_system_table: function(system_info){
    const $ = this.od.jQuery;
    const self = this; 

    if(!system_info.length) return;

    $('#maincontent').append(self.template('fowTable'));
    var fow_table = $('#dbMozPluginFowTable');

    var add_td = function(e,is_header,i){
      var td = $('<td/>').text(e.text());

      if(is_header){
        td.css('font-weight','bold');
      }

      var colspan = e.attr('colspan'),
          rowspan = e.attr('rowspan'),
          system_id = self.modules.location.options.system_id,
          href = e.attr('href'),
          href = href ? self.replace_placeholders(href,system_id) : null;

      if(href)td.wrapInner('<a href="'+href+'" />');
      if(colspan) td.attr('colspan',colspan)
      if(rowspan) td.attr('rowspan',rowspan)

      return td;
    }

    var counter = 0;

    var add_tr = function(e,is_header,i){
      var class = is_header ? 'tablecolor' : '';

      // toggle between highlighting and not
      if(is_header) counter = 0;
      else class = (++counter) % 2 ? 'tabletranslight' : ''; 

      var tr = $('<tr/>').addClass(class);

      e.children().each(function(i,e){
        var nodeName = e.nodeName, e = $(e);

        // only th and td childs are allowed
        if(!/^(th|td)$/.test(nodeName))return;
        var td = add_td(e,nodeName == 'th',i);

        tr.append(td);
      });

      return tr;
    }

    system_info.children().each(function(i,e){
      var nodeName = e.nodeName;

      // only thr and tr childs are allowed
      if(!/^(thr|tr)$/.test(nodeName))return;

      var tr = add_tr($(e),nodeName == 'thr',i);
      fow_table.append(tr);
    });
  },

  gui_extending_append_fow_window: function(){
    const $ = this.od.jQuery;
    $('body').append(this.template('statusWindow'));
    
    this.window = $('#dbMozPluginFowWindow');
  },

  gui_extending_fow: function(system_id){
    const prefs = this.lib.preferences;
    const ajax = this.lib.ajax;
    const self = this;

    // if odhelper and the fow api is activated, 
    // we are doing pretty heavy things, like looking up to the sky XD
    if(this.modules.basic.is_odhelper_enabled && 
      true === prefs.extern('extensions.odhelp.extDisableFow')
    ) return;

    if(!system_id) return;
    
    // fow api enabled?
    var enabled = prefs.get('preferences.configset.extDisableFow');
    if(enabled != true) return;

    this.gui_extending_append_fow_window();

    // get uri
    var uri = prefs.get('preferences.configset.extFowApiUri');
    uri = this.replace_placeholders(uri,system_id);

    // test if uri is not empty 
    if(/^\s*$/.test(uri)){
      self.log(self.template('requestNoUrl',uri));
      return;
    }

    // system is viewable and the config says not to complete the system
    if(self.system_viewable && true != prefs.get('preferences.configset.extFowKnown')){
      self.log(self.template('requestExtendNotSystem',uri));
      return;
    }

    self.log(self.template('requestConnect',uri));

    new ajax(uri,{
      timeout: 10* 1000, // wait 10s
      contentType: 'text/xml',
      onSuccess: function(xhr){
        // response ok?
        if(!self.is_fow_response_ok(xhr,true)) return;

        self.gui_extending_fow_datas(xhr.responseHTML.$);
      },
      onFailure: function(xhr){
        if(xhr.timeout){
          self.log(self.template('requestTimeout'));
        }
        self.log(self.template('requestFailed'));
      }
    });
  }
});
