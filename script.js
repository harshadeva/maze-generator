const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const dimensionInput = document.getElementById('dimension');
const generateButton = document.getElementById('generate');
const solveButton = document.getElementById('solve');
const downloadButton = document.getElementById('download');

let dimension = 20;
let maze;

class Cell {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.walls = {
            top: true,
            right: true,
            bottom: true,
            left: true
        };
        this.visited = false;
    }
}

class Maze {
    constructor(dimension) {
        this.dimension = dimension;
        this.grid = [];

        this.init();
        this.generate();
        this.draw();
    }

    init() {
        const scale = 10;
        canvas.width = this.dimension * scale;
        canvas.height = this.dimension * scale;
        ctx.lineWidth = 2;

        for (let row = 0; row < this.dimension; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.dimension; col++) {
                this.grid[row][col] = new Cell(row, col);
            }
        }

        // Add whitespace gaps at start and end
        this.grid[0][0].walls.left = false;
        this.grid[0][0].walls.top = false;
        this.grid[this.dimension - 1][this.dimension - 1].walls.right = false;
        this.grid[this.dimension - 1][this.dimension - 1].walls.bottom = false;
    }

    generate() {
        // Origin shift algorithm
        let shifts = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        let totalCells = this.dimension * this.dimension;
        let visitedCells = 1;
        let currentRow = 0;
        let currentCol = 0;
        this.grid[currentRow][currentCol].visited = true;

        while (visitedCells < totalCells) {
            let unvisitedNeighbors = [];

            for (let i = 0; i < shifts.length; i++) {
                let newRow = currentRow + shifts[i][0];
                let newCol = currentCol + shifts[i][1];

                if (newRow >= 0 && newRow < this.dimension && newCol >= 0 && newCol < this.dimension && !this.grid[newRow][newCol].visited) {
                    unvisitedNeighbors.push({ row: newRow, col: newCol, direction: i });
                }
            }

            if (unvisitedNeighbors.length > 0) {
                let randomNeighbor = unvisitedNeighbors[Math.floor(Math.random() * unvisitedNeighbors.length)];
                let newRow = randomNeighbor.row;
                let newCol = randomNeighbor.col;
                let direction = randomNeighbor.direction;

                this.removeWalls(currentRow, currentCol, newRow, newCol, direction);

                currentRow = newRow;
                currentCol = newCol;
                this.grid[currentRow][currentCol].visited = true;
                visitedCells++;
            } else {
                // Backtrack
                let hasUnvisitedNeighborFound = false;
                for (let row = 0; row < this.dimension; row++) {
                    for (let col = 0; col < this.dimension; col++) {
                        if (this.grid[row][col].visited) {
                            let hasUnvisitedNeighbor = false;
                            for (let i = 0; i < shifts.length; i++) {
                                let newRow = row + shifts[i][0];
                                let newCol = col + shifts[i][1];

                                if (newRow >= 0 && newRow < this.dimension && newCol >= 0 && newCol < this.dimension && !this.grid[newRow][newCol].visited) {
                                    hasUnvisitedNeighbor = true;
                                    break;
                                }
                            }

                            if (hasUnvisitedNeighbor) {
                                currentRow = row;
                                currentCol = col;
                                hasUnvisitedNeighborFound = true;
                                break;
                            }
                        }
                    }
                    if (hasUnvisitedNeighborFound) {
                        break;
                    }
                }
            }
        }
    }

    removeWalls(row, col, newRow, newCol, direction) {
        switch (direction) {
            case 0: // Right
                this.grid[row][col].walls.right = false;
                this.grid[newRow][newCol].walls.left = false;
                break;
            case 1: // Bottom
                this.grid[row][col].walls.bottom = false;
                this.grid[newRow][newCol].walls.top = false;
                break;
            case 2: // Left
                this.grid[row][col].walls.left = false;
                this.grid[newRow][newCol].walls.right = false;
                break;
            case 3: // Top
                this.grid[row][col].walls.top = false;
                this.grid[newRow][newCol].walls.bottom = false;
                break;
        }
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'black';

        let cellSize = canvas.width / this.dimension;

        if (!this.solutionVisible) {
            for (let row = 0; row < this.dimension; row++) {
                for (let col = 0; col < this.dimension; col++) {
                    let cell = this.grid[row][col];
                    let x = col * cellSize;
                    let y = row * cellSize;

                    if (cell.walls.top) {
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x + cellSize, y);
                        ctx.stroke();
                    }
                    if (cell.walls.right) {
                        ctx.beginPath();
                        ctx.moveTo(x + cellSize, y);
                        ctx.lineTo(x + cellSize, y + cellSize);
                        ctx.stroke();
                    }
                    if (cell.walls.bottom) {
                        ctx.beginPath();
                        ctx.moveTo(x + cellSize, y + cellSize);
                        ctx.lineTo(x, y + cellSize);
                        ctx.stroke();
                    }
                    if (cell.walls.left) {
                        ctx.beginPath();
                        ctx.moveTo(x, y + cellSize);
                        ctx.lineTo(x, y);
                        ctx.stroke();
                    }
                }
            }

            // Draw outer walls
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(canvas.width, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(canvas.width, 0);
            ctx.lineTo(canvas.width, canvas.height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(canvas.width, canvas.height);
            ctx.lineTo(0, canvas.height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            ctx.lineTo(0, 0);
            ctx.stroke();
        }
    }

    solve() {
        let solution = this.findSolution();
        if (solution) {
            this.drawSolution(solution);
        } else {
            alert('No solution found!');
        }
    }

    findSolution() {
        let startRow = 0;
        let startCol = 0;
        let endRow = this.dimension - 1;
        let endCol = this.dimension - 1;

        let visited = Array(this.dimension).fill(null).map(() => Array(this.dimension).fill(false));
        let path = [];

        function dfs(row, col) {
            if (row < 0 || row >= maze.dimension || col < 0 || col >= maze.dimension || visited[row][col]) {
                return false;
            }

            visited[row][col] = true;
            path.push([row, col]);

            if (row === endRow && col === endCol) {
                return true;
            }

            // Check top
            if (!maze.grid[row][col].walls.top && dfs(row - 1, col)) {
                return true;
            }

            // Check right
            if (!maze.grid[row][col].walls.right && dfs(row, col + 1)) {
                return true;
            }

            // Check bottom
            if (!maze.grid[row][col].walls.bottom && dfs(row + 1, col)) {
                return true;
            }

            // Check left
            if (!maze.grid[row][col].walls.left && dfs(row, col - 1)) {
                return true;
            }

            path.pop();
            return false;
        }

        if (dfs(startRow, startCol)) {
            return path;
        }

        return null;
    }

    drawSolution(solution) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;

        let cellSize = canvas.width / this.dimension;

        ctx.beginPath();
        ctx.moveTo((solution[0][1] * cellSize) + cellSize / 2, (solution[0][0] * cellSize) + cellSize / 2);

        for (let i = 1; i < solution.length; i++) {
            ctx.lineTo((solution[i][1] * cellSize) + cellSize / 2, (solution[i][0] * cellSize) + cellSize / 2);
        }

        ctx.stroke();
    }

    toggleSolution() {
        this.solutionVisible = !this.solutionVisible;
        if (this.solutionVisible) {
            let solution = this.findSolution();
            if (solution) {
                this.drawSolution(solution);
            } else {
                alert('No solution found!');
            }
        } else {
            this.draw();
        }
    }

    generateSVG() {
        let cellSize = 10;
        let svgWidth = this.dimension * cellSize;
        let svgHeight = this.dimension * cellSize;

        let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;
        svg += `<rect width="100%" height="100%" fill="white"/>`;
        svg += `<g stroke="black" stroke-width="2">`;

        for (let row = 0; row < this.dimension; row++) {
            for (let col = 0; col < this.dimension; col++) {
                let cell = this.grid[row][col];
                let x = col * cellSize;
                let y = row * cellSize;

                if (cell.walls.top) {
                    svg += `<line x1="${x}" y1="${y}" x2="${x + cellSize}" y2="${y}" />`;
                }
                if (cell.walls.right) {
                    svg += `<line x1="${x + cellSize}" y1="${y}" x2="${x + cellSize}" y2="${y + cellSize}" />`;
                }
                if (cell.walls.bottom) {
                    svg += `<line x1="${x + cellSize}" y1="${y + cellSize}" x2="${x}" y2="${y + cellSize}" />`;
                }
                if (cell.walls.left) {
                    svg += `<line x1="${x}" y1="${y + cellSize}" x2="${x}" y2="${y}" />`;
                }
            }
        }

        svg += `</g>`;
        svg += `</svg>`;
        return svg;
    }
}

generateButton.addEventListener('click', () => {
    dimension = parseInt(dimensionInput.value);
    maze = new Maze(dimension);
});

solveButton.addEventListener('click', () => {
    maze.toggleSolution();
});

maze = new Maze(dimension);
maze.solutionVisible = false;
maze.draw();

// downloadButton.addEventListener('click', () => {
//     const image = canvas.toDataURL("image/png", 1.0);
//     const link = document.createElement('a');
//     link.href = image.replace("image/png", "image/octet-stream");
//     link.download = 'maze.png';
//     link.click();
// });

downloadButton.addEventListener('click', () => {
    let svg = maze.generateSVG();
    const link = document.createElement('a');
    link.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    link.download = 'maze.svg';
    link.click();
});