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

  // nunjucks 템플릿 엔진 설정 (express와 연동, 변경시 자동 반영)
  nunjucks.configure('views', {
    express: app,
    watch: true,
  });

  // morgan은 개발 시 로그를 위해 필요하면 활성화 (원본은 주석 처리 상태)
  // app.use(morgan('dev'));

  // 정적 파일 제공 미들웨어 설정 (css, js, 이미지 제공용)
  app.use(express.static(path.join(__dirname, 'public')));
  
  // JSON 요청 본문 파싱 미들웨어
  app.use(express.json());
  
  // URL-encoded 데이터 파싱 미들웨어
  app.use(express.urlencoded({ extended: false }));

  // 라우터 연결 (원본과 동일)
  app.use('/', indexRouter);
  app.use('/profiles', profilesRouter);

  // 404 에러 처리 미들웨어 (별도 함수로 분리)
  app.use(notFoundHandler);

  // 에러 처리 미들웨어 (별도 함수로 분리)
  app.use(errorHandler);
}

/**
 * DB 연결 및 동기화 부분을 별도 함수로 분리
 * => 원본은 app.js에서 바로 sequelize.sync()를 호출했지만,
 *    DB 연결 로직을 함수로 분리하여 비동기 처리 흐름 명확히 함
 */
async function connectDB() {
  try {
    await sequelize.sync({ force: false }); // 기존 테이블 유지
    console.log('데이터베이스 연결 성공');
  } catch (err) {
    console.error('데이터베이스 연결 실패:', err);
  }
}

/**
 * 404 에러 처리 미들웨어를 함수로 분리
 * => 원본은 익명 함수로 app.use에 바로 작성했으나,
 *    함수로 빼내어 재사용과 테스트가 용이하도록 개선
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`${req.url}은 잘못된 주소입니다.`);
  error.status = 404;
  next(error);
}

/**
 * 500 에러 등 에러 처리 미들웨어를 함수로 분리
 * => 에러 메시지 전달 및 뷰 렌더링 역할을 담당
 */
function errorHandler(err, req, res, next) {
  res.locals.message = err.message;
  res.status(err.status || 500);
  res.render('error');
}

/**
 * 서버 시작 함수
 * => DB 연결 후 서버가 실행되도록 순서 제어
 *    원본은 sync() 후 then() 내부에서 바로 app.listen() 호출하였으나,
 *    async/await 패턴으로 명확하게 흐름을 관리함
 */
async function startServer() {
  await connectDB();
  configureApp(app);

  app.listen(app.get('port'), () => {
    console.log(`http://localhost:${app.get('port')} server open`);
  });
}

// 서버 시작
startServer();
