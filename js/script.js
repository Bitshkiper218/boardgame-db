// ==========================================
// Базові дані
// ==========================================
const defaultGames = [
    { id: 1, title: 'Каркасон', minPlayers: 2, maxPlayers: 5, genre: 'Стратегія', img: 'assets/img/carcassonne.jpg', owned: false },
    { id: 2, title: 'Манчкін', minPlayers: 3, maxPlayers: 6, genre: 'Карткова', img: 'assets/img/munchkin.jpg', owned: false },
    { id: 3, title: 'Діксіт', minPlayers: 3, maxPlayers: 8, genre: 'Асоціації', img: 'assets/img/dixit.jpg', owned: false },
    { id: 4, title: 'Козаки', minPlayers: 2, maxPlayers: 4, genre: 'Стратегія', img: 'assets/img/Cossacs.jpg', owned: false },
    { id: 5, title: 'Вуаля', minPlayers: 2, maxPlayers: 6, genre: 'Карткова', img: 'assets/img/Wualia.jpg', owned: false }
];

// ==========================================
// ЧАСТИНА 1: localStorage (вимога викладача)
// ==========================================
function loadFromLocalStorage(defaultData) {
    try {
        const raw = localStorage.getItem('boardgames');
        return raw ? JSON.parse(raw) : defaultData;
    } catch (error) {
        return defaultData;
    }
}

// ==========================================
// ЧАСТИНА 2: IndexedDB та CRUD (вимога викладача)
// ==========================================
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('BoardGamesDB', 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('games')) {
                db.createObjectStore('games', { keyPath: 'id' }); // Створення object store
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// CRUD-транзакція (Update)
async function saveGameToDB(game) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('games', 'readwrite');
        tx.objectStore('games').put(game);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// CRUD-транзакція (Read)
async function getAllGamesFromDB() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('games', 'readonly');
        const request = tx.objectStore('games').getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ==========================================
// ЧАСТИНА 3: Міграція даних (вимога викладача)
// ==========================================
async function migrateDataIfNeeded() {
    const isMigrated = localStorage.getItem('migratedToIDB');
    if (!isMigrated) {
        const oldData = loadFromLocalStorage(defaultGames);
        if (oldData.length > 0) {
            console.log('Міграція з localStorage в IndexedDB виконана! - script.js:71');
            for (const game of oldData) {
                await saveGameToDB(game);
            }
        }
        localStorage.setItem('migratedToIDB', 'true');
    }
}

// ==========================================
// КОМПОНЕНТ ТА ДОДАТОК VUE
// ==========================================
const GameCard = {
    props: ['id', 'title', 'minPlayers', 'maxPlayers', 'genre', 'img', 'owned'],
    emits: ['filter', 'toggle-owned'],
    template: `
        <article class="card" :class="{ 'card-owned': owned }">
            <h3>{{ title }}</h3>
            <span class="badge">👥 {{ minPlayers }}–{{ maxPlayers }} гравців</span>
            <img :src="img" :alt="'Обкладинка гри ' + title">
            <p class="genre-text" @click="$emit('filter', genre)">
                Жанр: <span class="genre-link">{{ genre }}</span>
            </p>
            <button 
                :class="['btn-status', owned ? 'btn-played' : 'btn-not-played']" 
                @click="$emit('toggle-owned', id)">
                {{ owned ? '✅ Зіграно' : '❌ Не зіграно' }}
            </button>
        </article>
    `
};

const App = {
    data() {
        return {
            currentGenre: '',
            games: []
        };
    },
    async created() {
        try {
            await migrateDataIfNeeded(); // Запуск міграції
            this.games = await getAllGamesFromDB(); // Завантаження з бази
        } catch (error) {
            console.error('Помилка БД: - script.js:115', error);
            // Додано обробку помилки для користувача:
            alert('Помилка доступу до бази даних! Переконайтеся, що ваш браузер підтримує IndexedDB і ви не знаходитесь у режимі інкогніто.');
        }
    },
    computed: {
        filteredGames() {
            if (!this.currentGenre) return this.games;
            return this.games.filter(game => game.genre === this.currentGenre);
        }
    },
    methods: {
        setGenreFilter(genre) {
            this.currentGenre = genre;
        },
        async toggleOwned(id) {
            const game = this.games.find(g => g.id === id);
            if (game) {
                game.owned = !game.owned;
                await saveGameToDB(game); // Зберігаємо в IndexedDB
            }
        },
        // Заявлена викладачем функція
        saveToLocalStorage(gamesArray) {
            localStorage.setItem('boardgames', JSON.stringify(gamesArray));
        }
    },
    // Заявлений викладачем watch
    watch: {
        games: {
            handler(newGames) {
                this.saveToLocalStorage(newGames); // Зберігаємо дубль у localStorage
            },
            deep: true
        }
    }
};

Vue.createApp(App).component('GameCard', GameCard).mount('#app');