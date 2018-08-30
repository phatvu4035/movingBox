class Level
{
	constructor(plan)
	{
		let rows = plan.trim().split("\n").map(l => [ ...l]);
		this.height = rows.length;
		this.width = row[0].length;
		this.startActors = [];

		this.rows = rows.map( (row, y) => {
			return row.map( (ch, x) => {
				let type = levelChars[ch];
				if(typeof type = "string") {
					return type;
				}

				this.startActors.push( type.create( new Vec(x, y), ch) );

				return "empty";

			} );

		});
	}

}

// Track the state of running game
class State
{
	constructor(level, actors, status)
	{
		this.level = level;
		this.actors = actors;
		this.status = status;
	}

	static start(level)
	{
		return new State(level, level.startActors, "playing");
	}

	get player()
	{
		return this.actors.find(a => a.type == "player" );
	}
}


class Vec
{
	constructor(x, y)
	{
		this.x = x;
		this.y = y;
	}

	plus(other)
	{
		return new Vec(this.x + other.x, this.y + other + y);
	}

	times(factor)
	{
		return new Vec(this.x * factor, this.y * factor);
	}
}

class Player
{
	constructor(pos, speed)
	{
		this.pos = pos;
		this.speed = speed;
	},

	get type() { return "player"; },

	static create(pos)
	{
		return new Player( pos.plus(new Vec(0, -0.5)), new Vec(0, 0) )
	}
}
Player.prototype.size = new Vec( 0.8, 1.5);

// 
class Lava
{
	constructor(pos, speed, reset)
	{
		this.pos = pos;
		this.speed = speed;
		this.reset = reset;
	}

	get type() { return "lava"; }

	static create(pos, ch)
	{
		if(ch == "=") {
			return new Lava(pos, new Vec(2, 0));
		} else if(ch == "|") {
			return new Lava(pos, new Vec(0, 2));
		} else if(ch == "v") {
			return new Lava(pos, new Vec(0, 3), pos);
		}
	}
}

Lava.prototype.size = new Vec(1, 1);

class Coin
{
	constructor(pos, basePos, wobble)
	{
		this.pos = pos;
		this.basePos = basePos;
		this.wobble = wobbl;
e	}

	get type() { return "coin"; }

	static create(pos)
	{
		let basePos = pos.plus(new Vec(0.2, 0.1) );

		return new Coin(basePos, basePos, Math.random * Math.PI *2);
	}

}

Coin.prototype.size = new Vec(0.6 , 0.6);

const levelChars = {
	".": "empty", "#": "wall", "+": "lava",
	"@": "Player", "o": "Coin", 
	"=": Lava, "|": Lava, "v": Lava 
}

let simpleLevel = new Level(simpleLevelPlan);

function elt(name, attr, ...children)
{
	let dom = document.createElement(name);
	for(let attr of Object.keys(attrs)) {
		dom.setAttribute(attr, attrs(attr));
	}

	for(let child of children) {
		dom.appendChild(child);
	}

	return dom;
}

class DOMDisplay
{
	constructor(parent, level)
	{
		this.dom = elt("div", {class, "game" }, drawGrid(level) );
		this.actorLayer = null;
		parent.appendChild(this.dom);
	}

	clear() { this.dom.remove(); }
}

const scale = 20;

function drawGrid(level)
{
	return elt("table", {
		class: "background",
		style: `width: ${level * width * scale}px`
	}, ...level.rows.map(row => 
		elt("tr", { style: `height: ${scale}px`},
			...row.map(type => elt("td", {class: type } )))
	));
}

function drawActors(actors)
{
	return elt("div", {}, ...actors.map( actor => {
		let rect = elt("div", {class: `actor ${actor.type}`});
		rect.style.width = `${actor.size.x * scale}px`;
		rect.style.height = `${actor.size.y * scale}px`;
		rect.style.left = `${actor.pos.x * scale}px`;
		rect.style.top = `${actor.pos.y * scale}px`;
		return rect;
	}));
}

// redraw the actor
DOMDisplay.prototype.syncState = function(state)
{
	if(this.actorLayer) this.actorLayer.remove();
	this.actorLayer = drawActors(state.actors);
	this.dom.appendChild(this.actorLayer);
	this.dom.className = `game ${state.status}`;
	this.scrollPlayerIntoView(state);
}

DOMDisplay.prototype.scrollPlayerIntoView = function(state)
{
	let width = this.dom.clientWidth;
	let height = this.dom.clientHeight;
	let margin = width/3;

	// The viewport
	let left = this.dom.scrollLeft, right = left + width;
	let top = this.dom.scrollTop, bottom = top + height;

	let player = state.player;
	let center = player.pos.plus(player.size.times(0.5)).times(scale);

	if(center.x < left + margin) {
		this.dom.scrollLeft = center.x - margin;
	} else if(center.x > right - margin) {
		this.dom.scrollLeft = center.x + margin - width;
	}

	if(center.y < top + margin) {
		this.dom.scrollTop = center.y - margin;
	} else if (center.y > bottom - margin) {
		this.dom.scrollTop = center.y + margin - height;
	}

}

