let fileName = "";   
let select = "";    
let chart;          
let chart_type = 'line'; 

let labels = [];
let minData = [];
let maxData = [];
let avgData = [];

const profileForm = document.getElementById('profile_form');
const inputProfile = document.querySelector('#input_profile');
const profileTbody = document.querySelector('#profile_list tbody');
const coreDiv = document.getElementById('core');
const taskDiv = document.getElementById('task');
const btnline = document.getElementById('line');
const btnbar = document.getElementById('bar');
const btnpolarArea = document.getElementById('polarArea');

async function getList() {
    try {
        const res = await axios.get('profiles');
        const profiles = res.data;
      
        profileTbody.innerHTML = '';

        profiles.forEach(profile => {
            const row = document.createElement('tr');

            const tdName = document.createElement('td');
            tdName.textContent = profile;
            tdName.className = 'text-center fw-semibold';
            tdName.style.cursor = 'pointer';
            tdName.addEventListener('click', () => {
                fileName = profile;
                highlightSelectedProfile();
                destroyChartIfExists();
                select = "";
                getData();
            });
          
            if (profile === fileName) {
                tdName.style.backgroundColor = '#888888';
            }

            const tdDelete = document.createElement('td');
            const btnDelete = document.createElement('button');
            btnDelete.textContent = "삭제";
            btnDelete.className = "btn btn-danger";

            btnDelete.addEventListener('click', async (e) => {
                e.stopPropagation(); 
                await deleteProfile(profile);
            });

            tdDelete.appendChild(btnDelete);
          
            row.appendChild(tdName);
            row.appendChild(tdDelete);

            profileTbody.appendChild(row);
        });
    } catch (error) {
        console.error('프로필 리스트를 불러오는 중 오류 발생:', error);
    }
}

function highlightSelectedProfile() {
    const allTds = profileTbody.querySelectorAll('tr td:first-child');
    allTds.forEach(td => td.style.backgroundColor = 'white');
    allTds.forEach(td => {
        if (td.textContent === fileName) {
            td.style.backgroundColor = '#888888';
        }
    });
}

function destroyChartIfExists() {
    if (chart) {
        chart.destroy();
        chart = null;
    }
}
async function deleteProfile(profileName) {
    try {
        await axios.delete(`profiles/drop/${profileName}`);
      
        if (fileName === profileName) {
            destroyChartIfExists();
            coreDiv.innerHTML = "";
            taskDiv.innerHTML = "";
            fileName = "";
            select = "";
        }

        await getList();
    } catch (error) {
        console.error('프로필 삭제 중 오류 발생:', error);
    }
}

profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const files = inputProfile.files;
    if (!files.length) {
        alert('파일을 등록하세요');
        return;
    }

    let profiles = [];
    let isError = false;

    // 파일별로 txt인지 체크 후 읽기
    const readPromises = Array.from(files).map(file => {
        if (file.name.toLowerCase().endsWith('.txt')) {
            return new Promise(resolve => {
                readTextFile(file, data => {
                    profiles.push(data);
                    resolve();
                });
            });
        } else {
            alert('.txt 파일만 입력해주세요');
            isError = true;
            return Promise.resolve();
        }
    });

    await Promise.all(readPromises);

    if (!isError) {
        try {
            const response = await fetch('/profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profiles)
            });
            if (response.ok) {
                const data = await response.json();
                alert(data.message);
                await getList();
            } else {
                console.error('파일 전송 중 오류 발생');
            }
        } catch (error) {
            console.error('파일 업로드 중 오류:', error);
        }
    }
});

