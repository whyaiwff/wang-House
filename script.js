// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取所有菜品元素
    const dishes = document.querySelectorAll('.dish');
    // 获取总价显示元素
    const totalPriceEl = document.getElementById('total-price');
    // 获取提交订单按钮
    const submitBtn = document.getElementById('submit-order');

    // 为每个菜品绑定加减按钮事件
    dishes.forEach(dish => {
        const minusBtn = dish.querySelector('.minus');
        const plusBtn = dish.querySelector('.plus');
        const countEl = dish.querySelector('.count');
        const price = parseFloat(dish.querySelector('.dish-price').value);

        // 初始禁用减号按钮
        minusBtn.disabled = true;

        // 加号按钮点击事件
        plusBtn.addEventListener('click', function() {
            let count = parseInt(countEl.textContent);
            count++;
            countEl.textContent = count;
            minusBtn.disabled = false; // 有数量后启用减号
            calculateTotal(); // 重新计算总价
        });

        // 减号按钮点击事件
        minusBtn.addEventListener('click', function() {
            let count = parseInt(countEl.textContent);
            if (count > 0) {
                count--;
                countEl.textContent = count;
                // 数量为0时禁用减号
                if (count === 0) {
                    minusBtn.disabled = true;
                }
                calculateTotal(); // 重新计算总价
            }
        });
    });

    // 计算总价的函数
    function calculateTotal() {
        let total = 0;
        dishes.forEach(dish => {
            const count = parseInt(dish.querySelector('.count').textContent);
            const price = parseFloat(dish.querySelector('.dish-price').value);
            total += count * price;
        });
        // 更新总价显示
        totalPriceEl.textContent = `¥${total}`;
    }

    // 提交订单按钮事件
    submitBtn.addEventListener('click', function() {
        const total = parseFloat(totalPriceEl.textContent.replace('¥', ''));
        if (total === 0) {
            alert('请先选择菜品！');
        } else {
            alert(`订单提交成功！\n总价：${totalPriceEl.textContent}\n请等待商家确认~`);
            // 重置所有菜品数量
            dishes.forEach(dish => {
                const countEl = dish.querySelector('.count');
                const minusBtn = dish.querySelector('.minus');
                countEl.textContent = '0';
                minusBtn.disabled = true;
            });
            // 重置总价
            totalPriceEl.textContent = '¥0';
        }
    });
});