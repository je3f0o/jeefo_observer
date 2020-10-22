/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-08-05
* Updated at  : 2020-10-22
* Author      : jeefo
* Purpose     :
* Description :
.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.*/
// ignore:start
"use strict";

/* globals*/
/* exported*/

/*
 * TODO: make observerable deep nested property
 * example:
 * 	`observer.on("options.analyser.disabled", is_disabled => {...})`
 */

// ignore:end

const array_remove     = require("@jeefo/utils/array/remove");
const {defineProperty} = Object;

const observer_instances = [];

class JeefoStaticObserver {
    constructor (object) {
        this.object    = object;
        this.values    = {};
        this.notifiers = [];
    }
}

class JeefoObserver {
    constructor (object) {
        this.object = object;

        const private_instance = observer_instances.find(instance => {
            return instance.object === object;
        });
        if (! private_instance) {
            observer_instances.push(new JeefoStaticObserver(object));
        }
    }

    on (property, notify_handler) {
        const private_instance = observer_instances.find(instance => {
            return instance.object === this.object;
        });
        if (! private_instance) { return; }

        const { object, values, notifiers } = private_instance;

        if (notifiers[property]) {
            notifiers[property].push(notify_handler);
        } else {
            values[property]    = object[property];
            notifiers[property] = [notify_handler];

            defineProperty(object, property, {
                get () { return values[property]; },

                set (value) {
                    const old_value = values[property];
                    if (old_value !== value) {
                        values[property] = value;
                        notifiers[property].forEach(fn => fn(value, old_value));
                    }
                }
            });
        }

        return notify_handler;
    }

    off (property, notify_handler) {
        const private_instance = observer_instances.find(instance => {
            return instance.object === this.object;
        });
        if (! private_instance) { return; }

        const { object, notifiers } = private_instance;

        array_remove(notifiers[property], notify_handler);
        if (notifiers[property].length === 0) {
            const value = object[property];
            delete object[property];
            object[property] = value;
        }
    }

    once (property, notify_handler) {
        const notifier = this.on(property, new_value => {
            notify_handler(new_value);
            this.off(property, notifier);
        });
    }

    static destroy (object) {
        const private_instance = observer_instances.find(instance => {
            return instance.object === object;
        });
        if (private_instance) {
            array_remove(observer_instances, private_instance);
        }
    }
}

module.exports = JeefoObserver;
