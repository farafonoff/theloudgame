// main
function randomInRange(min, max) {
	let diff = max - min;
	return Math.random() * diff + min;
}
function clamp(v, min, max) {
	return v < min? min: (v>max?max: v);
}
function makeCoordsList(width, height) {
	let runMin = 20;
	let runMax = 60;
	let heightMin = 0.2;
	let heightMax = 1.0;
	let result = [];
	let currentCoord = new Coords(0, height/2);
	while (currentCoord.x < width) {
		let run = randomInRange(runMin, runMax);
		let slope = randomInRange(-1, 1);
		if (slope > 0) slope = 1; else slope = -1;
		slope *= run;
		let segment = new Coords(run, slope);
		let nextCoord = currentCoord.clone().add(segment);
		nextCoord.y = clamp(nextCoord.y, height* heightMin, height* heightMax);
		let edge = new Edge([ currentCoord, nextCoord]);
		result.push(edge);
		currentCoord = nextCoord;
	}
	return result;
};

function main(parentNode)
{
  var level = new Level
	(
		"Level 1",
		new Coords(10000, parentNode.clientHeight), // size
		new Coords(0, 5), // accelerationDueToGravity
		.15, // velocityMin
		.4, // friction
		makeCoordsList(10000, parentNode.clientHeight)
		// edges
		/*[
			new Edge( [ new Coords(5, 50), new Coords(25, 50) ] ),
			new Edge( [ new Coords(25, 50), new Coords(45, 45) ] ),
			new Edge( [ new Coords(45, 45), new Coords(55, 50) ] ),
			new Edge( [ new Coords(35, 60), new Coords(65, 60) ] ),		
			new Edge( [ new Coords(65, 50), new Coords(85, 50) ] ),
			new Edge( [ new Coords(85, 40), new Coords(115, 40) ] ),
			new Edge( [ new Coords(105, 30), new Coords(185, 30) ] ),
			new Edge( [ new Coords(185, 40), new Coords(265, 40) ] ),
			new Edge( [ new Coords(280, 60), new Coords(295, 60) ] ),
			new Edge( [ new Coords(240, 70), new Coords(275, 70) ] ),
			new Edge( [ new Coords(200, 80), new Coords(220, 80) ] ),
		]*/
	);

	var bodyDefnPlayer = new BodyDefn
	(
		"Player",
		1, // accelerationRun
		.2, // accelerationFly
		1, // velocityMaxRun
		6, // accelerationJump
		8, // velocityMaxFlying
		//new IntelligenceDefnHuman(),
		new IntelligenceAudioFixSpeed(parentNode.clientHeight),
		new Face
		([
			new Edge([ new Coords(0, 0), new Coords(0, -12) ]),
			new Edge([ new Coords(0, -12), new Coords(0, 0) ])
		], { image: {
			data: document.getElementById('playerImg'),
			size: new Coords(100, 100),
			}
		})
	);

	var bodyForPlayer = new Body
	(
		"Player0",
		bodyDefnPlayer,
		new Coords(10, 10)
	);

	var levelRun = new LevelRun
	(
		level,
		// movers
		[
			bodyForPlayer
		]
	);

	var displayHelper = new DisplayHelper
	(
        parentNode, 
		new Coords(parentNode.clientWidth, parentNode.clientHeight) // viewSize
	);

	Globals.Instance.initialize
	(
		displayHelper,
		levelRun
	)
}

// classes

function Body(name, defn, pos)
{
	this.name = name;
	this.defn = defn;
	this.pos = pos;

	this.vel = new Coords(0, 0);
	this.edgeBeingStoodOn = null;
	if (this.defn.face != null)
	{
		this.face = this.defn.face.clone();
	}

	if (this.defn.intelligenceDefn != null)
	{
		this.intelligence = new Intelligence
		(
			this.defn.intelligenceDefn
		);
	}

	this.collisionMapCellsOccupied = [];

	this.integrity = 1;
}

function BodyDefn
(
	name, 
	accelerationRun,
	accelerationFly,
	velocityMaxRunning,
	accelerationJump,
	velocityMaxFlying,
	intelligenceDefn,
	face
)
{
	this.name = name;
	this.accelerationRun = accelerationRun;
	this.accelerationFly = accelerationFly;
	this.velocityMaxRunning = velocityMaxRunning;
	this.accelerationJump = accelerationJump;
	this.velocityMaxFlying = velocityMaxFlying;
	this.intelligenceDefn = intelligenceDefn;
	this.face = face;
}

