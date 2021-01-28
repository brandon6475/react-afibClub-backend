import express from 'express';
import path from "path";
import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';

import config from './config';
import { sequelize } from './model';
import router from './router';
import passport from './middleware/passport';
import logger from './middleware/logger';

if (!('toJSON' in Error.prototype))
Object.defineProperty(Error.prototype, 'toJSON', {
  value: function () {
    return {
      message: this.message
    };
  },
  configurable: true,
  writable: true
});

const app = express()
app.use(cors())
app.use(bodyParser.json({limit: '1000mb'}))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(helmet())
app.use(passport)
app.use('/public', express.static(path.join(__dirname, '../public')))
router(app)

const server = http.createServer(app);

sequelize.sync({force: false}).then(() => {
  logger.info('Connected to database')

  server.listen({ port: config.port }, () =>
    logger.info(
      `🚀 Server ready at: http${config.ssl ? 's' : ''}://${config.hostname}:${config.port}`
    )
  )
})