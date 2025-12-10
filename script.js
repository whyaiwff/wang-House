document.addEventListener('DOMContentLoaded', function() {
    // 初始菜品数据
    let dishData = [
        { id: 1, name: '麻辣小龙虾', price: 88, category: 'hot' },
        { id: 2, name: '蒜蓉花甲', price: 38, category: 'hot' },
        { id: 3, name: '凉拌黄瓜', price: 12, category: 'cold' },
        { id: 4, name: '拍黄瓜', price: 10, category: 'cold' },
        { id: 5, name: '烤羊肉串', price: 5, category: 'snack' },
        { id: 6, name: '烤面筋', price: 3, category: 'snack' }
    ];

    // DOM元素
    const dishListEl = document.getElementById('dish-list');
    const totalPriceEl = document.getElementById('total-price');
    const dishCountEl = document.getElementById('dish-count');
    const submitBtn = document.getElementById('submit-order');
    const selectAllBtn = document.getElementById('select-all');
    const minusAllBtn = document.getElementById('minus-all');
    const clearAllBtn = document.getElementById('clear-all');
    const tabs = document.querySelectorAll('.tab');
    // 菜品管理相关
    const addDishBtn = document.getElementById('add-dish-btn');
    const newDishName = document.getElementById('new-dish-name');
    const newDishPrice = document.getElementById('new-dish-price');
    const newDishCategory = document.getElementById('new-dish-category');

    // 初始化：渲染菜品列表
    renderDishList();
    // 初始化订单信息
    updateOrderInfo();

    // 渲染菜品列表函数（核心：动态生成菜品）
    function renderDishList(filterCategory = 'all') {
        // 清空现有列表
        dishListEl.innerHTML = '';

        // 筛选需要显示的菜品
        const filteredDishes = filterCategory === 'all' 
            ? dishData 
            : dishData.filter(dish => dish.category === filterCategory);

        // 生成每个菜品的DOM
        filteredDishes.forEach(dish => {
            const dishEl = document.createElement('div');
            dishEl.className = 'dish';
            dishEl.dataset.category = dish.category;
            dishEl.dataset.id = dish.id;

            dishEl.innerHTML = `
                <button class="delete-dish">×</button>
                <h3>${dish.name}</h3>
                <p class="price">¥${dish.price}/${dish.category === 'snack' ? '串' : '份'}</p>
                <div class="controls">
                    <button class="minus">-</button>
                    <input type="number" class="count" value="0" min="0">
                    <button class="plus">+</button>
                </div>
                <input type="hidden" class="dish-price" value="${dish.price}">
            `;

            // 添加到列表
            dishListEl.appendChild(dishEl);

            // 绑定单个菜品的事件（数量操作、删除）
            bindDishEvents(dishEl);
        });
    }

    // 绑定单个菜品的事件
    function bindDishEvents(dishEl) {
        const minusBtn = dishEl.querySelector('.minus');
        const plusBtn = dishEl.querySelector('.plus');
        const countInput = dishEl.querySelector('.count');
        const deleteBtn = dishEl.querySelector('.delete-dish');
        const dishId = parseInt(dishEl.dataset.id);

        // 初始禁用减号
        minusBtn.disabled = true;

        // 加号按钮
        plusBtn.addEventListener('click', function() {
            let count = parseInt(countInput.value);
            countInput.value = ++count;
            minusBtn.disabled = false;
            updateOrderInfo();
        });

        // 减号按钮
        minusBtn.addEventListener('click', function() {
            let count = parseInt(countInput.value);
            if (count > 0) {
                countInput.value = --count;
                minusBtn.disabled = count === 0;
                updateOrderInfo();
            }
        });

        // 数量输入框
        countInput.addEventListener('input', function() {
            let count = parseInt(this.value) || 0;
            if (count < 0) count = 0;
            this.value = count;
            minusBtn.disabled = count === 0;
            updateOrderInfo();
        });

        countInput.addEventListener('blur', function() {
            if (!this.value || this.value === '0') {
                this.value = 0;
                minusBtn.disabled = true;
            }
        });

        // 删除菜品按钮（核心：删除菜品种类）
        deleteBtn.addEventListener('click', function() {
            if (confirm(`确定删除【${dishEl.querySelector('h3').textContent}】吗？`)) {
                // 从数据中删除
                dishData = dishData.filter(dish => dish.id !== dishId);
                // 重新渲染列表
                const activeTab = document.querySelector('.tab.active');
                renderDishList(activeTab.dataset.category);
                // 更新订单信息
                updateOrderInfo();
            }
        });
    }

    // 更新订单总价和份数
    function updateOrderInfo() {
        let totalPrice = 0;
        let totalCount = 0;

        document.querySelectorAll('.dish').forEach(dish => {
            const count = parseInt(dish.querySelector('.count').value) || 0;
            const price = parseFloat(dish.querySelector('.dish-price').value);
            totalPrice += count * price;
            totalCount += count;
        });

        totalPriceEl.textContent = `¥${totalPrice.toFixed(2)}`;
        dishCountEl.textContent = totalCount;
    }

    // 批量操作：全选+1
    selectAllBtn.addEventListener('click', function() {
        document.querySelectorAll('.dish').forEach(dish => {
            const countInput = dish.querySelector('.count');
            const minusBtn = dish.querySelector('.minus');
            countInput.value = parseInt(countInput.value) + 1;
            minusBtn.disabled = false;
        });
        updateOrderInfo();
    });

    // 批量操作：全部-1
    minusAllBtn.addEventListener('click', function() {
        document.querySelectorAll('.dish').forEach(dish => {
            const countInput = dish.querySelector('.count');
            const minusBtn = dish.querySelector('.minus');
            let count = parseInt(countInput.value);
            if (count > 0) {
                countInput.value = --count;
                minusBtn.disabled = count === 0;
            }
        });
        updateOrderInfo();
    });

    // 批量操作：清空所有数量
    clearAllBtn.addEventListener('click', function() {
        document.querySelectorAll('.dish').forEach(dish => {
            const countInput = dish.querySelector('.count');
            const minusBtn = dish.querySelector('.minus');
            countInput.value = 0;
            minusBtn.disabled = true;
        });
        updateOrderInfo();
    });

    // 分类切换
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            renderDishList(this.dataset.category);
        });
    });

    // 添加新菜品（核心：新增菜品种类）
    addDishBtn.addEventListener('click', function() {
        // 验证输入
        const name = newDishName.value.trim();
        const price = parseFloat(newDishPrice.value);
        const category = newDishCategory.value;

        if (!name) {
            alert('请输入菜品名称！');
            return;
        }
        if (isNaN(price) || price < 0) {
            alert('请输入有效的菜品价格！');
            return;
        }

        // 生成新菜品ID（取最大ID+1）
        const maxId = dishData.length > 0 ? Math.max(...dishData.map(d => d.id)) : 0;
        const newDish = {
            id: maxId + 1,
            name: name,
            price: price,
            category: category
        };

        // 添加到数据列表
        dishData.push(newDish);

        // 重新渲染列表（保持当前分类筛选）
        const activeTab = document.querySelector('.tab.active');
        renderDishList(activeTab.dataset.category);

        // 清空表单
        newDishName.value = '';
        newDishPrice.value = '';

        alert(`成功添加菜品：【${name}】`);
    });

    // 提交订单
    submitBtn.addEventListener('click', function() {
        const total = parseFloat(totalPriceEl.textContent.replace('¥', ''));
        if (total === 0) {
            alert('请先选择菜品！');
        } else {
            alert(`订单提交成功！
已选菜品：${dishCountEl.textContent}份
总价：${totalPriceEl.textContent}
请等待商家确认~`);
            clearAllBtn.click(); // 清空数量
        }
    });
});