function Bounds(min, max)
{
	this.min = min;
	this.max = max;

	this.minAndMax = [ this.min, this.max ];
}
{
	Bounds.prototype.overwriteWithBoundsOfCoordsMany = function(coordsSetToFindBoundsOf)
	{
		this.min.overwriteWith(coordsSetToFindBoundsOf[0]);
		this.max.overwriteWith(this.min);

		for (var i = 0; i < coordsSetToFindBoundsOf.length; i++)
		{
			var coordsToCheck = coordsSetToFindBoundsOf[i];

			for (var d = 0; d < Coords.NumberOfDimensions; d++)
			{
				var dimensionValueToCheck = coordsToCheck.dimension(d);

				if (dimensionValueToCheck < this.min.dimension(d))
				{
					this.min.dimension_Set(d, dimensionValueToCheck);
				}

				if (dimensionValueToCheck > this.max.dimension(d))
				{
					this.max.dimension_Set(d, dimensionValueToCheck);
				}
				
			}
		}

		return this;
	}
}

function Cloneable()
{
	// static class
}
{
	Cloneable.cloneMany = function(cloneablesToClone)
	{
		var returnValues = [];

		for (var i = 0; i < cloneablesToClone.length; i++)
		{
			var cloneableToClone = cloneablesToClone[i];
			var cloneableCloned = cloneableToClone.clone();
			returnValues.push(cloneableCloned);
		}

		return returnValues;
	}
}

function Collision(pos, distance, edgeCollidedWith, bodyCollidedWith)
{
	this.pos = pos;
	this.distance = distance;
	this.edgeCollidedWith = edgeCollidedWith;
	this.bodyCollidedWith = bodyCollidedWith;
}
{
	// static variables

	Collision.bounds = 
	[
		new Bounds(new Coords(0, 0), new Coords(0, 0)),
		new Bounds(new Coords(0, 0), new Coords(0, 0)),
	];

	// static methods

	Collision.closestInList = function(collisionsToCheck)
	{
		var collisionClosest = collisionsToCheck[0];
		
		for (var i = 1; i < collisionsToCheck.length; i++)
		{
			var collision = collisionsToCheck[i];
			if (collision.distance < collisionClosest.distance)
			{
				collisionClosest = collision;
			}
		}

		return collisionClosest;
	}

	Collision.doBoundsOverlap = function(bounds0, bounds1)
	{
		var returnValue = false;

		var bounds = Collision.bounds;

		bounds[0] = bounds0;
		bounds[1] = bounds1;

		for (var b = 0; b < bounds.length; b++)
		{
			var boundsThis = bounds[b];
			var boundsOther = bounds[1 - b];			

			var doAllDimensionsOverlapSoFar = true;

			for (var d = 0; d < Coords.NumberOfDimensions; d++)
			{
				if 
				(
					boundsThis.max.dimension(d) < boundsOther.min.dimension(d)
					|| boundsThis.min.dimension(d) > boundsOther.max.dimension(d)
				)
				{
					doAllDimensionsOverlapSoFar = false;
					break;
				}
			}

			if (doAllDimensionsOverlapSoFar == true)
			{
				returnValue = true;
				break;
			}
		}

		return returnValue;
	}

	Collision.edgeWithOther = function(edge0, edge1)
	{
		var returnValue;

		var doBoundsOverlap = Collision.doBoundsOverlap
		(
			edge0.bounds,
			edge1.bounds
		);

		if (doBoundsOverlap == true)
		{
			var edge0ProjectedOntoEdge1 = edge0.clone().projectOntoOther
			(
				edge1
			);

			var distanceAlongEdge0ToEdge1 = 
				0 
				- edge0ProjectedOntoEdge1.vertices[0].y 
				/ edge0ProjectedOntoEdge1.direction.y;
	
			// Because the math's not perfect...
			var correctionFactor = 1; 

			if 
			(
				distanceAlongEdge0ToEdge1 >= 0 - correctionFactor
				&& distanceAlongEdge0ToEdge1 <= edge0.length + correctionFactor
			)
			{
				var collisionPos = edge0.vertices[0].clone().add
				(
					edge0.direction.clone().multiplyScalar
					(
						distanceAlongEdge0ToEdge1
					)
				);
				
				returnValue = new Collision
				(
					collisionPos,
					distanceAlongEdge0ToEdge1,
					edge1,
					null // bodyCollidedWith
				);
			}
		}
		else
		{
			returnValue = null;
		}

		return returnValue;
	}

	Collision.moverWithEdge = function(mover, edge)
	{
		var returnValue = null;

		if (mover.vel.dotProduct(edge.right) >= 0)
		{
			var moverEdge = new Edge
			([
				mover.pos,
				mover.pos.clone().add(mover.vel)
			]);	

			returnValue = Collision.edgeWithOther
			(
				moverEdge,
				edge
			);
		}
	
		return returnValue;
	}

	Collision.moverWithOther = function(mover0, mover1)
	{
		var returnValue = null;

		if (mover1.name.indexOf("Edge") == 0)
		{
			var edges = mover1.face.edges;
			for (var i = 0; i < edges.length; i++)
			{
				var edge = edges[i];
				var collision = Collision.moverWithEdge(mover0, edge);
				if (collision != null)
				{
					collision.bodyCollidedWith = mover1;
					returnValue = collision;
				}
			}
		}
		else // if mover
		{
			var doBoundsOverlap = Collision.doBoundsOverlap
			(
				mover0.face.bounds,
				mover1.face.bounds
			);

			if (doBoundsOverlap == true)
			{
				returnValue = new Collision
				(
					mover0.pos,
					0, // distance
					null, // edgeCollidedWith
					mover1 // bodyCollidedWith
				);
			}
		}

		return returnValue;
	}
}

