const express = require('express');    
const router = express.Router();

const { getTableList } = require('../models/index');    

router.get('/', async (req, res) => {
    try {
      
        const tableList = await getTableList();
        
        
        res.render('index', { tableList });
    } catch (error) { 
        console.error('테이블 리스트 조회 중 오류가 발생하였습니다:', error);
        res.status(500).send('서버 오류가 발생했습니다.');
    }
});

module.exports = router;
