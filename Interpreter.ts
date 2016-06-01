///<reference path="World.ts"/>
///<reference path="Parser.ts"/>

/**
* Interpreter module
*
* The goal of the Interpreter module is to interpret a sentence
* written by the user in the context of the current world state. In
* particular, it must figure out which objects in the world,
* i.e. which elements in the `objects` field of WorldState, correspond
* to the ones referred to in the sentence.
*
* Moreover, it has to derive what the intended goal state is and
* return it as a logical formula described in terms of literals, where
* each literal represents a relation among objects that should
* hold. For example, assuming a world state where "a" is a ball and
* "b" is a table, the command "put the ball on the table" can be
* interpreted as the literal ontop(a,b). More complex goals can be
* written using conjunctions and disjunctions of these literals.
*
* In general, the module can take a list of possible parses and return
* a list of possible interpretations, but the code to handle this has
* already been written for you. The only part you need to implement is
* the core interpretation function, namely `interpretCommand`, which produces a
* single interpretation for a single command.
*/
module Interpreter {

  //////////////////////////////////////////////////////////////////////
  // exported functions, classes and interfaces/types

  /**
  Top-level function for the Interpreter. It calls `interpretCommand` for each possible parse of the command. No need to change this one.
  * @param parses List of parses produced by the Parser.
  * @param currentState The current state of the world.
  * @returns Augments ParseResult with a list of interpretations. Each interpretation is represented by a list of Literals.
  */

  //TODO: remove world from parameters if it doesn't work:
  export function interpret(parses : Parser.ParseResult[], currentState : WorldState, world : World) : InterpretationResult[] {
    var errors : Error[] = [];
    var interpretations : InterpretationResult[] = [];
    parses.forEach((parseresult) => {
      try {
        var result : InterpretationResult = <InterpretationResult>parseresult;
        result.interpretation = interpretCommand(result.parse, currentState, world);
        interpretations.push(result);
      } catch(err) {
        errors.push(err);
      }
    });
    if (interpretations.length) {
      return interpretations;
    } else {
      // only throw the first error found
      throw errors[0];
    }
  }

  export interface InterpretationResult extends Parser.ParseResult {
    interpretation : DNFFormula;
  }

  export type DNFFormula = Conjunction[];
  type Conjunction = Literal[];

  /**
  * A Literal represents a relation that is intended to
  * hold among some objects.
  */
  export interface Literal {
    /** Whether this literal asserts the relation should hold
    * (true polarity) or not (false polarity). For example, we
    * can specify that "a" should *not* be on top of "b" by the
    * literal {polarity: false, relation: "ontop", args:
    * ["a","b"]}.
    */
    polarity : boolean;
    /** The name of the relation in question. */
    relation : string;
    /** The arguments to the relation. Usually these will be either objects
    * or special strings such as "floor" or "floor-N" (where N is a column) */
    args : string[];
  }

  export function stringify(result : InterpretationResult) : string {
    return result.interpretation.map((literals) => {
      return literals.map((lit) => stringifyLiteral(lit)).join(" & ");
      // return literals.map(stringifyLiteral).join(" & ");
    }).join(" | ");
  }

  export function stringifyLiteral(lit : Literal) : string {
    return (lit.polarity ? "" : "-") + lit.relation + "(" + lit.args.join(",") + ")";
  }

  function stringifyConjunction(conjunction : Conjunction) : string {
    var arrLiteralStrings : string[] = [];
    for (var i = 0; i < conjunction.length; i++) {
      arrLiteralStrings.push(stringifyLiteral(conjunction[i]));
    }
    return arrLiteralStrings.sort().join('');
  }


  /**
  * The core interpretation function. Returns interpretations of a parse. Throws "No valid interpretation" if that is the case.
  * @param cmd The actual command. Note that it is *not* a string, but rather an object of type `Command` (as it has been parsed by the parser).
  * @param state The current state of the world. Useful to look up objects in the world.
  * @returns A list of list of Literal, representing a formula in disjunctive normal form (disjunction of conjunctions). See the dummy interpetation returned in the code for an example, which means ontop(a,floor) AND holding(b).
  */

