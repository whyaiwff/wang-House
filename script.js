document.addEventListener('DOMContentLoaded', function() {
    // 定义本地存储的key
    const STORAGE_KEY = 'restaurant_dish_data';

    // 初始菜品数据（备用：当本地存储无数据时使用）
    const defaultDishData = [
        { id: 1, name: '麻辣小龙虾', price: 88, category: 'hot' },
        { id: 2, name: '蒜蓉花甲', price: 38, category: 'hot' },
        { id: 3, name: '凉拌黄瓜', price: 12, category: 'cold' },
        { id: 4, name: '拍黄瓜', price: 10, category: 'cold' },
        { id: 5, name: '烤羊肉串', price: 5, category: 'snack' },
        { id: 6, name: '烤面筋', price: 3, category: 'snack' }
    ];

    // 从本地存储读取菜品数据
    function getDishDataFromStorage() {
        const storedData = localStorage.getItem(STORAGE_KEY);
        return storedData ? JSON.parse(storedData) : defaultDishData;
    }

    // 将菜品数据保存到本地存储
    function saveDishDataToStorage(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // 初始化菜品数据
    let dishData = getDishDataFromStorage();

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
    // 新增：订单预览相关
    const orderPreviewEl = document.getElementById('order-preview');
    const menuCardEl = document.getElementById('menu-card');
    const menuBodyEl = document.getElementById('menu-body');
    const menuTotalEl = document.getElementById('menu-total');
    const menuCountEl = document.getElementById('menu-count');
    const orderTimeEl = document.getElementById('order-time');
    const generateImageBtn = document.getElementById('generate-image');
    const imagePreviewEl = document.getElementById('image-preview');
    const menuImageEl = document.getElementById('menu-image');
    const downloadImageBtn = document.getElementById('download-image');

    // 初始化：渲染菜品列表
    renderDishList();
    // 初始化订单信息
    updateOrderInfo();

    // 渲染菜品列表函数
    function renderDishList(filterCategory = 'all') {
        dishListEl.innerHTML = '';

        const filteredDishes = filterCategory === 'all' 
            ? dishData 
            : dishData.filter(dish => dish.category === filterCategory);

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

            dishListEl.appendChild(dishEl);
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

        // 删除菜品（同步保存到本地存储）
        deleteBtn.addEventListener('click', function() {
            if (confirm(`确定删除【${dishEl.querySelector('h3').textContent}】吗？`)) {
                dishData = dishData.filter(dish => dish.id !== dishId);
                saveDishDataToStorage(dishData);
                const activeTab = document.querySelector('.tab.active');
                renderDishList(activeTab.dataset.category);
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

    // 添加新菜品（同步保存到本地存储）
    addDishBtn.addEventListener('click', function() {
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

        const maxId = dishData.length > 0 ? Math.max(...dishData.map(d => d.id)) : 0;
        const newDish = {
            id: maxId + 1,
            name: name,
            price: price,
            category: category
        };

        dishData.push(newDish);
        saveDishDataToStorage(dishData);

        const activeTab = document.querySelector('.tab.active');
        renderDishList(activeTab.dataset.category);

        newDishName.value = '';
        newDishPrice.value = '';

        alert(`成功添加菜品：【${name}】`);
    });

    // 渲染订单菜单（核心：展示已选菜品）
    function renderOrderMenu() {
        // 清空原有菜单
        menuBodyEl.innerHTML = '';
        let totalPrice = 0;
        let totalCount = 0;
        let hasSelectedDish = false;

        // 获取已选菜品（数量>0的）
        document.querySelectorAll('.dish').forEach(dish => {
            const count = parseInt(dish.querySelector('.count').value) || 0;
            if (count > 0) {
                hasSelectedDish = true;
                const name = dish.querySelector('h3').textContent;
                const price = parseFloat(dish.querySelector('.dish-price').value);
                const unitPrice = price.toFixed(2);
                const subtotal = (count * price).toFixed(2);

                // 创建菜品项
                const dishItemEl = document.createElement('div');
                dishItemEl.className = 'dish-item';
                dishItemEl.innerHTML = `
                    <span class="dish-name">${name} × ${count}</span>
                    <span class="dish-price-count">¥${subtotal}</span>
                `;
                menuBodyEl.appendChild(dishItemEl);

                totalPrice += count * price;
                totalCount += count;
            }
        });

        // 更新菜单总计
        menuTotalEl.textContent = `¥${totalPrice.toFixed(2)}`;
        menuCountEl.textContent = totalCount;

        // 设置下单时间
        const now = new Date();
        const timeStr = now.toLocaleString('zh-CN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        orderTimeEl.textContent = `下单时间：${timeStr}`;

        // 显示订单预览区
        orderPreviewEl.style.display = 'block';
        // 隐藏图片预览区（重置）
        imagePreviewEl.style.display = 'none';
    }

    // 生成菜单图片（核心：html2canvas）
    function generateMenuImage() {
        // 显示加载提示
        generateImageBtn.textContent = '生成中...';
        generateImageBtn.disabled = true;

        // 使用html2canvas将菜单卡片转为canvas
        html2canvas(menuCardEl, {
            scale: 2, // 提高分辨率
            useCORS: true, // 支持跨域图片（如果有）
            backgroundColor: '#ffffff' // 背景色
        }).then(canvas => {
            // 将canvas转为图片URL
            const imageUrl = canvas.toDataURL('image/png');
            // 显示图片预览
            menuImageEl.src = imageUrl;
            imagePreviewEl.style.display = 'block';
            // 保存图片URL到下载按钮（用于下载）
            downloadImageBtn.dataset.imageUrl = imageUrl;

            // 恢复按钮状态
            generateImageBtn.textContent = '生成菜单图片';
            generateImageBtn.disabled = false;
        }).catch(error => {
            alert('图片生成失败：' + error.message);
            generateImageBtn.textContent = '生成菜单图片';
            generateImageBtn.disabled = false;
        });
    }

    // 下载菜单图片
    function downloadMenuImage() {
        const imageUrl = downloadImageBtn.dataset.imageUrl;
        if (!imageUrl) {
            alert('请先生成菜单图片！');
            return;
        }

        // 创建下载链接
        const link = document.createElement('a');
        link.href = imageUrl;
        // 设置文件名（含时间）
        const now = new Date();
        const fileName = `点单菜单_${now.getTime()}.png`;
        link.download = fileName;
        // 触发下载
        link.click();
    }

    // 提交订单（新增：渲染订单菜单）
    submitBtn.addEventListener('click', function() {
        const total = parseFloat(totalPriceEl.textContent.replace('¥', ''));
        if (total === 0) {
            alert('请先选择菜品！');
            return;
        }

        // 渲染订单菜单
        renderOrderMenu();

        alert(`订单提交成功！
已选菜品：${dishCountEl.textContent}份
总价：${totalPriceEl.textContent}
请查看下方菜单并可生成图片保存~`);
        // 不清空数量（方便用户查看/修改）
    });

    // 绑定生成图片按钮事件
    generateImageBtn.addEventListener('click', generateMenuImage);
    // 绑定下载图片按钮事件
    downloadImageBtn.addEventListener('click', downloadMenuImage);
});