function Coords(x, y)
{
	this.x = x;
	this.y = y;
}
{
	// constants

	Coords.NumberOfDimensions = 2;

	// instance methods

	Coords.prototype.add = function(other)
	{
		this.x += other.x;
		this.y += other.y;

		return this;
	}

	Coords.prototype.ceiling = function()
	{
		this.x = Math.ceil(this.x);
		this.y = Math.ceil(this.y);

		return this;
	}

	Coords.prototype.clear = function()
	{
		this.x = 0;
		this.y = 0;

		return this;
	}

	Coords.prototype.clone = function()
	{
		return new Coords(this.x, this.y);
	}

	Coords.prototype.dimension = function(dimensionIndex)
	{
		return (dimensionIndex == 0 ? this.x : this.y);
	}

	Coords.prototype.dimension_Set = function(dimensionIndex, dimensionValue)
	{
		if (dimensionIndex == 0)
		{
			this.x = dimensionValue;
		}
		else
		{
			this.y = dimensionValue;
		}
	}

	Coords.prototype.divide = function(other)
	{
		this.x /= other.x;
		this.y /= other.y;

		return this;
	}

	Coords.prototype.divideScalar = function(scalar)
	{
		this.x /= scalar;
		this.y /= scalar;

		return this;
	}
	
	Coords.prototype.dotProduct = function(other)
	{
		return this.x * other.x + this.y * other.y;
	}

	Coords.prototype.floor = function()
	{
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);

		return this;
	}

	Coords.prototype.magnitude = function()
	{
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	Coords.prototype.multiplyScalar = function(scalar)
	{
		this.x *= scalar;
		this.y *= scalar;

		return this;
	}

	Coords.prototype.normalize = function(scalar)
	{
		return this.divideScalar(this.magnitude());
	}

	Coords.prototype.right = function()
	{
		var temp = this.y;
		this.y = this.x;
		this.x = 0 - temp;

		return this;
	}

	Coords.prototype.overwriteWith = function(other)
	{
		this.x = other.x;
		this.y = other.y;

		return this;
	}

	Coords.prototype.overwriteWithXY = function(x, y)
	{
		this.x = x;
		this.y = y;

		return this;
	}

	Coords.prototype.subtract = function(other)
	{
		this.x -= other.x;
		this.y -= other.y;

		return this;
	}

	Coords.prototype.trimToMagnitude = function(magnitudeToTrimTo)
	{
		var magnitude = this.magnitude();

		if (magnitude > magnitudeToTrimTo)
		{
			this.divideScalar
			(
				magnitude
			).multiplyScalar
			(
				magnitudeToTrimTo
			);
		}
	}

	Coords.prototype.trimToRange = function(range)
	{
		if (this.x < 0)
		{
			this.x = 0;
		}
		else if (this.x > range.x)
		{
			this.x = range.x;
		}

		if (this.y < 0)
		{
			this.y = 0;
		}
		else if (this.y > range.y)
		{
			this.y = range.y;
		}

		return this;
	}
}

function Debug()
{
	// static class
}
{
	Debug._idNext = 0;
	Debug.idNext = function()
	{
		this._idNext++;
		return this._idNext;
	}
}