  //TODO: Remove world from parameters if things doesn't work out.
  function interpretCommand(cmd : Parser.Command, state : WorldState, world : World) : DNFFormula {



    console.log("world");
    console.log(world);
    world.printSystemOutput("Nu är vi inne i interpretCommand");
    // world.readUserInput("säg nåt då");

    try {console.log("Nu är vi i interpretCommand");
      var userInput : string = prompt('Skriv någon input');
      // console.log("userInput: " + userInput);
      world.printSystemOutput("userInput:" + userInput);
    } catch(e) {
      console.log(e)
    }

    var keysPossibleObjects : string[] = ['a', 'b', 'c'];
    var selectedKey : string = letUserSelectObject(keysPossibleObjects, state, world);

    world.printSystemOutput("selectedKey:" + selectedKey);

//    function letUserSelectObject(keysPossibleObjects : string[], state : WorldState, world: World) : string {


    // console.log(cmd);
    // console.log(state.stacks);
    // console.log(state.objects);

    var interpretation : DNFFormula = [];
    // a count of the number of interpretations we've added
    //TODO: change back interpCount
    // var interpCount : number = 0;
    //if it is a [take entity] command:
    if(cmd.command === "take"){
      //find all entities matching the given discription
      var possibleEntities : string[] = findEntity(cmd.entity, state, world);
      //add them to the interpetation list (with the exception of floor which cannot be grasped)
      possibleEntities.forEach((possibleEnt) => {
        if(possibleEnt.substring(0,6) !=="floor-"){
          //TODO: change back to interpCount
          var conjunction : Conjunction = [];
          var literal : Literal = {polarity : true, relation: "holding", args: [possibleEnt] };
          conjunction.push(literal);
          interpretation.push(conjunction);
          // interpretation[interpCount] = [ {polarity : true, relation : "holding", args: [possibleEnt] }]
          // interpCount++
        }
      })
    } else {
      if(cmd.command === "stack"){
        //all the entities to stack
        var matchingEntities = findEntity(cmd.entity,state,world)
        //all the different orders they can be stacked in
        var permutations : string[][] = getPermutations(matchingEntities)
        //if the physic laws allow for the objects to be stacked in a certain permutation it is
        //added as an interpretation
        permutations.forEach((perm) =>{
          var stackOrder : Literal[] = []
          //flag if a physic law is broken
          var flag : boolean = false
          for(var i=0;i<perm.length-1;i++){
            if(checkPhysicLaws(state.objects[perm[i]],state.objects[perm[i+1]],"ontop")){
              stackOrder.push({polarity : true, relation : "ontop", args: [perm[i],perm[i+1]]})
            }else{
              if( checkPhysicLaws(state.objects[perm[i]],state.objects[perm[i+1]],"inside")){
                stackOrder.push({polarity : true, relation : "inside", args: [perm[i],perm[i+1]]})
              }else{
                flag = true
                break
              }
            }
          }
          if(!flag && stackOrder.length>0){
            //TODO change back to interpCount
            interpretation.push(stackOrder);
            // interpretation[interpCount] = stackOrder
            // interpCount++
          }
        })
      }
      if(cmd.command == "move") {

        // if it is a [move/put/drop 'it' to a location] command (robot already holding an object)
        if(cmd.entity == null){

          //find all entities the location relation is in regards to
          var possibleEntities : string[] = findEntity(cmd.location.entity,state,world);

          possibleEntities.forEach((possibleEnt) => {
            var objectA = state.objects[state.holding]
            if(possibleEnt.substring(0,6) === "floor-"){
              objectB = {size : null, color : null, form : "floor"}
            }
            else{
              var objectB = state.objects[possibleEnt]
            }
            // if the interpretation does not break any physic laws it gets added to the interpretation list
            if(checkPhysicLaws(objectA,objectB,cmd.location.relation)){
              var conjunction : Conjunction = [];
              var literal : Literal = {polarity : true, relation : cmd.location.relation, args: [state.holding,possibleEnt]};
              conjunction.push(literal);
              interpretation.push(conjunction);
              // TODO: change back to interpCount (or remove commented code...)
              // interpretation[interpCount] = [{polarity : true, relation : cmd.location.relation, args: [state.holding,possibleEnt]}]
              // interpCount++;
            }
          })
        }
        // else it is a [move/put/drop 'an entity' to a location] command
        else {

          var keysLiftObjects : string[] = findObject(cmd.entity.object, state, world);
          var keysDestinationObjects : string[] = findObject(cmd.location.entity.object,state, world);

          var carryQuantifier : string = cmd.entity.quantifier;
          var destinationQuantifier : string = cmd.location.entity.quantifier;

          // How many pairs of pairs of [carryObject, destinationObject] that should be picked out.
          var sizeOfPermutation : number;

          var quantifiers: string = [carryQuantifier, destinationQuantifier].join(" ");

          switch(quantifiers) {
            case "any any":
              sizeOfPermutation = 1;
              break;
            case "any the":
              sizeOfPermutation = 1;
              break;
            case "any all":
              sizeOfPermutation = keysDestinationObjects.length;
              break;
            case "the any":
              sizeOfPermutation = 1;
              break;
            case "the the":
              sizeOfPermutation = 1;
              break;
            case "the all":
              throw new Error("Illegal can't put something in multiple places");
            case "all any":
              sizeOfPermutation = keysLiftObjects.length;
              break;
            case "all the":
              //special case for the floor:
              if (cmd.location.entity.object.form === "floor") {
                sizeOfPermutation = keysLiftObjects.length;
              } else {
                throw new Error("Too silly, what are you even doing..");
              }
              break;
            default:
              throw new Error("We shouldn't get here...");
          }

          var relation : string = cmd.location.relation;
          var possibleSolutions : Solution[] = generateSolutions(keysLiftObjects, keysDestinationObjects, sizeOfPermutation, relation);

          // Check which possible solutions are feasable according to the physical laws.
          var feasableSolutions : Solution[] = findFeasableSolutions(possibleSolutions, state);


          // Convert format from 'string[][][]' to 'Literal'
          for (var i = 0; i < feasableSolutions.length; i++) {
            //console.log("inne i loop feasable");
            var solution : Solution = feasableSolutions[i];
            var conjunction : Conjunction = [];
            for (var j = 0; j < solution.length; j++) {
              var action : Action = solution[j];
              var strKeyA : string = action[0];
              var strKeyB : string = action[1];
              var relation : string = action[2];
              var literal : Literal = {polarity: true, relation: relation, args: [strKeyA, strKeyB]};
              conjunction.push(literal);
            }
            interpretation.push(conjunction);
          }
          //console.log("interpretation");
          //visDNF(interpretation);
        }


        // //find all entities matching description to be moved: put THIS_ENTITY in relation to something
        // var possibleEntities : string[] = findEntity(cmd.entity,state);
        //
        // //console.log("possibleEntities");
        // //console.log(possibleEntities);
        //
        // possibleEntities.forEach((possibleEnt,index1) => {
        //   //cannnot move the floor
        //   if(possibleEnt.substring(0,6) !== "floor-" ){
        //     //find all entities matching the description of which the location is in relation to: put something in relation to THIS_ENTITY
        //
        //     var possibleLocationEntities : string[] = findEntity(cmd.location.entity,state);
        //     possibleLocationEntities.forEach((possibleLocationEnt) => {
        //       //check physic laws
        //       var objectA : ObjectDefinition = state.objects[possibleEnt]
        //       var objectB : ObjectDefinition;
        //       if(possibleLocationEnt.substring(0,6) === "floor-"){
        //         objectB = {size: null, color: null, form : "floor"}
        //       }
        //       else{
        //         objectB = state.objects[possibleLocationEnt]
        //       }
        //       if(checkPhysicLaws(objectA,objectB,cmd.location.relation)){
        //         interpretation[interpCount] = [{polarity : true, relation : cmd.location.relation, args: [possibleEnt,possibleLocationEnt]}]
        //         interpCount++;
        //       }
        //     })
        //   }
        //
        // })
      }
    }
    //throw error if no valid interpretation was found
    //TODO: Ska vi använda oss av interpCount??
    // if(interpCount === 0){
    //   throw "No valid interpretation"
    // }
    // if (interpretation.length === 0) {
    //   throw "No valid interpretation";
    // }


    // // convert interpretation to single floor slot to work with test cases:
    // var convertedInterpretation : DNFFormula = convertInterpretationToSingleFloorSlot(interpretation);
    // return convertedInterpretation;

    return interpretation;

  }

