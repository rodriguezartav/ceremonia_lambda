var EventEmitter = require('events').EventEmitter;


var fs = require("fs");

var argv = require('yargs').argv;
var dotenv = require('dotenv');
var lambda = require('./main.js');
var program = require('commander');
var Moment = require("moment");

var AWS = require("aws-sdk");


var AWS_ENVIRONMENT;
var CONFIG_FILE;
var EXCLUDE_GLOBS;
var AWS_ACCESS_KEY_ID;
var AWS_SECRET_ACCESS_KEY;
var AWS_SESSION_TOKEN;
var AWS_REGION;
var AWS_FUNCTION_NAME;
var AWS_HANDLER;
var AWS_ROLE;
var AWS_MEMORY_SIZE;
var AWS_TIMEOUT;
var AWS_DESCRIPTION;
var AWS_RUNTIME;
var AWS_PUBLISH;
var AWS_FUNCTION_VERSION;
var AWS_VPC_SUBNETS;
var AWS_VPC_SECURITY_GROUPS;
var EVENT_FILE;
var PACKAGE_DIRECTORY;
var CONTEXT_FILE;

function load(){
  CONFIG_FILE = ".env";
  AWS_ENVIRONMENT = '';
  EXCLUDE_GLOBS = process.env.EXCLUDE_GLOBS || '';
  AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
  AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
  AWS_SESSION_TOKEN = process.env.AWS_SESSION_TOKEN || '';
  AWS_REGION = process.env.AWS_REGION || 'us-east-1,us-west-2,eu-west-1';
  AWS_FUNCTION_NAME = process.env.AWS_FUNCTION_NAME;
  AWS_HANDLER = 'index.handler';
  AWS_ROLE = process.env.AWS_ROLE_ARN || process.env.AWS_ROLE || 'missing';
  AWS_MEMORY_SIZE = process.env.AWS_MEMORY_SIZE || 128;
  AWS_TIMEOUT = process.env.AWS_TIMEOUT || 60;
  AWS_DESCRIPTION = process.env.AWS_DESCRIPTION || '';
  AWS_RUNTIME = process.env.AWS_RUNTIME || 'nodejs4.3';
  AWS_PUBLISH = process.env.AWS_PUBLIS || false;
  AWS_FUNCTION_VERSION = process.env.AWS_FUNCTION_VERSION || '';
  AWS_VPC_SUBNETS = process.env.AWS_VPC_SUBNETS || '';
  AWS_VPC_SECURITY_GROUPS = process.env.AWS_VPC_SECURITY_GROUPS || '';
  EVENT_FILE = process.env.EVENT_FILE || 'event.json';
  PACKAGE_DIRECTORY = process.env.PACKAGE_DIRECTORY;
  CONTEXT_FILE = process.env.CONTEXT_FILE || 'context.json';

}

dotenv.config( { path: "../.env"  } );
dotenv.config( { path: "./.config"  } );

load();

