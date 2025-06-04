const { Sequelize } = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// 기존에는 define 방식으로 모델 생성했으나, 이제 클래스로 분리된 Profile 모델을 불러와 사용
const Profile = require('./profile');

const db = {};
db.sequelize = sequelize;

/**
 * Profile 클래스를 사용해 동적으로 테이블 생성
 * 기존 코드에서는 sequelize.define 으로 모델을 직접 정의했지만,
 * 변경된 코드에서는 Profile 클래스를 import 후
 * Profile.initiate()로 초기화하여 모델을 생성함.
 * 이렇게 하면 Profile 모델 정의가 한 곳에 모여 유지보수가 쉬워짐.
 */
async function createTable(tableName) {
  // Profile 클래스를 이용해 테이블명 지정하여 모델 초기화
  Profile.initiate(sequelize, tableName);

  // 기존에는 Model.sync()를 호출했으나,
  // 이제는 sequelize.models.Profile.sync()로 초기화된 모델을 동기화함
  await sequelize.models.Profile.sync();

  // 생성된 모델 반환
  return sequelize.models.Profile;
}

/**
 * 테이블 삭제 함수는 동일하게 유지
 */
async function dropTable(tableName) {
  try {
    await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    console.log(`테이블 '${tableName}'이(가) 삭제되었습니다.`);
  } catch (error) {
    console.error(`테이블 삭제 중 오류가 발생했습니다: ${error}`);
  }
}

/**
 * 프로파일 데이터를 받아 동적으로 테이블 생성 후 데이터 삽입
 * 데이터 삽입 로직은 동일하나,
 * createTable 호출 시 Profile 클래스를 사용한다는 점이 다름
 */
async function createDynamicTable(profile) {
  const tableName = profile[0][0];
  // 기존 define 모델 대신 Profile 클래스 기반 모델을 반환받아 사용
  const DynamicModel = await createTable(tableName);

  let coreRow = -1;
  for (let row = 1; row < profile.length; row++) {
    if (coreRow === -1) {
      coreRow = row;
      continue;
    }
    if (profile[row].length === 1) {
      coreRow = -1;
      continue;
    }

    for (let col = 1; col < profile[row].length; col++) {
      try {
        await DynamicModel.create({
          task: profile[coreRow][col - 1],
          core: profile[row][0],
          usaged: profile[row][col],
        });
      } catch (e) {
        console.log(`Error: ${tableName} 파일 데이터 오류 발생`);
      }
    }
  }
}

/**
 * DB 내 테이블 목록 조회 함수
 * 기존과 동일하나, DB 이름이 바뀌면
 * map 내 key값 수정 필요함
 */
async function getTableList() {
  const [results] = await sequelize.query('SHOW TABLES');
  // 결과의 키값은 DB마다 다를 수 있으므로
  // 동적으로 첫 번째 키를 가져와 테이블 리스트 생성
  const key = Object.keys(results[0])[0];
  return results.map((row) => row[key]);
}

module.exports = {
  db,
  createTable,
  dropTable,
  createDynamicTable,
  getTableList,
};
