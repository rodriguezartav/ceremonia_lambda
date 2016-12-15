var path = require("path");
var q = require( path.resolve(process.cwd(), "node_modules" ,"q") );
var jsforce = require( path.resolve(process.cwd(), "node_modules" ,"jsforce") );

function Query(email, query){
  var defered = q.defer();
  var rows;
  var _this = this;
  this.runQuery( email.conn, query )
  .then( function(rows){
    _this.rows = rows;
    return rows;
  })
  .then( function(){ return defered.resolve(_this.rows) } )
  .fail( defered.reject );

  return defered.promise;
}

Query.prototype.runQuery = function( conn, queryString ){
  var defered = q.defer();
  var records = [];
  conn.query(queryString)
   .on("record", function(record) {
    records.push(record);
  })
  .on("end", function(query) {
    defered.resolve(records);

  })
  .on("error", function(err) {
    defered.reject(err);
  })
  .run({ autoFetch : true, maxFetch : 1000000 });
  return defered.promise;
}

module.exports = Query;