program
  .version(lambda.version)
  .command('deploy')
  .description('Deploy your application to Amazon Lambda')
  .option('-a, --accessKey [' + AWS_ACCESS_KEY_ID + ']', 'AWS Access Key', AWS_ACCESS_KEY_ID)
  .option('-s, --secretKey [' + AWS_SECRET_ACCESS_KEY + ']', 'AWS Secret Key', AWS_SECRET_ACCESS_KEY)
  .option('-k, --sessionToken [' + AWS_SESSION_TOKEN + ']', 'AWS Session Token', AWS_SESSION_TOKEN)
  .option('-n, --functionName [' + AWS_FUNCTION_NAME + ']', 'Lambda FunctionName', AWS_FUNCTION_NAME)
  .option('-r, --region [' + AWS_REGION + ']', 'AWS Region', AWS_REGION)
  .option('--handler [' + AWS_HANDLER + ']', 'Lambda Handler {index.handler}', AWS_HANDLER)
  .option('-o, --role [' + AWS_ROLE + ']', 'Amazon Role ARN', AWS_ROLE)
  .option('-m, --memorySize [' + AWS_MEMORY_SIZE + ']', 'Lambda Memory Size', AWS_MEMORY_SIZE)
  .option('-t, --timeout [' + AWS_TIMEOUT + ']', 'Lambda Timeout', AWS_TIMEOUT)
  .option('-d, --description [' + AWS_DESCRIPTION + ']', 'Lambda Description', AWS_DESCRIPTION)
  .option('-u, --runtime [' + AWS_RUNTIME + ']', 'Lambda Runtime', AWS_RUNTIME)
  .option('-p, --publish [' + AWS_PUBLISH + ']', 'Lambda Publish', AWS_PUBLISH)
  .option('-v, --version [' + AWS_FUNCTION_VERSION + ']', 'Lambda Function Version', AWS_FUNCTION_VERSION)
  .option('-b, --vpcSubnets [' + AWS_VPC_SUBNETS + ']', 'Lambda Function VPC Subnets', AWS_VPC_SUBNETS)
  .option('-g, --vpcSecurityGroups [' + AWS_VPC_SECURITY_GROUPS + ']', 'Lambda VPC Security Group',
    AWS_VPC_SECURITY_GROUPS)
  .option('-p, --packageDirectory [' + PACKAGE_DIRECTORY + ']', 'Local Package Directory', PACKAGE_DIRECTORY)
  .option('-f, --configFile [' + CONFIG_FILE + ']',
    'Path to file holding secret environment variables (e.g. "deploy.env")', CONFIG_FILE)
  .option('-x, --excludeGlobs [' + EXCLUDE_GLOBS + ']',
    'Space-separated glob pattern(s) for additional exclude files (e.g. "event.json dotenv.sample")', EXCLUDE_GLOBS)
  .action(function (prg) {
    console.log(prg)
  	lambda.deploy(prg);
  });


program
  .version(lambda.version)
  .command('run')
  .description('Run your Amazon Lambda application locally')
  .option('--handler [' + AWS_HANDLER + ']', 'Lambda Handler {index.handler}', AWS_HANDLER)
  .option('-j, --eventFile [' + EVENT_FILE + ']', 'Event JSON File', EVENT_FILE)
  .option('-u, --runtime [' + AWS_RUNTIME + ']', 'Lambda Runtime', AWS_RUNTIME)
  .option('-x, --contextFile [' + CONTEXT_FILE + ']', 'Context JSON File', CONTEXT_FILE)
  .option('-n, --functionName [' + AWS_FUNCTION_NAME + ']', 'Lambda FunctionName', AWS_FUNCTION_NAME)
  .option('-p, --production', 'Run with .env', ".env")
  .action(function (prg) {
    if( prg.production ) dotenv.config( { path: "./.env"  } );
    else dotenv.config( { path: "./.envs"  } );
    lambda.run(prg);
  });

program
  .version(lambda.version)
  .command('setup')
  .description('Sets up the .env file.')
  .option('-n, --functionName [' + AWS_FUNCTION_NAME + ']', 'Lambda FunctionName', AWS_FUNCTION_NAME)
  .action(function(prg) {

		try{fs.mkdirSync(prg.functionName)}catch(e){}

		process.chdir("./"+prg.functionName);

    lambda.setup();
  });


  program
    .version(lambda.version)
    .command('tail')
    .description('Tails the Log')
    .action(function(prg) {
      var parts = process.env.PWD.split("/");
      var fn = parts[parts.length -1];
      console.log('/aws/lambda/' + fn )

      var hose = require('cloudwatch-logs-hose');

      var src = new hose.Source({
        LogGroup: '/aws/lambda/' + fn,
        aws: { region: 'us-east-1' }
      });

      src.on('logs', function(batch) {
        for(var i in batch) console.log('Log: ', batch[i].message.trim());
      });

      src.on('error', function(error) {
        console.log('Error: ', error);
      });

      src.open();

    });

