(function(maze, undefined) {

	// cross-browser support for requestAnimationFrame and cancelAnimationFrame
	var requestAnimFrame = window.requestAnimationFrame
		|| window.webkitRequestAnimationFrame
		|| window.msRequestAnimationFrame
		|| window.mozRequestAnimationFrame
		|| function(callback) { return window.setTimeout(callback, 1000 / 60); };
	var cancelAnimFrame = window.cancelAnimationFrame
		|| window.webkitCancelRequestAnimationFrame
		|| window.webkitCancelAnimationFrame
		|| window.mozCancelRequestAnimationFrame || window.mozCancelAnimationFrame
		|| window.oCancelRequestAnimationFrame || window.oCancelAnimationFrame
		|| window.msCancelRequestAnimationFrame || window.msCancelAnimationFrame
		|| function(id) { clearTimeout(id); };

	class Direction {
		constructor(x, y) {
			this.x = x;
			this.y = y;
		}
		isOpposite(other) {
			return (this.x != 0 && this.x == -other.x)
				|| (this.y != 0 && this.y == -other.y);
		}
	}
	Direction.NONE 	= new Direction(0, 0);
	Direction.RIGHT = new Direction(1, 0);
	Direction.LEFT 	= new Direction(-1, 0);
	Direction.UP 	= new Direction(0, -1);
	Direction.DOWN 	= new Direction(0, 1);

	class Cell {
		constructor(x, y, color, fromDir) {
			this.x = Math.floor(x);
			this.y = Math.floor(y);
			this.color = color || 0;
			this.fromDir = fromDir || Direction.NONE;
		}
	}

	class Settings {
		constructor(guiSettings) {
			this.startX = guiSettings.startX;
			this.startY = guiSettings.startY;
			this.blockSize = Math.floor(guiSettings.blockSize);
			this.cellDistance = Math.floor(guiSettings.cellDistance);
			this.directionShuffleProbability = guiSettings.directionShuffleProbability;
			this.disallowSameDirection = guiSettings.disallowSameDirection;
			this.circleProbability = guiSettings.circleProbability;
			this.backgroundColor = guiSettings.backgroundColor;
			this.colorFactor = Math.floor(guiSettings.colorFactor);
			this.colorFunction = guiSettings.colorFunction;
			this.border = this.cellDistance == 1 ? 0 : 1;
		}
	}

	var settings;
	var updatesPerFrame;
	var running;
	// array for the direction that the maze expands in
	// the first direction is taken first (if possible)
	var directions;
	var animFrameReqId = null;

	var data;
	var width;
	var height;
	var dfsStack;

	var canvas;
	var context;
	var bufferCanvas;
	var bufferContext;
	var changedCells = new Array();

	/**
	 * Shuffles array in place.
	 * @see http://stackoverflow.com/a/6274381
	 * @param {Array} a items The array containing the items.
	 */
	function shuffle(a) {
		var j, x, i;
		for(i = a.length; i; i--) {
			j = Math.floor(Math.random() * i);
			x = a[i - 1];
			a[i - 1] = a[j];
			a[j] = x;
		}
	}

	function initCanvas() {
		canvas = document.getElementById("canvas");
		bufferCanvas = document.createElement("canvas");

		[canvas, bufferCanvas].forEach(can => {
			can.mozOpaque = true;
			can.width = window.innerWidth;
			can.height = window.innerHeight;
		});

		context = canvas.getContext("2d");
		bufferContext = bufferCanvas.getContext("2d");

		[context, bufferContext].forEach(ctx => {
			ctx.webkitImageSmoothingEnabled = false;
			ctx.mozImageSmoothingEnabled = false;
			ctx.imageSmoothingEnabled = false;
		});
	}

	function initMaze() {
		width = Math.floor(canvas.width / settings.blockSize);
		height = Math.floor(canvas.height / settings.blockSize);

		data = new Array(height);
		changedCells.length = 0;
		for(var y = 0; y < height; y++) {
			data[y] = new Array(width);
			for(var x = 0; x < width; x++) {
				data[y][x] = null;
			}
		}
	}

	function initGeneration() {
		// put starting position on the stack
		dfsStack = new Array();	
		const border = settings.border;
		dfsStack.push(new Cell(
			settings.startX * (width - 2*border - 1) + border,
			settings.startY * (height - 2*border - 1) + border));

		directions = [ Direction.RIGHT, Direction.LEFT, Direction.UP, Direction.DOWN ];
	}

	maze.performStep = function() {
		var cell;
		var makeCircle = false;

		// get next cell
		while(true) {
			if(dfsStack.length == 0) {
				return false;
			}

			cell = dfsStack.pop();
			if(data[cell.y][cell.x] != null) {
				if(Math.random() < settings.circleProbability && settings.cellDistance > 1) {
					makeCircle = true;
				} else {
					continue;
				}
			}

			// only one element per update
			break;
		}

		var color = cell.color;

		// draw the intermediate cells
		if(cell.fromDir !== Direction.NONE) {
			for(var i = 1; i < settings.cellDistance; i++) {
				// minus fromDir, since the directions points from old to new position (p is the new position)
				var intermediate = new Cell(
					cell.x - i * cell.fromDir.x,
					cell.y - i * cell.fromDir.y,
					color);
				data[intermediate.y][intermediate.x] = intermediate;
				changedCells.push(intermediate);
				color++;
			}
		}

		// draw the cell (if this step is not a circle connection)
		if(makeCircle)
			return true;

		data[cell.y][cell.x] = cell;
		changedCells.push(cell);
		color++;

		// shuffle directions
		if(Math.random() < settings.directionShuffleProbability)
			shuffle(directions);

		// expand maze in all directions
		// opposite order so that the first element will be the top-most on the stack
		for(var i = directions.length-1; i >= 0; i--) {
			var d = directions[i];

			// no need to check the direction that we are coming from
			if(d.isOpposite(cell.fromDir))
				continue;

			// disallow continuing in the same direction
			if(settings.disallowSameDirection && d === cell.fromDir)
				continue;

			var newX = cell.x + settings.cellDistance * d.x;
			var newY = cell.y + settings.cellDistance * d.y;

			// check if next position is outside of canvas
			if(newX < settings.border || newX >= width - settings.border)
				continue;
			if(newY < settings.border || newY >= height - settings.border)
				continue;

			dfsStack.push(new Cell(newX, newY, color, d));
		}

		return true;
	}

	function redrawChanged() {
		changedCells.forEach(drawCell);
		changedCells.length = 0;
	}

	maze.redrawAll = function(guiSettings) {
		settings.backgroundColor = guiSettings.backgroundColor;
		settings.colorFactor = guiSettings.colorFactor;
		settings.colorFunction = guiSettings.colorFunction;

		for(var y = 0; y < height; y++) {
			for(var x = 0; x < width; x++) {
				if(data[y][x] != null) {
					drawCell(data[y][x]);
				}
			}
		}
	}

	function drawCell(cell) {
		if(settings.colorFactor == 0) {
			bufferContext.fillStyle = "#ffffff";
		} else {
			bufferContext.fillStyle = settings.colorFunction(
				(cell.color % settings.colorFactor) / settings.colorFactor,
				cell.x / width,
				cell.y / height);
		}

		bufferContext.fillRect(
			cell.x * settings.blockSize,
			cell.y * settings.blockSize,
			settings.blockSize,
			settings.blockSize);
	}

	function drawBuffer() {
		context.fillStyle = settings.backgroundColor;
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.drawImage(bufferCanvas, 0, 0);
	}

	function updateAndDrawFrame() {
		if(running) {
			for(var i = 0; i < updatesPerFrame; i++) {
				if(!maze.performStep()) {
					break;
				}
			}
		}
		redrawChanged();
		drawBuffer();
		animFrameReqId = requestAnimFrame(updateAndDrawFrame);
	};

	maze.start = function(guiSettings) {
		settings = new Settings(guiSettings);
		maze.setSpeed(guiSettings.speed);
		maze.setRunning(guiSettings.running);

		initCanvas();
		initMaze();
		initGeneration();

		// start the draw-loop
		if(animFrameReqId != null) {
			cancelAnimFrame(animFrameReqId);
		}
		animFrameReqId = requestAnimFrame(updateAndDrawFrame);
	}

	maze.setSpeed = function(_updatesPerFrame) {
		updatesPerFrame = Math.min(Math.max(_updatesPerFrame, 1), 10000);
	}

	maze.completeGeneration = function() {
		while(maze.performStep()) {
			// performStep will return false when no more cells are left
		}
	}

	maze.setRunning = function(_running) {
		running = _running;
	}
}(window.maze = window.maze || {}));