function DisplayHelper(parentNode, viewSize)
{
    this.parentNode = parentNode;
	this.viewSize = viewSize;
	this.viewSizeHalf = this.viewSize.clone().divideScalar(2);
}
{
	DisplayHelper.prototype.clear = function()
	{
		/*this.graphics.fillStyle = "White";
		this.graphics.strokeStyle = "LightGray";
		this.graphics.fillRect
		(
			0, 0, 
			this.viewSize.x, this.viewSize.y
		);
		this.graphics.strokeRect
		(
			0, 0, 
			this.viewSize.x, this.viewSize.y
		);*/
		this.graphics.clearRect(0, 0, this.viewSize.x, this.viewSize.y);
	}

	DisplayHelper.prototype.drawBody = function(body, cameraPos)
	{
		if (body.face.image) {
			this.drawImage(body.face.image, body.face.vertices[0], cameraPos);
			return;
		}
		var vertices = body.face.vertices;

		for (var v = 0; v < vertices.length; v++)
		{
			var vertex = vertices[v];
			var vNext = v + 1;
			if (vNext >= vertices.length)
			{
				vNext = 0;
			}
			var vertexNext = vertices[vNext];
	
			this.drawLine
			(
				vertex,
				vertexNext,
				cameraPos
			);
		}
	}

	DisplayHelper.prototype.drawBounds = function(bounds, cameraPos)
	{
		var drawPos = this.drawPos.overwriteWith
		(
			bounds.min
		).subtract
		(
			cameraPos
		);

		var drawSize = this.drawSize.overwriteWith
		(
			bounds.max
		).subtract
		(
			bounds.min
		);

		this.graphics.strokeStyle = "LightGray";
		this.graphics.strokeRect
		(
			drawPos.x, 
			drawPos.y,
			drawSize.x,
			drawSize.y
		);
	}

	DisplayHelper.prototype.drawEdge = function(edge, cameraPos)
	{
		this.drawPos.overwriteWith
		(
			edge.vertices[0]
		);

		this.drawPos2.overwriteWith
		(
			edge.vertices[1]
		)

		this.drawLine
		(
			this.drawPos, 
			this.drawPos2,
			cameraPos
		);
	}

	DisplayHelper.prototype.drawLine = function(startPos, endPos, cameraPos, color)
	{
		if (color == null)
		{
			color = "Red";
		}

		this.graphics.strokeStyle = color;
		this.graphics.beginPath();
		this.graphics.moveTo
		(
			startPos.x - cameraPos.x, 
			startPos.y - cameraPos.y
		);
		this.graphics.lineTo
		(
			endPos.x - cameraPos.x, 
			endPos.y - cameraPos.y
		);
		this.graphics.stroke();
	}

	DisplayHelper.prototype.drawImage = function(image, pos, cameraPos) {
		let offset = pos.clone().subtract(cameraPos);
		let imgcenter = image.size.clone().divideScalar(2);
		offset.subtract(imgcenter);
		this.graphics.drawImage(image.data, offset.x, offset.y, image.size.x, image.size.y);
	}

	DisplayHelper.prototype.drawLevelRun = function(levelRun)
	{
		this.clear();

		var bodyForPlayer = levelRun.bodyForPlayer;
		var cameraPos = levelRun.cameraPos;

		cameraPos.overwriteWith
		(
			bodyForPlayer.pos
		).subtract
		(
			this.viewSizeHalf
		).trimToRange
		(
			levelRun.cameraRange
		);

		var cameraViewBounds = new Bounds
		(
			cameraPos,
			cameraPos.clone().add(levelRun.cameraRange)
		);

		//var bodies = levelRun.bodies;
		var bodies = levelRun.collisionMap.bodiesInBoundsAddToList
		(
			cameraViewBounds,
			[]
		);

		for (var i = 0; i < bodies.length; i++)
		{
			var body = bodies[i];

			this.drawBody(body, cameraPos);
		}
	}

	DisplayHelper.prototype.initialize = function()
	{
		var canvas = document.createElement("canvas");
		canvas.width = this.viewSize.x;
		canvas.height = this.viewSize.y;

		this.graphics = canvas.getContext("2d");
		
		this.parentNode.appendChild(canvas);

		this.drawPos = new Coords(0, 0);
		this.drawPos2 = new Coords(0, 0);
		this.drawSize = new Coords(0, 0);
	}
}

function Edge(vertices)
{
this.id = Debug.idNext();
	this.vertices = vertices;

	this.defn = new BodyDefn
	(
		Edge.BodyDefnName // name
	);

	this.displacement = new Coords(0, 0);
	this.direction = new Coords(0, 0);
	this.right = new Coords(0, 0);
	this.bounds = new Bounds(new Coords(0, 0), new Coords(0, 0));

	this.recalculateDerivedValues();
}
{
	// constants

	Edge.BodyDefnName = "Edge";
	Edge.Thickness = 4;

	// methods

	Edge.prototype.clone = function()
	{
		return new Edge
		(
			[ this.vertices[0].clone(), this.vertices[1].clone() ]
		);
	}

	Edge.prototype.overwriteWith = function(other)
	{
		for (var i = 0; i < this.vertices.length; i++)
		{
			var vertexThis = this.vertices[i];
			var vertexOther = other.vertices[i];
			vertexThis.overwriteWith(vertexOther);
		}

		this.recalculateDerivedValues();
	}

	Edge.prototype.projectOntoOther = function(other)
	{
		for (var v = 0; v < this.vertices.length; v++)
		{
			var vertexToProject = this.vertices[v];

			vertexToProject.subtract
			(
				other.vertices[0]
			).overwriteWithXY
			(
				vertexToProject.dotProduct(other.direction),
				vertexToProject.dotProduct(other.right)
			);
		}

		this.recalculateDerivedValues();

		return this;
	}

	Edge.prototype.recalculateDerivedValues = function()
	{
		this.displacement.overwriteWith
		(
			this.vertices[1]
		).subtract
		(
			this.vertices[0]
		);

		this.length = this.displacement.magnitude();

		this.direction.overwriteWith
		(
			this.displacement
		).divideScalar
		(
			this.length
		);

		this.right.overwriteWith
		(
			this.direction
		).right();
	
		this.bounds.overwriteWithBoundsOfCoordsMany
		(
			this.vertices
		);
	}
}

