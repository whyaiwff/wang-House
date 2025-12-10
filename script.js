document.addEventListener('DOMContentLoaded', function() {
    // 定义本地存储的key
    const STORAGE_KEY = 'restaurant_dish_data';

    // 默认菜品图片（Base64占位图）
    const DEFAULT_DISH_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTMwIDQ1IEw2MCAzMCBMOTAgNDUgTDkwIDgwIEw2MCA5NSBMzAgODBaIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNjAiIHk9IjEwNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5Zu+5Lq65Zu+5rqQPC90ZXh0Pjwvc3ZnPg==';

    // 图片压缩配置
    const IMAGE_CONFIG = {
        maxWidth: 800,    // 最大宽度
        maxHeight: 800,   // 最大高度
        quality: 0.8,     // 压缩质量(0-1)
        cropRatio: 4/3    // 裁剪比例（宽高比）
    };

    // 初始菜品数据
    const defaultDishData = [
        { id: 1, name: '麻辣小龙虾', price: 88, category: 'hot', image: DEFAULT_DISH_IMAGE },
        { id: 2, name: '蒜蓉花甲', price: 38, category: 'hot', image: DEFAULT_DISH_IMAGE },
        { id: 3, name: '凉拌黄瓜', price: 12, category: 'cold', image: DEFAULT_DISH_IMAGE },
        { id: 4, name: '拍黄瓜', price: 10, category: 'cold', image: DEFAULT_DISH_IMAGE },
        { id: 5, name: '烤羊肉串', price: 5, category: 'snack', image: DEFAULT_DISH_IMAGE },
        { id: 6, name: '烤面筋', price: 3, category: 'snack', image: DEFAULT_DISH_IMAGE }
    ];

    // 从本地存储读取菜品数据
    function getDishDataFromStorage() {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (!storedData) return defaultDishData;
        
        // 兼容旧数据
        const data = JSON.parse(storedData);
        return data.map(dish => ({
            ...dish,
            image: dish.image || DEFAULT_DISH_IMAGE
        }));
    }

    // 将菜品数据保存到本地存储
    function saveDishDataToStorage(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // 压缩图片并返回Base64
    function compressImage(img, width, height, quality) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 计算缩放后的尺寸
        let newWidth = width;
        let newHeight = height;
        
        if (width > IMAGE_CONFIG.maxWidth || height > IMAGE_CONFIG.maxHeight) {
            const ratio = Math.min(IMAGE_CONFIG.maxWidth / width, IMAGE_CONFIG.maxHeight / height);
            newWidth = width * ratio;
            newHeight = height * ratio;
        }
        
        // 设置canvas尺寸
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // 绘制并压缩图片
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        return canvas.toDataURL('image/jpeg', quality || IMAGE_CONFIG.quality);
    }

    // 裁剪并压缩图片
    function cropAndCompressImage(file, callback, isEdit = false) {
        if (!file) {
            callback(null);
            return;
        }
        
        // 限制图片大小（5MB）
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('图片大小不能超过5MB！');
            callback(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const cropImageEl = document.getElementById('crop-image');
            const cropModalEl = document.getElementById('crop-image-modal');
            
            // 设置裁剪图片源
            cropImageEl.src = e.target.result;
            cropImageEl.onload = function() {
                // 显示裁剪弹窗
                cropModalEl.style.display = 'flex';
                
                // 初始化裁剪器
                let cropper = new Cropper(cropImageEl, {
                    aspectRatio: IMAGE_CONFIG.cropRatio,
                    viewMode: 1,
                    preview: isEdit ? '#edit-dish-image-preview' : null,
                    autoCropArea: 0.8,
                    movable: true,
                    zoomable: true,
                    rotatable: true,
                    scalable: true
                });

                // 绑定确认裁剪事件
                document.getElementById('confirm-crop-btn').onclick = function() {
                    // 获取裁剪后的画布
                    const canvas = cropper.getCroppedCanvas({
                        width: IMAGE_CONFIG.maxWidth,
                        height: IMAGE_CONFIG.maxWidth / IMAGE_CONFIG.cropRatio
                    });
                    
                    // 压缩并转为Base64
                    const compressedBase64 = compressImage(
                        canvas, 
                        canvas.width, 
                        canvas.height, 
                        IMAGE_CONFIG.quality
                    );
                    
                    // 销毁裁剪器
                    cropper.destroy();
                    // 关闭裁剪弹窗
                    cropModalEl.style.display = 'none';
                    
                    // 返回处理后的Base64
                    callback(compressedBase64);
                };

                // 绑定关闭裁剪弹窗事件
                document.querySelector('.crop-close-modal').onclick = function() {
                    cropper.destroy();
                    cropModalEl.style.display = 'none';
                    callback(null);
                };

                // 点击弹窗外关闭
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
            alert('图片读取失败！');
            callback(null);
        };
        
        reader.readAsDataURL(file);
    }

    // 初始化菜品数据
    let dishData = getDishDataFromStorage();
    // 临时存储新增/编辑的图片Base64
    let newDishImageBase64 = null;
    let editDishImageBase64 = null;

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

    // 绑定新增菜品图片上传事件（新增裁剪逻辑）
    newDishImage.addEventListener('change', function() {
        const file = this.files[0];
        if (!file) {
            newDishImageName.textContent = '未选择';
            newDishImageBase64 = null;
            return;
        }

        newDishImageName.textContent = file.name;
        // 裁剪并压缩图片
        cropAndCompressImage(file, function(base64) {
            newDishImageBase64 = base64;
            // 如果取消裁剪，清空选择
            if (!base64) {
                newDishImageName.textContent = '未选择';
                newDishImage.value = '';
            }
        });
    });

    // 绑定编辑菜品图片上传事件（新增裁剪逻辑）
    editDishImage.addEventListener('change', function() {
        const file = this.files[0];
        if (!file) {
            editDishImageName.textContent = '未更换';
            editDishImageBase64 = null;
            return;
        }

        editDishImageName.textContent = file.name;
        // 裁剪并压缩图片（编辑模式）
        cropAndCompressImage(file, function(base64) {
            editDishImageBase64 = base64;
            // 如果取消裁剪，清空选择
            if (!base64) {
                editDishImageName.textContent = '未更换';
                editDishImage.value = '';
            }
        }, true);
    });

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
                <div class="dish-actions">
                    <button class="edit-dish">✏️</button>
                    <button class="delete-dish">×</button>
                </div>
                <div class="dish-image">
                    <img src="${dish.image}" alt="${dish.name}">
                </div>
                <h3>${dish.name}</h3>
                <p class="price">¥${dish.price}/${dish.category === 'snack' ? '串' : '份'}</p>
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
    }

    // 绑定单个菜品的事件
    function bindDishEvents(dishEl) {
        const minusBtn = dishEl.querySelector('.minus');
        const plusBtn = dishEl.querySelector('.plus');
        const countInput = dishEl.querySelector('.count');
        const deleteBtn = dishEl.querySelector('.delete-dish');
        const editBtn = dishEl.querySelector('.edit-dish');
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

        // 删除菜品
        deleteBtn.addEventListener('click', function() {
            if (confirm(`确定删除【${dishEl.querySelector('h3').textContent}】吗？`)) {
                dishData = dishData.filter(dish => dish.id !== dishId);
                saveDishDataToStorage(dishData);
                const activeTab = document.querySelector('.tab.active');
                renderDishList(activeTab.dataset.category);
                updateOrderInfo();
            }
        });

        // 编辑菜品按钮点击事件
        editBtn.addEventListener('click', function() {
            // 查找当前菜品数据
            const dish = dishData.find(item => item.id === dishId);
            if (!dish) return;

            // 填充编辑表单
            editDishIdEl.value = dish.id;
            editDishNameEl.value = dish.name;
            editDishPriceEl.value = dish.price;
            editDishCategoryEl.value = dish.category;
            // 重置编辑图片相关
            editDishImageName.textContent = '未更换';
            editDishImageBase64 = null;
            // 显示当前图片预览
            editDishImagePreview.innerHTML = `<img src="${dish.image}" alt="${dish.name}">`;

            // 显示编辑弹窗
            editModalEl.style.display = 'flex';
        });
    }

    // 关闭编辑弹窗
    function closeEditModal() {
        editModalEl.style.display = 'none';
        // 清空表单
        editDishIdEl.value = '';
        editDishNameEl.value = '';
        editDishPriceEl.value = '';
        editDishImageName.textContent = '未更换';
        editDishImagePreview.innerHTML = '';
        editDishImageBase64 = null;
        // 清空文件选择
        editDishImage.value = '';
    }

    // 保存菜品编辑
    function saveDishEdit() {
        // 获取编辑表单数据
        const dishId = parseInt(editDishIdEl.value);
        const name = editDishNameEl.value.trim();
        const price = parseFloat(editDishPriceEl.value);
        const category = editDishCategoryEl.value;

        // 验证输入
        if (!name) {
            alert('请输入菜品名称！');
            return;
        }
        if (isNaN(price) || price < 0) {
            alert('请输入有效的菜品价格！');
            return;
        }

        // 查找并更新菜品数据
        const dishIndex = dishData.findIndex(item => item.id === dishId);
        if (dishIndex === -1) {
            alert('菜品不存在！');
            return;
        }

        // 保留原有图片，除非上传了新图片
        const image = editDishImageBase64 || dishData[dishIndex].image;

        dishData[dishIndex] = {
            id: dishId,
            name: name,
            price: price,
            category: category,
            image: image
        };

        // 保存到本地存储
        saveDishDataToStorage(dishData);

        // 刷新菜品列表
        const activeTab = document.querySelector('.tab.active');
        renderDishList(activeTab.dataset.category);
        updateOrderInfo();

        // 关闭弹窗
        closeEditModal();

        alert(`成功修改菜品：【${name}】`);
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

    // 添加新菜品
    addDishBtn.addEventListener('click', function() {
        const name = newDishName.value.trim();
        const price = parseFloat(newDishPrice.value);
        const category = newDishCategory.value;
        // 使用裁剪压缩后的图片或默认图片
        const image = newDishImageBase64 || DEFAULT_DISH_IMAGE;

        // 验证输入
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
            category: category,
            image: image
        };

        dishData.push(newDish);
        saveDishDataToStorage(dishData);

        const activeTab = document.querySelector('.tab.active');
        renderDishList(activeTab.dataset.category);

        // 清空表单
        newDishName.value = '';
        newDishPrice.value = '';
        newDishImageName.textContent = '未选择';
        newDishImageBase64 = null;
        newDishImage.value = '';

        alert(`成功添加菜品：【${name}】`);
    });

    // 渲染订单菜单
    function renderOrderMenu() {
        menuBodyEl.innerHTML = '';
        let totalPrice = 0;
        let totalCount = 0;

        document.querySelectorAll('.dish').forEach(dish => {
            const count = parseInt(dish.querySelector('.count').value) || 0;
            if (count > 0) {
                const name = dish.querySelector('h3').textContent;
                const price = parseFloat(dish.querySelector('.dish-price').value);
                const image = dish.querySelector('.dish-image').value;
                const subtotal = (count * price).toFixed(2);

                // 创建带图片的菜品项
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

        menuTotalEl.textContent = `¥${totalPrice.toFixed(2)}`;
        menuCountEl.textContent = totalCount;

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

        orderPreviewEl.style.display = 'block';
        imagePreviewEl.style.display = 'none';
    }

    // 生成菜单图片
    function generateMenuImage() {
        generateImageBtn.textContent = '生成中...';
        generateImageBtn.disabled = true;

        html2canvas(menuCardEl, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            const imageUrl = canvas.toDataURL('image/png');
            menuImageEl.src = imageUrl;
            imagePreviewEl.style.display = 'block';
            downloadImageBtn.dataset.imageUrl = imageUrl;

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

        const link = document.createElement('a');
        link.href = imageUrl;
        const now = new Date();
        const fileName = `点单菜单_${now.getTime()}.png`;
        link.download = fileName;
        link.click();
    }

    // 提交订单
    submitBtn.addEventListener('click', function() {
        const total = parseFloat(totalPriceEl.textContent.replace('¥', ''));
        if (total === 0) {
            alert('请先选择菜品！');
            return;
        }

        renderOrderMenu();

        alert(`订单提交成功！
已选菜品：${dishCountEl.textContent}份
总价：${totalPriceEl.textContent}
请查看下方菜单并可生成图片保存~`);
    });

    // 绑定编辑弹窗相关事件
    closeModalBtn.addEventListener('click', closeEditModal);
    saveEditBtn.addEventListener('click', saveDishEdit);
    // 点击弹窗外区域关闭弹窗
    editModalEl.addEventListener('click', function(e) {
        if (e.target === editModalEl) {
            closeEditModal();
        }
    });

    // 绑定生成/下载图片按钮事件
    generateImageBtn.addEventListener('click', generateMenuImage);
    downloadImageBtn.addEventListener('click', downloadMenuImage);
});