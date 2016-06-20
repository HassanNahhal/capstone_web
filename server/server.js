var loopback = require('loopback');
var boot = require('loopback-boot');
var path = require('path');
var fs = require('fs');
var app = module.exports = loopback();
var config = require('./config.json');

// Passport configurators..
var loopbackPassport = require('loopback-component-passport');
var PassportConfigurator = loopbackPassport.PassportConfigurator;
var passportConfigurator = new PassportConfigurator(app);

/*
 * body-parser is a piece of express middleware that
 *   reads a form's input and stores it as a javascript
 *   object accessible through `req.body`
 *
 */
var bodyParser = require('body-parser');

/**
 * Flash messages for passport
 *
 * Setting the failureFlash option to true instructs Passport to flash an
 * error message using the message given by the strategy's verify callback,
 * if any. This is often the best approach, because the verify callback
 * can make the most accurate determination of why authentication failed.
 */
var flash      = require('express-flash');

// attempt to build the providers/passport config
var config = {};
try {
  config = require('../providers.json');
} catch (err) {
  console.trace(err);
  process.exit(1); // fatal
}

// Setup the view engine (jade)
var path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// boot scripts mount components like REST API
// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname);

// -- Add your pre-processing middleware here --
//~~~~~~~~~~~~~~~~~Middleware~~~~~~~~~~~~~~~~~~~~

// to support JSON-encoded bodies
app.middleware('parse', bodyParser.json());
// to support URL-encoded bodies
app.middleware('parse', bodyParser.urlencoded({
  extended: true
}));

// The access token is only available after boot
app.middleware('auth', loopback.token({
  model: app.models.accessToken
}));

app.middleware('session:before', require('cookie-parser')(app.get('cookieSecret')));
app.middleware('session', require('express-session')({
  secret: app.get('cookieSecret'),
  saveUninitialized: true,
  resave: true
}));
passportConfigurator.init();

// We need flash messages to see passport errors
app.use(flash());

// Setup Passport Model
passportConfigurator.setupModels({
  userModel: app.models.Customer,
  userIdentityModel: app.models.CustomerIdentity,
  userCredentialModel: app.models.CustomerCredential
});

for (var s in config) {
  var c = config[s];
  c.session = c.session !== false;
  passportConfigurator.configureProvider(s, c);
}

var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

app.get('/auth/account', ensureLoggedIn('/login'), function (req, res, next) {
  res.jon({id: response.user.id,
            tokenId: response.id,
            email: email
          });
});

//After email verification, it will be redirected 
app.get('/verified', function(req, res) {
    res.render('pages/verified');
});
// -- Mount static files here--
// All static middleware should be registered at the end, as all requests
// passing the static middleware are hitting the file system
// Example:

app.use(loopback.static(path.resolve(__dirname, '../client')));

// Requests that get this far won't be handled
// by any middleware. Convert them into a 404 error
// that will be handled later down the chain.
app.use(loopback.urlNotFound());

// The ultimate error handler.
app.use(loopback.errorHandler());


app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};


// start the server if `$ node server.js`
if (require.main === module) {
    app.start();
}

