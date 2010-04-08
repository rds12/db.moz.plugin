//= basics.js

Namespace('db.moz.plugin');

// @see: https://developer.mozilla.org/en/Storage

db.moz.plugin.database = function(database_name){
  if(!(this instanceof db.moz.plugin.database))
    return new db.moz.plugin.database(database_name);

  this.storageService = Components.classes["@mozilla.org/storage/service;1"]
                      .getService(Components.interfaces.mozIStorageService);

  this.connection = null;
  this.error = null;
  this.connect(database_name);
}

db.moz.plugin.database.prototype = {
  // get database location, if raw_sql database does not exists, 
  // it will be created
  connect: function(database_name){
    try{
      var file = Components.classes["@mozilla.org/file/directory_service;1"]
                   .getService(Components.interfaces.nsIProperties)
                   .get("ProfD", Components.interfaces.nsIFile);
      file.append(filename+".sqlite");
      // Will also create the file if it does not exist
      this.connection = this.storageService.openDatabase(file);
    }catch(e){
      this.error = e;
    }
  },

  lastRowID: function(){
    if(!this.isConnected()) return 0;
    return this.connection.lastInsertRowID;
  },

  isConnected: function(){ return !!this.connection;},

  getLastError: function(rawSql){
    try{
      throw new TypeError("SQL: `" + rawSql + "`" +
            "\nErrorcode: " + this.connection.lastError +
            "\nErrortext: " +
            this.connection.lastErrorString);
    }catch(e2){
      return e2;
    }
  },

  // executes sql without a result from sqlite
  execute: function(rawSql){
    if(!this.isConnected()) return false;

    try{
      this.connection.executeSimpleSQL(rawSql);
    }catch(e){
      this.error = this.getLastError(rawSql);
      db.moz.plugin.console.warn('sqlite execute error',this.error);
      return false;
    }
    return true;
  },

  convertType: function(value){
    var type = db.moz.plugin.basics.get_type(value);
    if(type == "Boolean") return (value ? 1: 0);
    if(type == "Undefined") return null;
    if(type == "String") return value;
    if(type == "Number") return value;
    return null;
  },

  insert: function(tablename,hash,options){
    options = options || {};
    hash = hash || {};

    var sql = "INSERT INTO " + tablename + " ",
        keys = [], values = [];

    for(var key in hash){
      if(db.moz.plugin.basics.is_function(hash[key]))
        continue;
      keys.push(key);
      values.push(":" + key);
      hash[key] = this.convertType(hash[key]);
    }

    sql+= "('" + keys.join("','") + "') VALUES ";
    sql+= "(" + values.join(",") + ")";
    db.moz.plugin.console.message(sql);

    var query = this.newQuery(sql,hash);
    return query.execute(null,options['onError'],options['onCompletion']);
  },

  update: function(tablename,hash,options){
    options = options || {};
    hash = hash || {};

    var sql = "UPDATE " + tablename + " SET ", values = [];

    for(var key in hash){
      if(db.moz.plugin.basics.is_function(hash[key]))
        continue;
      values.push(key + ' = :' + key);
      hash[key] = this.convertType(hash[key]);
    }

    sql += values.join(' , ');
    db.moz.plugin.console.message(sql);

    if(options['where']){
      sql += ' WHERE ' + options['where'];
    }

    var query = this.newQuery(sql,hash);
    return query.execute(null,options['onError'],options['onCompletion']);
  },

  newQuery: function(rawSql, params){
    return new db.moz.plugin.database.query(this,rawSql,params);
  },

  emptyTable: function(tablename, options){
    options = options || {};
    var query = this.newQuery('DELETE FROM '+ tablename);
    return query.execute(null,options['onError'],options['onCompletion']);
  }
}

db.moz.plugin.database.query = function(database,rawSql,params){
  if(!(this instanceof db.moz.plugin.database.query))
    return new db.moz.plugin.database.query(database,rawSql,params);

  this.basics = db.moz.plugin.basics;
  this.database = database;
  this.statement = null;
  this.error = null;
  this.cache = {};
  this.rawSql = rawSql;
  this.params = params || {};

  this.bindParams = function(params){
    for(var key in params){
      if(this.basics.is_function(params[key]))
        continue;
      this.statement.params[key] = params[key];
    }
  }

  try {
    this.statement = database.connection.createStatement(rawSql);
    this.bindParams(this.params);
  }catch(e){
    this.statement = null;
    this.error = this.database.getLastError(rawSql);
    db.moz.plugin.console.warn('sqlite query error',this.error);
  }
}

db.moz.plugin.database.query.prototype = {
  isExecutable: function(){
    return !!this.statement;
  },

  execute: function(onResult, onError, onCompletion){
    var exec = {

      handleResult: function(results) {
        onResult(results);
      },

      handleError: function(aError) {
        onError(aError);
      },

      handleCompletion: function(aReason) {
        onCompletion({
          REASON_FINISHED: 0,
          REASON_CANCELED: 1,
          REASON_ERROR: 2,
          reason: aReason
        });
      }
    };

    // unless onResult is defined, don't execute
    // something on handleResult
    if(!this.basics.is_function(onResult)){
      exec.handleResult = function(){};
    }

    // unless onCompletion is defined, don't execute
    // something on handleCompletion
    if(!this.basics.is_function(onCompletion)){
      exec.handleCompletion = function(){};
    }
    
    // unless onError is defined, don't execute
    // something on handleError 
    if(!this.basics.is_function(onError)){
      exec.handleError = function(){};
    };

    // is statement executable? if not return error and completion
    if(!this.isExecutable()){
      exec.handleError(this.error);
      exec.handleCompletion(2 /*REASON_ERROR*/);
      return false;
    }

    this.statement.executeAsync(exec);
    return true;
  },

  size: function(){
    if(!this.isExecutable()) return 0;
    return this.statement.numEntries;
  },

  columnNames: function(){
    if(!this.isExecutable()) return [];
    if(this.cache.columnNames) return this.cache.columnNames;
    var size  = this.statement.columnCount,
        names = [];

    for(var i=0; i < size; ++i){
      names.push(this.statement.getColumnName(i));
    }

    this.cache.columnNames = names; 
    return names;
  },

  each: function(onResult, onError, onCompletion){
    if(!this.basics.is_function(onResult)) return false;

    var onExtendedCompletion = null;
    if(this.basics.is_function(onCompletion)){
      onExtendedCompletion = function(result){
        result['fetched'] = fetchedRows > 0;
        result['fetchedRows'] = fetchedRows;
        onCompletion(result);
      }
    }

    var columnNames = this.columnNames();
    var rowToHash = function(row){
      var hash = {};
      for(var i = 0, size = columnNames.length; i < size; ++i){
        hash[columnNames[i]] = row.getResultByIndex(i);
      }
      return hash;
    }
    var fetchedRows = 0;

    return this.execute(function(results){
      for (var row = results.getNextRow(); row; 
               row = results.getNextRow()) {
        onResult(rowToHash(row),fetchedRows++,results);
      }
    }, onError, onExtendedCompletion);
  }
}