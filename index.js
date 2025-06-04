const { Sequelize } = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const sequelize = new Sequelize(config.database, config.username, config.password, config);
const Profile = require('./profile');
const db = {};

db.sequelize = sequelize;

async function createTable(tableName) {

  Profile.initiate(sequelize, tableName);
  
  await sequelize.models.Profile.sync();

  return sequelize.models.Profile;
}

async function dropTable(tableName) {
  try {
    await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    console.log(`테이블 '${tableName}'이(가) 삭제되었습니다.`);
  } catch (error) {
    console.error(`테이블 삭제 중 오류가 발생했습니다: ${error}`);
  }
}

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
        console.log(`Error: ${tableName} 파일 데이터 오류 발생`);
      }
    }
  }
}

async function getTableList() {
  const [results] = await sequelize.query('SHOW TABLES');
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
