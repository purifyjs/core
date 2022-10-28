import { deepEqual, deepStrictEqual, strictEqual } from "node:assert"
import { describe, it } from "node:test"
import { computed, Dependency, ref } from "./signals"

describe("Signals", () => {
    it("Derive counter with immediate basics", () => {
        const value = ref(0)
        const double = computed(() => value.val * 2)

        const results: number[] = []
        double.follow((value) => results.push(value), true)

        for (let i = 0; i < 8; i++) {
            value.val++
        }

        deepEqual(results, [0, 2, 4, 6, 8, 10, 12, 14, 16])
    })

    it("Derive counter without immediate basics", () => {
        const value = ref(0)
        const double = computed(() => value.val * 2)

        const results: number[] = []
        double.follow((value) => results.push(value))

        for (let i = 0; i < 8; i++) {
            value.val++
        }

        deepEqual(results, [2, 4, 6, 8, 10, 12, 14, 16])
    })

    it("Computed multiple dependency", () => {
        const a = ref(0)
        const b = ref(0)
        const ab = computed(() => `${a.val},${b.val}`)

        const results: string[] = []
        ab.follow((ab) => results.push(ab))

        for (let i = 0; i < 3; i++) {
            b.val++
            a.val++
        }

        deepEqual(results, ["0,1", "1,1", "1,2", "2,2", "2,3", "3,3"])
    })

    it("Computed multi follower should call getter once", () => {
        let counter = 0
        const a = ref(0)
        const b = computed(() => {
            Dependency.add(a)
            counter++
        })
        b.follow(() => {})
        b.follow(() => {})
        b.follow(() => {})
        b.follow(() => {})

        a.val++

        strictEqual(counter, 1 + 1) // +1 for the initial dependency discovery
    })

    it("Computed shouldn't call followers if the value is the same as the previous value", () => {
        const a = ref(0)
        const b = computed(() => a.val % 2)
        const results: unknown[] = []
        b.follow((value) => {
            results.push(value)
        })

        a.val = 1
        a.val = 3
        a.val = 2

        deepStrictEqual(results, [1, 0])
    })

    it("Computed should update as many times as the dependencies changes", () => {
        let counter = 0
        const a = ref(0)
        const b = computed(() => {
            Dependency.add(a)
            counter++
        })
        b.follow(() => {})
        b.follow(() => {})

        a.val++
        a.val++

        strictEqual(counter, 2 + 1) // +1 for the initial dependency discovery
    })

    it("Computed shouldn't run without followers", () => {
        let counter = 0
        const a = ref(0)
        computed(() => {
            Dependency.add(a)
            counter++
        })

        a.val++

        strictEqual(counter, 0)
    })

    it("Computed shouldn't discover without followers", () => {
        let counter = 0
        const a = ref(0)
        computed(() => {
            Dependency.add(a)
            counter++
        })

        strictEqual(counter, 0)
    })

    it("State, no infinite follower emit", () => {
        const a = ref(0)
        let counter = 0
        function follower() {
            // Prevent infinite loop
            if (counter > 8) return

            a.follow(() => {
                counter++
                follower()
            })
        }
        follower()

        a.val++

        strictEqual(counter, 1)
    })
})

// TODO: computed shouldn't update without followers. and similar logic check
