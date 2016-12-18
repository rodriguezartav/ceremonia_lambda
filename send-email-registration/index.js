var dotenv = require("dotenv");
dotenv.load();

var AWS = require('aws-sdk');
var UltraSES = require('ultrases');
var Plates = require("plates");
var Request = require("superagent");
var q = require("q");

var fs = require("fs");
var mailer = new UltraSES({
  sdk: AWS,
  defaults: { from: 'Ceremonia Ayahuasca <web@3vot.com>' }
});

exports.handler = function( event, context, callback ) {
  var lambda = new Lambda(event);

  lambda.checkRecordExists()
  .then( function(res){
    return lambda.createRecord();
  })
  .then( function(res){
    return lambda.sendEmail();
  })
  .then( function(res){
    callback(null, { success: true } );
  })
  .fail( function(err){
    if(err.message.indexOf("code 1") > -1) callback(null, { success: false, error: err.message, code: 1 } );
    else callback(err);
  }).done();
};


function Lambda(event){
  this.bookId = '58459e566d3f1e0300613e49';
  this.baseUrl = 'https://api.fieldbook.com/v1/' + this.bookId;
  this.username = process.env.USERNAME;
  this.password = process.env.PASSWORD;
  this.url = this.baseUrl + '/pacientes';

  this.record = {
    nombre: event["body-json"].nombre,
    email: event["body-json"].email,
    celular: event["body-json"].celular,
    jueves: event["body-json"].jueves,
    sabado: event["body-json"].sabado,
    domingo: event["body-json"].domingo,
  };
}

Lambda.prototype.checkRecordExists = function(){
  var defered = q.defer();
  var _this = this;
  var url = this.url + '?email=' + this.record.email;

  this.getRequest(url, "get","")
  .end( function(err,res){
    console.log(this.record)
    console.log(res.body)
    if(err) return defered.reject( new Error(err) );
    if( res.body && res.body.length > 0 ) return defered.reject( new Error(_this.record.email + " exists (code 1)") );
    defered.resolve(res.body);
  });

  return defered.promise;
}

Lambda.prototype.createRecord = function(){
  var defered = q.defer();

  var monto = 0;
  var dias = 0;
  var personas = 0;
  if( this.record.jueves ){
    personas = this.record.jueves
    dias++;
  }
  if( this.record.sabado ){
   personas = this.record.juevsabadoes;
    dias++;
  }
  if( this.record.domingo ){
    personas = this.record.domingo;
    dias++;
  }
  if( dias == 1) monto = 150 * personas;
  if( dias == 2) monto = 300 * personas;
  if( dias == 3) monto = 500 * personas;
  this.record.monto = monto;
  this.record.personas = personas;

  this.getRequest(this.url, "post","")
  .send(this.record)
  .set("Content-Type","application/json")
  .end( function(err,res){
    if(err) defered.reject(new Error(err));
    else defered.resolve(res.body);
  })

  return defered.promise;
}

Lambda.prototype.sendEmail = function(){
  var defered = q.defer();


  this.record.monto2 = this.record.monto;
  var email = {cc: "roberto@3vot.com", to: this.record.email, subject: 'Informacion para completar su reservacion.'};
  var html = fs.readFileSync("./template.html");
  var output = Plates.bind(html, this.record);

  mailer.sendHTML(email, output, function(emailErr,emailRes){
    if(emailErr) defered.reject(err);
    else defered.resolve(emailRes);
  })
  return defered.promise;
}

Lambda.prototype.getRequest = function(url, method,query){
  return Request[method](url)
  .query(query)
  .auth(this.username,this.password)
}

