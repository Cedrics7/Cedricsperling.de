export class ChessPuzzleManager {
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