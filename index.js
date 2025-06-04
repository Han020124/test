// models/index.js
// ✅ Sequelize 연결 전용 파일로 분리
// 기존에는 동적 테이블 생성 코드와 같이 있었으나, 연결만 따로 관리함으로써 역할을 명확히 분리함

const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

module.exports = { sequelize };


// models/dynamicModel.js
// ✅ 동적 테이블 관련 함수만 따로 관리하는 파일
// createTable, dropTable, createDynamicTable, getTableList 모두 이 파일에서만 관리하며, 다른 파일에서는 import해서 사용
// 기존에는 이 모든 기능이 index.js에 혼합되어 있었음 → 유지보수 불편

const { sequelize } = require('./index');
const SequelizeLib = require('sequelize');

// ✅ 동적으로 테이블을 정의하고 생성하는 함수
async function createTable(tableName) {
  const Model = sequelize.define(
    tableName,
    {
      core: { type: SequelizeLib.STRING(20), allowNull: false },
      task: { type: SequelizeLib.STRING(20), allowNull: false },
      usaged: { type: SequelizeLib.INTEGER.UNSIGNED, allowNull: false },
    },
    {
      sequelize,
      timestamps: false,
      modelName: 'Profile',
      tableName,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );

  await Model.sync(); // 테이블 생성
  return Model;
}

// ✅ 특정 테이블을 삭제하는 함수
async function dropTable(tableName) {
  try {
    await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    console.log(`테이블 '${tableName}'이(가) 삭제되었습니다.`);
  } catch (error) {
    console.error(`테이블 삭제 중 오류 발생: ${error}`);
  }
}

// ✅ 동적으로 테이블을 생성하고 데이터를 삽입하는 함수
async function createDynamicTable(profile) {
  const tableName = profile[0][0];
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
        console.log(`Error: ${tableName} 데이터 오류`);
      }
    }
  }
}

// ✅ 현재 DB에 존재하는 테이블 목록을 반환
async function getTableList() {
  const [results] = await sequelize.query('SHOW TABLES');
  return results.map((row) => Object.values(row)[0]);
}

// 📤 모듈로 외부에 내보냄 (필요한 함수만 가져다 쓸 수 있도록)
module.exports = {
  createTable,
  dropTable,
  createDynamicTable,
  getTableList,
};
