/**
 * SubscKeeper - サブスクリプション管理アプリ
 * =====================================================
 * LocalStorageを使用したフロントエンド特化型Webアプリ
 */

// =====================================================
// ユーティリティ関数
// =====================================================

/**
 * UUID生成
 * @returns {string} ランダムなUUID
 */
function generateId() {
    return crypto.randomUUID ? crypto.randomUUID() : 
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
}

/**
 * 日付をフォーマット
 * @param {string} dateStr - YYYY-MM-DD形式の日付
 * @returns {string} フォーマットされた日付
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * 金額をフォーマット
 * @param {number} amount - 金額
 * @param {string} currency - 通貨コード
 * @returns {string} フォーマットされた金額
 */
function formatCurrency(amount, currency = 'JPY') {
    const symbol = currency === 'USD' ? '$' : '¥';
    const formatted = Math.round(amount).toLocaleString('ja-JP');
    return `${symbol}${formatted}`;
}

/**
 * 更新日までの残り日数を計算
 * @param {string} dateStr - 更新日
 * @returns {number} 残り日数（負の場合は過去）
 */
function getDaysUntil(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * カテゴリの絵文字を取得
 * @param {string} category - カテゴリID
 * @returns {string} 絵文字
 */
function getCategoryEmoji(category) {
    const emojis = {
        entertainment: '🎬',
        work: '💼',
        life: '🏠',
        other: '📦'
    };
    return emojis[category] || '📦';
}

/**
 * カテゴリの表示名を取得
 * @param {string} category - カテゴリID
 * @returns {string} 表示名
 */
function getCategoryName(category) {
    const names = {
        entertainment: 'エンタメ',
        work: '仕事',
        life: '生活',
        other: 'その他'
    };
    return names[category] || 'その他';
}

// =====================================================
// StorageManager - LocalStorage操作
// =====================================================

const StorageManager = {
    KEYS: {
        SUBSCRIPTIONS: 'subsckeeper_subscriptions',
        SETTINGS: 'subsckeeper_settings'
    },

    /**
     * データを取得
     * @param {string} key - ストレージキー
     * @returns {any} 保存されたデータ
     */
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    },

    /**
     * データを保存
     * @param {string} key - ストレージキー
     * @param {any} data - 保存するデータ
     */
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Storage set error:', error);
        }
    },

    /**
     * サブスク一覧を取得
     * @returns {Array} サブスク配列
     */
    getSubscriptions() {
        return this.get(this.KEYS.SUBSCRIPTIONS) || [];
    },

    /**
     * サブスク一覧を保存
     * @param {Array} subscriptions - サブスク配列
     */
    setSubscriptions(subscriptions) {
        this.set(this.KEYS.SUBSCRIPTIONS, subscriptions);
    },

    /**
     * 設定を取得
     * @returns {Object} 設定オブジェクト
     */
    getSettings() {
        return this.get(this.KEYS.SETTINGS) || {
            notificationDays: 3,
            darkMode: false,
            exchangeRate: 150
        };
    },

    /**
     * 設定を保存
     * @param {Object} settings - 設定オブジェクト
     */
    setSettings(settings) {
        this.set(this.KEYS.SETTINGS, settings);
    },

    /**
     * データをエクスポート
     * @returns {string} JSONデータ
     */
    exportData() {
        return JSON.stringify({
            subscriptions: this.getSubscriptions(),
            settings: this.getSettings(),
            exportedAt: new Date().toISOString()
        }, null, 2);
    }
};

// =====================================================
// SubscriptionManager - サブスク管理ロジック
// =====================================================

