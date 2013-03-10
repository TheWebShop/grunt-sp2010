/*
 * grunt-sp2010
 * https://github.com/kevinattfield/grunt-sp2010
 *
 * Copyright (c) 2013 Kevin Attfield
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // External libs.
  var path = require('path'),
    fs = require('fs'),
    express = require('express'),
    app = express(),
    _ = require('underscore'),
    lists = {};

  grunt.registerMultiTask('sp2010', 'Start a SharePoint 2010 RESTful server.', function() {

    // Merge task-specific options with these defaults.
    var options = this.options({
      port: 8080,
      hostname: 'localhost',
      base: 'public',
      load: 'lists',
      keepalive: false,
    });

    // fs requires the base path to be absolute.
    options.base = path.resolve(options.base);
    options.load = path.resolve(options.load);

    // populate lists with any json files in ./lists
    fs.readdirSync(options.load).forEach(function(listName) {
      var isJson = listName.indexOf('.json', listName.length - 5) !== -1;
      if(!isJson) return;
      var list = require(options.load + '/' + listName);

      // support naked arrays or actual sp2010 rest scrapes
      if(list.d && list.d.results) list = list.d.results;

      lists[listName.replace('.json', '')] = list;
    });
    grunt.log.write('Loaded ' + _.size(lists) + ' list(s) from ' + options.load + '\n');

    app.configure(function () {

      // remove trailing slashes
      app.use(function(req, res, next) {
        if(req.url.substr(-1) === '/' && req.url.length > 1) req.url.slice(0, -1);
        next();
      });

      // separate list name and id for easier routing
      // :listName(:id) -> :listName/:id
      app.use(function(req, res, next) {
        var re = /_vti_bin\/listData.svc\/([^\(\/]+)\((\d+)\)/i;
        var match = req.url.match(re);
          if(match) {req.url = '/_vti_bin/listData.svc/' + match[1] + '/' + match[2];}
        next();
      });

      // for development we make sure nothing is cached
      app.use(function(req, res, next) {
        res.header('Cache-Control', 'no-cache');
        next();
      });
      app.use(express.bodyParser());
      // support _method (PUT in forms etc)
      app.use(express.methodOverride());
      app.use(app.router);
      app.use(express.static(options.base));
      app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });

    // allow the user to see a collection of all available lists
    app.get('/_vti_bin/listData.svc', function(req, res) {
      var available = [];
      for(var listName in lists){
        available.push(listName);
      }
      res.send({
        d: {
          EntitySets: available
        }
      });
    });
    // Single item in list
    app.get('/_vti_bin/listData.svc/:listName/:id', function(req, res) {
      var list = lists[req.params.listName];
      var item = list? list[req.params.id]: null;

      if(!item) {
        res.send(noList(req.params.listName));
      }
      res.send({
        d: item
      });
    });
    // Contents of a list
    app.get('/_vti_bin/listData.svc/:listName', function(req, res) {
      var list = lists[req.params.listName];
      var orderby = req.query.$orderby;
      var filter = req.query.$filter;
      var skip = parseInt(req.query.$skip, 10) || 0;
      var top = parseInt(req.query.$top, 10);

      if(!lists[req.params.listName]) res.send(noList(req.params.listName));

      if(filter) list = _.filter(list, function(record) {
        return true;
      });

      if(typeof orderby === 'string') {
        var re = /(\S+) ?(asc|desc)?/;
        var match = orderby.match(re);
        var direction = match[2];
        orderby = match[1];

        if(_.has(list[0], orderby)) {
          list = list.sort(function(a, b) {
            a = a[orderby] || '';
            b = b[orderby] || '';

            a = a.toString().toUpperCase();
            b = b.toString().toUpperCase();

            if(direction === 'asc') return  a>b? 1: a<b? -1: 0;
            return  a>b? -1: a<b? 1: 0;
          });
        } else {
          res.send(noProp(orderby));
        }
      }

      list = top? list.slice(skip, skip + top): list.slice(skip);

      res.send({
        d: {
          results: list
        }
      });
    });

    // Start server.
    grunt.log.writeln('Starting web server on ' + (options.hostname || '*') + ':' + options.port + '.');
    app.listen(options.port);

    if(options.keepalive) {
      this.async();
      grunt.log.write('Keeping server alive...\n');
    }

    function noList(listName){
      return {
        error: {
          code: '',
          message: {
            lang: 'en-US',
            value: "Resource not found for the segment '" + listName + "'."
          }
        }
      };
    }
    function noProp(prop){
      return {
        error: {
          code: '',
          message: {
            lang: 'en-US',
            value: "No property '" + prop + "' exists in type 'Microsoft.SharePoint.Linq.DataServiceEntity' at position 0."
          }
        }
      };
    }
  });
};
