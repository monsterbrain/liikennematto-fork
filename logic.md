# Liikennematto Game Logic

This document outlines the core logic and architecture of the Liikennematto game, based on the developer's blog posts and analysis of the Elm source code. This will serve as a blueprint for migrating the game to HTML, CSS, and JavaScript.

## 1. Core Concepts

-   **Gameplay Loop:** The player draws roads on a tile-based map. The game automatically populates the areas next to roads with "lots," which contain buildings. Buildings spawn cars, which then drive around the road network, creating a living traffic simulation.
-   **Goal:** A sandbox-style "digital toy" inspired by children's traffic mats. There are no explicit goals or scores.

## 2. Game World & Map

-   **Tilemap:** The world is based on a 2D grid or tilemap. The player's primary interaction is adding or removing road tiles.
-   **Smart Tiling:** A "smart construction" tool uses 4-bit bitmasking to automatically select the correct road tile based on its neighbors (north, east, south, west), simplifying road drawing.
-   **Lots & Buildings:**
    -   Lots are multi-tile areas that are procedurally generated next to existing roads.
    -   Generation happens at random intervals.
    -   Each lot has one or more buildings, which are currently unique.
    -   Lots serve as the origin and destination for cars.
-   **Wave Function Collapse (WFC):** The latest version of the game is moving towards using WFC for more advanced procedural generation of lots and decorations, driven by the player's road placements.

## 3. Road Network & Pathfinding

-   **Graph-Based Network:** The tilemap is converted into a directed graph.
    -   **Nodes:** Represent specific points on a lane (e.g., lane start/end, intersection entry/exit, parking spot connection). Nodes store their position and direction of travel.
    -   **Edges:** Represent the one-way lanes connecting the nodes.
-   **Pathfinding:**
    -   Cars use the A* algorithm to find the shortest path between two nodes in the graph (e.g., from their origin lot to a destination lot).
    -   Routes are dynamically recalculated if the road network changes.

## 4. Car Simulation (Real-Time)

-   **Movement:**
    -   Cars are not locked to the grid. They move smoothly at 60 FPS.
    -   They have physics properties like `position`, `velocity`, and `acceleration`.
    -   Movement between two nodes in the road network graph is guided by a **cubic Bézier curve**, which is approximated by a polyline that the car follows. This creates smooth turns.
-   **Collision Avoidance:**
    -   This is a predictive system, not just a reactive one.
    -   Cars have a "field of view" (a triangle in front of them) to detect other cars. The FOV size is dynamic based on speed.
    -   To prevent deadlocks, cars only react to other cars on their **right side**.
    -   Collision detection uses precise polygons that approximate the car's shape. A ray is cast from the car to check for intersection with the other car's polygon.
    -   A **Quadtree** is used to efficiently query for nearby cars, avoiding an O(n^2) check against all other cars on every frame.
-   **State Management:**
    -   Car behavior is managed by a **Finite State Machine (FSM)**. States could include `Accelerating`, `Decelerating`, `StoppedAtLight`, `Turning`, `Parking`, etc.
    -   FSM states have entry and exit actions, which can be used to trigger animations and sounds.

## 5. Traffic Rules & Intersections

-   **Traffic Lights:**
    -   Operate on a timed cycle.
    -   Cars approaching a red or yellow light will calculate the required deceleration to stop just before the intersection line.
    -   Cars queue up behind a stopped car using the standard collision avoidance system.
-   **Yield Signs:**
    -   Cars approaching a yield sign slow down.
    -   They check their field of view for conflicting traffic on the priority road.
    -   If there is a conflict, they decelerate to a full stop and wait until the path is clear.
-   **Parking:**
    -   Lots have dedicated parking areas with one or more parking spots.
    -   Each spot has a defined path to the lot's main entrance/exit, which connects to the road network graph.
    -   A **parking lock** ensures only one car can be maneuvering within a lot's parking area at a time to prevent collisions in the tight space.

## 6. Architecture (based on Elm project)

The JavaScript project should be structured similarly to the final Elm version.

-   **`World` / `State`:** A central object holding the entire game state (tilemap, car list, lots, road network graph, etc.).
-   **`UI` Module:**
    -   Handles all user input (mouse clicks, taps, panning, zooming).
    -   Renders UI elements like buttons and icons.
    -   Dispatches events/messages to other modules (e.g., `addTileAt(x, y)`).
-   **`Tilemap` Module:**
    -   Manages the 2D grid of tiles.
    -   Contains the logic for adding/removing tiles, including the bitmasking for auto-tiling.
    -   Triggers the regeneration of the road network graph when the map changes.
-   **`Simulation` Module:**
    -   Contains the core game logic.
    -   Builds the road network graph from the tilemap.
    -   Manages all simulated entities (cars, lots).
    -   Runs the A* pathfinding.
    -   Updates car positions, physics, and FSMs on every frame.
    -   Handles collision detection and traffic rules.
-   **`Render` Module:**
    -   Reads the game state from the `World` object.
    -   Renders the game world onto an HTML5 **Canvas**.
    -   Draws the tilemap, cars, buildings, and debug information.
    -   Should be decoupled from the simulation logic.
-   **Event Queue:**
    -   A custom event queue to manage the flow of state changes.
    -   Events (e.g., `carSpawned`, `roadChanged`) are accumulated during a simulation tick and then flushed.
    -   This allows for delayed actions, retries, and better control over side effects like sound and animation triggers.

## 7. Asset Requirements for Migration

-   The original assets are private.
-   Need to find suitable free-to-use assets for:
    -   Road tiles (straights, curves, intersections).
    -   Cars (various types/colors).
    -   Buildings (residential, commercial, etc.).
    -   Decorations (trees, etc.).
    -   UI Icons.
-   The original author used assets from **Kenney.nl**, which is a good place to start looking.
-   Sound effects for UI actions and game events.
