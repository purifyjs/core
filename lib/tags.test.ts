import { tags } from "./tags"

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
