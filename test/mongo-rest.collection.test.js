var MongoRest = require('../lib/index')
  , _ = require('underscore')
;

describe('MongoRest', function() {

  describe("renderCollection()", function() {
    it('should render a collection correctly depending on the request');
  });

  describe('collectionGet()', function() {
    var mongoRest = new MongoRest({ }, null, true) // Don't register routes
      , doc1 = new function() { this.doc1 = true; }
      , doc2 = new function() { this.doc2 = true; }
      , initialDocs = [ doc1, doc2 ]
      , req = { model: { }, params: { resource: 'user' } }
      , run = function(callback) {
          callback(null, initialDocs);
        }
      , model = {
            find: function() { return model; }
          , sort: function() { return model; }
          , run: run
        }
      ;

    req.model = model;

    it("should directly render if there are no interceptors", function(done) {
      mongoRest.renderCollection = function(docs) {
        docs.should.eql(initialDocs);
        done();
      };

      mongoRest.collectionGet()(req, { }, { });
    });

    it("should call all 'get' interceptors and render the entity asynchroniously", function(done) {
      var interceptedCount = 0
        , interceptor = function(info, iDone) {
            info.doc.should.equal(initialDocs[interceptedCount % 2]);
            interceptedCount ++;
            setTimeout(function() { iDone(); }, 1);
          };

      mongoRest.renderCollection = function(docs) {
        interceptedCount.should.equal(6); // Each interceptor for each document.
        docs.should.eql(initialDocs);
        done();
      };
      req.model = model;

      mongoRest.addInterceptor("user", "get", interceptor);
      mongoRest.addInterceptor("user", "get", interceptor);
      mongoRest.addInterceptor("user", "get", interceptor);


      mongoRest.collectionGet()(req, { }, { });
    });

    it("should call all 'get' interceptors and render the entity synchroniously", function(done) {
      var interceptedCount = 0
        , interceptor = function(info, iDone) {
            info.doc.should.equal(initialDocs[interceptedCount % 2]);
            interceptedCount ++;
            iDone();
          };

      mongoRest.renderCollection = function(docs) {
        interceptedCount.should.equal(6); // Each interceptor for each document.
        docs.should.eql(initialDocs);
        done();
      };
      req.model = model;

      mongoRest.addInterceptor("user", "get", interceptor);
      mongoRest.addInterceptor("user", "get", interceptor);
      mongoRest.addInterceptor("user", "get", interceptor);


      mongoRest.collectionGet()(req, { }, { });
    });

  });

  describe("collectionPost()", function() {
    var mongoRest = new MongoRest({ }, null, true) // Don't register routes
      , doc1 = new function() { this.doc1 = true; }
      , emptyDoc = { save: function(callback) { setTimeout(callback, 1); } }
      , req = {
          model: function() { return emptyDoc; }
        , body: { newResource: { some: 'values' } }
        , params: { resource: 'user' }
      }
      ;


    it("should call the 'post' and 'post.success' event interceptors on success", function(done) {
      var interceptorList = []
        , interceptor = function(intName) { return function(info, iDone) { interceptorList.push(intName); setTimeout(iDone, 1); } }
        ;

      mongoRest.addInterceptor("user", "post", interceptor("firstPost"));
      mongoRest.addInterceptor("user", "post", interceptor("secondPost"));
      mongoRest.addInterceptor("user", "post.success", interceptor("post.success"));

      var res = {
        redirect: function() {
          interceptorList.should.eql([ "firstPost", "secondPost", "post.success" ]);
          done();
        }
      };

      mongoRest.collectionPost()(req, res, { });
    });
    it("should call the 'post.error' event interceptors on error", function(done) {
      var flashMessages = [];
      req.flash = function(type, message) { flashMessages.push([type, message]); }

      emptyDoc = { save: function(callback) { setTimeout(function() { callback(new Error("Some Error")); }, 1); } }

      var interceptorList = []
        , interceptor = function(intName) { return function(info, iDone) { interceptorList.push(intName); setTimeout(iDone, 1); } }
        ;

      mongoRest.addInterceptor("user", "post", interceptor("firstPost"));
      mongoRest.addInterceptor("user", "post", interceptor("secondPost"));
      mongoRest.addInterceptor("user", "post.error", interceptor("post.error"));

      var res = {
        redirect: function() {
          interceptorList.should.eql([ "firstPost", "secondPost", "post.error" ]);
          flashMessages.should.eql([ ['error', 'Error: Some Error'] ]);
          done();
        }
      };

      mongoRest.collectionPost()(req, res, { });
    });
  });


});