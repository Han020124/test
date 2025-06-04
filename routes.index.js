const express = require('express');    
const router = express.Router();

// models/index.js에서 DB 관련 함수 가져오기
const { getTableList } = require('../models/index');    

/**
 * @route GET /
 * @desc DB에서 테이블 리스트를 가져와 index 뷰에 전달하는 라우터
 * @details
 * - 비동기 함수(getTableList) 호출 후 결과를 받아서 렌더링함
 * - 에러 발생 시 콘솔에 로그 출력 (추후 에러 핸들링 개선 가능)
 */
router.get('/', async (req, res) => {
    try {
        // DB에서 테이블 리스트 조회
        const tableList = await getTableList();
        
        // 조회한 테이블 리스트를 'index' 템플릿에 전달하여 렌더링
        res.render('index', { tableList });
    } catch (error) {
        // 에러 발생 시 콘솔에 로그 출력
        console.error('테이블 리스트 조회 중 오류가 발생하였습니다:', error);

        // 사용자에게 간단한 오류 메시지 전송 (추가 개선 가능)
        res.status(500).send('서버 오류가 발생했습니다.');
    }
});

// 이 모듈에서 정의한 router 객체를 외부로 공개 (다른 파일에서 불러서 사용 가능)
module.exports = router;
