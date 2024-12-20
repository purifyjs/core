export {}

/**
 * @module ARIA
 *
 * This module defines stricter types for ARIA.
 * It includes the `Attributes` type, which transforms ARIA property keys to attribute-like strings,
 * and the `Properties` interface for ARIA property type overrides and experimental attributes.
 */

export namespace StrictARIA {
    /**
     * Type representing ARIA attributes, which are derived from `Properties` and follow a
     * `aria-` prefix naming convention. Attributes like `aria-labelledby` are mapped to
     * properties of specific element types.
     */
    export type Attributes = {
        [K in keyof Properties as K extends `aria${infer Name}` ?
            Name extends `${infer Name}Elements` ?
                `aria-${Lowercase<Name>}`
            :   `aria-${Lowercase<Name>}`
        :   never]: Element[] extends Properties[K] ? string | null : Properties[K]
    }

    /**
     * Interface representing all ARIA properties, including those that override base properties and
     * experimental attributes that are supported by specific browsers.
     */
    export type Properties = ARIAMixin & Properties.Mixin

    export namespace Properties {
        export type Mixin = Properties.Override & Properties.Experimental

        /**
         * Experimental ARIA properties that may not be fully standardized or cross-browser.
         */
        export type Experimental = {
            ariaOwnsElements: Element[] | null
            ariaFlowToElements: Element[] | null
            ariaDetailsElements: Element[] | null
            ariaControlsElements: Element[] | null
            ariaLabelledByElements: Element[] | null
            ariaDescribedByElements: Element[] | null
            ariaErrorMessageElements: Element[] | null
        }

        /**
         * Properties that override default ARIA types for stricter control over allowed values.
         * These types enforce specific string literal types for various ARIA attributes.
         */
        export type Override = {
            ariaAtomic: "false" | "true" | null
            ariaAutoComplete: "inline" | "list" | "both" | "none" | null
            ariaBusy: "true" | "false" | null
            ariaChecked: "true" | "mixed" | "false" | "undefined" | null
            ariaColCount: `${bigint}` | null
            ariaColIndex: `${bigint}` | null
            ariaColSpan: `${bigint}` | null
            ariaCurrent:
                | "page"
                | "step"
                | "location"
                | "date"
                | "time"
                | "true"
                | "false"
                | null
            ariaDisabled: "true" | "false" | null
            ariaExpanded: "true" | "false" | "undefined" | null
            ariaHasPopup:
                | "false"
                | "true"
                | "menu"
                | "listbox"
                | "tree"
                | "grid"
                | "dialog"
                | null
            ariaHidden: "true" | "false" | "undefined" | null
            ariaInvalid: "true" | "false" | "grammar" | "spelling" | null
            ariaLevel: `${bigint}` | null
            ariaLive: "assertive" | "off" | "polite" | null
            ariaModal: "true" | "false" | null
            ariaMultiLine: "true" | "false" | null
            ariaMultiSelectable: "true" | "false" | null
            ariaOrientation: "horizontal" | "vertical" | "undefined" | null
            ariaPosInSet: `${bigint}` | null
            ariaPressed: "true" | "false" | "mixed" | "undefined" | null
            ariaReadOnly: "true" | "false" | null
            ariaRequired: "true" | "false" | null
            ariaRowCount: `${bigint}` | null
            ariaRowIndex: `${bigint}` | null
            ariaRowSpan: `${bigint}` | null
            ariaSelected: "true" | "false" | "undefined" | null
            ariaSetSize: `${bigint}` | null
            ariaSort: "ascending" | "descending" | "none" | "other" | null
            ariaValueMax: `${number}` | null
            ariaValueMin: `${number}` | null
            ariaValueNow: `${number}` | null
            role: StrictARIA.Role | null
        }
    }

    /**
     * Type representing ARIA roles, which can be specified for various elements to define
     * their function and behavior within an application. Roles are grouped by specification.
     */
    export type Role =
        | Role.RichInternetApplications
        | Role.DigitalPublishing
        | Role.Experimental

    export namespace Role {
        /**
         * Experimental role that may not be fully standardized or supported by all browsers.
         */
        export type Experimental = "text"

        /**
         * Roles specified under the WAI-ARIA Rich Internet Applications specification,
         * which are commonly used for interactive web elements.
         */
        export type RichInternetApplications =
            | "alert"
            | "alertdialog"
            | "application"
            | "article"
            | "banner"
            | "button"
            | "cell"
            | "checkbox"
            | "columnheader"
            | "combobox"
            | "complementary"
            | "contentinfo"
            | "definition"
            | "dialog"
            | "document"
            | "feed"
            | "figure"
            | "form"
            | "grid"
            | "gridcell"
            | "group"
            | "heading"
            | "img"
            | "link"
            | "list"
            | "listbox"
            | "listitem"
            | "log"
            | "main"
            | "marquee"
            | "math"
            | "menu"
            | "menubar"
            | "menuitem"
            | "menuitemcheckbox"
            | "menuitemradio"
            | "navigation"
            | "none"
            | "note"
            | "option"
            | "presentation"
            | "progressbar"
            | "radio"
            | "radiogroup"
            | "region"
            | "row"
            | "rowgroup"
            | "rowheader"
            | "scrollbar"
            | "search"
            | "searchbox"
            | "separator"
            | "slider"
            | "spinbutton"
            | "status"
            | "switch"
            | "tab"
            | "table"
            | "tablist"
            | "tabpanel"
            | "term"
            | "textbox"
            | "timer"
            | "toolbar"
            | "tooltip"
            | "tree"
            | "treegrid"
            | "treeitem"

        /**
         * Roles specific to digital publishing, which assist in identifying structural elements
         * within digital documents, such as chapters, footnotes, and bibliographies.
         */
        export type DigitalPublishing =
            | "doc-abstract"
            | "doc-acknowledgments"
            | "doc-afterword"
            | "doc-appendix"
            | "doc-backlink"
            | "doc-biblioentry"
            | "doc-bibliography"
            | "doc-biblioref"
            | "doc-chapter"
            | "doc-colophon"
            | "doc-conclusion"
            | "doc-cover"
            | "doc-credit"
            | "doc-credits"
            | "doc-dedication"
            | "doc-endnote"
            | "doc-endnotes"
            | "doc-epigraph"
            | "doc-epilogue"
            | "doc-errata"
            | "doc-example"
            | "doc-footnote"
            | "doc-foreword"
            | "doc-glossary"
            | "doc-glossref"
            | "doc-index"
            | "doc-introduction"
            | "doc-noteref"
            | "doc-notice"
            | "doc-pagebreak"
            | "doc-pagelist"
            | "doc-part"
            | "doc-preface"
            | "doc-prologue"
            | "doc-pullquote"
            | "doc-qna"
            | "doc-subtitle"
            | "doc-tip"
            | "doc-toc"
    }
}
