import media from './media';
import data from './data';

export default function(app){
  app.use('/media', media);
  app.use('/data', data);
}