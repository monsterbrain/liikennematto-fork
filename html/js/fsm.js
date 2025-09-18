export class FiniteStateMachine {
    constructor(initialState, states) {
        this.currentState = initialState;
        this.states = states; // An object mapping state names to state objects
        this.states[this.currentState].enter();
    }

    transition(newState) {
        if (!this.states[newState]) {
            console.error(`State ${newState} does not exist.`);
            return;
        }
        this.states[this.currentState].exit();
        this.currentState = newState;
        this.states[this.currentState].enter();
    }

    update(...args) {
        this.states[this.currentState].update(...args);
    }
}

/**
 * A helper function to create a state object for the FSM.
 * A state has three optional methods: enter, exit, and update.
 */
export function createState({ enter = () => {}, exit = () => {}, update = () => {} }) {
    return { enter, exit, update };
}