  // Convert interpretation to single floor slot to work with the test cases.
  function convertInterpretationToSingleFloorSlot(interpretation : DNFFormula) : DNFFormula {
    var newDNF : DNFFormula = [];
    for (var i = 0; i < interpretation.length; i++) {
      var conjunction : Conjunction = interpretation[i];
      var newConjunction : Conjunction = [];
      for (var j = 0; j < conjunction.length; j++) {
        var literal : Literal = conjunction[j];
        var newLiteral : Literal = {polarity : true, relation : '', args : []};

        newLiteral.polarity = literal.polarity;
        newLiteral.relation = literal.relation;
        for (var k = 0; k < literal.args.length; k++) {
          if (literal.args[k].indexOf("floor") > -1) {
            newLiteral.args[k] = "floor";
          } else {
            newLiteral.args[k] = literal.args[k];
          }
        }
        newConjunction.push(newLiteral);
      }
      newDNF.push(newConjunction);
    }

    // Remove duplicate literals and conjunctions;
    var simplifiedDNF : DNFFormula = simplifyDNFFormula(newDNF);
    return simplifiedDNF;
  }

  function letUserSelectObject(keysPossibleObjects : string[], state : WorldState, world: World) : string {

    var promptStr : string = '';
    var obj : ObjectDefinition;
    for (var i = 0; i < keysPossibleObjects.length; i++) {
      obj = state.objects[keysPossibleObjects[i]];
      var objStr = i + ": " + obj.size + " " + obj.color + " " + obj.form + ".";
      promptStr = promptStr + "\n" + objStr;
    }

    var messageStr : string = "Which object do you mean? Type the number of the object you want to select.";

    promptStr = promptStr + "\n" + messageStr;
    var selectedKey : string = prompt(promptStr)

    return selectedKey;

  }


