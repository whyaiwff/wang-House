document.addEventListener('DOMContentLoaded', function() {
    // 订单状态存储KEY
    const STORAGE_KEYS = {
        DISH_COUNTS: 'restaurant_dish_counts',
        ACTIVE_TAB: 'restaurant_active_tab',
        ORDER_STATE: 'restaurant_order_state'
    };

    // 移动端优化的图片配置
    const IMAGE_CONFIG = {
        maxWidth: 600,    
        maxHeight: 600,   
        quality: 0.7,     
        cropRatio: 4/3    
    };

    // 检测是否为移动端
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // ==================== 订单状态管理 ====================
    // 保存菜品数量到本地存储
    function saveDishCountsToStorage() {
        try {
            const counts = {};
            document.querySelectorAll('.dish').forEach(dish => {
                const dishId = dish.dataset.id;
                const count = dish.querySelector('.count').value;
                counts[dishId] = count;
            });
            localStorage.setItem(STORAGE_KEYS.DISH_COUNTS, JSON.stringify(counts));
        } catch (e) {
            console.error('保存菜品数量失败:', e);
        }
    }

    // 恢复菜品数量
    function restoreDishCounts() {
        try {
            const storedCounts = localStorage.getItem(STORAGE_KEYS.DISH_COUNTS);
            if (!storedCounts) return;
            
            const counts = JSON.parse(storedCounts);
            document.querySelectorAll('.dish').forEach(dish => {
                const dishId = dish.dataset.id;
                if (counts[dishId] !== undefined) {
                    const countInput = dish.querySelector('.count');
                    const minusBtn = dish.querySelector('.minus');
                    countInput.value = counts[dishId];
                    minusBtn.disabled = counts[dishId] == 0;
                }
            });
        } catch (e) {
            console.error('恢复菜品数量失败:', e);
        }
    }

    // 保存激活的分类标签
    function saveActiveTab(category) {
        try {
            localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, category);
        } catch (e) {
            console.error('保存分类标签失败:', e);
        }
    }

    // 恢复激活的分类标签
    function restoreActiveTab() {
        try {
            const activeTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) || 'all';
            tabs.forEach(tab => {
                if (tab.dataset.category === activeTab) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
            return activeTab;
        } catch (e) {
            console.error('恢复分类标签失败:', e);
            return 'all';
        }
    }

    // 保存订单状态
    function saveOrderState(isSubmitted, orderData) {
        try {
            const state = {
                isSubmitted: isSubmitted,
                orderData: orderData || null,
                timestamp: new Date().getTime()
            };
            localStorage.setItem(STORAGE_KEYS.ORDER_STATE, JSON.stringify(state));
        } catch (e) {
            console.error('保存订单状态失败:', e);
        }
    }

    // 恢复订单状态
    function restoreOrderState() {
        try {
            const storedState = localStorage.getItem(STORAGE_KEYS.ORDER_STATE);
            if (!storedState) return null;
            
            const state = JSON.parse(storedState);
            // 如果订单超过24小时，自动清除
            const now = new Date().getTime();
            if (now - state.timestamp > 24 * 60 * 60 * 1000) {
                localStorage.removeItem(STORAGE_KEYS.ORDER_STATE);
                return null;
            }
            
            return state;
        } catch (e) {
            console.error('恢复订单状态失败:', e);
            return null;
        }
    }

    // ==================== 图片处理方法 ====================
    // 压缩图片并返回Base64 - 移动端优化
    function compressImage(img, width, height, quality) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 移动端进一步压缩
        const maxSize = isMobile ? 400 : IMAGE_CONFIG.maxWidth;
        let newWidth = width;
        let newHeight = height;
        
        if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            newWidth = width * ratio;
            newHeight = height * ratio;
        }
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // 绘制并压缩图片
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        return canvas.toDataURL('image/jpeg', isMobile ? 0.7 : quality || IMAGE_CONFIG.quality);
    }

    // 裁剪并压缩图片 - 移动端交互优化
    function cropAndCompressImage(file, callback, isEdit = false) {
        if (!file) {
            callback(null);
            return;
        }
        
        // 移动端限制更小的图片大小（3MB）
        const maxSize = isMobile ? 3 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert(`图片大小不能超过${isMobile ? '3' : '5'}MB！`);
            callback(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const cropImageEl = document.getElementById('crop-image');
            const cropModalEl = document.getElementById('crop-image-modal');
            
            cropImageEl.src = e.target.result;
            cropImageEl.onload = function() {
                cropModalEl.style.display = 'flex';
                
                // 移动端裁剪器优化配置
                const cropperOptions = {
                    aspectRatio: IMAGE_CONFIG.cropRatio,
                    viewMode: 1,
                    preview: isEdit ? '#edit-dish-image-preview' : null,
                    autoCropArea: 0.8,
                    movable: true,
                    zoomable: true,
                    rotatable: true,
                    scalable: true,
                    touchDragZoom: true, // 移动端支持双指缩放
                    mouseWheelZoom: !isMobile // 移动端禁用鼠标滚轮
                };
                
                let cropper = new Cropper(cropImageEl, cropperOptions);

                // 确认裁剪 - 移动端防抖
                let cropConfirmed = false;
                document.getElementById('confirm-crop-btn').onclick = function() {
                    if (cropConfirmed) return;
                    cropConfirmed = true;
                    
                    try {
                        const canvas = cropper.getCroppedCanvas({
                            width: isMobile ? 400 : IMAGE_CONFIG.maxWidth,
                            height: isMobile ? 300 : IMAGE_CONFIG.maxWidth / IMAGE_CONFIG.cropRatio
                        });
                        
                        const compressedBase64 = compressImage(
                            canvas, 
                            canvas.width, 
                            canvas.height, 
                            IMAGE_CONFIG.quality
                        );
                        
                        cropper.destroy();
                        cropModalEl.style.display = 'none';
                        callback(compressedBase64);
                    } catch (e) {
                        alert('裁剪失败，请重试！');
                        cropper.destroy();
                        cropModalEl.style.display = 'none';
                        callback(null);
                        cropConfirmed = false;
                    }
                };

                // 关闭裁剪弹窗 - 移动端优化
                document.querySelector('.crop-close-modal').onclick = function() {
                    cropper.destroy();
                    cropModalEl.style.display = 'none';
                    callback(null);
                };

                cropModalEl.onclick = function(e) {
                    if (e.target === cropModalEl) {
                        cropper.destroy();
                        cropModalEl.style.display = 'none';
                        callback(null);
                    }
                };
            };
        };
        
        reader.onerror = function() {
            alert('图片读取失败，请检查文件！');
            callback(null);
        };
        
        reader.readAsDataURL(file);
    }

    // ==================== DOM元素获取 ====================
    // 核心DOM元素
    const dishListEl = document.getElementById('dish-list');
    const totalPriceEl = document.getElementById('total-price');
    const dishCountEl = document.getElementById('dish-count');
    const submitBtn = document.getElementById('submit-order');
    const selectAllBtn = document.getElementById('select-all');
    const minusAllBtn = document.getElementById('minus-all');
    const clearAllBtn = document.getElementById('clear-all');
    const tabs = document.querySelectorAll('.tab');

    // 数据管理相关
    const clearDataBtn = document.getElementById('clear-data');
    const exportDataBtn = document.getElementById('export-data');
    const importDataBtn = document.getElementById('import-data');
    const dataImportFile = document.getElementById('data-import-file');

    // 菜品管理相关
    const addDishBtn = document.getElementById('add-dish-btn');
    const newDishName = document.getElementById('new-dish-name');
    const newDishPrice = document.getElementById('new-dish-price');
    const newDishCategory = document.getElementById('new-dish-category');
    const newDishImage = document.getElementById('new-dish-image');
    const newDishImageName = document.getElementById('new-dish-image-name');

    // 订单预览相关
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

    // 编辑弹窗相关
    const editModalEl = document.getElementById('edit-dish-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const editDishIdEl = document.getElementById('edit-dish-id');
    const editDishNameEl = document.getElementById('edit-dish-name');
    const editDishPriceEl = document.getElementById('edit-dish-price');
    const editDishCategoryEl = document.getElementById('edit-dish-category');
    const editDishImage = document.getElementById('edit-dish-image');
    const editDishImageName = document.getElementById('edit-dish-image-name');
    const editDishImagePreview = document.getElementById('edit-dish-image-preview');
    const saveEditBtn = document.getElementById('save-edit-btn');

    // 临时存储图片Base64
    let newDishImageBase64 = null;
    let editDishImageBase64 = null;

    // ==================== 事件绑定 ====================
    // 绑定新增菜品图片上传事件 - 移动端优化
    newDishImage.addEventListener('change', function() {
        const file = this.files[0];
        if (!file) {
            newDishImageName.textContent = '未选择';
            newDishImageBase64 = null;
            return;
        }

        newDishImageName.textContent = file.name.length > 10 ? 
            file.name.substring(0, 10) + '...' : file.name;
        
        cropAndCompressImage(file, function(base64) {
            newDishImageBase64 = base64;
            if (!base64) {
                newDishImageName.textContent = '未选择';
                newDishImage.value = '';
            }
        });
    });

    // 绑定编辑菜品图片上传事件 - 移动端优化
    editDishImage.addEventListener('change', function() {
        const file = this.files[0];
        if (!file) {
            editDishImageName.textContent = '未更换';
            editDishImageBase64 = null;
            return;
        }

        editDishImageName.textContent = file.name.length > 10 ? 
            file.name.substring(0, 10) + '...' : file.name;
        
        cropAndCompressImage(file, function(base64) {
            editDishImageBase64 = base64;
            if (!base64) {
                editDishImageName.textContent = '未更换';
                editDishImage.value = '';
            }
        }, true);
    });

    // ==================== 核心功能方法 ====================
    // 渲染菜品列表函数 - 移动端优化
    function renderDishList(filterCategory = 'all') {
        dishListEl.innerHTML = '';

        // 从数据模块获取菜品
        const dishes = dishManager.getDishesByCategory(filterCategory);

        dishes.forEach(dish => {
            const dishEl = document.createElement('div');
            dishEl.className = 'dish';
            dishEl.dataset.category = dish.category;
            dishEl.dataset.id = dish.id;

            dishEl.innerHTML = `
                <div class="dish-actions">
                    <button class="edit-dish">✏️</button>
                    <button class="delete-dish">×</button>
                </div>
                <div class="dish-image">
                    <img src="${dish.image}" alt="${dish.name}">
                </div>
                <div class="dish-info">
                    <h3>${dish.name}</h3>
                    <p class="price">¥${dish.price}/${dish.category === 'snack' ? '串' : '份'}</p>
                </div>
                <div class="controls">
                    <button class="minus">-</button>
                    <input type="number" class="count" value="0" min="0">
                    <button class="plus">+</button>
                </div>
                <input type="hidden" class="dish-price" value="${dish.price}">
                <input type="hidden" class="dish-image" value="${dish.image}">
            `;

            dishListEl.appendChild(dishEl);
            bindDishEvents(dishEl);
        });

        // 渲染完成后恢复菜品数量
        restoreDishCounts();
        // 更新订单信息
        updateOrderInfo();
    }

    // 绑定单个菜品的事件 - 移动端防抖优化
    function bindDishEvents(dishEl) {
        const minusBtn = dishEl.querySelector('.minus');
        const plusBtn = dishEl.querySelector('.plus');
        const countInput = dishEl.querySelector('.count');
        const deleteBtn = dishEl.querySelector('.delete-dish');
        const editBtn = dishEl.querySelector('.edit-dish');
        const dishId = parseInt(dishEl.dataset.id);

        // 移动端按钮防抖
        let isProcessing = false;
        const debounceTime = isMobile ? 300 : 100;

        minusBtn.disabled = true;

        // 加号按钮 - 防抖
        plusBtn.addEventListener('click', function() {
            if (isProcessing) return;
            isProcessing = true;
            
            let count = parseInt(countInput.value);
            countInput.value = ++count;
            minusBtn.disabled = false;
            updateOrderInfo();
            // 保存数量变化
            saveDishCountsToStorage();
            
            setTimeout(() => {
                isProcessing = false;
            }, debounceTime);
        });

        // 减号按钮 - 防抖
        minusBtn.addEventListener('click', function() {
            if (isProcessing) return;
            isProcessing = true;
            
            let count = parseInt(countInput.value);
            if (count > 0) {
                countInput.value = --count;
                minusBtn.disabled = count === 0;
                updateOrderInfo();
                // 保存数量变化
                saveDishCountsToStorage();
            }
            
            setTimeout(() => {
                isProcessing = false;
            }, debounceTime);
        });

        // 数量输入框 - 移动端优化
        countInput.addEventListener('input', function() {
            let count = parseInt(this.value) || 0;
            if (count < 0) count = 0;
            this.value = count;
            minusBtn.disabled = count === 0;
            updateOrderInfo();
            // 保存数量变化
            saveDishCountsToStorage();
        });

        // 移动端输入框失焦优化
        countInput.addEventListener('blur', function() {
            if (!this.value || this.value === '0') {
                this.value = 0;
                minusBtn.disabled = true;
            }
            // 移动端收起键盘
            document.activeElement.blur();
            // 保存数量变化
            saveDishCountsToStorage();
        });

        // 删除菜品 - 移动端确认提示优化
        deleteBtn.addEventListener('click', function() {
            const dishName = dishEl.querySelector('h3').textContent;
            const confirmText = isMobile ? `删除【${dishName}】？` : `确定删除【${dishName}】吗？`;
            
            if (confirm(confirmText)) {
                // 调用数据模块删除菜品
                const deleted = dishManager.deleteDish(dishId);
                if (deleted) {
                    const activeTab = document.querySelector('.tab.active');
                    renderDishList(activeTab.dataset.category);
                    updateOrderInfo();
                } else {
                    alert('删除失败，菜品不存在！');
                }
            }
        });

        // 编辑菜品按钮 - 移动端优化
        editBtn.addEventListener('click', function() {
            // 从数据模块获取菜品
            const dish = dishManager.getDishById(dishId);
            if (!dish) return;

            editDishIdEl.value = dish.id;
            editDishNameEl.value = dish.name;
            editDishPriceEl.value = dish.price;
            editDishCategoryEl.value = dish.category;
            editDishImageName.textContent = '未更换';
            editDishImageBase64 = null;
            editDishImagePreview.innerHTML = `<img src="${dish.image}" alt="${dish.name}">`;

            // 移动端弹窗显示优化
            editModalEl.style.display = 'flex';
            // 自动聚焦到名称输入框
            setTimeout(() => {
                editDishNameEl.focus();
            }, 300);
        });
    }

    // 关闭编辑弹窗 - 移动端优化
    function closeEditModal() {
        editModalEl.style.display = 'none';
        editDishIdEl.value = '';
        editDishNameEl.value = '';
        editDishPriceEl.value = '';
        editDishImageName.textContent = '未更换';
        editDishImagePreview.innerHTML = '';
        editDishImageBase64 = null;
        editDishImage.value = '';
        // 移动端收起键盘
        document.activeElement.blur();
    }

    // 保存菜品编辑 - 移动端优化
    function saveDishEdit() {
        const dishId = parseInt(editDishIdEl.value);
        const name = editDishNameEl.value.trim();
        const price = parseFloat(editDishPriceEl.value);
        const category = editDishCategoryEl.value;

        if (!name) {
            alert('请输入菜品名称！');
            return;
        }
        if (isNaN(price) || price < 0) {
            alert('请输入有效的菜品价格！');
            return;
        }

        // 准备更新数据
        const updateData = {
            name: name,
            price: price,
            category: category
        };

        // 如果有新图片，添加到更新数据
        if (editDishImageBase64) {
            updateData.image = editDishImageBase64;
        }

        // 调用数据模块更新菜品
        const updated = dishManager.updateDish(dishId, updateData);
        if (!updated) {
            alert('更新失败，菜品不存在！');
            return;
        }

        const activeTab = document.querySelector('.tab.active');
        renderDishList(activeTab.dataset.category);
        updateOrderInfo();

        closeEditModal();

        // 移动端提示优化
        const alertText = isMobile ? `已修改：${name}` : `成功修改菜品：【${name}】`;
        alert(alertText);
    }

    // 更新订单信息 - 基础功能
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

    // ==================== 事件绑定 - 批量操作 ====================
    // 批量操作 - 移动端防抖
    let batchProcessing = false;
    
    selectAllBtn.addEventListener('click', function() {
        if (batchProcessing) return;
        batchProcessing = true;
        
        document.querySelectorAll('.dish').forEach(dish => {
            const countInput = dish.querySelector('.count');
            const minusBtn = dish.querySelector('.minus');
            countInput.value = parseInt(countInput.value) + 1;
            minusBtn.disabled = false;
        });
        updateOrderInfo();
        // 保存数量变化
        saveDishCountsToStorage();
        
        setTimeout(() => {
            batchProcessing = false;
        }, 300);
    });

    minusAllBtn.addEventListener('click', function() {
        if (batchProcessing) return;
        batchProcessing = true;
        
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
        // 保存数量变化
        saveDishCountsToStorage();
        
        setTimeout(() => {
            batchProcessing = false;
        }, 300);
    });

    clearAllBtn.addEventListener('click', function() {
        if (batchProcessing) return;
        batchProcessing = true;
        
        document.querySelectorAll('.dish').forEach(dish => {
            const countInput = dish.querySelector('.count');
            const minusBtn = dish.querySelector('.minus');
            countInput.value = 0;
            minusBtn.disabled = true;
        });
        updateOrderInfo();
        // 保存数量变化
        saveDishCountsToStorage();
        
        setTimeout(() => {
            batchProcessing = false;
        }, 300);
    });

    // 分类切换 - 移动端优化
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const category = this.dataset.category;
            renderDishList(category);
            // 保存激活的分类
            saveActiveTab(category);
            // 移动端点击后滚动到菜品列表顶部
            if (isMobile) {
                dishListEl.scrollTop = 0;
            }
        });
    });

    // 添加新菜品 - 移动端优化
    addDishBtn.addEventListener('click', function() {
        const name = newDishName.value.trim();
        const price = parseFloat(newDishPrice.value);
        const category = newDishCategory.value;
        const image = newDishImageBase64;

        if (!name) {
            alert('请输入菜品名称！');
            return;
        }
        if (isNaN(price) || price < 0) {
            alert('请输入有效的菜品价格！');
            return;
        }

        try {
            // 调用数据模块添加菜品
            const newId = dishManager.addDish({
                name: name,
                price: price,
                category: category,
                image: image
            });

            const activeTab = document.querySelector('.tab.active');
            renderDishList(activeTab.dataset.category);

            // 清空表单
            newDishName.value = '';
            newDishPrice.value = '';
            newDishImageName.textContent = '未选择';
            newDishImageBase64 = null;
            newDishImage.value = '';
            
            // 移动端自动聚焦到名称输入框
            setTimeout(() => {
                newDishName.focus();
            }, 300);

            const alertText = isMobile ? `已添加：${name}` : `成功添加菜品：【${name}】`;
            alert(alertText);
        } catch (e) {
            alert('添加菜品失败：' + e.message);
        }
    });

    // ==================== 订单相关功能 ====================
    // 渲染订单菜单 - 基础功能
    function renderOrderMenu(orderData = null) {
        menuBodyEl.innerHTML = '';
        let totalPrice = 0;
        let totalCount = 0;

        // 如果有保存的订单数据，使用保存的数据
        if (orderData) {
            // 使用保存的订单数据渲染
            orderData.forEach(item => {
                const dishItemEl = document.createElement('div');
                dishItemEl.className = 'dish-item';
                dishItemEl.innerHTML = `
                    <div class="dish-image-small">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="dish-info">
                        <div class="dish-name">${item.name} × ${item.count}</div>
                        <div class="dish-price-count">¥${item.subtotal}</div>
                    </div>
                `;
                menuBodyEl.appendChild(dishItemEl);

                totalPrice += parseFloat(item.subtotal);
                totalCount += item.count;
            });
            
            orderTimeEl.textContent = `下单时间：${orderData.orderTime || new Date().toLocaleString()}`;
        } else {
            // 实时获取当前选择的菜品
            document.querySelectorAll('.dish').forEach(dish => {
                const count = parseInt(dish.querySelector('.count').value) || 0;
                if (count > 0) {
                    const name = dish.querySelector('h3').textContent;
                    const price = parseFloat(dish.querySelector('.dish-price').value);
                    const image = dish.querySelector('.dish-image').value;
                    const subtotal = (count * price).toFixed(2);

                    const dishItemEl = document.createElement('div');
                    dishItemEl.className = 'dish-item';
                    dishItemEl.innerHTML = `
                        <div class="dish-image-small">
                            <img src="${image}" alt="${name}">
                        </div>
                        <div class="dish-info">
                            <div class="dish-name">${name} × ${count}</div>
                            <div class="dish-price-count">¥${subtotal}</div>
                        </div>
                    `;
                    menuBodyEl.appendChild(dishItemEl);

                    totalPrice += count * price;
                    totalCount += count;
                }
            });

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
        }

        menuTotalEl.textContent = `¥${totalPrice.toFixed(2)}`;
        menuCountEl.textContent = totalCount;

        orderPreviewEl.style.display = 'block';
        imagePreviewEl.style.display = 'none';
        
        // 移动端滚动到订单预览区
        if (isMobile) {
            orderPreviewEl.scrollIntoView({ behavior: 'smooth' });
        }
        
        // 返回订单数据，用于保存
        return {
            items: Array.from(document.querySelectorAll('.dish')).filter(dish => {
                return parseInt(dish.querySelector('.count').value) > 0;
            }).map(dish => {
                const count = parseInt(dish.querySelector('.count').value);
                const name = dish.querySelector('h3').textContent;
                const price = parseFloat(dish.querySelector('.dish-price').value);
                const image = dish.querySelector('.dish-image').value;
                const subtotal = (count * price).toFixed(2);
                
                return {
                    name,
                    price,
                    count,
                    subtotal,
                    image
                };
            }),
            totalPrice: totalPrice.toFixed(2),
            totalCount,
            orderTime: orderTimeEl.textContent.replace('下单时间：', '')
        };
    }

    // 生成菜单图片 - 移动端优化
    function generateMenuImage() {
        generateImageBtn.textContent = isMobile ? '生成中...' : '生成中...';
        generateImageBtn.disabled = true;

        // 移动端降低生成质量，提升速度
        const scale = isMobile ? 1 : 2;
        
        html2canvas(menuCardEl, {
            scale: scale,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false // 移动端禁用日志
        }).then(canvas => {
            const imageUrl = canvas.toDataURL('image/png', isMobile ? 0.8 : 1);
            menuImageEl.src = imageUrl;
            imagePreviewEl.style.display = 'block';
            downloadImageBtn.dataset.imageUrl = imageUrl;

            generateImageBtn.textContent = '生成菜单图片';
            generateImageBtn.disabled = false;
            
            // 移动端滚动到图片预览区
            if (isMobile) {
                imagePreviewEl.scrollIntoView({ behavior: 'smooth' });
            }
        }).catch(error => {
            const errorText = isMobile ? '图片生成失败！' : '图片生成失败：' + error.message;
            alert(errorText);
            generateImageBtn.textContent = '生成菜单图片';
            generateImageBtn.disabled = false;
        });
    }

    // 下载菜单图片 - 基础功能
    function downloadMenuImage() {
        const imageUrl = downloadImageBtn.dataset.imageUrl;
        if (!imageUrl) {
            alert('请先生成菜单图片！');
            return;
        }

        const link = document.createElement('a');
        link.href = imageUrl;
        const now = new Date();
        const fileName = `点单菜单_${now.getTime()}.png`;
        link.download = fileName;
        link.click();
    }

    // 提交订单 - 移动端提示优化
    submitBtn.addEventListener('click', function() {
        const total = parseFloat(totalPriceEl.textContent.replace('¥', ''));
        if (total === 0) {
            alert('请先选择菜品！');
            return;
        }

        // 渲染订单并获取订单数据
        const orderData = renderOrderMenu();
        
        // 保存订单状态
        saveOrderState(true, orderData);

        const alertText = isMobile ? 
            `订单提交成功！
已选：${dishCountEl.textContent}份
总价：${totalPriceEl.textContent}` :
            `订单提交成功！
已选菜品：${dishCountEl.textContent}份
总价：${totalPriceEl.textContent}
请查看下方菜单并可生成图片保存~`;
            
        alert(alertText);
    });

    // ==================== 数据管理功能 ====================
    // 清空所有数据
    clearDataBtn.addEventListener('click', function() {
        if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
            dishManager.clearAllDishes();
            renderDishList('all');
            updateOrderInfo();
            orderPreviewEl.style.display = 'none';
            alert('所有数据已清空！');
        }
    });

    // 导出数据
    exportDataBtn.addEventListener('click', function() {
        try {
            const exportData = dishManager.exportDishes();
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `点菜系统菜品数据_${new Date().getTime()}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('导出数据失败:', e);
            alert('数据导出失败！');
        }
    });

    // 导入数据
    importDataBtn.addEventListener('click', function() {
        dataImportFile.click();
    });

    dataImportFile.addEventListener('change', function() {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                const dishes = importedData.dishes || importedData;
                
                if (confirm('确定要导入数据吗？现有数据将被覆盖！')) {
                    const success = dishManager.importDishes(dishes);
                    if (success) {
                        const activeTab = restoreActiveTab();
                        renderDishList(activeTab);
                        updateOrderInfo();
                        alert('数据导入成功！');
                    } else {
                        alert('导入失败：数据格式不正确！');
                    }
                }
            } catch (e) {
                console.error('解析导入数据失败:', e);
                alert('导入失败：文件格式错误！');
            }
        };
        
        reader.onerror = function() {
            alert('读取文件失败！');
        };
        
        reader.readAsText(file);
        this.value = ''; // 清空文件选择
    });

    // ==================== 初始化执行 ====================
    // 恢复激活的分类标签
    const activeTab = restoreActiveTab();
    
    // 渲染菜品列表
    renderDishList(activeTab);
    
    // 恢复订单状态
    const orderState = restoreOrderState();
    if (orderState && orderState.isSubmitted) {
        // 恢复订单预览
        renderOrderMenu(orderState.orderData.items);
    }

    // ==================== 事件绑定 - 其他 ====================
    // 编辑弹窗相关
    closeModalBtn.addEventListener('click', closeEditModal);
    saveEditBtn.addEventListener('click', saveDishEdit);
    editModalEl.addEventListener('click', function(e) {
        if (e.target === editModalEl) {
            closeEditModal();
        }
    });

    // 图片生成/下载
    generateImageBtn.addEventListener('click', generateMenuImage);
    downloadImageBtn.addEventListener('click', downloadMenuImage);

    // 移动端返回键处理
    window.addEventListener('popstate', function() {
        if (editModalEl.style.display === 'flex') {
            closeEditModal();
        } else if (document.getElementById('crop-image-modal').style.display === 'flex') {
            document.getElementById('crop-image-modal').style.display = 'none';
        }
    });

    // 页面关闭/刷新时自动保存数据
    window.addEventListener('beforeunload', function() {
        saveDishCountsToStorage();
        const activeTab = document.querySelector('.tab.active').dataset.category;
        saveActiveTab(activeTab);
    });
});