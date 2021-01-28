import passport from 'passport';

import auth from './auth';
import doctor from './doctor';
import patient from './patient';
import chat from './chat';
import feedback from './feedback';
import health from './health';
import post from './post';
import comment from './comment';
import reaction from './reaction';
import profile from './profile';
import subscription from './subscription';

export default function(app){
  
  // public routes
  app.use('/auth', auth);
  
  // private routes
  app.use('/', passport.authenticate('jwt', { failWithError: true, session: false }));
  
  app.use('/doctor', doctor);
  app.use('/patient', patient);
  app.use('/chat', chat);
  app.use('/feedback', feedback);
  app.use('/health', health);
  app.use('/post', post);
  app.use('/comment', comment);
  app.use('/reaction', reaction);
  app.use('/profile', profile);
  app.use('/subscription', subscription);
}