  // Remove duplicate conjunctions, and remove duplicate literals in every conjunction,
  function simplifyDNFFormula(dnf : DNFFormula) : DNFFormula {

    // Remove all duplicate literals in each conjunction:
    var newDNF : DNFFormula = [];
    for (var iConjunction = 0; iConjunction < dnf.length; iConjunction++) {
      var conjunction : Conjunction = dnf[iConjunction];
      var newConjunction : Conjunction = [];
      for (var jLiteral = 0; jLiteral < conjunction.length; jLiteral++) {
        var isLiteralUnique : boolean = true;
        for (var kLiteral = 0; kLiteral < newConjunction.length; kLiteral++) {
          var isSame : boolean = (JSON.stringify(conjunction[jLiteral]) === JSON.stringify(newConjunction[kLiteral]))
          isLiteralUnique = (isLiteralUnique && !isSame)
        }
        if (isLiteralUnique) {
          newConjunction.push(conjunction[jLiteral])
        }
      }
      newDNF.push(newConjunction);
    }

    // Remove all duplicate conjunctions:
    var simplifiedDNF : DNFFormula = [];
    for (var iConjunction = 0; iConjunction < newDNF.length; iConjunction++) {
      var conjunction : Conjunction = newDNF[iConjunction];
      var isConjunctionUnique : boolean = true;
      for (var jConjunction = 0; jConjunction < simplifiedDNF.length; jConjunction++) {
        var isSame : boolean = (stringifyConjunction(conjunction) === stringifyConjunction(simplifiedDNF[jConjunction]))
        isConjunctionUnique = isConjunctionUnique && !isSame;
      }
      if (isConjunctionUnique) {
        simplifiedDNF.push(newDNF[iConjunction])
      }
    }
    return simplifiedDNF;
  }


