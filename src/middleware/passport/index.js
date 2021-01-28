import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import FacebookTokenStrategy from 'passport-facebook-token';
var GoogleTokenStrategy = require('passport-google-token').Strategy

import config from '../../config';
import models from '../../model';

const passportHandler = passport.initialize()

passport.use('local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, (email, password, done) => {
  //this one is typically a DB call. Assume that the returned user object is pre-formatted and ready for storing in JWT
  return models.User.findByLogin(email)
    .then(user => {
      if (!user) {
        return done({status: 401, message: 'Not registered'}, false);
      }
      user.validatePassword(password).then(res => {
        if (res) {
          done(null, user, {message: 'Logged In Successfully'})
        } else {
          return done({status: 401, message: 'Incorrect email or password.'}, false);
        }
      }).catch(err => done(err))
    })
    .catch(err => done(err));
  }
));

passport.use(new FacebookTokenStrategy({
  clientID        : config.facebook_app_id,
  clientSecret    : config.facebook_app_secret,
  fbGraphVersion  : 'v3.0'
}, (access_token, refresh_token, profile, done) => {
  process.nextTick(function() {
    const profile_json = {
      id: profile.id,
      first_name: profile.name.givenName,
      last_name: profile.name.familyName,
      email: profile.emails[0].value || '',
      photo: profile.photos[0].value || ''
    }
    models.User.findByFacebook(profile_json).then(data => {
      const { user, newUser } = data;
      return done(null, user, { newUser });
    })
  });
}));

passport.use(new GoogleTokenStrategy({
  clientID        : config.google_client_id,
  clientSecret    : config.google_client_secret,
}, (access_token, refresh_token, profile, done) => {
  process.nextTick(function() {
    const profie_json = profile._json;
    models.User.findByGoogle(profie_json).then(data => {
      const { user, newUser } = data;
      return done(null, user, { newUser });
    })
  });
}));

passport.use('admin', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  return models.Admin.findByLogin(email)
    .then(admin => {
      if (!admin) {
        return done({status: 401, message: 'Incorrect email or password.'}, false);
      }
      admin.validatePassword(password).then(res => {
        if (res) {
          done(null, admin, {message: 'Logged In Successfully'})
        } else {
          return done({status: 401, message: 'Incorrect email or password.'}, false);
        }
      }).catch(err => done(err))
    })
    .catch(err => done(err));
  }
));

var jwtOpts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.secret_key,
  ignoreExpiration: true,
};
passport.use('jwt', new JwtStrategy(jwtOpts, function(jwt_payload, done) {
  // if (jwt_payload.exp <= Math.floor(Date.now() / 1000)) {
  //   return done({status: 401, message: 'jwt expired'}, false);
  // }

  models.User.findOne({ where: { email: jwt_payload.email } }).then(user => {
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  }).catch(err => {
    if (err) {
      return done(err, false);
    }
  });
}));

passport.use('jwt-admin', new JwtStrategy(jwtOpts, function(jwt_payload, done) {
  if (jwt_payload.exp <= Math.floor(Date.now() / 1000)) {
    return done({status: 401, message: 'jwt expired'}, false);
  }

  models.Admin.findOne({ where: { email: jwt_payload.email } }).then(admin => {
    if (admin) {
      return done(null, admin);
    } else {
      return done(null, false);
    }
  }).catch(err => {
    if (err) {
      return done(err, false);
    }
  });
}));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  models.User.findByPk(id).then(user => {
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  }).catch(err => {
    if (err) {
      return done(err, false);
    }
  });
});

export default passportHandler;