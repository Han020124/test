const Sequelize = require('sequelize');

class Profile extends Sequelize.Model {
  
  static initiate(sequelize, tableName) {
    Profile.init(
      {
        core: {
          type: Sequelize.STRING(20),
          allowNull: false,
        },
        task: {
          type: Sequelize.STRING(20),
          allowNull: false,
        },
        usaged: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: 'Profile',
        tableName: tableName,
        timestamps: false,
        underscored: false,
        paranoid: false,
        charset: 'utf8',
        collate: 'utf8_general_ci',
      }
    );
  }

  static associations(db) {}
}

module.exports = Profile;