  // Declare types for describing solutions. An action is the two strKeys of the
  // objects involved in an action, and the relation between them. Eg. ['a', 'floor-1', ontop]
  type Action = string[];
  type Solution = Action[];


  function visDNF(interpretation : DNFFormula) : void {

    var DNF :string[][] = [];
    for (var iConjunction = 0; iConjunction < interpretation.length; iConjunction++) {
      var con : Conjunction = interpretation[iConjunction];
      var conjunctionString : string[] = [];
      for (var jLiteral = 0; jLiteral < con.length; jLiteral++) {
        var lit : Literal = con[jLiteral];
        var literalString : string = JSON.stringify(lit);
        conjunctionString.push(literalString);
      }
      DNF.push(conjunctionString);
    }
    console.log("DNF:")
    console.log(DNF);

  }



  function generateSolutions(aList: string[], bList: string[], size: number, relation: string) : Solution[] {

    var solutionsList : Solution[] = [];

    var aPermutations : string[][] = generatePermutations(aList, size);
    var bPermutations : string [][] = generatePermutations(bList, size);

    for (var aPerm of aPermutations) {
      for (var bPerm of bPermutations) {
        var solution : Solution = [];
        for (var i = 0; i<size; i++) {

          var action : Action = [aPerm[i].toString(), bPerm[i].toString(), relation];
          solution.push(action);
        }
        solutionsList.push(solution);
      }
    }
    return solutionsList;
  }


  function generatePermutations(list: string[], sizeOfPermutation: number) {
    var permutationsList: string[][] = [];
    genPerm([], sizeOfPermutation, permutationsList, list);
    return permutationsList;
  }

  function genPerm(currentList : string[], numLeftToPick: number, permutationsList: string[][], listLeftToPick: string[]) {
    if (numLeftToPick === 0) {
      permutationsList.push(currentList);
    } else {
      for (var element of listLeftToPick) {
        var newList = currentList.slice();
        var newListLeftToPick = listLeftToPick.slice();
        newList.push(element);
        var index = newListLeftToPick.indexOf(element);
        newListLeftToPick.splice(index,1);
        genPerm(newList, numLeftToPick -1, permutationsList, newListLeftToPick);
      }
    }
  }


  function findFeasableSolutions(possibleSolutionsList : Solution[], state : WorldState) : Solution[] {

    var feasableSolutions : Solution[] = [];

    for (var i = 0; i < possibleSolutionsList.length; i++) {
      var solution : Solution = possibleSolutionsList[i];
      var isFeasableSolution: boolean = true

      for (var j = 0; j < solution.length; j++) {
        var action : Action = solution[j];
        var strKeyA: string = action[0];
        var strKeyB: string = action[1];
        var relation: string = action[2];
        var objectA : ObjectDefinition;
        var objectB : ObjectDefinition;

        //Special case for floor:
        var isAFloor : boolean = (strKeyA.indexOf("floor") > -1);
        var isBFloor : boolean = (strKeyB.indexOf("floor") > -1);
        if (isAFloor) {
          objectA = {size: null, color: null, form: "floor"};
        } else {
          objectA = state.objects[strKeyA];
        }

        if (isBFloor) {
          objectB = {size: null, color: null, form: "floor"};
        } else {
          objectB = state.objects[strKeyB];
        }

        if (objectA === undefined || objectB === undefined) {
          //console.log("objectA: " + objectA + "\nobjectB: " + objectB);
          //console.log("strKeyA: " + strKeyA + "\nstrKeyB: " + strKeyB);
          //console.log(state.stacks);
          //console.log(state.objects);
        }

        var isFeasableAction: boolean = checkPhysicLaws(objectA, objectB, relation);
        isFeasableSolution = isFeasableSolution && isFeasableAction;
      }
      if (isFeasableSolution) {
        feasableSolutions.push(solution);
      }
    }
    return feasableSolutions;
  }


