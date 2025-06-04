const express = require('express');
const path = require('path');
const nunjucks = require('nunjucks');
const morgan = require('morgan');
const { sequelize } = require('./models');

const indexRouter = require('./routes');
const profilesRouter = require('./routes/profiles');

const app = express();

function configureApp(app) {
  app.set('port', process.env.PORT || 3000);
  app.set('view engine', 'html');

  nunjucks.configure('views', {
    express: app,
    watch: true,
  });
 
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use('/', indexRouter);
  app.use('/profiles', profilesRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
}

async function connectDB() {
  try {
    await sequelize.sync({ force: false }); 
    console.log('데이터베이스 연결 성공');
  } catch (err) {
    console.error('데이터베이스 연결 실패:', err);
  }
}

function notFoundHandler(req, res, next) {
  const error = new Error(`${req.url}은 잘못된 주소입니다.`);
  error.status = 404;
  next(error);
}

function errorHandler(err, req, res, next) {
  res.locals.message = err.message;
  res.status(err.status || 500);
  res.render('error');
}


async function startServer() {
  await connectDB();
  configureApp(app);

  app.listen(app.get('port'), () => {
    console.log(`http://localhost:${app.get('port')} server open`);
  });
}

startServer();