const SubscriptionManager = {
    /**
     * 全サブスク取得
     * @returns {Array} サブスク配列
     */
    getAll() {
        return StorageManager.getSubscriptions();
    },

    /**
     * IDでサブスク取得
     * @param {string} id - サブスクID
     * @returns {Object|null} サブスクオブジェクト
     */
    getById(id) {
        const subscriptions = this.getAll();
        return subscriptions.find(sub => sub.id === id) || null;
    },

    /**
     * サブスク追加
     * @param {Object} data - サブスクデータ
     * @returns {Object} 追加されたサブスク
     */
    add(data) {
        const subscription = {
            id: generateId(),
            name: data.name,
            price: parseFloat(data.price),
            currency: data.currency || 'JPY',
            cycle: data.cycle || 'monthly',
            nextDate: data.nextDate,
            category: data.category || 'other',
            cancelUrl: data.cancelUrl || '',
            trialEndDate: data.trialEndDate || '',
            createdAt: new Date().toISOString()
        };
        
        const subscriptions = this.getAll();
        subscriptions.push(subscription);
        StorageManager.setSubscriptions(subscriptions);
        
        return subscription;
    },

    /**
     * サブスク更新
     * @param {string} id - サブスクID
     * @param {Object} data - 更新データ
     * @returns {Object|null} 更新されたサブスク
     */
    update(id, data) {
        const subscriptions = this.getAll();
        const index = subscriptions.findIndex(sub => sub.id === id);
        
        if (index === -1) return null;
        
        subscriptions[index] = {
            ...subscriptions[index],
            name: data.name,
            price: parseFloat(data.price),
            currency: data.currency,
            cycle: data.cycle,
            nextDate: data.nextDate,
            category: data.category,
            cancelUrl: data.cancelUrl || '',
            trialEndDate: data.trialEndDate || '',
            updatedAt: new Date().toISOString()
        };
        
        StorageManager.setSubscriptions(subscriptions);
        return subscriptions[index];
    },

    /**
     * サブスク削除
     * @param {string} id - サブスクID
     * @returns {boolean} 削除成功
     */
    delete(id) {
        const subscriptions = this.getAll();
        const filtered = subscriptions.filter(sub => sub.id !== id);
        
        if (filtered.length === subscriptions.length) return false;
        
        StorageManager.setSubscriptions(filtered);
        return true;
    },

    /**
     * 月額換算価格を計算
     * @param {Object} subscription - サブスク
     * @param {number} exchangeRate - USD→JPY換算レート
     * @returns {number} 月額換算価格（円）
     */
    getMonthlyPrice(subscription, exchangeRate = 150) {
        let price = subscription.price;
        
        // USDの場合は円に換算
        if (subscription.currency === 'USD') {
            price = price * exchangeRate;
        }
        
        // 年額の場合は12で割る
        if (subscription.cycle === 'yearly') {
            price = price / 12;
        }
        
        return Math.round(price);
    },

    /**
     * 月額合計を計算
     * @param {number} exchangeRate - 換算レート
     * @returns {number} 月額合計
     */
    getMonthlyTotal(exchangeRate = 150) {
        const subscriptions = this.getAll();
        return subscriptions.reduce((total, sub) => {
            return total + this.getMonthlyPrice(sub, exchangeRate);
        }, 0);
    },

    /**
     * 年額合計を計算
     * @param {number} exchangeRate - 換算レート
     * @returns {number} 年額合計
     */
    getYearlyTotal(exchangeRate = 150) {
        return this.getMonthlyTotal(exchangeRate) * 12;
    },

    /**
     * 更新日でソート
     * @param {Array} subscriptions - サブスク配列
     * @returns {Array} ソート済み配列
     */
    sortByDate(subscriptions) {
        return [...subscriptions].sort((a, b) => {
            return new Date(a.nextDate) - new Date(b.nextDate);
        });
    },

    /**
     * 金額でソート
     * @param {Array} subscriptions - サブスク配列
     * @param {number} exchangeRate - 換算レート
     * @returns {Array} ソート済み配列
     */
    sortByPrice(subscriptions, exchangeRate = 150) {
        return [...subscriptions].sort((a, b) => {
            return this.getMonthlyPrice(b, exchangeRate) - this.getMonthlyPrice(a, exchangeRate);
        });
    },

    /**
     * カテゴリでフィルター
     * @param {Array} subscriptions - サブスク配列
     * @param {string} category - カテゴリ
     * @returns {Array} フィルター済み配列
     */
    filterByCategory(subscriptions, category) {
        if (category === 'all') return subscriptions;
        return subscriptions.filter(sub => sub.category === category);
    },

    /**
     * 通知対象のサブスクを取得
     * @param {number} days - 何日前から通知するか
     * @returns {Array} 通知対象サブスク
     */
    getUpcoming(days = 3) {
        const subscriptions = this.getAll();
        return subscriptions.filter(sub => {
            const daysUntil = getDaysUntil(sub.nextDate);
            return daysUntil >= 0 && daysUntil <= days;
        });
    },

    /**
     * お試し期間終了が近いサブスクを取得
     * @param {number} days - 何日前から通知するか
     * @returns {Array} お試し終了が近いサブスク
     */
    getTrialEnding(days = 3) {
        const subscriptions = this.getAll();
        return subscriptions.filter(sub => {
            if (!sub.trialEndDate) return false;
            const daysUntil = getDaysUntil(sub.trialEndDate);
            return daysUntil >= 0 && daysUntil <= days;
        });
    }
};

