Shrdlite project by Group 22 AI-Prips
Members: Nils Carlsson, Eduardo Cesma Caselles, Martin Henoch, Ulf Hjohlman
Supervisor: Pablo
--------------------------------------------------------------------------------
Implementation of the aStarSearch, Interpreter, Planner, and some extensions.


--------------------------------------------------------------------------------
Extensions:
1) Heuristic - Non-admissible heuristic that takes stack sizes, weights etc. into
  account. Note that it might not find the optimal path due to being non-admissible,
  but it should find one close enough. Reason for choosing non-admissable is that the
  program simply times out on more complex commands otherwise. Non-admissability
  works quite well in shrdlite since we can easily determine what objects NEEDS to be
  moved ("take" command needs all objects above the target removed, for example) and
  we can therefore attach a higher weight to these. Heuristic should be able to handle 
  nearly all of the harder commands. Notably hard commands include "stack all red objects"
  in the complex world, and in the medium world (full disclosure: this one might time out on
  slower computers, approaches the 10sec limit). Unable to handle "stack all yellow objects"
  in the complex world,  altough we're not sure that one is actually possible?

2) Weights - Large objects have extra weight when being moved (double the cost for
  the arm to move/drop/pick up a large object). Also considered in the heuristic.

3) "Stack all ..." command - Tells the robot to stack all objects of a certain type,
  For example, "stack all red objects" or "stack all bricks" in the medium world.
  For such a command the interpreter will pass along a disjunctive normal form of
  the physically valid ways to stack the objects. For example "stack all red objects"
  can be done in the medium world in two ways:
  [ontop(h,j) & inside(j,l) & ontop(l,c) | ontop(j,h) & inside(h,l) & ontop(l,c)]

4) User questions: "How many ... are there?" & "Where is the ..." - For these
  commands the normal work flow of path planning is bypassed and the program will
  instead answer the question in regards to the current world state.

5) Ambiguity resolution - In the case that there is a parsing or interpretation
  ambiguity the user will be asked what goal state they had in mind when asking
  the question.

--------------------------------------------------------------------------------
Extra:
 Quantifiers - This extension was not fully completed but is included in the
 file 'AlternativeInterpreterWithAllQuantifiers.ts'. There are some unsolved bugs
 left in this implementation. But the general idea of the code should be sound.