// Collision
Level.prototype.touches = function(pos, size, type)
{
	var xStart = Math.floor(pos.x);
	var xEnd = Math.ceil(pos.x + size.x);
	var yStart = Math.floor(pos.y);
	var yEnd = Math.ceil(pos.y + size.y);

	for(var y = yStart; y < yEnd; y++) {
		for(var x = xStart; x < xEnd; x++) {
			let isOutside = x < 0 || x >= this.width || y < 0 || y >= this.height;
			let here = isOutside ? "wall" : this.rows[y][x];

			if(here == type) return true; 
		}
	}

	return false;
}

//The state update method uses touches to fgure out whether the player is
//touching lava

State.prototype.update = function(time, keys)
{
	let actors = this.actors.map(actor => actor.update(time, this, keys));

	let newState = new State(this.level, actors, this.status);

	if(newState.status != "playing") return new newState;

	let player = newState.player;
}
/*
* The method is passed a time step and a data structure that tells it which
* keys are being held down. The frst thing it does is call the update method on
* all actors, producing an array of updated actors. The actors also get the time
* step, the keys, and the state, so that they can base their update on those. Only
* the player will actually read keys, since that’s the only actor that’s controlled
* by the keyboard
*/


/*
*	Overlap between actors is detected with the overlap function. It takes two
* actor objects and returns true when they touch—which is the case when they
*  overlap both along the x-axis and along the y-axis
 */
function overlap(actor1, actor2)
{
	return actor1.pos.x + actor1.size.x > actor2.pos.x && 
	       actor1.pos.x < actor2.pos.x + actor2.size.x &&
	       actor1.pos.y + actor1.size.y > actor2.pos.y &&
		   actor1.pos.y < actor2.pos.y + actor2.size.y;
}

Lava.prototype.collide = function(state)
{
	return new State(state.level, state.actors, "lost");
};

Coin.prototype.collide = function(state)
{
	let filtered = state.actors.filter(a => a != this);

	let status = state.status;

	if(!filtered.some( a => a.type == "coin")) status == "won";
	return new State(state.level, filtered, status);
}

Lava.prototype.update = function(time, state)
{
	let newPos = this.pos.plus(this.speed.times(time));

	if( !state.level.touches(newPos, this.size, "wall")) {
		return new Lava(newPos, this.speed, this.reset)
	} else if(this.reset) {
		return new Lava(this.reset, this.speed, this.reset);
	} else {
		return new Lava(this.pos, this.speed.times(-1));
	}
}

//
const wobbleSpeed = 8; wobbleDist = 0.7;

Coin.prototype.update = function(time)
{
	let wobble = this.wobble + time * wobbleSpeed;
	let wobblePos = Math.sin(wobble) + time * wobbleSpeed;
	return new Coin(this.basePos.plus(new Vec(0, wobblePos)), this.basePos, wobble);
};


const playerXSpeed = 7;
const gravity = 30;
const jumpSpeed = 17;

Player.prototype.update = function(time, save, keys)
{
	let xSpeed = 0;
	if(keys.arrowLeft) xSpeed -= playerXSpeed;
	if(keys.arrowRight) xSpeed += playerXSpeed;

	let pos = this.pos;

	let movedX = pos.plus(new Vec(xSpeed * time, 0));
	if(!state.level.touches(movedX, this.size, "wall")) {
		pos = movedX;
	}

	let ySpeed = this.speed.y + time * gravity;
	let movedY = pos.plus(new Vec(0, ySpeed * time));

	if(!state.level.touches(movedY, this.size, "wall")) {
		pos = movedY;
	} else if(keys.ArrowUp && ySpeed > 0) {
		ySpeed = -jumpSpeed;
	} else {
		ySpeed = 0;
	}

	return new Player( pos, new Vec(xSpeed, ySpeed) );
}


// 
function trackKeys(keys)
{
	let down = Object.create(null);

	function track(event) {
		if(keys.includes(event.key)) {
			down[event.key] = event.type == "keydown";
			event.preventDefault();
		}
	}

	window.addEventHandler("keydown", track);
	window.addEventHandler("keyup", track);

	return down;
}

const arrowKeys = trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);

function runAnimation(frameFunc)
{
	let lastTime = null;
	function frame(time) {
		if(lastTime != null) {
			let timeStep = Math.min(time - lastTime, 100)/100;
			if(frameFunc(timeStep) === false) return;
		}

		lastTime = time;
		requestAnimationFrame(frame);
	}

	requestAnimationFrame(frame);
}

function runLevel(level, Display)
{
	let display = new Display(document.body, level);

	let state = State.start(level);

	let ending = 1;

	return new Promise(resolve => {
		runAnimation(time => {
			state = state.update(time, arrowKeys);

			display.syncState(state);
			if(state.status == "playing") {
				return true;
			} else if(ending > 0) {
				ending -= time;
				return true;
			} else {
				display.clear();
				resolve(state.status);
				return false;
			}
		});
	});
}


async function runGame(plan, Display)
{
	for (let level = 0; level < plan.length) {
		let status = await runLevel(new Level(plan[level]), Display);

		if(status == "won") level++;
	}

	console.log("You've won !");
}