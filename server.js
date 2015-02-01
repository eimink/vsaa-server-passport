"use strict";

// Configuration
global.config = require("./config");

//global.db = require("./databases/"+config.db_driver); // This is a bit of a hack and outdated way of doing things...

// Required node modules
var restify = require("restify");
//var restifyOAuth2 = require("restify-oauth2");
var cluster = require('cluster');
//var hooks = require("./hooks");
var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy;

// Process variables

var server = restify.createServer({
	name: "Very Simple Application Analytics Server",
	version: "0.0.1",
	formatters: {
		"application/hal+json": function (req, res, body) {
			return res.formatters["application/json"](req, res, body);
		}
	}
});

var port = config.listen; // Default port to listen

if (process.argc >= 2) {
	port = parseInt(process.argv[2]); // Port can be also passed as an argument, this overrides config...
}

var RESOURCES = Object.freeze({
	INITIAL: "/",
	TOKEN: "/v1/login",
	REG_USER: "/v1/user",
	DEL_USER: "/v1/user",
	RESET_PW: "/v1/user/resetpass"
});

server.use(restify.authorizationParser());
server.use(restify.bodyParser({ mapParams: false }));

passport.use(new LocalStrategy(
	function(username, password, done) {
		User.findOne({ username: username }, function(err, user){
			if(err) {return done(err);}
			if(!user) {
				return done(null, false, {message: "Incorrect username." });
			}
			if (!user.verifyPassword(password)) { return done(null, false); }
			return done(null,user);
		});
	}
));

server.post(RESOURCES.TOKEN,passport.authenticate('local', { successRedirect: '/',failureRedirect: '/login',failureFlash: true }));

//	restifyOAuth2.cc(server, { tokenEndpoint: RESOURCES.TOKEN, hooks: hooks });
server.use(function(req,res,next) {
	res.redirect = function(addr) {
		res.header('Location',addr);
		res.send(302);
	}
});
server.get(RESOURCES.INITIAL, function (req, res) {
	var response = {
		_links: {
			self: { href: RESOURCES.INITIAL }
		}
	};

	if (req.clientId) {
		response._links["http://rel.example.com/event"] = { href: RESOURCES.EVENT };
	} else {
		response._links["auth-token"] = {
			href: RESOURCES.TOKEN,
			"grant-types": "client_credentials",
			"token-types": "bearer"
		};
	}

	res.contentType = "application/hal+json";
	res.send(response);
});

/*server.post(RESOURCES.EVENT, function (req, res) {
	if (!req.clientId) {
		return res.sendUnauthenticated();
	}
	var fields = [
		req.body.DeviceId,
		req.body.Description,
		req.body.ApiKey
	];
	var response = {
		"success": "event recorded successfully",
		_links: {
			self: { href: RESOURCES.EVENT },
			parent: { href: RESOURCES.INITIAL }
		}
	}
	db.createEvent(fields, function (err, result) {
		if (err) {
			response = {
				"error": "err",
				_links: {
					self: { href: RESOURCES.EVENT },
					parent: { href: RESOURCES.INITIAL }
				}
			}
		}
	});
	if (req.body.message_type === 'APPLICATION_EVENT_QUIT')
		hooks.invalidateClientToken(req.authorization.credentials);
	res.contentType = "application/hal+json";
	res.send(response);
});*/

// Adding error information output, and killing process when this happens.
process.on('uncaughtException', function (err) {
	console.log("UNCAUGHT EXCEPTION ");
	console.log("[Inside 'uncaughtException' event] " + err.stack || err.message);
	process.exit(1);
});

// Clustering to utilize all CPU cores
if (cluster.isMaster) {

	console.log("Spawning "+config.workers+" worker threads...");	
    // Fork workers
    for (var i = 0; i < config.workers; i++) {
        cluster.fork();
    }

    cluster.on('exit', function (worker, code, signal) {
    	console.log('Worker ' + worker.process.pid + ' died');
    	console.log('Spawining new worker...');
    	cluster.fork();
    });
} 
else {
	console.log("Worker process id: "+process.pid+" now listening on port " + port);
    server.listen(port);
}
