import { assertStrictEquals } from "jsr:@std/assert";
import { ref, Sync, sync, track } from "./signals.ts";

function assertTupleEqual(a: unknown[], b: unknown[]) {
    assertStrictEquals(a.length, b.length);
    for (let i = 0; i < a.length; i++) {
        assertStrictEquals(a[i], b[i]);
    }
}

function _(_fn: () => void) {}

_(() => {
    const signalSignal = sync<number>(() => {});
    const stateSignal = ref<number>(0);
    const computedSignal = track<number>(() => 0);

    /// @ts-expect-error read-only
    signalSignal.val = 0;
    stateSignal.val = 0;
    /// @ts-expect-error read-only
    computedSignal.val = 0;

    function acceptSignal(_: Sync<unknown>) {}
    function acceptref(_: Sync.Ref<unknown>) {}

    acceptSignal(signalSignal);
    acceptSignal(stateSignal);
    acceptSignal(computedSignal);

    /// @ts-expect-error read-only
    acceptref(signalSignal);
    acceptref(stateSignal);
    /// @ts-expect-error read-only
    acceptref(computedSignal);
});

Deno.test("Derive counter with immediate basics", () => {
    const value = ref(0);
    const double = track(() => value.val * 2);

    const results: number[] = [];
    double.follow((value) => results.push(value), true);

    for (let i = 0; i < 8; i++) {
        value.val++;
    }

    assertTupleEqual(results, [0, 2, 4, 6, 8, 10, 12, 14, 16]);
});

Deno.test("Derive counter without immediate basics", () => {
    const value = ref(0);
    const double = track(() => value.val * 2);

    const results: number[] = [];
    double.follow((value) => results.push(value));

    for (let i = 0; i < 8; i++) {
        value.val++;
    }

    assertTupleEqual(results, [2, 4, 6, 8, 10, 12, 14, 16]);
});

Deno.test("Computed multiple dependency", () => {
    const a = ref(0);
    const b = ref(0);
    const ab = track(() => `${a.val},${b.val}`);

    const results: string[] = [];
    ab.follow((ab) => results.push(ab));

    for (let i = 0; i < 3; i++) {
        b.val++;
        a.val++;
    }

    assertTupleEqual(results, ["0,1", "1,1", "1,2", "2,2", "2,3", "3,3"]);
});

Deno.test("Computed multi follower should call getter once", () => {
    let counter = 0;
    const a = ref(0);
    const b = track(() => {
        Sync.Tracking.add(a);
        counter++;
    });
    b.follow(() => {});
    b.follow(() => {});
    b.follow(() => {});
    b.follow(() => {});

    a.val++;

    assertStrictEquals(counter, 1 + 1); // +1 for the initial dependency discovery
});

Deno.test("Computed shouldn't call followers if the value is the same as the previous value", () => {
    const a = ref(0);
    const b = track(() => a.val % 2);
    const results: unknown[] = [];
    b.follow((value) => {
        results.push(value);
    });

    a.val = 1;
    a.val = 3;
    a.val = 2;

    assertTupleEqual(results, [1, 0]);
});

Deno.test("Computed should update as many times as the dependencies changes", () => {
    let counter = 0;
    const a = ref(0);
    const b = track(() => {
        Sync.Tracking.add(a);
        counter++;
    });
    b.follow(() => {});
    b.follow(() => {});

    a.val++;
    a.val++;

    assertStrictEquals(counter, 2 + 1); // +1 for the initial dependency discovery
});

Deno.test("Computed shouldn't run without followers", () => {
    let counter = 0;
    const a = ref(0);
    track(() => {
        Sync.Tracking.add(a);
        counter++;
    });

    a.val++;

    assertStrictEquals(counter, 0);
});

Deno.test("Computed shouldn't discover without followers", () => {
    let counter = 0;
    const a = ref(0);
    track(() => {
        Sync.Tracking.add(a);
        counter++;
    });

    assertStrictEquals(counter, 0);
});

Deno.test("State, no infinite follower emit", () => {
    const a = ref(0);
    let counter = 0;
    function follower() {
        // Prevent infinite loop
        if (counter > 8) return;

        a.follow(() => {
            counter++;
            follower();
        });
    }
    follower();

    a.val++;

    assertStrictEquals(counter, 1);
});

Deno.test("Deep derivation shouldn't run multiple times", () => {
    const a = ref(0);
    let counter = 0;

    a.derive((value) => {
        counter++;
        return value;
    })
        .derive((value) => value)
        .derive((value) => value)
        .derive((value) => value)
        .derive((value) => value)
        .follow(() => {});

    assertStrictEquals(counter, 1);
});

Deno.test("State should start on get, if there are no followers", () => {
    const a = ref("abc");

    const b = a
        .derive((value) => value)
        .derive((value) => value)
        .derive((value) => value)
        .derive((value) => value);

    assertStrictEquals(b.val, "abc");
});

Deno.test("Verify computed recalculates correctly with internal dependency updates", () => {
    const a = ref(0);
    let counter = 0;
    track(() => {
        counter++;
        if (counter > 100) return;
        Sync.Tracking.add(a);
        a.val = 1; // 2, 4
    }).follow(() => {}); // 1
    a.val = 2; // 3

    assertStrictEquals(counter, 4); // 4 times, no less, no more
});

Deno.test("Infinite loop test", () => {
    let counter = 0;
    const a = new Sync(() => {
        counter++;
        if (counter > 100) return;
        a.val;
    });
    a.val;

    assertStrictEquals(counter, 1);
});

Deno.test("No stop leak", () => {
    let counter = 0;
    // deno-lint-ignore prefer-const
    let unfollow: Sync.Unfollower;
    const a = new Sync(() => {
        if (typeof unfollow !== "undefined") {
            unfollow();
        }

        return () => {
            counter++;
        };
    });
    unfollow = a.follow(() => {});
    unfollow();
    assertStrictEquals(counter, 1);
});

/* it("Basic awaited signal logic", async () => {
        const results: (typeof signal)["val"][] = []
        const promise = new Promise((resolve) => setTimeout(resolve, 1000))
        const signal = awaited(
            promise.then(() => "done"),
            "waiting"
        )
        signal.follow((value) => results.push(value), true)
        await promise.catch(() => {})
        await new Promise((resolve) => setTimeout(resolve))
        deepStrictEqual(results, ["waiting", "done"])
    }) */
