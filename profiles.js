const express = require('express');
const router = express.Router();

const { createDynamicTable, getTableList, sequelize, dropTable } = require('../models/index');
const profile_model = require('../models/profile');

async function checkTableExists(tableName) {
    const tableList = await getTableList();
    return tableList.includes(tableName);
}

router.post('/', async (req, res) => {
    const profiles = req.body; 
    let processedCount = 0;

    try {
        const tableList = await getTableList();

        for (let i = 0; i < profiles.length; i++) {
           
            const tableName = profiles[i][0][0].toLowerCase().slice(0, -4);
            profiles[i][0][0] = tableName;

           
            if (tableList.includes(tableName)) {
                console.log(`테이블 ${tableName}은(는) 이미 존재합니다.`);
                continue;
            }

            await createDynamicTable(profiles[i]);
            processedCount++;
        }

    
        if (processedCount === 0) {
            res.json({ status: 'success', message: '저장 가능한 파일이 존재하지 않습니다.' });
        } else if (processedCount === profiles.length) {
            res.json({ status: 'success', message: `${processedCount}개의 프로파일이 정상적으로 저장되었습니다.` });
        } else {
            res.json({ status: 'success', message: `중복된 이름의 파일을 제외한 ${processedCount}개의 프로파일이 저장되었습니다.` });
        }

    } catch (error) {
        console.error('프로파일 생성 중 오류 발생:', error);
        res.status(500).json({ status: 'error', message: '프로파일 생성 중 오류가 발생하였습니다.' });
    }
});

// 2. 테이블 목록 조회(GET)
router.get('/', async (req, res) => {
    try {
        const tableList = await getTableList();
        res.json(tableList);
    } catch (error) {
        console.error('테이블 목록 조회 오류:', error);
        res.status(500).json({ error: '테이블 목록 조회 중 오류가 발생했습니다.' });
    }
});

router.get('/data/:tableName', async (req, res) => {
    try {
        const { tableName } = req.params;

        if (!(await checkTableExists(tableName))) {
            return res.status(404).json({ error: '존재하지 않는 파일입니다.' });
        }
        
        profile_model.initiate(sequelize, tableName);

        const datas = await profile_model.findAll();
        
        const tasks = await profile_model.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('core')), 'core']]
        });
        
        const cores = await profile_model.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('task')), 'task']]
        });

        res.json({ datas, cores, tasks });

    } catch (error) {
        console.error('데이터 조회 오류:', error);
        res.status(500).json({ error: '데이터 조회 중 오류가 발생했습니다.' });
    }
});

router.delete('/drop/:tableName', async (req, res) => {
    try {
        const { tableName } = req.params;

        if (!(await checkTableExists(tableName))) {
            return res.status(404).json({ state: 'error', message: '존재하지 않는 테이블입니다.' });
        }

        await dropTable(tableName);
        res.json({ state: 'success', message: `${tableName} 테이블이 삭제되었습니다.` });

    } catch (error) {
        console.error('테이블 삭제 오류:', error);
        res.status(500).json({ state: 'error', message: '테이블 삭제 중 오류가 발생했습니다.' });
    }
});

router.get('/coredata/:tableName/:core', async (req, res) => {
    try {
        const { tableName, core } = req.params;

        if (!(await checkTableExists(tableName))) {
            return res.status(404).json({ error: '존재하지 않는 테이블입니다.' });
        }

        profile_model.initiate(sequelize, tableName);

        const data = await profile_model.findAll({
            attributes: [
                'task',
                [sequelize.fn('max', sequelize.col('usaged')), 'max_usaged'],
                [sequelize.fn('min', sequelize.col('usaged')), 'min_usaged'],
                [sequelize.fn('avg', sequelize.col('usaged')), 'avg_usaged']
            ],
            where: { core },
            group: ['task']
        });

        res.json(data);

    } catch (error) {
        console.error('CORE 기준 데이터 조회 오류:', error);
        res.status(500).json({ error: '데이터 조회 중 오류가 발생했습니다.' });
    }
});

router.get('/taskdata/:tableName/:task', async (req, res) => {
    try {
        const { tableName, task } = req.params;

        if (!(await checkTableExists(tableName))) {
            return res.status(404).json({ error: '존재하지 않는 테이블입니다.' });
        }

        profile_model.initiate(sequelize, tableName);

        const data = await profile_model.findAll({
            attributes: [
                'core',
                [sequelize.fn('max', sequelize.col('usaged')), 'max_usaged'],
                [sequelize.fn('min', sequelize.col('usaged')), 'min_usaged'],
                [sequelize.fn('avg', sequelize.col('usaged')), 'avg_usaged']
            ],
            where: { task },
            group: ['core']
        });

        res.json(data);

    } catch (error) {
        console.error('TASK 기준 데이터 조회 오류:', error);
        res.status(500).json({ error: '데이터 조회 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
