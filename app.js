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
        this.navToggle = document.getElementById('navToggle'); // Button für mobiles Menü
        this.navMenu = document.getElementById('navMenu'); // Das Menü selbst
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
        if (this.navToggle) {
            this.navToggle.addEventListener('click', () => this.toggleMobileMenu());
        }
        this.showPage('startseite');
    }

    toggleMobileMenu() {
        if (this.navToggle && this.navMenu) {
            this.navToggle.classList.toggle('active');
            this.navMenu.classList.toggle('active');
        }
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


// Chess Puzzle Management (FINALE KORREKTUR)
// Chess Puzzle Management (Vereinfacht für Tagesrätsel)
class ChessPuzzleManager {
    constructor() {
        this.board = null;
        this.game = new Chess();
        this.puzzle = null;
        this.currentMove = 0;
        this.statusElement = $('.puzzle-status');
        this.solutionBtn = $('#showSolutionBtn');
        this.dailyPuzzleButton = $('#dailyPuzzleBtn'); // Wählt nur noch den einen Button aus
        this.init();
    }

    init() {
        // Event-Listener für den Lösungs-Button
        this.solutionBtn.on('click', () => this.showSolution());

        // Event-Listener für den "Tagesrätsel laden"-Button
        this.dailyPuzzleButton.on('click', (e) => {
            e.preventDefault();
            this.fetcher('https://lichess.org/api/puzzle/daily');
        });

        // Beobachtet, wann die Rätsel-Seite sichtbar wird, um Darstellungsfehler zu beheben
        const puzzlePage = document.getElementById('schach-raetsel');
        if (puzzlePage) {
            const observer = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const isVisible = mutation.target.classList.contains('page--active');
                        if (isVisible && this.board) {
                            setTimeout(() => this.board.resize(), 50);
                        }
                    }
                }
            });
            observer.observe(puzzlePage, { attributes: true });
        }

        // Lädt das erste Rätsel automatisch, wenn die Seite initialisiert wird.
        this.dailyPuzzleButton.click();
    }

    async fetcher(url) {
        this.statusElement.text('Lade neues Rätsel...');
        this.solutionBtn.hide();
        if (this.board) {
            this.board.destroy();
        }
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Netzwerk-Antwort war nicht OK`);
            const data = await response.json();
            this.setupPuzzle(data);
        } catch (error) {
            this.statusElement.text('Fehler: Rätsel konnte nicht geladen werden.');
        }
    }

    setupPuzzle(data) {
        if (!data || !data.game || (!data.game.fen && !data.game.pgn)) {
            this.statusElement.text('Fehler: Ungültige Rätsel-Daten erhalten.');
            return;
        }

        data.game.fen ? this.game.load(data.game.fen) : this.game.load_pgn(data.game.pgn);
        this.puzzle = data;
        this.currentMove = 0;

        const turn = this.game.turn();
        const orientation = (turn === 'w') ? 'white' : 'black';

        const config = {
            draggable: true,
            position: this.game.fen(),
            orientation: orientation,
            pieceTheme: 'chesspieces/wikipedia/{piece}.png',
            onDrop: (source, target) => {
                const move = this.game.move({ from: source, to: target, promotion: 'q' });
                if (move === null) return 'snapback';
                this.checkSolution(move);
            }
        };

        this.board = Chessboard('puzzleBoard', config);
        this.statusElement.text(`${orientation === 'white' ? 'Weiß' : 'Schwarz'} am Zug.`);
        this.solutionBtn.show();
    }

    checkSolution(userMove) {
        const solution = this.puzzle.puzzle.solution;
        const expectedMove = solution[this.currentMove];
        if (`${userMove.from}${userMove.to}` === expectedMove) {
            this.statusElement.text('Korrekt!');
            this.currentMove++;
            setTimeout(() => {
                if (this.currentMove < solution.length) {
                    this.game.move(solution[this.currentMove], { sloppy: true });
                    this.board.position(this.game.fen());
                    this.currentMove++;
                    this.statusElement.text('Dein Zug.');
                } else {
                    this.statusElement.text('Rätsel gelöst!');
                    this.solutionBtn.hide();
                }
            }, 500);
        } else {
            this.statusElement.text('Falsch, versuche es erneut.');
            setTimeout(() => {
                this.game.undo();
                this.board.position(this.game.fen());
            }, 500);
        }
    }

    showSolution() {
        let moveIndex = this.currentMove;
        const playNextMove = () => {
            if (moveIndex < this.puzzle.puzzle.solution.length) {
                this.game.move(this.puzzle.puzzle.solution[moveIndex], { sloppy: true });
                this.board.position(this.game.fen());
                moveIndex++;
                setTimeout(playNextMove, 1000);
            } else {
                this.statusElement.text('Rätsel gelöst!');
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