function Face(edges, options)
{
	this.edges = edges;
	Object.assign(this, options);
	this.vertices = [];
	for (var i = 0; i < this.edges.length; i++)
	{
		var edge = this.edges[i];
		var vertex = edge.vertices[0];
		this.vertices.push(vertex);
	}

	if (this.edges.length == 1)
	{
		this.vertices.push(this.edges[0].vertices[1]);
	}

	this.bounds = new Bounds(new Coords(0, 0), new Coords(0, 0));

	this.recalculateDerivedValues();
}
{
	Face.prototype.clone = function()
	{
		return new Face(Cloneable.cloneMany(this.edges), { image: this.image });
	}

	Face.prototype.overwriteWith = function(other)
	{
		for (var e = 0; e < this.edges.length; e++)
		{
			var edge = this.edges[e];
			var edgeOther = other.edges[e];
			edge.overwriteWith(edgeOther);
		}

		this.recalculateDerivedValues();

		return this;
	}

	Face.prototype.recalculateDerivedValues = function()
	{
		this.bounds.overwriteWithBoundsOfCoordsMany(this.vertices);
	}

	Face.prototype.transform = function(transformToApply)
	{
		Transform.applyTransformToCoordsMany
		(
			transformToApply,
			this.vertices
		);

		this.recalculateDerivedValues();

		return this;	
	}
}

function Globals()
{}
{
	Globals.Instance = new Globals();

	Globals.prototype.handleEventTimerTick = function()
	{
		this.inputHelper.updateForTimerTick();
		this.levelRun.updateForTimerTick();
	}

	Globals.prototype.initialize = function(displayHelper, levelRun)
	{	
		this.displayHelper = displayHelper;
		this.displayHelper.initialize();

		this.inputHelper = new InputHelper();
		this.inputHelper.initialize();

		this.levelRun = levelRun;
		this.levelRun.initialize();

		var millisecondsPerTimerTick = 50;

		this.timer = setInterval
		(
			"Globals.Instance.handleEventTimerTick();", 
			millisecondsPerTimerTick
		);
	}

	Globals.prototype.finalize = function()
	{
		clearInterval(this.timer);
	}
}

function InputHelper()
{}
{
	InputHelper.prototype.initialize = function()
	{
		this.keyCodesPressed = [];
		document.body.onkeydown = this.handleEventKeyDown.bind(this);
		document.body.onkeyup = this.handleEventKeyUp.bind(this);
	}

	InputHelper.prototype.handleEventKeyDown = function(event)
	{
		var keyCode = event.keyCode;
		this.keyCodesPressed[keyCode] = keyCode;
	}

	InputHelper.prototype.handleEventKeyUp = function(event)
	{
		var keyCode = event.keyCode;
		delete this.keyCodesPressed[keyCode];
	}

	InputHelper.prototype.updateForTimerTick = function()
	{
		// todo
	}
}

function Intelligence(defn)
{
	this.defn = defn;
	this.defn.initializeIntelligence(this);
}
{
	Intelligence.prototype.decideActionForMover = function(mover)
	{
		this.defn.decideActionForMover(this, mover);
	}
}

function IntelligenceDefnCharger()
{
	// do nothing
}
{
	IntelligenceDefnCharger.prototype.decideActionForMover = function(intelligence, mover)
	{
		mover.vel.x -= mover.defn.accelerationRun;
	}

	IntelligenceDefnCharger.prototype.initializeIntelligence = function(intelligence)
	{
		// do nothing
	}
}

function IntelligenceDefnNone()
{
	// do nothing
}
{
	IntelligenceDefnNone.prototype.decideActionForMover = function(intelligence, mover)
	{
		// do nothing
	}

	IntelligenceDefnNone.prototype.initializeIntelligence = function(intelligence)
	{
		// do nothing
	}
}

function IntelligenceAudioFixSpeed(heightScale) {
	this.heightScale = heightScale;
}
{
	IntelligenceAudioFixSpeed.prototype.initializeIntelligence = function(intelligence)
	{
		// do nothing
	}

	IntelligenceAudioFixSpeed.prototype.decideActionForMover = function(intelligence, mover) {
		var player = mover;
		player.vel.x = 10;
		let accel = player.defn.accelerationJump * window.peak * 2 || 0;
		player.vel.y -= accel;
		if (player.edgeBeingStoodOn != null) {
			//player.integrity = 0;
		}
		//player.pos.y = (1-window.peak)*this.heightScale - 100;
	}
}

