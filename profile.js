const Sequelize = require('sequelize');

class Profile extends Sequelize.Model {
  /**
   * Sequelize 인스턴스와 테이블명을 받아 Profile 모델을 초기화합니다.
   * 
   * 기존 코드와 차별점:
   * - JSDoc 주석 추가로 함수와 파라미터 역할 명확화
   * - Profile.init 호출 시 옵션 순서를 직관적으로 정리 (sequelize, modelName, tableName 순)
   * - 코드 가독성 향상을 위해 들여쓰기 및 빈 줄 조정
   * - 기능 변경 없이 코드 스타일 개선에 집중
   * 
   * @param {Sequelize} sequelize - Sequelize 인스턴스
   * @param {string} tableName - 생성할 테이블 이름
   */
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

  /**
   * 데이터베이스 관계(associations)를 정의할 때 사용합니다.
   * 현재는 미구현 상태입니다.
   */
  static associations(db) {
    // 관계 설정 시 작성 예정
  }
}

module.exports = Profile;