  //returns true if 'a relation b' fullfills the physic laws of the world
  export function checkPhysicLaws( a : ObjectDefinition, b : ObjectDefinition, relation : string) : boolean {

    if (a === undefined || b === undefined) {
      console.log("Wrong input to checkPhysicLaws")
      throw new Error("Wrong input to checkPhysicLaws")
    }

    //cannot be in relation to itself
    if(a === b){
      return false
    }

    //can only be inside a box
    if(relation === "inside" && b.form !== "box"){
      return false
    }

    //cannot be ontop of a box
    if(relation === "ontop" && b.form === "box"){
      return false
    }

    // Balls must be in boxes or on the floor
    if(a.form === "ball" && relation === "ontop" && b.form !== "floor" ){
      return false
    }

    // Balls cannot support anything.
    if((a.form === "ball" && relation === "under") || b.form === "ball" && (relation ==="ontop" || relation === "above")){
      return false
    }
    // Small objects cannot support large objects.
    if((a.size === "small" && b.size === "large" && relation === "under") || (b.size === "small" && a.size==="large" && (relation ==="ontop" || relation === "inside" || relation ==="above"))){
      return false
    }
    // Boxes cannot contain pyramids, planks or boxes of the same size.
    if(relation === "inside" && b.form ==="box" && a.size === b.size && (a.form === "pyramid" || a.form === "plank" || a.form === "box")){
      return false
    }

    // Small boxes cannot be supported by small bricks or pyramids.
    if(relation === "ontop" && a.form === "box" && a.size === "small" && (b.form==="pyramid" || (b.form ==="brick" && b.size ==="small"))){
      return false
    }
    // Large boxes cannot be supported by large pyramids.
    if(relation === "ontop" && a.form==="box" && b.form === "pyramid" && a.size === "large" && b.size === "large"){
      return false
    }

    return true
  }

  /**
  * Finds the possible object-key-strings corresponding to an arbitrary entity
  * @param ent The entity being searched for
  * @param state The current world state
  * @returns A list of the string keys correspoding to objects in the world matching given entity description
  */
  function findEntity(ent : Parser.Entity , state : WorldState, world : World) : string[] {
    // Qunatifier assumed to be "the/any". Support for "all" extended later

    var identifiedObjects : string[] = findObject(ent.object, state, world);

    if (identifiedObjects.length === 0) {
      throw new Error("No objects found!");
    }

    switch (ent.quantifier) {
      case "any":
        return identifiedObjects;
      case "the":
        // Special Case for the floor:
        if (ent.object.form === "floor") {
          return identifiedObjects;
        } else {
          if (identifiedObjects.length === 1) {
            return identifiedObjects;
          }
          // If more than one object was found:
          else {
            var selectedKey : string = letUserSelectObject(identifiedObjects, state, world);
            // console.log("More than one possible object was found, when quantifier 'the' was used.")
            // throw new Error("More than one possible object was found, when quantifier 'the' was used.");
            identifiedObjects = [selectedKey];
            return identifiedObjects;
          }
        }
      case "all":
        return identifiedObjects;
      default:
        throw new Error("Invalid quantifier: " + ent.quantifier);
    }
  }
  /**
  * Finds the possible object-key-strings corresponding to an arbitrary object
  * @param obj The object being searched for
  * @param state The current world state
  * @returns A list of the string keys correspoding to objects in the world matching given object description
  */
  function findObject(obj : Parser.Object , state : WorldState, world : World) : string[] {

    //stores string keys to all found objects matching what we are looking for. Returned by the function
    var foundObjects : string[] = [];
    // string keys to all world objects
    var objects : string[] = Array.prototype.concat.apply([], state.stacks);
    // add the grasped object if it exists
    if(state.holding != null){
      objects.push(state.holding)
    }
    //If we are looking for a (color,form,size) object
    if(obj.location == null){
      //special case for floor
      if(obj.size == null && obj.color == null && obj.form == "floor"){
        for(var i =0;i<state.stacks.length;i++){
          //Each floor position is a separate entity: floor-0,...,floor-N
          foundObjects.push("floor-"+i)
        }
        return foundObjects
      }
      //look through all world objects and add to the found-list if {size,color,form} match
      objects.forEach((eachWorldObj) => {
        if(obj.size == null || obj.size === state.objects[eachWorldObj].size){
          if(obj.color == null || obj.color === state.objects[eachWorldObj].color){
            if(obj.form === state.objects[eachWorldObj].form || obj.form === "anyform"){
              foundObjects.push(eachWorldObj)
            }
          }
        }
      })
      return foundObjects
    }
    // Then we are searching for a (object,location) based object:
    // loop through all the possible objects which are to fullfill the location relation
    var objList : string[] = findObject( obj.object, state, world)
    for(var i = 0 ; i < objList.length ; i++){
      var coordinates : number[] = getCoords(objList[i],state);
      //if location relation is fullfilled add object to the found-list
      if(checkLocation(coordinates,obj.location,state,world)){
        foundObjects.push(objList[i])
      }
    }
    return foundObjects
  }
  /** Checks if CoordinatesA fullfills LOCATION requirements in relation to
  * some entity B (the location.entity, which could correspond to multiple objects).
  * @returns true if requirements are fullfilled
  */


