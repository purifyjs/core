import {
    Builder,
    Lifecycle,
    ref,
    Sync,
    sync,
    tags,
    track,
} from "@purifyjs/core";

const { button, ul, li, input } = tags;

const time = sync<number>((set) => {
    const update = () => set(Date.now());
    const interval = setInterval(update, 1000);
    update();
    return () => clearInterval(interval);
});

const count = ref(0);
const double = count.derive((count) => count * 2);
const half = track(() => count.val * 0.5);

new Builder(document.body).append$(
    button()
        .onclick(() => count.val--)
        .textContent("-"),
    input().type("number")
        .$bind(useValueAsNumber(count))
        .step("1"),
    button()
        .onclick(() => count.val++)
        .textContent("+"),
    ul().append$(
        li().append$("Count: ", count),
        li().append$("Double: ", double),
        li().append$("Half: ", half),
        li().append$("Time: ", time),
    ),
);

function useValueAsNumber(
    state: Sync.Ref<number>,
): Lifecycle.OnConnected<HTMLInputElement> {
    return (element) => {
        const abortController = new AbortController();
        element.addEventListener(
            "input",
            () => (state.val = element.valueAsNumber),
            { signal: abortController.signal },
        );
        const unfollow = state.follow(
            (value) => (element.valueAsNumber = value),
            true,
        );
        return () => {
            abortController.abort();
            unfollow();
        };
    };
}
