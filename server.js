'use strict';

var express     = require('express');
var bodyParser  = require('body-parser');
var expect      = require('chai').expect;
var cors        = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const MongoClient = require('mongodb').MongoClient;
const helmet = require('helmet');

var apiRoutes         = require('./routes/api.js');
var fccTestingRoutes  = require('./routes/fcctesting.js');
var runner            = require('./test-runner');

if (!process.env.DB || !process.env.PORT) {
  console.error('missing environment variables');
  process.exit(1);
}


var app = express();

MongoClient.connect(process.env.DB, { useNewUrlParser: true }, (err, client) => {
  if (err) {
    throw err;
  }
  console.log('successfully connected to database');
  const db = client.db('anonymous-message-board');
  
  app.use((req, res, next) => {
    console.log(req.method, req.url, req.ip);
    next();
  });
  
  app.use(helmet.dnsPrefetchControl());
  app.use(helmet.frameguard({ action: 'sameorigin' }));
  app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

  app.use('/public', express.static(process.cwd() + '/public'));
  
  app.use(cors({origin: '*'})); //For FCC testing purposes only
  
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  
  //Sample front-end
  app.route('/b/:board/')
    .get(function (req, res) {
      res.sendFile(process.cwd() + '/views/board.html');
    });
  app.route('/b/:board/:threadid')
    .get(function (req, res) {
      res.sendFile(process.cwd() + '/views/thread.html');
    });
  
  //Index page (static HTML)
  app.route('/')
    .get(function (req, res) {
      res.sendFile(process.cwd() + '/views/index.html');
    });
  
  //For FCC testing purposes
  fccTestingRoutes(app);
  
  //Routing for API 
  apiRoutes(app, db);
  
  //Sample Front-end
  
      
  //404 Not Found Middleware
  app.use(function(req, res, next) {
    res.status(404)
      .type('text')
      .send('Not Found');
  });
  
  //Start our server and tests!
  app.listen(process.env.PORT || 3000, function () {
    console.log("Listening on port " + process.env.PORT);
    if(process.env.NODE_ENV==='test') {
      console.log('Running Tests...');
      setTimeout(function () {
        try {
          runner.run();
        } catch(e) {
          var error = e;
            console.log('Tests are not valid:');
            console.log(error);
        }
      }, 1500);
    }
  });
});


module.exports = app; //for testing
