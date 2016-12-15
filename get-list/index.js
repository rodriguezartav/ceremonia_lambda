var dotenv = require("dotenv");
dotenv.load();

var AWS = require('aws-sdk');
var Request = require("superagent");
var q = require("q");


exports.handler = function( event, context, callback ) {
  var lambda = new Lambda(event);

  lambda.getList()
  .then( function(res){
    var count = {jueves: [], sabado: [], domingo: []}
    var pacientes = res.map( function(item){
      item.email = null;
      item.celular = item.celular.toString().substring(3);
      if( item.jueves > 0) count.jueves++;
      if( item.sabado > 0) count.sabado++;
      if( item.domingo > 0) count.domingo++;
      return item;
    })
    callback(null, {items: pacientes, count: count} );
  })
  .fail( function(err){
    callback(err);
  }).done();
};


function Lambda(event){
  this.bookId = '58459e566d3f1e0300613e49';
  this.baseUrl = 'https://api.fieldbook.com/v1/' + this.bookId;
  this.username = process.env.USERNAME;
  this.password = process.env.PASSWORD;
  this.url = this.baseUrl + '/pacientes';

}

Lambda.prototype.getList = function(){
  var defered = q.defer();
  var _this = this;
  var url = this.url;

  this.getRequest(url, "get","")
  .end( function(err,res){
    if(err) return defered.reject( new Error(err) );
    defered.resolve(res.body);
  });

  return defered.promise;
}




Lambda.prototype.getRequest = function(url, method,query){
  return Request[method](url)
  .query(query)
  .auth(this.username,this.password)
}

