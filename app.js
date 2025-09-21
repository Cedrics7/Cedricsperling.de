// Theme Management
class ThemeManager {
    constructor() {
        this.currentTheme = 'dark';
        this.themeToggle = document.getElementById('themeToggle');
        this.body = document.body;
        this.init();
    }
    init() {
        this.setTheme('dark');
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }
    setTheme(theme) {
        this.currentTheme = theme;
        this.body.setAttribute('data-color-scheme', theme);
    }
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
}

// Navigation Management
class NavigationManager {
    constructor() {
        this.pages = document.querySelectorAll('.page');
        this.navLinks = document.querySelectorAll('.nav__link'); // Nur für die "active" Klasse

        // Ein zentraler Selektor für alle Navigationselemente (Header-Links, Footer-Links, Buttons, Home-Button)
        this.navigationTriggers = document.querySelectorAll('[data-page], [data-page-link], #homeBtn');

        this.currentPage = 'startseite';
        this.init();
    }

    init() {
        // Eine Schleife für alle Links (Header, Footer, Buttons)
        this.navigationTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                // Der Home-Button hat kein data-page Attribut, daher wird hier 'startseite' fest zugewiesen
                const pageId = trigger.getAttribute('data-page') || trigger.getAttribute('data-page-link') || 'startseite';
                this.showPage(pageId);
            });
        });

        this.showPage('startseite');
    }

    showPage(pageId) {
        if (!pageId) return;

        this.pages.forEach(page => page.classList.remove('page--active'));
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('page--active');
            this.currentPage = pageId;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Sorge dafür, dass der richtige Link in der Hauptnavigation aktiv ist
        this.updateActiveNavLink();
    }

    updateActiveNavLink() {
        this.navLinks.forEach(link => {
            if (link.getAttribute('data-page') === this.currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
}

// Interaction Management (mit PHP-Anbindung)
class InteractionManager {
    constructor() {
        this.init();
    }

    init() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactSubmit(e));
        }
    }

    handleContactSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const feedbackElement = document.getElementById('form-feedback');
        const submitButton = form.querySelector('button[type="submit"]');
        const formData = new FormData(form);

        submitButton.disabled = true;
        submitButton.textContent = 'Sende...';

        fetch('send_mail.php', {
            method: 'POST',
            body: formData
        })
            .then(response => response.text().then(text => ({ ok: response.ok, text })))
            .then(data => {
                feedbackElement.textContent = data.text;
                if (data.ok) {
                    feedbackElement.className = 'success';
                    form.reset();
                } else {
                    feedbackElement.className = 'error';
                }
            })
            .catch(error => {
                feedbackElement.textContent = 'Ein Netzwerkfehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
                feedbackElement.className = 'error';
                console.error('Fetch Error:', error);
            })
            .finally(() => {
                feedbackElement.style.display = 'block';
                submitButton.disabled = false;
                submitButton.textContent = 'Nachricht senden';

                setTimeout(() => { feedbackElement.style.display = 'none'; }, 6000);
            });
    }
}


class ChessPuzzleManager {
    constructor() {
        this.board = null;
        this.game = new Chess();
        this.puzzle = null;
        this.currentMove = 0;

        // HTML-Elemente
        this.boardElement = $('#puzzleBoard');
        this.statusElement = $('.puzzle-status');
        this.solutionBtn = $('#showSolutionBtn');
        this.difficultyButtons = $('.difficulty-buttons .btn');
        this.dailyPuzzleBtn = $('#dailyPuzzleBtn');

        this.init();
    }

    init() {
        this.dailyPuzzleBtn.on('click', () => this.loadDailyPuzzle());
        this.solutionBtn.on('click', () => this.showSolution());
        this.difficultyButtons.on('click', (e) => {
            const difficulty = $(e.currentTarget).data('difficulty');
            this.loadPuzzleByDifficulty(difficulty);
        });

        // Initial das Rätsel des Tages laden
        this.loadDailyPuzzle();
    }

