// 初始化数据
window.countdowns = JSON.parse(localStorage.getItem('countdowns')) || []
init()

// 事件绑定
const addBtn = document.getElementById('addBtn')
addBtn.addEventListener('click', handleAddCountdown)

// 保存数据到本地存储
function saveToLocalStorage() {
    localStorage.setItem('countdowns', JSON.stringify(window.countdowns))
}

// 渲染列表主函数
function renderList() {
    const list = document.getElementById('countdownList')
    list.innerHTML = ''
    const sortedData = sortCountdowns()
    sortedData.forEach(item => list.appendChild(createCountdownItem(item)))
}

// 排序倒数日（今天优先，未来日期正序，过去日期倒序）
function sortCountdowns() {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const nowStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    ).getTime()

    return [...window.countdowns].sort((a, b) => {
        // 今天的日期排在最前面
        const aIsToday = a.targetDate === today
        const bIsToday = b.targetDate === today
        if (aIsToday !== bIsToday) return aIsToday ? -1 : 1

        // 计算日期时间戳（忽略时分秒）
        const aStart = new Date(a.targetDate).setHours(0, 0, 0, 0)
        const bStart = new Date(b.targetDate).setHours(0, 0, 0, 0)
        const aDiff = aStart - nowStart
        const bDiff = bStart - nowStart

        // 排序逻辑：未来日期正序，过去日期倒序
        return aDiff >= 0 && bDiff >= 0 ?
            aDiff - bDiff :
            aDiff >= 0 ?
                -1 :
                bDiff >= 0 ?
                    1 :
                    Math.abs(aDiff) - Math.abs(bDiff)
    })
}

// 处理删除倒数日函数（补充验证）
function handleDeleteCountdown(id) {
    if (!confirm('确定要删除这个倒数日吗？')) return
    // 新增：验证ID是否存在于当前数组中
    const targetItem = window.countdowns.find(item => item.id === id)
    if (!targetItem) {
        alert('错误：未找到要删除的倒数日，请刷新页面后重试')
        return
    }
    // 执行删除
    window.countdowns = window.countdowns.filter(item => item.id !== id)
    saveToLocalStorage()
    renderList()
    updateExportButtonState()
}

// 计算天数文本函数
function getDaysText(targetDateStr) {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    if (targetDateStr === today) return '就在今天'

    const nowStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    ).getTime()
    const targetStart = new Date(targetDateStr).setHours(0, 0, 0, 0)
    const timeDiff = nowStart - targetStart
    const days = Math.abs(timeDiff) / (1000 * 3600 * 24)

    return targetStart >= nowStart ?
        `剩余 ${days} 天` :
        `已过去 ${days} 天`
}

// 处理添加倒数日函数
function handleAddCountdown() {
    const nameInput = document.getElementById('nameInput')
    const issueInput = document.getElementById('issueInput')
    const dateInput = document.getElementById('dateInput')
    const name = nameInput.value.trim()
    const issue = issueInput.value.trim()
    const date = dateInput.value

    if (!name || !date) {
        alert('请填写完整的倒数日名称和日期')
        return
    }

    window.countdowns.push({
        id: Date.now(),
        name,
        targetDate: date,
        createdAt: new Date().toISOString(),
        issue: issue || null
    })

    saveToLocalStorage()
    clearInputs()
    renderList()
    updateExportButtonState()
}

// 创建单个列表项函数
function createCountdownItem(item) {
    const itemElem = document.createElement('div')
    itemElem.className = 'countdown-item'
    const daysText = getDaysText(item.targetDate)
    const daysClass = getDaysClass(daysText)
    const issueHtml = generateIssueHtml(item)

    itemElem.innerHTML = generateItemHtml(item, daysClass, daysText, issueHtml)
    setupDeleteButtonListener(itemElem, item.id)
    return itemElem
}

// 设置删除按钮事件监听
function setupDeleteButtonListener(element, itemId) {
    const deleteBtn = element.querySelector('.delete-btn')
    deleteBtn.addEventListener('click', e => {
        const targetId = Number(e.currentTarget.dataset.id)
        if (isNaN(targetId)) {
            alert('错误：无效的删除ID，请刷新页面后重试')
            return
        }
        handleDeleteCountdown(targetId)
    })
}

