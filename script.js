document.addEventListener('DOMContentLoaded', function() {
    const dishes = document.querySelectorAll('.dish');
    const totalPriceEl = document.getElementById('total-price');
    const dishCountEl = document.getElementById('dish-count');
    const submitBtn = document.getElementById('submit-order');
    // 批量操作按钮
    const selectAllBtn = document.getElementById('select-all');
    const minusAllBtn = document.getElementById('minus-all');
    const clearAllBtn = document.getElementById('clear-all');
    // 分类标签
    const tabs = document.querySelectorAll('.tab');

    // 初始化所有菜品
    dishes.forEach(dish => {
        initDishControls(dish);
    });

    // 初始化单个菜品的控制逻辑
    function initDishControls(dish) {
        const minusBtn = dish.querySelector('.minus');
        const plusBtn = dish.querySelector('.plus');
        const countInput = dish.querySelector('.count');
        const price = parseFloat(dish.querySelector('.dish-price').value);

        // 初始禁用减号按钮
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

        // 输入框直接修改数量（核心便捷功能）
        countInput.addEventListener('input', function() {
            // 过滤非数字输入，确保数量≥0
            let count = parseInt(this.value) || 0;
            if (count < 0) count = 0;
            this.value = count;
            minusBtn.disabled = count === 0;
            updateOrderInfo();
        });

        // 输入框失去焦点时格式化
        countInput.addEventListener('blur', function() {
            if (!this.value || this.value === '0') {
                this.value = 0;
                minusBtn.disabled = true;
            }
        });
    }

    // 更新订单总价和已选份数
    function updateOrderInfo() {
        let totalPrice = 0;
        let totalCount = 0;

        dishes.forEach(dish => {
            const count = parseInt(dish.querySelector('.count').value) || 0;
            const price = parseFloat(dish.querySelector('.dish-price').value);
            totalPrice += count * price;
            totalCount += count;
        });

        totalPriceEl.textContent = `¥${totalPrice}`;
        dishCountEl.textContent = totalCount;
    }

    // 批量操作：全选（所有菜品+1）
    selectAllBtn.addEventListener('click', function() {
        dishes.forEach(dish => {
            const countInput = dish.querySelector('.count');
            const minusBtn = dish.querySelector('.minus');
            countInput.value = parseInt(countInput.value) + 1;
            minusBtn.disabled = false;
        });
        updateOrderInfo();
    });

    // 批量操作：全部-1
    minusAllBtn.addEventListener('click', function() {
        dishes.forEach(dish => {
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

    // 批量操作：清空所有
    clearAllBtn.addEventListener('click', function() {
        dishes.forEach(dish => {
            const countInput = dish.querySelector('.count');
            const minusBtn = dish.querySelector('.minus');
            countInput.value = 0;
            minusBtn.disabled = true;
        });
        updateOrderInfo();
    });

    // 菜品分类切换
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 切换激活状态
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const category = this.dataset.category;
            // 显示对应分类的菜品
            dishes.forEach(dish => {
                if (category === 'all' || dish.dataset.category === category) {
                    dish.style.display = 'block';
                } else {
                    dish.style.display = 'none';
                }
            });
        });
    });

    // 提交订单
    submitBtn.addEventListener('click', function() {
        const total = parseFloat(totalPriceEl.textContent.replace('¥', ''));
        if (total === 0) {
            alert('请先选择菜品！');
        } else {
            alert(`订单提交成功！\n已选菜品：${dishCountEl.textContent}份\n总价：${totalPriceEl.textContent}\n请等待商家确认~`);
            clearAllBtn.click(); // 提交后清空
        }
    });

    // 初始化订单信息
    updateOrderInfo();
});