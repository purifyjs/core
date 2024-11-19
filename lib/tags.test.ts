import type { tags as tags_type } from "./tags"
declare const tags: typeof tags_type

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _() {
    // Elements should still satisfy the native types
    {
        tags.a().element satisfies HTMLAnchorElement
        tags.form().element satisfies HTMLFormElement
    }

    // StrictARIA should be correctly defined
    {
        const ariaBusy = tags.div().element.ariaBusy
        switch (ariaBusy) {
            case "true":
            case "false":
            case null:
                break
            default:
                ariaBusy satisfies never
        }
    }

    // StrictARIA should be correctly defined
    {
        tags.div().ariaBusy("true")
        /// @ts-expect-error Unknown value
        tags.div().ariaBusy("abc")
    }
}
