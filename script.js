document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const groupSelect = document.getElementById('group-select');
    const wordCountSpan = document.getElementById('word-count');
    const startBtn = document.getElementById('start-btn');
    const loadingElement = document.getElementById('loading');
    const wordContainer = document.getElementById('word-container');
    
    // 单词显示区域元素
    const englishRow = document.getElementById('english-row');
    const splitRow = document.getElementById('split-row');
    const phoneticElement = document.getElementById('phonetic');
    const pronounceBtn = document.getElementById('pronounce-btn');
    const chineseRow = document.getElementById('chinese-row');
    const inputRow = document.getElementById('input-row');
    const answerInput = document.getElementById('answer-input');
    const feedbackElement = document.getElementById('feedback');
    const example1Row = document.getElementById('example1-row');
    const example2Row = document.getElementById('example2-row');
    const example3Row = document.getElementById('example3-row');
    const nextBtn = document.getElementById('next-btn');
    const pronunciation = document.getElementById('pronunciation');
    
    // 全局变量
    let wordDatabase = [];
    let currentGroup = '';
    let currentWordIndex = -1;
    let currentWords = [];
    let studyTimer = null;
    
    // 初始化 - 加载单词数据库
    loadWordDatabase();
    
    // 加载单词数据库
    function loadWordDatabase() {
        fetch('words.json')
            .then(response => {
                if (!response.ok) throw new Error('网络响应不正常');
                return response.json();
            })
            .then(data => {
                wordDatabase = data;
                populateGroupSelect();
                loadingElement.style.display = 'none';
                wordContainer.style.display = 'block';
            })
            .catch(error => {
                console.error('加载单词数据库失败:', error);
                loadingElement.innerHTML = `
                    <p style="color: #e74c3c;">加载单词数据库失败: ${error.message}</p>
                    <p>请检查: </p>
                    <ul>
                        <li>words.json文件是否存在</li>
                        <li>是否通过HTTP服务器访问</li>
                    </ul>
                `;
            });
    }
    
    // 填充题组选择下拉框
    function populateGroupSelect() {
        // 获取所有大类
        const groups = [...new Set(wordDatabase.map(word => word.dalei))];
        
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group;
            option.textContent = group;
            groupSelect.appendChild(option);
        });
    }
    
    // 更新单词统计
    function updateWordCount() {
        const total = currentWords.length;
        const unstudied = currentWords.filter(word => word.state !== '已学').length;
        wordCountSpan.textContent = `未学: ${unstudied} / 总数: ${total}`;
    }
    
    // 开始学习
    startBtn.addEventListener('click', function() {
        currentGroup = groupSelect.value;
        if (!currentGroup) {
            alert('请先选择题组');
            return;
        }
        
        // 筛选当前题组的单词
        currentWords = wordDatabase.filter(word => word.dalei === currentGroup);
        
        // 如果没有未学的单词
        if (currentWords.every(word => word.state === '已学')) {
            if (confirm('该组所有单词已学习完毕，是否重置学习状态？')) {
                currentWords.forEach(word => word.state = '未学');
                updateWordCount();
            } else {
                return;
            }
        }
        
        updateWordCount();
        showNextWord();
    });
    
    // 显示下一个单词
    function showNextWord() {
        // 隐藏例句和输入框
        inputRow.style.display = 'none';
        example1Row.style.display = 'none';
        example2Row.style.display = 'none';
        example3Row.style.display = 'none';
        nextBtn.style.display = 'none';
        
        // 获取未学习的单词
        const unstudiedWords = currentWords.filter(word => word.state !== '已学');
        if (unstudiedWords.length === 0) {
            alert('恭喜！您已完成本组所有单词的学习！');
            return;
        }
        
        // 随机选择一个单词
        currentWordIndex = Math.floor(Math.random() * unstudiedWords.length);
        const word = unstudiedWords[currentWordIndex];
        
        // 显示单词信息
        englishRow.textContent = word.english;
        splitRow.textContent = word.chaifen;
        phoneticElement.textContent = word.yinbiao;
        chineseRow.textContent = word.chinese;
        
        // 设置读音
        pronunciation.src = word.duyin;
        
        // 设置例句
        example1Row.textContent = `1. ${word.example1}`;
        example2Row.textContent = `2. ${word.example2}`;
        example3Row.textContent = `3. ${word.example3}`;
        
        // 10秒后显示输入框
        if (studyTimer) clearTimeout(studyTimer);
        studyTimer = setTimeout(() => {
            englishRow.textContent = '';
            splitRow.textContent = '';
            inputRow.style.display = 'flex';
            answerInput.value = '';
            feedbackElement.textContent = '';
            answerInput.focus();
        }, 10000);
    }
    
    // 检查答案
    answerInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const currentWord = currentWords.find(word => word.state !== '已学');
            if (!currentWord) return;
            
            if (answerInput.value.trim().toLowerCase() === currentWord.english.toLowerCase()) {
                feedbackElement.textContent = '正确!';
                feedbackElement.className = 'correct';
                
                // 显示例句
                example1Row.style.display = 'block';
                example2Row.style.display = 'block';
                example3Row.style.display = 'block';
                nextBtn.style.display = 'inline-block';
            } else {
                feedbackElement.textContent = '错误，请再试一次';
                feedbackElement.className = 'incorrect';
                answerInput.value = '';
                answerInput.focus();
            }
        }
    });
    
    // 下一个单词
    nextBtn.addEventListener('click', function() {
        // 标记当前单词为已学
        const unstudiedWords = currentWords.filter(word => word.state !== '已学');
        if (currentWordIndex >= 0 && currentWordIndex < unstudiedWords.length) {
            const wordId = unstudiedWords[currentWordIndex].id;
            const wordInDatabase = currentWords.find(w => w.id === wordId);
            if (wordInDatabase) {
                wordInDatabase.state = '已学';
            }
        }
        
        updateWordCount();
        showNextWord();
    });
    
    // 播放读音
    pronounceBtn.addEventListener('click', function() {
        pronunciation.play();
    });
});