  function checkLocation(coordinatesA : number[], location : Parser.Location, state : WorldState, world : World) : boolean {

    var bList : string[] = findEntity(location.entity, state, world);

    var isRelationTrue : boolean;
    var relation : string = location.relation;

    var index :number = bList.length;

    var isRelationTrueForCurrent : boolean = checkRelation(coordinatesA, bList[index - 1], relation, state);

    switch (location.entity.quantifier) {
      case "any":
        var isRelationTrueForAny : boolean = isRelationTrueForCurrent;
        for (var i = 0; i < bList.length; i++) {
          isRelationTrueForCurrent = checkRelation(coordinatesA, bList[i], relation, state);
          isRelationTrueForAny = isRelationTrueForAny || isRelationTrueForCurrent
        }
        return isRelationTrueForAny;
      case "all":
        var isRelationTrueForAll : boolean = isRelationTrueForCurrent;
        for (var i = 0; i < bList.length; i++) {
          isRelationTrueForCurrent = checkRelation(coordinatesA, bList[i], relation, state);
          isRelationTrueForAll = isRelationTrueForAll && isRelationTrueForCurrent;
        }
        return isRelationTrueForAll;
      case "the":
        //special case for the floor:
        var isFloor : boolean = (bList[0].indexOf("floor") > -1);
        if (isFloor) {
          var isRelationTrueForAnyFloorSlot : boolean = isRelationTrueForCurrent;
          for (var i = 0; i < bList.length; i++) {
            isRelationTrueForCurrent = checkRelation(coordinatesA, bList[i], relation, state);
            isRelationTrueForAnyFloorSlot = isRelationTrueForAnyFloorSlot || isRelationTrueForCurrent;
          }
          return isRelationTrueForAnyFloorSlot;
        }
        return (isRelationTrueForCurrent);
      default:
        throw new Error("Unrecognized quantifier: " + location.entity.quantifier);
    }
  }

  function checkRelation(coordinatesA : number[], strKeyB : string, relation : string, state : WorldState) : boolean {
    if (strKeyB.indexOf("floor") > -1) {
      var coordinatesFloor : number[] = getCoords(strKeyB, state);
      switch(relation) {
        case "above":
          return (coordinatesA[0] === coordinatesFloor[0] && coordinatesA[1] > coordinatesFloor[1]);
        case "ontop":
          return (coordinatesA[0] === coordinatesFloor[0] && coordinatesA[1] === coordinatesFloor[1] + 1);
        default:
          return false;
      }
    } else {

      var objectB = state.objects[strKeyB];
      var coordinatesB : number[] = getCoords(strKeyB,state)

      switch(relation) {
        case "leftof":
          return (coordinatesA[0] < coordinatesB[0]);
        case "rightof":
          return (coordinatesA[0] > coordinatesB[0]);
        case "ontop":
          return (objectB.form !== "box" &&
          coordinatesA[0] === coordinatesB[0] &&
          coordinatesA[1] === coordinatesB[1]+1);
        case "inside":
          return (objectB.form === "box" &&
          coordinatesA[0] === coordinatesB[0] &&
          coordinatesA[1] === coordinatesB[1]+1);
        case "under":
          return (coordinatesA[0] === coordinatesB[0] &&
          coordinatesA[1] < coordinatesB[1]);
        case "above":
          return (coordinatesA[0] === coordinatesB[0] &&
            coordinatesA[1] > coordinatesB[1]);
        case "beside":
          return (Math.abs(coordinatesA[0] - coordinatesB[0]) === 1);
        default:
          throw new Error("Wrong relation");
      }
    }
  }