function IntelligenceDefnHuman()
{
	// do nothing	
}
{
	IntelligenceDefnHuman.prototype.decideActionForMover = function(intelligence, mover)
	{
		var player = mover;

		var inputHelper = Globals.Instance.inputHelper;

		for (var keyCode in inputHelper.keyCodesPressed)
		{
			if 
			(
				keyCode == "32" // spacebar
				|| keyCode == "87" // w
			)
			{
				if (player.edgeBeingStoodOn != null)
				{
					player.edgeBeingStoodOn = null;
					player.vel.y -= player.defn.accelerationJump;
					delete inputHelper.keyCodesPressed[keyCode];
				}
			}
			else if (keyCode == "65") // a
			{
				var acceleration;

				if (player.edgeBeingStoodOn == null)
				{
					acceleration = player.defn.accelerationFly;
				}
				else
				{
					acceleration = player.defn.accelerationRun;
				}

				player.vel.x -= acceleration;
			}
			else if (keyCode == "68") // d
			{
				var acceleration;

				if (player.edgeBeingStoodOn == null)
				{
					acceleration = player.defn.accelerationFly;
				}
				else
				{
					acceleration = player.defn.accelerationRun;
				}

				player.vel.x += acceleration;
			}
		}	
	}

	IntelligenceDefnHuman.prototype.initializeIntelligence = function(intelligence)
	{
		// do nothing
	}
}

function Level
(
	name, 
	size, 
	accelerationDueToGravity, 
	velocityMin, 
	friction, 
	edges
)
{
	this.name = name;
	this.size = size;
	this.accelerationDueToGravity = accelerationDueToGravity;
	this.velocityMin = velocityMin;
	this.friction = friction;
	this.edges = edges;
}

