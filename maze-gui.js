(function($) {

	function createSandboxedColorFunction(code) {
		let frame = document.getElementById("sandbox");
		if(frame == null) {
			frame = document.createElement("iframe");
			frame.src = "about:blank";
			frame.style.display = "none";
			frame.id = "sandbox";
			document.body.appendChild(frame);
		}
		return new frame.contentWindow.Function("c", "x", "y", code);
	};

	const colorFunctionInput = document.getElementById("colorFunction");

	const settings = {
		running : true,
		speed : 100,
		performStep : maze.performStep,
		complete : function() {
			$("*").addClass("wait");
			// call is delayed to let the browser show the wait-cursor
			setTimeout(function() {
				maze.completeGeneration();
				$("*").removeClass("wait");
			}, 100);
		},
		startX : 0,
		startY : 0,
		pickStartPosition : function() {
			alert("Click on the maze to select a new start position. Press H to hide/show the controls.");
			$("#floatingBox").text("Click to select a start position");
			$("#canvas").off().on({
				mouseenter : function(e) {
					$("#floatingBox").show();
				},
				mouseleave : function(e) {
					$("#floatingBox").hide();
				},
				mousemove : function(e) {
					$("#floatingBox").css({ left : e.pageX, top : e.pageY });
				},
				click : function(e) {
					settings.startX = e.pageX / $("#canvas").width();
					settings.startY = e.pageY / $("#canvas").height();
					gui.updateDisplay();
					$("#floatingBox").hide();
					$("#canvas").off();
				}
			});
		},
		blockSize : 1,
		cellDistance : 2,
		directionShuffleProbability : 1.0,
		disallowSameDirection : false,
		circleProbability : 0.0,
		backgroundColor : "#000000",
		colorFactor : 3600,
		colorFunctionPreset : "rainbow",
		colorFunction : colorFunctions.rainbow,
		changeColorFunction : function() {
			$("#colorFunctionPresets").empty();
			Object.keys(colorFunctions).forEach((key, index) => $("#colorFunctionPresets").append("<option>" + key + "</option>"));
			$("#colorFunctionPresetLoad").off("click").on("click", () => {
				const functionDefinition = colorFunctions[$("#colorFunctionPresets").val()].toString();
				const functionBody = functionDefinition.slice(functionDefinition.indexOf("{") + 1, functionDefinition.lastIndexOf("}"));
				colorFunctionInput.value = functionBody.replace(new RegExp("\n\t\t", "g"), "\n").trim(); // remove tabs at beginnings of lines
			});
			$("#dialog-wrapper").fadeIn();
			$(".cancel-button").off("click").on("click", event => {
				$("#dialog-wrapper").fadeOut();
				event.stopPropagation();
			});
			function checkSyntax() {
				const resultElement = document.getElementById("checkSyntaxResult");
				try {
					const sandboxedFunction = createSandboxedColorFunction(colorFunctionInput.value);
					const testVal = sandboxedFunction(0, 0, 0); // not really an in-depth test...
					if(testVal == undefined || typeof testVal != "string") {
						resultElement.innerHTML = '<span style="color: red">The function has to return a string.</span>';
						return false;
					} else {
						resultElement.innerHTML = '<span style="color: green">Syntax is valid.</span>';
						return true;
					}
				} catch(e) {
					resultElement.innerHTML = '<span style="color: red">' + e + '</span>';
					return false;
				}
			};
			$("#checkSyntax").off("click").on("click", checkSyntax);
			$("#dialog-colorFunction .confirm-button").off("click").on("click", () => {
				if(checkSyntax()) {
					$("#dialog-wrapper").fadeOut();
					settings.colorFunctionPreset = "custom";
					settings.colorFunction = createSandboxedColorFunction(colorFunctionInput.value);
				}
			});
		},
		redrawAll : function() {
			$("*").addClass("wait");
			// call is delayed to let the browser show the wait-cursor
			setTimeout(function() {
				maze.redrawAll(settings);
				$("*").removeClass("wait");
			}, 100);
		},
		startMaze : function() {
			maze.start(settings);
		},
		viewSource : function() {
			window.location.href = "https://github.com/Robyt3/maze";
		}
	};

	const gui = new dat.GUI({ width: 400 });

	const folderGeneration = gui.addFolder("Generation");
	folderGeneration.add(settings, "running").name("Running [Space]").listen().onChange(() => maze.setRunning(settings.running));
	folderGeneration.add(settings, "speed").min(1).max(1000).step(1).name("Speed [+/-]").listen().onChange(() => maze.setSpeed(settings.speed));
	folderGeneration.add(settings, "performStep").name("Perform single step [S]");
	folderGeneration.add(settings, "complete").name("Complete generation");
	folderGeneration.add(settings, "startMaze").name("Start/Restart generation [R]");
	folderGeneration.open();

	const folderSettings = gui.addFolder("Settings");
	const folderSettingsStartPosition = folderSettings.addFolder("Start position");
	folderSettingsStartPosition.add(settings, "startX").min(0).max(1).step(0.0001).name("X");
	folderSettingsStartPosition.add(settings, "startY").min(0).max(1).step(0.0001).name("Y");
	folderSettingsStartPosition.add(settings, "pickStartPosition").name("Pick start position");
	folderSettings.add(settings, "blockSize").min(1).max(50).step(1).name("Block size");
	folderSettings.add(settings, "cellDistance").min(1).max(50).step(1).name("Cell distance");
	folderSettings.add(settings, "directionShuffleProbability").min(0.0).max(1.0).step(0.001).name("Direction shuffle probability");
	folderSettings.add(settings, "disallowSameDirection").name("Disallow same direction");
	folderSettings.add(settings, "circleProbability").min(0.0).max(1.0).step(0.001).name("Circle probability");
	folderSettings.open();

	const folderColors = gui.addFolder("Colors");
	folderColors.addColor(settings, "backgroundColor").name("Background color");
	folderColors.add(settings, "colorFactor").min(0).step(1).name("Color factor");
	const colorFuncs = Object.keys(colorFunctions);
	colorFuncs.push("custom");
	folderColors.add(settings, "colorFunctionPreset", colorFuncs).name("Color function").onChange(value => {
		if(value == "custom") {
			settings.changeColorFunction();
		} else {
			settings.colorFunction = colorFunctions[value];
		}
	}).listen();
	folderColors.add(settings, "changeColorFunction").name("Custom color function");
	folderColors.add(settings, "redrawAll").name("Redraw with new color");
	folderColors.open();

	gui.add(settings, "viewSource").name("Show source code on GitHub");

	const canvas = document.getElementById("canvas");
	maze.setCanvas(canvas);
	canvas.addEventListener("keypress", event => {
		if(event.key == " ") {
			settings.running = !settings.running;
			maze.setRunning(settings.running);
		} else if(event.key == "s") {
			maze.performStep();
		} else if(event.key == "r") {
			settings.startMaze();
		} else if(event.key == "+") {
			settings.speed = Math.min(settings.speed + (event.shiftKey ? 10 : 1), 1000);
			maze.setSpeed(settings.speed);
		} else if(event.key == "-") {
			settings.speed = Math.max(settings.speed - (event.shiftKey ? 10 : 1), 1);
			maze.setSpeed(settings.speed);
		}
	});
	canvas.focus();

	// enable tabs in the color function textarea
	// https://stackoverflow.com/a/6140696
	colorFunctionInput.addEventListener("keydown", event => {
		if(event.keyCode === 9) { // tab
			const target = event.target;
			target.value = target.value.substring(0, target.selectionStart) + "\t" + target.value.substring(target.selectionEnd);
			target.selectionStart = target.selectionEnd = target.selectionStart + 1;
			event.preventDefault();
		}
	});

	settings.startMaze();
})(jQuery);