  //
  // function checkLocation(coordinatesA : number[],location : Parser.Location, state : WorldState) : boolean{
  //   var bList : string[] = findEntity( location.entity , state )
  //   //if the location.relation is fullfilled with respect to ANY other object
  //   //matching the entity description: return true
  //   for(var j = 0 ; j < bList.length ; j++){
  //     // special case: in relation to floor
  //     if(bList[j].substring(0,6)==="floor-"){
  //       if(location.relation === "above"  && coordinatesA[0] === Number(bList[j].substring(6,7))){
  //         return true
  //       }
  //       if(location.relation === "ontop" && coordinatesA[0] === Number(bList[j].substring(6,7))){
  //         if(coordinatesA[1] === 0){
  //           return true
  //         }
  //       }
  //       continue
  //     }
  //     var coordinatesB : number[] = getCoords(bList[j],state)
  //     if(location.relation === "leftof"){
  //       if(coordinatesA[0]<coordinatesB[0]){
  //         return true
  //       }
  //     }
  //     else {if(location.relation === "rightof"){
  //       if(coordinatesA[0]>coordinatesB[0]){
  //         return true
  //       }
  //     }
  //     else {if(location.relation === "ontop"){
  //       if(state.objects[bList[j]].form !== "box"){
  //         if(coordinatesA[0]===coordinatesB[0] && coordinatesA[1] === coordinatesB[1]+1){
  //
  //           return true
  //         }
  //       }
  //     }
  //     else {if(location.relation === "inside"){
  //       if(state.objects[bList[j]].form === "box"){
  //         if(coordinatesA[0]===coordinatesB[0] && coordinatesA[1] === coordinatesB[1]+1){
  //           return true
  //         }
  //       }
  //     }
  //     else {if(location.relation === "under"){
  //       if(coordinatesA[0]===coordinatesB[0] && coordinatesA[1]<coordinatesB[1]){
  //         return true
  //       }
  //     }
  //     else {if(location.relation === "beside"){
  //       if(Math.abs(coordinatesA[0]-coordinatesB[0])===1){
  //         return true
  //       }
  //     }
  //     else {if(location.relation === "above"){
  //       if(coordinatesA[0]===coordinatesB[0] && coordinatesA[1]>coordinatesB[1]){
  //         return true
  //       }
  //     }}}}}}}
  //   }
  //   return false
  // }



  /** Finds coordinates of an object given a key. Assending coordinate system to the right and upwards
  * @param strKey string key of object being searched for
  * @param state current world state
  * @returns [x,y] coordinates
  */
  export function getCoords(strKey : string, state : WorldState) : number[] {
    var x : number;
    var y : number;
    if(strKey.substring(0,6) === "floor-"){
      x = Number(strKey.substr(6));
      y = -1;
    }else{
      state.stacks.forEach((stack,index) => {
        if(stack.indexOf(strKey) !=-1){
          x = index;
          y = stack.indexOf(strKey)
        }
      })
    }
    return [x,y]
  }

  // returns all permutations of an array
  // tex getPermutations([1 2 3]) => [[1 2 3] [ 1 3 2] [2 1 3] [ 2 3 1] [3 1 2] [3 2 1]]
  function getPermutations<T>( arr : T[]) : T[][]{
    if(arr.length === 1){
      return [[arr[0]]]
    }
    var pile : T[][] =[]
    for (var i =0; i<arr.length;i++){
      var front : T = arr[i];
      var rest : T[] = []
      for(var j =0;j<arr.length;j++){
        if(i!==j){
          rest.push(arr[j])
        }
      }
      var restPerms : T[][] = getPermutations(rest)
      for(var j =0;j<restPerms.length;j++){
        pile.push( [].concat(front,restPerms[j]) )
      }
    }
    return pile
  }
}
