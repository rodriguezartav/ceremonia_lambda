var path = require("path");
var q = require( path.resolve(process.cwd(), "node_modules" ,"q") );
var jsforce = require( path.resolve(process.cwd(), "node_modules" ,"jsforce") );

function login(){
  var defered = q.defer();
   var conn = new jsforce.Connection( { loginUrl : process.env["SF_HOST"] });
    conn.login(process.env["SF_USERNAME"], process.env["SF_PASSWORD"], function(err, res) {
      if (err) return defered.reject(err);
      return defered.resolve(conn);
    });
    return defered.promise;
}

module.exports = login;
