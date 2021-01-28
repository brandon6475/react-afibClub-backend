import passport from 'passport';

import auth from './auth';
import article from './article';
import good from './good';
import user from './user';
import post from './post';
import logo from './logo';
import category from './category';

export default function(app){
  
  // public routes
  app.use('/admin/auth', auth);
  
  // private routes
  app.use('/admin', passport.authenticate('jwt-admin', { failWithError: true, session: false }));
  app.use('/admin/article', article);
  app.use('/admin/good', good);
  app.use('/admin/user', user);
  app.use('/admin/post', post);
  app.use('/admin/logo', logo);
  app.use('/admin/category', category);
}