program
  .version(lambda.version)
  .command('logstream')
  .description('Displays recent Log')
  .option('-s, --streamName', 'Log StreamName', null)
  .action(function(prg) {
    var parts = process.env.PWD.split("/");
    var fn = parts[parts.length -1];
    var time = Moment();
    var cloudwatchlogs = new AWS.CloudWatchLogs();

    console.log('/aws/lambda/' + fn )


    var params = {
      logGroupName: '/aws/lambda/' + fn, /* required */
      logStreamName: prg,
      endTime: null,
      limit: null,
      nextToken: null,
      startTime: null
    };

    cloudwatchlogs.getLogEvents(params, function(err, data) {
      if (err) return console.log(err, err.stack); // an error occurred

      data.events.forEach( function(event){
        var eventTime = Moment(event.ingestionTime);
        var showTime = false;
        if( time.diff( eventTime, "seconds") > 1 ) showTime = true
        time = eventTime;
        var line_parts = event.message.trim().split("\t");
        if (line_parts.length === 1){
          var item_parts = line_parts[0].split(":");
          if( item_parts[0] === 'START RequestId'){
            console.log('\n\n',"START",eventTime.fromNow(), item_parts[1], "\n" );
            return;
          }
          else if (item_parts[0] === 'END RequestId') {
           console.log('\n\n',"END",eventTime.fromNow() );
           return;
          }
        }
        var logline = line_parts.reverse()[0];
        if( showTime ) console.log( "  ",eventTime.fromNow(), logline );
        console.log( "  ", "> " ,logline );
      })

    });
  });

program.setMaxListeners(100);

program
  .version(lambda.version)
  .command('logs')
  .description('Displays recent Log')
  .option('-s, --streamName', 'Log StreamName', null)
  .action(function(prg) {
    var parts = process.env.PWD.split("/");
    var fn = parts[parts.length -1];
    var time = Moment();
    var cloudwatchlogs = new AWS.CloudWatchLogs();

    console.log('/aws/lambda/' + fn )


    var params = {
      logGroupName: '/aws/lambda/' + fn, /* required */
      endTime: null,
      filterPattern: null,
      interleaved: true,
      limit: null,
      nextToken: null,
      startTime: null
    };
    cloudwatchlogs.filterLogEvents(params, function(err, data) {
      if (err) return console.log(err, err.stack); // an error occurred

      data.events.forEach( function(event){
        var eventTime = Moment(event.ingestionTime);
        var showTime = false;
        if( time.diff( eventTime, "seconds") > 1 ) showTime = true
        time = eventTime;
        var line_parts = event.message.trim().split("\t");
        if (line_parts.length === 1){
          var item_parts = line_parts[0].split(":");
          if( item_parts[0] === 'START RequestId'){
            console.log('\n\n',eventTime.fromNow(), item_parts[1] );
            return;
          }
        }
        var logline = line_parts.reverse()[0];
        if( showTime ) console.log( "  ",eventTime.fromNow(), logline );
        console.log( "  ", "> " ,logline );
      })

    });
  });

program
  .version(lambda.version)
  .command('list')
  .description('Displays recent Log')
  .action(function(prg) {
    var parts = process.env.PWD.split("/");
    var fn = parts[parts.length -1];
    var cloudwatchlogs = new AWS.CloudWatchLogs();

    console.log('/aws/lambda/' + fn )

    var cloudwatchlogs = new AWS.CloudWatchLogs();

    var params = {
      logGroupName: '/aws/lambda/' + fn, /* required */
      descending: false,
      orderBy: 'LastEventTime'
    };
    cloudwatchlogs.describeLogStreams(params, function(err, data) {
      if (err) return console.log(err, err.stack); // an error occurred

      data.logStreams.forEach( function(stream){
        var init = Moment( stream.firstEventTimestamp );
        var end = Moment( stream.lastEventTimestamp );

        console.log( "'" + stream.logStreamName + "' ended " + init.fromNow() + ".      Started ( " + end.fromNow(true) + ")" );
      })


    });

  });

program.parse(process.argv);