// 生成列表项HTML
function generateItemHtml(item, daysClass, daysText, issueHtml) {
    return `
        <div class="countdown-item" ${formatCreatedAt(item.createdAt) ? 
            `data-created-at="${formatCreatedAt(item.createdAt)}"` : ''}>
          <div class="item-info">
             <div class="name">${item.name}</div>
            <div class="date-and-delete">
                <div class="target-date">${item.targetDate}</div>
                ${issueHtml}
                <button class="delete-btn" data-id="${item.id}">删除</button>
            </div>
        </div>
        <div class="days-large ${daysClass}">${daysText}</div>
    `
}

// 格式化创建时间显示
function formatCreatedAt(isoString) {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) {
        return ''
    }
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 获取天数显示样式类
function getDaysClass(daysText) {
    if (daysText.startsWith('剩余')) return 'days-future'
    if (daysText === '就在今天') return 'days-today'
    return 'days-past'
}

// 生成issue链接HTML
function generateIssueHtml(item) {
    return item.issue ?
        `<a href="https://redmine.licsber.site/issues/${item.issue}"
            class="issue-link" 
            target="_blank">
            ${item.issue}
        </a>` :
        `<span class="issue-plain">无关联工单</span>`
}

// 事件绑定（回车提交）
const nameInput = document.getElementById('nameInput')
nameInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') handleAddCountdown()
})

// 初始化入口函数（新增日期默认值）
function init() {
    renderList()
    updateExportButtonState()
    // 设置日期输入框默认值为今天
    const today = new Date().toISOString().split('T')[0]
    const dateInput = document.getElementById('dateInput')
    dateInput.value = today
}

// 清空输入框函数（修改日期清空逻辑）
function clearInputs() {
    const nameInput = document.getElementById('nameInput')
    nameInput.value = ''
    // 日期输入框恢复为今天
    const today = new Date().toISOString().split('T')[0]
    const dateInput = document.getElementById('dateInput')
    dateInput.value = today
}

// 处理导出数据函数
const exportBtn = document.getElementById('exportBtn')
exportBtn.addEventListener('click', handleExport)
function handleExport() {
    if (window.countdowns.length === 0) {
        alert('当前没有需要导出的倒数日数据')
        return
    }
    const jsonData = JSON.stringify(window.countdowns, null, 2)
    const blob = new Blob(
        [jsonData],
        { type: 'application/json' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'counting-time.json'
    a.click()
    URL.revokeObjectURL(url)
}

// 处理导入数据函数
const importInput = document.getElementById('importInput')
importInput.addEventListener('change', handleImport)
// 处理导入数据函数（修复id重复问题）
function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
        try {
            const importedData = JSON.parse(event.target.result)
            if (!Array.isArray(importedData)) {
                throw new Error('无效的JSON格式：需要数组类型')
            }
            // 关键修复：为每个导入条目生成唯一id（时间戳+索引）
            // 合并导入数据：存在相同ID则覆盖，否则追加
            // 使用Map合并数据，存在相同ID则覆盖
            const existingMap = new Map(
                window.countdowns.map(item => [item.id, item])
            )
            const newItems = importedData.map((item, index) => {
                // 如果导入项有有效ID，则使用
                if (item.id !== undefined && !isNaN(Number(item.id))) {
                    return { ...item, id: Number(item.id) }
                }
                // 生成新ID，确保不与现有ID冲突
                let newId
                do {
                    newId = Date.now() + index
                    index++
                } while (existingMap.has(newId))
                return { ...item, id: newId }
            })
            newItems.forEach(item => existingMap.set(item.id, item))
            window.countdowns = Array.from(existingMap.values())
            saveToLocalStorage()
            renderList()
            alert(`导入成功，共加载 ${window.countdowns.length} 条记录`)
        } catch (error) {
            alert(`导入失败：${error.message}`)
        }
    }
    reader.readAsText(file)
}

// 更新导出按钮状态函数
function updateExportButtonState() {
    const exportBtn = document.querySelector('.export-btn')
    const hasData = window.countdowns.length > 0
    exportBtn.disabled = !hasData
    exportBtn.title = hasData ? '' : '无数据可导出'
}

// 触发导入文件选择
const importBtn = document.getElementById('importBtn')
importBtn.addEventListener('click', () => {
    document.getElementById('importInput').click()
})