// =====================================================
// UIManager - DOM操作・レンダリング
// =====================================================

const UIManager = {
    elements: {},

    /**
     * DOM要素をキャッシュ
     */
    cacheElements() {
        this.elements = {
            // Summary
            monthlyTotal: document.getElementById('monthlyTotal'),
            yearlyTotal: document.getElementById('yearlyTotal'),
            
            // Subscription list
            subscriptionList: document.getElementById('subscriptionList'),
            emptyState: document.getElementById('emptyState'),
            
            // Filters
            categoryFilter: document.getElementById('categoryFilter'),
            sortByDate: document.getElementById('sortByDate'),
            sortByPrice: document.getElementById('sortByPrice'),
            
            // Notification
            notificationBanner: document.getElementById('notificationBanner'),
            notificationText: document.getElementById('notificationText'),
            closeNotification: document.getElementById('closeNotification'),
            
            // FAB
            addBtn: document.getElementById('addBtn'),
            
            // Subscription Modal
            subscriptionModal: document.getElementById('subscriptionModal'),
            modalBackdrop: document.getElementById('modalBackdrop'),
            modalTitle: document.getElementById('modalTitle'),
            closeModal: document.getElementById('closeModal'),
            subscriptionForm: document.getElementById('subscriptionForm'),
            cancelBtn: document.getElementById('cancelBtn'),
            
            // Form fields
            subscriptionId: document.getElementById('subscriptionId'),
            serviceName: document.getElementById('serviceName'),
            price: document.getElementById('price'),
            currency: document.getElementById('currency'),
            cycle: document.getElementById('cycle'),
            category: document.getElementById('category'),
            nextDate: document.getElementById('nextDate'),
            trialEndDate: document.getElementById('trialEndDate'),
            cancelUrl: document.getElementById('cancelUrl'),
            
            // Settings Modal
            settingsBtn: document.getElementById('settingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            settingsBackdrop: document.getElementById('settingsBackdrop'),
            closeSettings: document.getElementById('closeSettings'),
            notificationDays: document.getElementById('notificationDays'),
            darkModeToggle: document.getElementById('darkModeToggle'),
            exchangeRate: document.getElementById('exchangeRate'),
            saveSettingsBtn: document.getElementById('saveSettingsBtn'),
            exportDataBtn: document.getElementById('exportDataBtn'),
            
            // Delete Modal
            deleteModal: document.getElementById('deleteModal'),
            deleteBackdrop: document.getElementById('deleteBackdrop'),
            deleteTargetName: document.getElementById('deleteTargetName'),
            cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
            confirmDeleteBtn: document.getElementById('confirmDeleteBtn')
        };
    },

    /**
     * サマリーを更新
     * @param {number} exchangeRate - 換算レート
     */
    updateSummary(exchangeRate = 150) {
        const monthly = SubscriptionManager.getMonthlyTotal(exchangeRate);
        const yearly = SubscriptionManager.getYearlyTotal(exchangeRate);
        
        this.elements.monthlyTotal.textContent = monthly.toLocaleString('ja-JP');
        this.elements.yearlyTotal.textContent = yearly.toLocaleString('ja-JP');
    },

    /**
     * サブスクリストをレンダリング
     * @param {Array} subscriptions - サブスク配列
     * @param {number} exchangeRate - 換算レート
     */
    renderSubscriptions(subscriptions, exchangeRate = 150) {
        const container = this.elements.subscriptionList;
        
        // 既存のカードを削除（空状態は残す）
        container.querySelectorAll('.subscription-card').forEach(el => el.remove());
        
        // 空状態の表示切替
        this.elements.emptyState.hidden = subscriptions.length > 0;
        
        if (subscriptions.length === 0) return;
        
        // カードを生成
        subscriptions.forEach(sub => {
            const card = this.createSubscriptionCard(sub, exchangeRate);
            container.appendChild(card);
        });
    },

    /**
     * サブスクカードを生成
     * @param {Object} subscription - サブスク
     * @param {number} exchangeRate - 換算レート
     * @returns {HTMLElement} カード要素
     */
    createSubscriptionCard(subscription, exchangeRate) {
        const card = document.createElement('div');
        card.className = 'subscription-card';
        card.dataset.id = subscription.id;
        
        const daysUntil = getDaysUntil(subscription.nextDate);
        const monthlyPrice = SubscriptionManager.getMonthlyPrice(subscription, exchangeRate);
        
        // お試し期間中かチェック
        let isTrial = false;
        if (subscription.trialEndDate) {
            const trialDays = getDaysUntil(subscription.trialEndDate);
            if (trialDays >= 0) {
                isTrial = true;
                card.classList.add('subscription-card--trial');
            }
        }
        
        // 更新日が近い場合はハイライト
        if (daysUntil >= 0 && daysUntil <= 3) {
            card.classList.add('subscription-card--urgent');
        }
        
        // アクセントカラー
        const categoryColors = {
            entertainment: 'var(--color-entertainment)',
            work: 'var(--color-work)',
            life: 'var(--color-life)',
            other: 'var(--color-other)'
        };
        card.style.setProperty('--card-accent-color', categoryColors[subscription.category] || categoryColors.other);
        
        card.innerHTML = `
            <div class="subscription-card__category subscription-card__category--${subscription.category}">
                ${getCategoryEmoji(subscription.category)}
            </div>
            <div class="subscription-card__info">
                <div class="subscription-card__name">${this.escapeHtml(subscription.name)}</div>
                <div class="subscription-card__meta">
                    <span class="subscription-card__date">
                        <span class="subscription-card__date-icon">📅</span>
                        ${formatDate(subscription.nextDate)}
                        ${daysUntil === 0 ? '（今日）' : daysUntil > 0 ? `（${daysUntil}日後）` : ''}
                    </span>
                    <span class="subscription-card__cycle">${subscription.cycle === 'yearly' ? '年額' : '月額'}</span>
                </div>
            </div>
            <div class="subscription-card__price">
                <div class="subscription-card__amount">${formatCurrency(subscription.price, subscription.currency)}</div>
                ${subscription.cycle === 'yearly' ? `<div class="subscription-card__monthly">月額換算 ¥${monthlyPrice.toLocaleString()}</div>` : ''}
            </div>
            <div class="subscription-card__actions">
                ${subscription.cancelUrl ? `
                    <a href="${this.escapeHtml(subscription.cancelUrl)}" target="_blank" rel="noopener" 
                       class="subscription-card__action-btn" title="解約ページを開く" onclick="event.stopPropagation()">
                        🔗
                    </a>
                ` : ''}
                <button class="subscription-card__action-btn" data-action="edit" title="編集">
                    ✏️
                </button>
                <button class="subscription-card__action-btn subscription-card__action-btn--delete" data-action="delete" title="削除">
                    🗑️
                </button>
            </div>
        `;
        
        return card;
    },

    /**
     * HTML特殊文字をエスケープ
     * @param {string} str - 文字列
     * @returns {string} エスケープ済み文字列
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * 通知バナーを表示
     * @param {string} message - メッセージ
     */
    showNotification(message) {
        this.elements.notificationText.textContent = message;
        this.elements.notificationBanner.hidden = false;
    },

    /**
     * 通知バナーを非表示
     */
    hideNotification() {
        this.elements.notificationBanner.hidden = true;
    },

    /**
     * サブスクモーダルを開く
     * @param {Object|null} subscription - 編集する場合はサブスクオブジェクト
     */
    openSubscriptionModal(subscription = null) {
        const isEdit = subscription !== null;
        
        this.elements.modalTitle.textContent = isEdit ? 'サブスクリプションを編集' : 'サブスクリプションを追加';
        
        // フォームをリセットまたは値を設定
        if (isEdit) {
            this.elements.subscriptionId.value = subscription.id;
            this.elements.serviceName.value = subscription.name;
            this.elements.price.value = subscription.price;
            this.elements.currency.value = subscription.currency;
            this.elements.cycle.value = subscription.cycle;
            this.elements.category.value = subscription.category;
            this.elements.nextDate.value = subscription.nextDate;
            this.elements.trialEndDate.value = subscription.trialEndDate || '';
            this.elements.cancelUrl.value = subscription.cancelUrl || '';
        } else {
            this.elements.subscriptionForm.reset();
            this.elements.subscriptionId.value = '';
            // デフォルトで今日の日付を設定
            this.elements.nextDate.value = new Date().toISOString().split('T')[0];
        }
        
        this.elements.subscriptionModal.hidden = false;
        this.elements.serviceName.focus();
    },

    /**
     * サブスクモーダルを閉じる
     */
    closeSubscriptionModal() {
        this.elements.subscriptionModal.hidden = true;
        this.elements.subscriptionForm.reset();
    },

    /**
     * 設定モーダルを開く
     */
    openSettingsModal() {
        const settings = StorageManager.getSettings();
        
        this.elements.notificationDays.value = settings.notificationDays;
        this.elements.darkModeToggle.checked = settings.darkMode;
        this.elements.exchangeRate.value = settings.exchangeRate;
        
        this.elements.settingsModal.hidden = false;
    },

    /**
     * 設定モーダルを閉じる
     */
    closeSettingsModal() {
        this.elements.settingsModal.hidden = true;
    },

    /**
     * 削除確認モーダルを開く
     * @param {Object} subscription - 削除するサブスク
     */
    openDeleteModal(subscription) {
        this.elements.deleteTargetName.textContent = subscription.name;
        this.elements.deleteModal.hidden = false;
        this.elements.deleteModal.dataset.targetId = subscription.id;
    },

    /**
     * 削除確認モーダルを閉じる
     */
    closeDeleteModal() {
        this.elements.deleteModal.hidden = true;
        delete this.elements.deleteModal.dataset.targetId;
    },

    /**
     * ダークモードを切り替え
     * @param {boolean} enabled - 有効/無効
     */
    setDarkMode(enabled) {
        document.body.classList.toggle('dark-mode', enabled);
    },

    /**
     * ソートボタンのアクティブ状態を更新
     * @param {string} sortType - 'date' または 'price'
     */
    updateSortButtons(sortType) {
        this.elements.sortByDate.classList.toggle('active', sortType === 'date');
        this.elements.sortByPrice.classList.toggle('active', sortType === 'price');
    }
};

// =====================================================
// App - メインアプリケーション
// =====================================================

const App = {
    currentSort: 'date',
    currentCategory: 'all',
    settings: null,

    /**
     * アプリ初期化
     */
    init() {
        UIManager.cacheElements();
        this.settings = StorageManager.getSettings();
        
        // ダークモード適用
        UIManager.setDarkMode(this.settings.darkMode);
        
        // イベントリスナー設定
        this.bindEvents();
        
        // 初期表示
        this.refresh();
        
        // 通知チェック
        this.checkNotifications();
        
        console.log('SubscKeeper initialized');
    },

    /**
     * イベントリスナーを設定
     */
    bindEvents() {
        const { elements } = UIManager;
        
        // FAB - 追加ボタン
        elements.addBtn.addEventListener('click', () => {
            UIManager.openSubscriptionModal();
        });
        
        // サブスクモーダル
        elements.closeModal.addEventListener('click', () => UIManager.closeSubscriptionModal());
        elements.modalBackdrop.addEventListener('click', () => UIManager.closeSubscriptionModal());
        elements.cancelBtn.addEventListener('click', () => UIManager.closeSubscriptionModal());
        
        // フォーム送信
        elements.subscriptionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSaveSubscription();
        });
        
        // 設定モーダル
        elements.settingsBtn.addEventListener('click', () => UIManager.openSettingsModal());
        elements.closeSettings.addEventListener('click', () => UIManager.closeSettingsModal());
        elements.settingsBackdrop.addEventListener('click', () => UIManager.closeSettingsModal());
        elements.saveSettingsBtn.addEventListener('click', () => this.handleSaveSettings());
        elements.exportDataBtn.addEventListener('click', () => this.handleExportData());
        
        // ダークモードトグル（リアルタイム反映）
        elements.darkModeToggle.addEventListener('change', (e) => {
            UIManager.setDarkMode(e.target.checked);
        });
        
        // 削除モーダル
        elements.deleteBackdrop.addEventListener('click', () => UIManager.closeDeleteModal());
        elements.cancelDeleteBtn.addEventListener('click', () => UIManager.closeDeleteModal());
        elements.confirmDeleteBtn.addEventListener('click', () => this.handleConfirmDelete());
        
        // 通知バナー
        elements.closeNotification.addEventListener('click', () => UIManager.hideNotification());
        
        // フィルター
        elements.categoryFilter.addEventListener('change', (e) => {
            this.currentCategory = e.target.value;
            this.refresh();
        });
        
        // ソート
        elements.sortByDate.addEventListener('click', () => {
            this.currentSort = 'date';
            UIManager.updateSortButtons('date');
            this.refresh();
        });
        
        elements.sortByPrice.addEventListener('click', () => {
            this.currentSort = 'price';
            UIManager.updateSortButtons('price');
            this.refresh();
        });
        
        // サブスクリスト - イベント委譲
        elements.subscriptionList.addEventListener('click', (e) => {
            const card = e.target.closest('.subscription-card');
            if (!card) return;
            
            const id = card.dataset.id;
            const action = e.target.closest('[data-action]')?.dataset.action;
            
            if (action === 'edit') {
                const subscription = SubscriptionManager.getById(id);
                if (subscription) {
                    UIManager.openSubscriptionModal(subscription);
                }
            } else if (action === 'delete') {
                const subscription = SubscriptionManager.getById(id);
                if (subscription) {
                    UIManager.openDeleteModal(subscription);
                }
            } else if (!e.target.closest('a') && !e.target.closest('button')) {
                // カード自体をクリックした場合は編集モーダルを開く
                const subscription = SubscriptionManager.getById(id);
                if (subscription) {
                    UIManager.openSubscriptionModal(subscription);
                }
            }
        });
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                UIManager.closeSubscriptionModal();
                UIManager.closeSettingsModal();
                UIManager.closeDeleteModal();
            }
        });
    },

    /**
     * 画面を更新
     */
    refresh() {
        let subscriptions = SubscriptionManager.getAll();
        
        // フィルター適用
        subscriptions = SubscriptionManager.filterByCategory(subscriptions, this.currentCategory);
        
        // ソート適用
        if (this.currentSort === 'date') {
            subscriptions = SubscriptionManager.sortByDate(subscriptions);
        } else {
            subscriptions = SubscriptionManager.sortByPrice(subscriptions, this.settings.exchangeRate);
        }
        
        // レンダリング
        UIManager.updateSummary(this.settings.exchangeRate);
        UIManager.renderSubscriptions(subscriptions, this.settings.exchangeRate);
    },

    /**
     * 通知チェック
     */
    checkNotifications() {
        const notifications = [];
        
        // 更新日が近いサブスク
        const upcoming = SubscriptionManager.getUpcoming(this.settings.notificationDays);
        if (upcoming.length > 0) {
            const names = upcoming.map(sub => sub.name).join('、');
            notifications.push(`📅 ${names} の更新日が近づいています`);
        }
        
        // お試し期間終了が近いサブスク
        const trialEnding = SubscriptionManager.getTrialEnding(this.settings.notificationDays);
        if (trialEnding.length > 0) {
            const names = trialEnding.map(sub => sub.name).join('、');
            notifications.push(`⚠️ ${names} のお試し期間がまもなく終了します`);
        }
        
        if (notifications.length > 0) {
            UIManager.showNotification(notifications.join(' / '));
        }
    },

    /**
     * サブスク保存処理
     */
    handleSaveSubscription() {
        const { elements } = UIManager;
        
        const data = {
            name: elements.serviceName.value.trim(),
            price: elements.price.value,
            currency: elements.currency.value,
            cycle: elements.cycle.value,
            category: elements.category.value,
            nextDate: elements.nextDate.value,
            trialEndDate: elements.trialEndDate.value,
            cancelUrl: elements.cancelUrl.value.trim()
        };
        
        const id = elements.subscriptionId.value;
        
        if (id) {
            // 編集
            SubscriptionManager.update(id, data);
        } else {
            // 追加
            SubscriptionManager.add(data);
        }
        
        UIManager.closeSubscriptionModal();
        this.refresh();
        this.checkNotifications();
    },

    /**
     * 削除確認処理
     */
    handleConfirmDelete() {
        const id = UIManager.elements.deleteModal.dataset.targetId;
        if (id) {
            SubscriptionManager.delete(id);
            UIManager.closeDeleteModal();
            this.refresh();
        }
    },

    /**
     * 設定保存処理
     */
    handleSaveSettings() {
        const { elements } = UIManager;
        
        this.settings = {
            notificationDays: parseInt(elements.notificationDays.value),
            darkMode: elements.darkModeToggle.checked,
            exchangeRate: parseFloat(elements.exchangeRate.value) || 150
        };
        
        StorageManager.setSettings(this.settings);
        UIManager.closeSettingsModal();
        this.refresh();
        this.checkNotifications();
    },

    /**
     * データエクスポート処理
     */
    handleExportData() {
        const data = StorageManager.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `subsckeeper_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// =====================================================
// アプリ起動
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
