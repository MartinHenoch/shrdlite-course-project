///<reference path="Interpreter.ts"/>
///<reference path="./Parser.ts"/>

/**
Takes a parse of the question type, i.e. parse.command === "Q: _____ "
Implemented questions:
  Where is __(entity)__ ? || Where are __(entity)__?
  How many __(plural object)__ are there?
  ....
  @param parse The question to answer
  @returns a string which gets printed to the User
*/
function interpretQuestion( parse : Parser.Command, state : WorldState) : string{
  if(parse.command === "Q_where_is") {
    var messageStr : string = '';

    // ATTENTION! here parse.entity.object is an object, not it the case of "how many".
    var searchObject : Parser.Object = parse.entity.object;
    console.log("Before 'findObject'");
    var foundObjects : string[] = Interpreter.findObject(searchObject, state)
    console.log("After 'findObject'");

    if (foundObjects.length === 0) {
      return "There is no such object!";
    }

    // If several matching objects are found, assume it is the first one.
    var foundObject : string = foundObjects[0];
    var coordinates : number[] = Interpreter.getCoords(foundObject, state);
    var x : number = coordinates[0];
    var y : number = coordinates[1];

    messageStr += "The object is ";
    for (var j = y-1; j > -1; j--) {
      var strKeyObject : string = state.stacks[x][j];
      var object : ObjectDefinition = state.objects[strKeyObject];
      var objectDescriptionStr = '';

      if (object.size !== null) {
        objectDescriptionStr += object.size + " ";
      }
      if (object.color !== null) {
        objectDescriptionStr += object.color + " ";
      }
      objectDescriptionStr += object.form;
      messageStr += "ontop of a " + objectDescriptionStr + "\n";
    }
    messageStr += "ontop of the floor";
    return messageStr;
  }
  if(parse.command === "Q_how_many") {
    // ATTENTION! parse.entity is called "entity" but it IS an object!
    var searchObject : Parser.Object = parse.entity;

    var foundObjects : string[] = Interpreter.findObject(searchObject, state);
    var numberOfObjects : number = foundObjects.length;
    var numString : string = numberOfObjects.toString();
    return "There are " + numString + generateObjectDescription(searchObject) + ".";
  }
  // If the command is of the wrong format somehow..
  return "BAD RETURN STRING from 'interpretQuestion'"
}

function generateObjectDescription(object : Parser.Object) {
  return JSON.stringify(object);
//  return "<object description>";

}