function readTextFile(file, callback) {
    const reader = new FileReader();

    reader.onload = function (e) {
        const contents = e.target.result;
        const lines = contents.split('\n');
        const parsed = [[file.name]];
        lines.forEach(line => {
            parsed.push(line.trim().split(/\t| |,|\//));
        });

        callback(parsed);
    };

    reader.onerror = function () {
        console.error('파일을 읽는 중 오류 발생');
    };

    reader.readAsText(file, 'UTF-8');
}

async function getData() {
    if (!fileName) return;

    try {
        const res = await axios.get(`profiles/data/${fileName}`);
        const cores = res.data.cores;
        const tasks = res.data.tasks; 

        coreDiv.innerHTML = 'select core : ';
        tasks.forEach(task => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-info me-2';
            btn.textContent = task.core;

            btn.addEventListener('click', () => {
                updateChart('task', task.core);
                setButtonActive(coreDiv, btn, 'btn-info', 'btn-secondary');
                resetButtonClass(taskDiv, 'btn-success');
            });

            coreDiv.appendChild(btn);
        });

        taskDiv.innerHTML = 'select task : ';
        cores.forEach(core => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-success me-2';
            btn.textContent = core.task;

            btn.addEventListener('click', () => {
                updateChart('core', core.task);
                setButtonActive(taskDiv, btn, 'btn-success', 'btn-secondary');
                resetButtonClass(coreDiv, 'btn-info');
            });

            taskDiv.appendChild(btn);
        });

    } catch (error) {
        console.error('프로필 데이터 로드 중 오류:', error);
    }
}

function setButtonActive(container, activeBtn, defaultClass, activeClass) {
    const buttons = container.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.className = (btn === activeBtn) ? `btn ${activeClass} me-2` : `btn ${defaultClass} me-2`;
    });
}

function resetButtonClass(container, defaultClass) {
    const buttons = container.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.className = `btn ${defaultClass} me-2`;
    });
}

async function updateChart(type, chosenName) {
    const ctx = document.getElementById('profiler').getContext('2d');

    if (chart) {
        chart.destroy();
        chart = null;
    }

    select = chosenName;

    if (!fileName || !select) return;

    try {
        let url = '';
        if (type === 'core') {
            url = `profiles/taskdata/${fileName}/${select}`;
        } else if (type === 'task') {
            url = `profiles/coredata/${fileName}/${select}`;
        } else {
          
            return;
        }

        const res = await axios.get(url);
        const data = res.data;
        labels = [];
        minData = [];
        maxData = [];
        avgData = [];

        data.forEach(d => {
            labels.push(type === 'core' ? d.core : d.task);
            minData.push(d.min_usaged);
            maxData.push(d.max_usaged);
            avgData.push(d.avg_usaged);
        });

        chart = new Chart(ctx, {
            type: chart_type,
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Min',
                        data: minData,
                        borderColor: 'rgba(0, 0, 255, 0.5)',
                        backgroundColor: 'rgba(0, 0, 255, 0.5)',
                    },
                    {
                        label: 'Max',
                        data: maxData,
                        borderColor: 'rgba(255, 0, 0, 1)',
                        backgroundColor: 'rgba(255, 0, 0, 0.5)',
                    },
                    {
                        label: 'Avg',
                        data: avgData,
                        borderColor: 'rgba(100, 255, 30, 1)',
                        backgroundColor: 'rgba(100, 255, 30, 0.5)',
                    }
                ]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: `${fileName}의 ${select} 정보`,
                        font: { size: 30 }
                    }
                }
            }
        });

    } catch (error) {
        console.error('차트 데이터 로드 중 오류:', error);
    }
}

btnline.addEventListener('click', () => {
    chart_type = 'line';
    btnline.className = "btn btn-secondary";
    btnbar.className = "btn btn-primary";
    btnpolarArea.className = "btn btn-primary";

    if (fileName) updateChart(null, null);
});

btnbar.addEventListener('click', () => {
    chart_type = 'bar';
    btnline.className = "btn btn-primary";
    btnbar.className = "btn btn-secondary";
    btnpolarArea.className = "btn btn-primary";

    if (fileName) updateChart(null, null);
});

btnpolarArea.addEventListener('click', () => {
    chart_type = 'polarArea';
    btnline.className = "btn btn-primary";
    btnbar.className = "btn btn-primary";
    btnpolarArea.className = "btn btn-secondary";

    if (fileName) updateChart(null, null);
});

getList();
