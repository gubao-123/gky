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
    let currentWords = [];
    let currentWord = null;  // 存储当前显示的单词对象
    let studyTimer = null;
    let unstudiedWords = []; // 存储当前组的未学单词

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
                        <li>文件格式是否正确</li>
                    </ul>
                `;
            });
    }

    // 填充题组选择下拉框
    function populateGroupSelect() {
        // 清空现有选项
        groupSelect.innerHTML = '<option value="">请选择题组</option>';
        
        // 获取所有大类
        const groups = [...new Set(wordDatabase.map(word => word.dalei))];
        
        groups.forEach(group => {
            if (group) { // 确保group不为空
                const option = document.createElement('option');
                option.value = group;
                option.textContent = group;
                groupSelect.appendChild(option);
            }
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
        unstudiedWords = currentWords.filter(word => word.state !== '已学');
        
        // 如果没有未学的单词
        if (unstudiedWords.length === 0) {
            if (confirm('该组所有单词已学习完毕，是否重置学习状态？')) {
                currentWords.forEach(word => word.state = '未学');
                unstudiedWords = [...currentWords]; // 复制数组
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
        unstudiedWords = currentWords.filter(word => word.state !== '已学');
        if (unstudiedWords.length === 0) {
            alert('恭喜！您已完成本组所有单词的学习！');
            return;
        }
        
        // 随机选择一个单词
        const randomIndex = Math.floor(Math.random() * unstudiedWords.length);
        currentWord = unstudiedWords[randomIndex];
        
        // 显示单词信息
        englishRow.textContent = currentWord.english;
        splitRow.textContent = currentWord.chaifen;
        phoneticElement.textContent = currentWord.yinbiao;
        chineseRow.textContent = currentWord.chinese;
        
        // 设置读音
        if (currentWord.duyin) {
            pronunciation.src = currentWord.duyin;
            pronounceBtn.style.display = 'inline-block';
        } else {
            pronounceBtn.style.display = 'none';
        }
        
        // 设置例句
        example1Row.textContent = currentWord.example1 ? `1. ${currentWord.example1}` : '';
        example2Row.textContent = currentWord.example2 ? `2. ${currentWord.example2}` : '';
        example3Row.textContent = currentWord.example3 ? `3. ${currentWord.example3}` : '';
        
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
            if (!currentWord) return;
            
            const userAnswer = answerInput.value.trim().toLowerCase();
            const correctAnswer = currentWord.english.toLowerCase();
            
            if (userAnswer === correctAnswer) {
                feedbackElement.textContent = '正确!';
                feedbackElement.className = 'correct';
                
                // 显示例句
                if (currentWord.example1) example1Row.style.display = 'block';
                if (currentWord.example2) example2Row.style.display = 'block';
                if (currentWord.example3) example3Row.style.display = 'block';
                nextBtn.style.display = 'inline-block';
                
                // 自动标记为已学
                currentWord.state = '已学';
                updateWordCount();
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
        showNextWord();
    });

    // 播放读音
    pronounceBtn.addEventListener('click', function() {
        if (pronunciation.src) {
            pronunciation.play().catch(e => {
                console.error('播放音频失败:', e);
                feedbackElement.textContent = '无法播放音频';
                feedbackElement.className = 'incorrect';
            });
        }
    });

    // 初始化时聚焦到选择框
    groupSelect.focus();
});