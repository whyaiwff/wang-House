// dishData.js - 菜品数据管理模块
class DishDataManager {
    constructor() {
        // 本地存储KEY
        this.STORAGE_KEY = 'restaurant_dish_data';
        
        // 默认菜品图片（Base64占位图）
        this.DEFAULT_DISH_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTMwIDQ1IEw2MCAzMCBMOTAgNDUgTDkwIDgwIEw2MCA5NSBMzAgODBaIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNjAiIHk9IjEwNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5Zu+5Lq65Zu+5rqQPC90ZXh0Pjwvc3ZnPg==';

        // 默认菜品数据
        this.DEFAULT_DISHES = [
            { id: 1, name: '麻辣小龙虾', price: 88, category: 'hot', image: this.DEFAULT_DISH_IMAGE },
            { id: 2, name: '蒜蓉花甲', price: 38, category: 'hot', image: this.DEFAULT_DISH_IMAGE },
            { id: 3, name: '凉拌黄瓜', price: 12, category: 'cold', image: this.DEFAULT_DISH_IMAGE },
            { id: 4, name: '拍黄瓜', price: 10, category: 'cold', image: this.DEFAULT_DISH_IMAGE },
            { id: 5, name: '烤羊肉串', price: 5, category: 'snack', image: this.DEFAULT_DISH_IMAGE },
            { id: 6, name: '烤面筋', price: 3, category: 'snack', image: this.DEFAULT_DISH_IMAGE }
        ];

        // 初始化加载数据
        this.dishes = this.loadFromStorage();
    }

    /**
     * 从本地存储加载菜品数据
     * @returns {Array} 菜品数组
     */
    loadFromStorage() {
        try {
            const storedData = localStorage.getItem(this.STORAGE_KEY);
            if (!storedData) return [...this.DEFAULT_DISHES];
            
            // 兼容旧数据格式
            const data = JSON.parse(storedData);
            return data.map(dish => ({
                ...dish,
                image: dish.image || this.DEFAULT_DISH_IMAGE,
                price: parseFloat(dish.price) || 0
            }));
        } catch (e) {
            console.error('加载菜品数据失败:', e);
            return [...this.DEFAULT_DISHES];
        }
    }

    /**
     * 保存菜品数据到本地存储
     */
    saveToStorage() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.dishes));
            return true;
        } catch (e) {
            console.error('保存菜品数据失败:', e);
            alert('数据保存失败，可能是浏览器存储空间不足！');
            return false;
        }
    }

    /**
     * 获取所有菜品
     * @returns {Array} 菜品数组
     */
    getAllDishes() {
        return [...this.dishes];
    }

    /**
     * 根据分类筛选菜品
     * @param {string} category 分类标识(all/hot/cold/snack)
     * @returns {Array} 筛选后的菜品数组
     */
    getDishesByCategory(category) {
        if (category === 'all') return [...this.dishes];
        return this.dishes.filter(dish => dish.category === category);
    }

    /**
     * 根据ID获取菜品
     * @param {number} id 菜品ID
     * @returns {Object|null} 菜品对象或null
     */
    getDishById(id) {
        const dish = this.dishes.find(d => d.id === parseInt(id));
        return dish ? { ...dish } : null;
    }

    /**
     * 添加新菜品
     * @param {Object} dishData 菜品数据
     * @returns {number} 新菜品ID
     */
    addDish(dishData) {
        // 验证数据
        if (!dishData.name || !dishData.price || !dishData.category) {
            throw new Error('菜品名称、价格、分类不能为空');
        }

        // 生成新ID
        const maxId = this.dishes.length > 0 
            ? Math.max(...this.dishes.map(d => d.id)) 
            : 0;
        const newId = maxId + 1;

        // 创建新菜品
        const newDish = {
            id: newId,
            name: dishData.name.trim(),
            price: parseFloat(dishData.price),
            category: dishData.category,
            image: dishData.image || this.DEFAULT_DISH_IMAGE
        };

        // 添加并保存
        this.dishes.push(newDish);
        this.saveToStorage();
        
        return newId;
    }

    /**
     * 更新菜品
     * @param {number} id 菜品ID
     * @param {Object} updateData 更新的数据
     * @returns {boolean} 是否更新成功
     */
    updateDish(id, updateData) {
        const dishIndex = this.dishes.findIndex(d => d.id === parseInt(id));
        if (dishIndex === -1) return false;

        // 更新数据
        this.dishes[dishIndex] = {
            ...this.dishes[dishIndex],
            ...updateData,
            id: parseInt(id) // 确保ID不变
        };

        // 保存更新
        this.saveToStorage();
        return true;
    }

    /**
     * 删除菜品
     * @param {number} id 菜品ID
     * @returns {boolean} 是否删除成功
     */
    deleteDish(id) {
        const initialLength = this.dishes.length;
        this.dishes = this.dishes.filter(d => d.id !== parseInt(id));
        
        const deleted = this.dishes.length < initialLength;
        if (deleted) {
            this.saveToStorage();
            
            // 同时删除对应的数量记录
            try {
                const counts = JSON.parse(localStorage.getItem('restaurant_dish_counts') || '{}');
                delete counts[id];
                localStorage.setItem('restaurant_dish_counts', JSON.stringify(counts));
            } catch (e) {
                console.error('删除菜品数量记录失败:', e);
            }
        }
        
        return deleted;
    }

    /**
     * 清空所有菜品（恢复默认）
     */
    clearAllDishes() {
        this.dishes = [...this.DEFAULT_DISHES];
        this.saveToStorage();
        
        // 清空相关数据
        localStorage.removeItem('restaurant_dish_counts');
        localStorage.removeItem('restaurant_active_tab');
        localStorage.removeItem('restaurant_order_state');
    }

    /**
     * 导入菜品数据
     * @param {Array} importedDishes 导入的菜品数组
     * @returns {boolean} 是否导入成功
     */
    importDishes(importedDishes) {
        if (!Array.isArray(importedDishes)) return false;
        
        // 验证导入数据格式
        const validDishes = importedDishes.filter(dish => 
            dish.name && dish.price !== undefined && dish.category
        );
        
        if (validDishes.length === 0) return false;
        
        // 处理ID冲突，重新生成ID
        const maxId = this.dishes.length > 0 
            ? Math.max(...this.dishes.map(d => d.id)) 
            : 0;
        
        const newDishes = validDishes.map((dish, index) => ({
            id: maxId + index + 1,
            name: dish.name.trim(),
            price: parseFloat(dish.price),
            category: dish.category,
            image: dish.image || this.DEFAULT_DISH_IMAGE
        }));
        
        // 替换现有数据
        this.dishes = newDishes;
        this.saveToStorage();
        
        return true;
    }

    /**
     * 导出菜品数据
     * @returns {Object} 包含版本和数据的导出对象
     */
    exportDishes() {
        return {
            version: '1.0',
            exportTime: new Date().toLocaleString(),
            dishes: this.getAllDishes()
        };
    }
}

// 创建单例实例
const dishManager = new DishDataManager();

// 暴露到全局，供其他脚本使用
window.dishManager = dishManager;