function LevelRun(level, movers)
{
	this.level = level;
	this.movers = movers;
	this.bodyForPlayer = this.movers[0];

	this.bodies = [];
	this.bodies = this.bodies.concat(this.movers);

	this.moversToRemove = [];
}
{
	LevelRun.prototype.initialize = function()
	{
		this.cameraPos = new Coords(0, 0);
		this.cameraRange = this.level.size.clone().subtract
		(
			Globals.Instance.displayHelper.viewSize
		);

		this.collisionMap = new Map
		(
			new Coords(32, 1), // sizeInCells,
			this.level.size // sizeInPixels
		);
	
		var edges = this.level.edges;

		for (var i = 0; i < edges.length; i++)
		{
			var edge = edges[i];

			var bodyDefnForEdge = new BodyDefn
			(
				"Edge" + i,
				0, // accelerationRun
				0, // accelerationFly
				0, // velocityMaxRun
				0, // accelerationJump
				0, // velocityMaxFlying
				null, // ?
				new Face
				([
					edge, 
				])
			);

			var bodyForEdge = new Body
			(
				"Edge" + i,
				bodyDefnForEdge,
				new Coords(0, 0) // pos
			)

			this.bodies.push(bodyForEdge);

			var edgeBounds = edge.bounds;
			var cells = this.collisionMap.cellsInBoundsAddToList
			(
				edgeBounds, []
			);

			for (var c = 0; c < cells.length; c++)
			{
				var cell = cells[c];
				cell.bodiesPresent.push(bodyForEdge);
			}
		}

		var movers = this.movers;
		for (var i = 0; i < movers.length; i++)
		{
			var mover = movers[i];

			mover.face.overwriteWith(mover.defn.face).transform
			(
				new TransformTranslate(mover.pos)
			);
		}
	}

	LevelRun.prototype.updateForTimerTick = function()
	{
		this.updateForTimerTick_Intelligence();
		this.updateForTimerTick_Physics();
		this.updateForTimerTick_WinOrLose();
		Globals.Instance.displayHelper.drawLevelRun(this)
	}

	LevelRun.prototype.updateForTimerTick_Intelligence = function()
	{
		for (var m = 0; m < this.movers.length; m++)
		{
			var mover = this.movers[m];
			var intelligence = mover.intelligence;
			intelligence.decideActionForMover(mover);
		}
	}

	LevelRun.prototype.updateForTimerTick_Physics = function()
	{
		for (var m = 0; m < this.movers.length; m++)
		{
			var mover = this.movers[m];

			var collisionMapCells = mover.collisionMapCellsOccupied;
			for (var i = 0; i < collisionMapCells.length; i++)
			{
				var cell = collisionMapCells[i];
				var cellBodies = cell.bodiesPresent;

				cellBodies.splice
				(
					cellBodies.indexOf(mover),
					1
				);
			}

			collisionMapCells.length = 0;
			
			this.collisionMap.cellsInBoundsAddToList
			(
				mover.face.bounds, collisionMapCells
			);

			for (var i = 0; i < collisionMapCells.length; i++)
			{
				var cell = collisionMapCells[i];
				var cellBodies = cell.bodiesPresent;

				cellBodies.push(mover);
			}
		}

		for (var m = 0; m < this.movers.length; m++)
		{
			var mover = this.movers[m];
			var moverDefn = mover.defn;
			let velx = mover.vel.x;
			mover.vel.add
			(
				this.level.accelerationDueToGravity
			).trimToMagnitude
			(
				mover.defn.velocityMaxFlying
			);
			//Audio: fix velocity
			mover.vel.x = velx;

			var bodiesToCollideWith = [];

			this.updateForTimerTick_Physics_CollidableBodiesAddToList
			(
				mover, 
				bodiesToCollideWith
			);

			this.updateForTimerTick_Physics_BodiesCollideWithMover
			(
				mover,
				bodiesToCollideWith
			);

			if (mover.edgeBeingStoodOn != null)
			{
				var edge = mover.edgeBeingStoodOn;
				var edgeTangent = edge.direction;
	
				var accelerationAlongEdge = edgeTangent.clone().multiplyScalar
				(
					this.level.friction 
					* mover.vel.dotProduct(edgeTangent)
				);
	
				mover.vel.subtract
				(
					accelerationAlongEdge
				);
	
				if (mover.vel.magnitude() < this.level.velocityMin)
				{
					mover.vel.clear();
				}
			}

			mover.pos.add
			(
				mover.vel
			);

			mover.face.overwriteWith(mover.defn.face).transform
			(
				new TransformTranslate(mover.pos)
			);

			if (mover.pos.y >= this.level.size.y * 2)
			{
				this.moversToRemove.push(mover);
			}
		}

		for (var i = 0; i < this.moversToRemove.length; i++)
		{
			var mover = this.moversToRemove[i];
			this.movers.splice
			(
				this.movers.indexOf(mover),
				1
			);
		}

		this.moversToRemove.length = 0;
	}

	LevelRun.prototype.updateForTimerTick_Physics_CollidableBodiesAddToList = function
	(
		mover,
		bodiesToCollideWith
	)
	{	
		if (mover.integrity <= 0)
		{
			return;
		}

		var moverBounds = new Bounds
		(
			mover.pos,
			mover.pos.clone().add(mover.vel)
		);

		this.collisionMap.bodiesInBoundsAddToList
		(
			moverBounds, bodiesToCollideWith
		);
	}

	LevelRun.prototype.updateForTimerTick_Physics_BodiesCollideWithMover = function
	(
		mover, 
		bodiesToCollideWith
	)
	{
		mover.edgeBeingStoodOn = null;

		while (true)
		{
			var collisionsOfMoverWithOthers = [];

			for (var i = 0; i < bodiesToCollideWith.length; i++)
			{
				var other = bodiesToCollideWith[i];

				if (mover != other)
				{
					var collisionOfMoverWithOther = Collision.moverWithOther
					(
						mover, 
						other
					);
			
					if (collisionOfMoverWithOther != null)
					{
						collisionsOfMoverWithOthers.push
						(
							collisionOfMoverWithOther
						);
					}
				}
			}

			if (collisionsOfMoverWithOthers.length == 0)
			{
				break;
			}
			else
			{	
				var collisionOfMoverWithOther = Collision.closestInList
				(
					collisionsOfMoverWithOthers
				);
	
				mover.pos.overwriteWith
				(
					collisionOfMoverWithOther.pos
				);

				var bodyCollidedWith = collisionOfMoverWithOther.bodyCollidedWith;

				bodiesToCollideWith.splice
				(
					bodiesToCollideWith.indexOf(bodyCollidedWith),
					1
				);

				var bodyCollidedWithDefnName = bodyCollidedWith.defn.name;


				if (bodyCollidedWithDefnName.indexOf("Enemy") == 0)
				{
					if (mover == this.bodyForPlayer)
					{
						var player = mover;
						var enemy = bodyCollidedWith;

						if (enemy.integrity > 0)
						{
							if (player.pos.y >= enemy.pos.y)
							{
								player.integrity = 0;
								player.vel.x += 3 * enemy.vel.x / Math.abs(enemy.vel.x);
								player.intelligence.defn = new IntelligenceDefnNone();
							}
							else 
							{
								player.vel.y -= 3;
								enemy.integrity = 0;
								enemy.intelligence.defn = new IntelligenceDefnNone();
							}
						}
					}

				}
				else // if (bodyCollidedWithDefnName.indexOf("Edge") == 0)
				{
					var edgeCollidedWith = bodyCollidedWith.face.edges[0];

					if (mover.edgeBeingStoodOn == null)
					{
						mover.edgeBeingStoodOn = edgeCollidedWith;
					}
	
					if (mover.vel.magnitude() > 0)
					{
						var edgeNormal = edgeCollidedWith.right;
			
						var speedAlongEdgeNormal = mover.vel.dotProduct
						(
							edgeNormal
						);
							
						var velocityCancelledByEdge = edgeNormal.clone().multiplyScalar
						(
							speedAlongEdgeNormal
						);
	
						mover.vel.subtract
						(
							velocityCancelledByEdge
						);
					}
				}
			}
		}
	}	


	LevelRun.prototype.updateForTimerTick_WinOrLose = function()
	{
		if (this.bodyForPlayer.pos.y >= this.level.size.y * 2 || this.bodyForPlayer.integrity <=0 )
		{
			document.write("Game Over");
			Globals.Instance.finalize();
		}
		else if (this.bodyForPlayer.pos.x >= this.level.size.x)
		{
			document.write("You win!");
			Globals.Instance.finalize();
		}
	}
}

