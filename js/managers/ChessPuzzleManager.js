export class ChessPuzzleManager {
    constructor() {
        this.board = null;
        this.game = new Chess();
        this.puzzle = null;
        this.currentMove = 0;
        this.statusElement = $('.puzzle-status');
        this.solutionBtn = $('#showSolutionBtn');
        this.dailyPuzzleButton = $('#dailyPuzzleBtn');
        this.initialLoadDone = false;
        this.init();
    }

    init() {
        this.solutionBtn.on('click', () => this.showSolution());
        this.dailyPuzzleButton.on('click', (e) => {
            e.preventDefault();
            this.fetcher('https://lichess.org/api/puzzle/daily');
        });

        const puzzlePage = document.getElementById('schach-raetsel');
        if (puzzlePage) {
            const observer = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const isActive = mutation.target.classList.contains('page--active');
                        if (isActive && !this.initialLoadDone) {
                            this.fetcher('https://lichess.org/api/puzzle/daily');
                            this.initialLoadDone = true;
                        } else if (isActive && this.board) {
                            setTimeout(() => this.board.resize(), 50);
                        }
                    }
                }
            });
            observer.observe(puzzlePage, { attributes: true });
        }
    }

    async fetcher(url) {
        this.statusElement.text('Lade neues Rätsel...');
        this.solutionBtn.hide();
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Netzwerk-Antwort war nicht OK');
            const data = await response.json();
            this.setupPuzzle(data);
        } catch (error) {
            this.statusElement.text('Fehler: Rätsel konnte nicht geladen werden.');
            console.error('Fehler beim Abrufen des Rätsels:', error);
        }
    }

    setupPuzzle(data) {
        if (!data?.game?.pgn || !data?.puzzle?.solution) {
            this.statusElement.text('Fehler: Ungültige Rätseldaten erhalten.');
            console.error("Ungültige oder unvollständige Rätseldaten empfangen:", data);
            return;
        }

        const tempGame = new Chess();
        if (!tempGame.load_pgn(data.game.pgn)) {
            this.statusElement.text('Fehler: PGN-Daten konnten nicht verarbeitet werden.');
            return;
        }

        const solution = data.puzzle.solution;
        for (let i = 0; i < solution.length; i++) {
            tempGame.undo();
        }

        // **ENTSCHEIDENDE ÄNDERUNG:** Speichere die FEN-Position und lade sie in ein neues, sauberes Spielobjekt.
        const puzzleStartFen = tempGame.fen();
        this.game.load(puzzleStartFen);

        this.puzzle = data;
        this.currentMove = 0;

        const orientation = this.game.turn() === 'w' ? 'white' : 'black';
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

        if (this.board) this.board.destroy();
        this.board = Chessboard('puzzleBoard', config);

        this.statusElement.text(`${orientation === 'white' ? 'Weiß' : 'Schwarz'} am Zug.`);
        this.solutionBtn.show();
    }

    checkSolution(userMove) {
        const solution = this.puzzle.puzzle.solution;
        const expectedMove = solution[this.currentMove];
        const moveUci = `${userMove.from}${userMove.to}`;

        if (moveUci === expectedMove) {
            this.statusElement.text('Korrekt!');
            this.currentMove++;
            setTimeout(() => {
                if (this.currentMove < solution.length) {
                    const computerMove = solution[this.currentMove];
                    this.game.move(computerMove, { sloppy: true });
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
        // Lädt die Startposition sauber, bevor die Lösung angezeigt wird.
        this.game.load(this.puzzleStartFen || this.game.fen());
        this.board.position(this.game.fen());
        this.currentMove = 0;

        let moveIndex = 0;
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