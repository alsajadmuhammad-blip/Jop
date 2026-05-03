
import { EventEmitter } from 'events';

// This is a global event emitter to handle specific types of errors application-wide.
// We use the 'events' package because it's a standard and lightweight solution for event handling in Node.js and the browser.
export const errorEmitter = new EventEmitter();