function Map(sizeInCells, sizeInPixels)
{
	this.sizeInCells = sizeInCells;
	this.sizeInPixels = sizeInPixels;

	this.sizeInCellsMinusOnes = this.sizeInCells.clone().subtract
	(
		new Coords(1, 1)
	);

	this.cellSizeInPixels = this.sizeInPixels.clone().divide
	(
		this.sizeInCells
	);

	var numberOfCells = this.sizeInCells.x * this.sizeInCells.y;
	this.cells = [];

	for (var i = 0; i < numberOfCells; i++)
	{
		var cell = new MapCell();
		this.cells.push(cell);
	}
}
{
	Map.prototype.cellAtPos = function(cellPos)
	{
		return this.cells[this.indexOfCellAtPos(cellPos)];
	}

	Map.prototype.bodiesInBoundsAddToList = function(boundsInPixels, listToAddTo)
	{
		var boundsMinInCells = boundsInPixels.min.clone().divide
		(
			this.cellSizeInPixels
		).floor().trimToRange
		(
			this.sizeInCellsMinusOnes
		);

		var boundsMaxInCells = boundsInPixels.max.clone().divide
		(
			this.cellSizeInPixels
		).ceiling().trimToRange
		(
			this.sizeInCellsMinusOnes
		);

		var cellPos = new Coords(0, 0);

		for (var y = boundsMinInCells.y; y <= boundsMaxInCells.y; y++)
		{
			cellPos.y = y;

			for (var x = boundsMinInCells.x; x <= boundsMaxInCells.x; x++)
			{
				cellPos.x = x;

				var cell = this.cellAtPos(cellPos);
				var bodiesInCell = cell.bodiesPresent;

				for (var b = 0; b < bodiesInCell.length; b++)
				{
					var body = bodiesInCell[b];
					if (listToAddTo.indexOf(body) == -1)
					{
						listToAddTo.push(body);
					}
				}
			}
		}

		return listToAddTo;
	}

	Map.prototype.cellsInBoundsAddToList = function(boundsInPixels, listToAddTo)
	{
		var boundsMinInCells = boundsInPixels.min.clone().divide
		(
			this.cellSizeInPixels
		).floor().trimToRange
		(
			this.sizeInCellsMinusOnes
		);

		var boundsMaxInCells = boundsInPixels.max.clone().divide
		(
			this.cellSizeInPixels
		).ceiling().trimToRange
		(
			this.sizeInCellsMinusOnes
		);

		var cellPos = new Coords(0, 0);

		for (var y = boundsMinInCells.y; y <= boundsMaxInCells.y; y++)
		{
			cellPos.y = y;

			for (var x = boundsMinInCells.x; x <= boundsMaxInCells.x; x++)
			{
				cellPos.x = x;

				var cell = this.cellAtPos(cellPos);

				listToAddTo.push(cell);
			}
		}

		return listToAddTo;
	}

	Map.prototype.indexOfCellAtPos = function(cellPos)
	{
		return cellPos.y * this.sizeInCells.x + cellPos.x;
	}
}

function MapCell()
{
	this.bodiesPresent = [];
}

function Transform()
{
	// static class
}
{
	Transform.applyTransformToCoordsMany = function(transformToApply, coordsSetToApplyTo)
	{
		for (var i = 0; i < coordsSetToApplyTo.length; i++)
		{
			var coords = coordsSetToApplyTo[i];
			transformToApply.applyToCoords(coords);
		}
	}
}

function TransformTranslate(displacement)
{
	this.displacement = displacement;
}
{
	TransformTranslate.prototype.applyToCoords = function(coordsToApplyTo)
	{
		coordsToApplyTo.add(this.displacement);
	}
}

// run

main(document.getElementById("gameView"));
