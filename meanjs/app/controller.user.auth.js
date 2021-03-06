'use strict';

/**
 * Module dependencies.
 */
var errorHandler = require('./controller.errors'),
  parser = require('./parser.user'),
  queries = require('./queries'),
  mongoose = require('mongoose'),
  passport = require('passport'),
  User = mongoose.model('User'),
  token = require('./controller.token'),
  config = require('./../config/config'),
  serializeUser = require('./../app/serializer.user');

var parseInsert = function(req) {
  return (new parser.Insert(req.body)).validate();
};

/**
 * Signup
 */
exports.signup = function(req, res) {
  parseInsert(req)
    .then(function(data) {
      var user = new User(data);
      user.provider = 'local';
      user.displayName = user.firstName + ' ' + user.lastName;
      return queries.exec(user, 'save');
    })
    .then(function(user) {
      token.create(user)
        .then(function(newToken) {
          res.jsonp({user: serializeUser(user), token: newToken});
        });
    })
    .fail(function(err) {
      console.trace(err);
      return res.status(400).jsonp({
        email: ['Já existe outra conta com este e-mail!'],
      });
    });
};

/**
 * Signin after passport authentication
 */
exports.signin = function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err || !user) {
      res.status(400).send(info);
    } else {
      token.create(user)
        .then(function(newToken) {
          res.jsonp({user: serializeUser(user), token: newToken});
        });
    }
  })(req, res, next);
};

/**
 * OAuth callback
 */
exports.oauthCallback = function(strategy) {
  return function(req, res, next) {
    passport.authenticate(strategy, function(err, user) {
      if (err || !user) {
        return res.redirect(config.url + '/#/signin');
      }

      token.createTemporary(user)
        .then(function(newToken) {
          return res.redirect(config.url + '/#/token/' + newToken.refreshToken);
        });
    })(req, res, next);
  };
};

/**
 * Helper function to save or update a OAuth user profile
 */
exports.saveOAuthUserProfile = function(req, providerUserProfile, done) {

  User.findOne({email: providerUserProfile.email}, function(err, user) {
    if (!user) {
      // Define a search query fields
      var searchMainProviderIdentifierField = 'providerData.' + providerUserProfile.providerIdentifierField;
      var searchAdditionalProviderIdentifierField = 'additionalProvidersData.' + providerUserProfile.provider + '.' + providerUserProfile.providerIdentifierField;

      // Define main provider search query
      var mainProviderSearchQuery = {};
      mainProviderSearchQuery.provider = providerUserProfile.provider;
      mainProviderSearchQuery[searchMainProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

      // Define additional provider search query
      var additionalProviderSearchQuery = {};
      additionalProviderSearchQuery[searchAdditionalProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

      // Define a search query to find existing user with current provider profile
      var searchQuery = {
        $or: [mainProviderSearchQuery, additionalProviderSearchQuery]
      };

      User.findOne(searchQuery, function(err, user) {
        if (err) {
          return done(err);
        } else {
          if (!user) {
            user = new User({
              firstName: providerUserProfile.firstName,
              lastName: providerUserProfile.lastName,
              displayName: providerUserProfile.displayName,
              email: providerUserProfile.email,
              provider: providerUserProfile.provider,
              providerData: providerUserProfile.providerData
            });

            // And save the user
            user.save(function(err) {
              return done(err, user);
            });
          } else {
            return done(err, user);
          }
        }
      });
    } else {
      // Check if user exists, is not signed in using this provider, and doesn't have that provider data already configured
      if (user.provider !== providerUserProfile.provider && (!user.additionalProvidersData || !user.additionalProvidersData[providerUserProfile.provider])) {
        // Add the provider data to the additional provider data field
        if (!user.additionalProvidersData) {
          user.additionalProvidersData = {};
        }
        user.additionalProvidersData[providerUserProfile.provider] = providerUserProfile.providerData;

        // Then tell mongoose that we've updated the additionalProvidersData field
        user.markModified('additionalProvidersData');

        // And save the user
        user.save(function(err) {
          return done(err, user, '/#/settings/accounts');
        });
      } else {
        return done(null, user);
      }
    }
  });

};

/**
 * Remove OAuth provider
 */
exports.removeOAuthProvider = function(req, res) {
  var user = req.user;
  var provider = req.param('provider');

  if (user && provider) {
    // Delete the additional provider
    if (user.additionalProvidersData[provider]) {
      delete user.additionalProvidersData[provider];

      // Then tell mongoose that we've updated the additionalProvidersData field
      user.markModified('additionalProvidersData');
    }

    user.save(function(err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.jsonp(serializeUser(user));
      }
    });
  }
};