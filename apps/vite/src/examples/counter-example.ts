import { computed, Lifecycle, Signal, state, tags } from "@purifyjs/core";

const { div, section, button, ul, li, input } = tags;

function App() {
    return div().id("app").append$(Counter());
}

function Counter() {
    const count = state(0);
    const double = count.derive((count) => count * 2);
    const half = computed(() => count.val * 0.5);

    return div().append$(
        section({ class: "input" })
            .ariaLabel("Input")
            .append$(
                button()
                    .title("Decrement by 1")
                    .onclick(() => count.val--)
                    .textContent("-"),
                input().type("number").$bind(useBindNumber(count)).step(
                    "1",
                ),
                button()
                    .title("Increment by 1")
                    .onclick(() => count.val++)
                    .textContent("+"),
            ),
        section({ class: "output" })
            .ariaLabel("Output")
            .append$(
                ul().append$(
                    li().append$("Count: ", count),
                    li().append$("Double: ", double),
                    li().append$("Half: ", half),
                ),
            ),
    );
}

function useBindNumber(
    state: Signal.State<number>,
): Lifecycle.OnConnected<HTMLInputElement> {
    return (element) => {
        const listener = () => (state.val = element.valueAsNumber);
        element.addEventListener("input", listener);
        const unfollow = state.follow(
            (value) => (element.valueAsNumber = value),
            true,
        );
        return () => {
            element.removeEventListener("input", listener);
            unfollow();
        };
    };
}

document.body.append(App().$node);
