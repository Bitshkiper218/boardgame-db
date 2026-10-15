// ==========================================
// КРОК 2: Базові дані та localStorage
// ==========================================
function loadFromLocalStorage(defaultData) {
    try {
        const raw = localStorage.getItem('boardgames');
        return raw ? JSON.parse(raw) : defaultData;
    } catch (error) {
        console.error('Пошкоджені дані в localStorage: - script.js:9', error);
        return defaultData;
    }
}

const defaultGames = [
    { id: 1, title: 'Каркасон', minPlayers: 2, maxPlayers: 5, genre: 'Стратегія', img: 'assets/img/carcassonne.jpg', owned: false },
    { id: 2, title: 'Манчкін', minPlayers: 3, maxPlayers: 6, genre: 'Карткова', img: 'assets/img/munchkin.jpg', owned: false },
    { id: 3, title: 'Діксіт', minPlayers: 3, maxPlayers: 8, genre: 'Асоціації', img: 'assets/img/dixit.jpg', owned: false },
    { id: 4, title: 'Козаки', minPlayers: 2, maxPlayers: 4, genre: 'Стратегія', img: 'assets/img/Cossacs.jpg', owned: false },
    { id: 5, title: 'Вуаля', minPlayers: 2, maxPlayers: 6, genre: 'Карткова', img: 'assets/img/Wualia.jpg', owned: false }
];

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
    created() {
        // При завантаженні сторінки дістаємо дані з localStorage
        this.games = loadFromLocalStorage(defaultGames);
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
        toggleOwned(id) {
            const game = this.games.find(g => g.id === id);
            if (game) {
                game.owned = !game.owned;
            }
        },
        // ВИМОГА ВИКЛАДАЧА: Функція для збереження в localStorage
        saveToLocalStorage(gamesArray) {
            localStorage.setItem('boardgames', JSON.stringify(gamesArray));
        }
    },
    // ВИМОГА ВИКЛАДАЧА: watch з deep: true
    watch: {
        games: {
            handler(newGames) {
                this.saveToLocalStorage(newGames);
            },
            deep: true // Зберігаємо після кожного кліку по кнопці "Зіграно"
        }
    }
};

Vue.createApp(App).component('GameCard', GameCard).mount('#app');