    async fetcher(url) {
        this.statusElement.text('Lade neues Rätsel...');
        this.solutionBtn.hide();
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Netzwerk-Problem');
            const data = await response.json();
            this.setupPuzzle(data);
        } catch (error) {
            this.statusElement.text('Fehler beim Laden des Rätsels.');
            console.error(error);
        }
    }

    loadDailyPuzzle() {
        this.difficultyButtons.removeClass('active');
        this.dailyPuzzleBtn.addClass('active');
        this.fetcher('https://lichess.org/api/puzzle/daily');
    }

    loadPuzzleByDifficulty(difficulty) {
        this.dailyPuzzleBtn.removeClass('active');
        this.difficultyButtons.removeClass('active');
        $(`.difficulty-buttons .btn[data-difficulty=${difficulty}]`).addClass('active');

        // Lichess-Bewertung für Schwierigkeitsstufen
        const ratings = { easy: 1300, medium: 1600, hard: 2000 };
        const rating = ratings[difficulty];
        // Wir holen ein Rätsel in einem Bereich von +/- 100 Punkten der Zielbewertung
        this.fetcher(`https://lichess.org/api/puzzle/rated?rating=${rating}&themes=mateIn2`);
    }

    setupPuzzle(data) {
        this.puzzle = data;
        this.currentMove = 0;

        const orientation = this.puzzle.game.player.toLowerCase();
        this.game.load(this.puzzle.game.fen);

        const config = {
            draggable: true,
            position: this.game.fen(),
            orientation: orientation === 'white' ? 'white' : 'black',
            onDragStart: (source, piece) => {
                // Nur Züge für die richtige Farbe erlauben
                return this.game.turn() === piece.charAt(0);
            },
            onDrop: (source, target) => {
                const move = this.game.move({
                    from: source,
                    to: target,
                    promotion: 'q' // Immer zur Dame umwandeln
                });
                if (move === null) return 'snapback';
                this.checkSolution(move);
            }
        };

        this.board = Chessboard('puzzleBoard', config);
        this.statusElement.text(`${orientation === 'white' ? 'Weiß' : 'Schwarz'} am Zug.`);
        this.statusElement.removeClass('correct incorrect');
        this.solutionBtn.show();
    }

    checkSolution(userMove) {
        const solution = this.puzzle.puzzle.solution;
        const expectedMove = solution[this.currentMove];

        if (`${userMove.from}${userMove.to}` === expectedMove) {
            this.statusElement.text('Korrekt!').addClass('correct');
            this.currentMove++;

            // Computer macht den nächsten Zug
            setTimeout(() => {
                if (this.currentMove < solution.length) {
                    this.game.move(solution[this.currentMove], { sloppy: true });
                    this.board.position(this.game.fen());
                    this.currentMove++;
                    this.statusElement.text('Dein Zug.').removeClass('correct');
                } else {
                    this.statusElement.text('Rätsel gelöst!').addClass('correct');
                    this.solutionBtn.hide();
                }
            }, 500);
        } else {
            this.statusElement.text('Falsch, versuche es erneut.').addClass('incorrect');
            setTimeout(() => {
                this.game.undo();
                this.board.position(this.game.fen());
            }, 500);
        }
    }

    showSolution() {
        this.statusElement.text('Lösung wird angezeigt...');
        let moveIndex = this.currentMove;

        const playNextMove = () => {
            if (moveIndex < this.puzzle.puzzle.solution.length) {
                this.game.move(this.puzzle.puzzle.solution[moveIndex], { sloppy: true });
                this.board.position(this.game.fen());
                moveIndex++;
                setTimeout(playNextMove, 1000);
            } else {
                this.statusElement.text('Rätsel gelöst!').addClass('correct');
            }
        };
        playNextMove();
        this.solutionBtn.hide();
    }
}

// Main Application
class App {
    constructor() {
        document.addEventListener('DOMContentLoaded', () => this.initializeManagers());
    }

    initializeManagers() {
        try {
            new ThemeManager();
            new NavigationManager();
            new InteractionManager();
            // NEU: Schachrätsel-Manager initialisieren
            new ChessPuzzleManager();
            console.log('Website successfully initialized');
        } catch (error) {
            console.error('Error initializing website:', error);
        }
    }
}

// Initialize the application
const app = new App();