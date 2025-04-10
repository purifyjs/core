/**
 * @module StrictDOM
 *
 * This module defines stricter types for DOM.
 */

/**
 * This module defines stricter types for DOM.
 */
export namespace StrictDOM {
    export type HTMLInputElementType = string extends HTMLInputElement["type"] ?
            | "button"
            | "checkbox"
            | "color"
            | "date"
            | "datetime-local"
            | "email"
            | "file"
            | "hidden"
            | "image"
            | "month"
            | "number"
            | "password"
            | "radio"
            | "range"
            | "reset"
            | "search"
            | "submit"
            | "tel"
            | "text"
            | "time"
            | "url"
            | "week"
        : HTMLInputElement["type"];
}
