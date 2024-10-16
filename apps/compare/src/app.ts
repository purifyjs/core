import picoCss from "@picocss/pico/css/pico.css?raw"
import { computed, fragment, ref, tags } from "@purifyjs/core"
import highlightjs from "highlight.js"
import highlightCss from "highlight.js/styles/atom-one-dark.css?raw"
import { css, sheet } from "./css"
import { Framework, getFrameworks } from "./frameworks"

// I have to do it like this, because if i use top-level await, vite fucks up glob imports for some reasons
getFrameworks().then((frameworks) => {
    const {
        div,
        span,
        details,
        summary,
        ul,
        li,
        a,
        aside,
        img,
        nav,
        main,
        section,
        h2,
        h3,
        pre,
        code,
        button,
        hr,
        strong,
        link
    } = tags

    document.head.append(
        link().rel("icon").type("image/svg+xml").href(frameworks["purify.js"].iconSrc)
            .element
    )

    const hash = ref(location.hash)
    setInterval(() => (hash.val = location.hash), 100)

    const primaryFrameworkKey = "purify.js"
    const primaryFramework = frameworks[primaryFrameworkKey]

    const path = computed(() => {
        const [framework, group, example] = hash.val.slice(1).split("/")
        return { framework, group, example }
    })

    const compared = ref(calculateCompared(path.val))
    function calculateCompared(pathValue: (typeof path)["val"]) {
        const key = pathValue.framework || "vue3"
        return {
            key,
            framework: frameworks[key]
        }
    }
    path.follow((value) => {
        if (compared.val.key === value.framework) return
        compared.val = calculateCompared(value)
    })

    compared.follow(() => console.log("changed"))

    function App() {
        const host = div({ id: "app" }).children(
            aside().children(FrameworkSelector(), GroupsNav()),
            main().children(
                (() => {
                    const host = fragment()
                    const primaryGroups = primaryFramework.groups

                    for (const primaryGroupKey in primaryGroups) {
                        const primaryGroupItem = primaryGroups[primaryGroupKey]

                        const groupSection = section({ class: "group" })
                            .id(computed(() => `${compared.val.key}/${primaryGroupKey}`))
                            .children(h2().children(primaryGroupItem.label))
                        host.append(groupSection.element)

                        for (const primaryExampleKey in primaryGroupItem.examples) {
                            const primaryExample =
                                primaryGroupItem.examples[primaryExampleKey]

                            const exampleSection = section({ class: "example" })
                                .id(
                                    computed(
                                        () =>
                                            `${compared.val.key}/${primaryGroupKey}/${primaryExampleKey}`
                                    )
                                )
                                .children(h3().children(primaryExample.label))
                            groupSection.children(exampleSection)

                            const exampleItemsWrapper = div({ class: "items" }).children(
                                renderExampleItem(primaryFramework, primaryExample),
                                computed(() => {
                                    const framework = compared.val.framework
                                    const example =
                                        framework.groups[primaryGroupKey].examples[
                                            primaryExampleKey
                                        ]
                                    if (!example) return null
                                    return renderExampleItem(framework, example)
                                })
                            )
                            exampleSection.children(exampleItemsWrapper, hr())

                            function renderExampleItem(
                                framework: Framework,
                                exampleItem: Framework.Example
                            ) {
                                const exampleItemWrapper = div({
                                    class: "item"
                                })

                                exampleItemWrapper.children(
                                    div({ class: "framework-title" }).children(
                                        img().src(framework.iconSrc),
                                        strong().children(framework.label)
                                    )
                                )

                                const currentFile = ref(exampleItem.files[0])
                                const fileTabs = div().role("group")
                                exampleItemWrapper.children(fileTabs)

                                for (const file of exampleItem.files) {
                                    fileTabs.children(
                                        button()
                                            .onclick(() => (currentFile.val = file))
                                            .ariaCurrent(
                                                computed(() =>
                                                    String(currentFile.val === file)
                                                )
                                            )
                                            .children(file.name)
                                    )
                                }

                                exampleItemWrapper.children(
                                    computed(() => {
                                        const fileExtension =
                                            currentFile.val.name.split(".").at(-1) ?? ""

                                        const highlightResult =
                                            (
                                                fileExtension === "ts" ||
                                                fileExtension === "js" ||
                                                fileExtension === "jsx" ||
                                                fileExtension === "tsx"
                                            ) ?
                                                highlightjs.highlight(
                                                    "typescript",
                                                    currentFile.val.content
                                                )
                                            :   highlightjs.highlightAuto(
                                                    currentFile.val.content
                                                )

                                        return pre().children(
                                            code({
                                                class: `language-${highlightResult.language}`
                                            }).innerHTML(highlightResult.value)
                                        )
                                    })
                                )

                                return exampleItemWrapper
                            }
                        }
                    }

                    return host
                })()
            )
        )

        return host
    }

    function FrameworkSelector() {
        const open = ref(false)

        return details({ class: "dropdown frameworks" })
            .open(open)
            .ontoggle((event) => (open.val = event.currentTarget.open))
            .children(
                summary().children(
                    div({ class: "item" }).children(
                        img().src(computed(() => compared.val.framework.iconSrc)),
                        computed(() => compared.val.framework.label)
                    )
                ),
                ul().children(
                    Object.entries(frameworks).map(([frameworkKey, framework]) =>
                        li().children(
                            a({ class: "item" })
                                .href(`#${frameworkKey}`)
                                .onclick(() => setTimeout(() => (open.val = false)))
                                .title(framework.label)
                                .children(img().src(framework.iconSrc), framework.label)
                        )
                    )
                )
            )
    }

    function GroupsNav() {
        return nav({ class: "groups" }).children(
            ul().children(
                Object.entries(primaryFramework.groups).map(([groupKey, group]) =>
                    li().children(
                        span({ class: "item" }).title(group.label).children(group.label),
                        ul().children(
                            Object.entries(group.examples).map(([exampleKey, example]) =>
                                li().children(
                                    a({
                                        class: "item"
                                    })
                                        .href(
                                            computed(
                                                () =>
                                                    `#${compared.val.key}/${groupKey}/${exampleKey}`
                                            )
                                        )
                                        .title(example.label)
                                        .children(example.label)
                                )
                            )
                        )
                    )
                )
            )
        )
    }

    const piceStyle = sheet(css`
        @layer global {
            ${picoCss.replaceAll("rem", "em")}
        }
    `)
    const highlightStyle = sheet(highlightCss)
    const appStyle = sheet(css`
	:root {
		scroll-behavior: smooth;
	}

	body {
		container: body / inline-size;
	}

	#app {
		display: grid;
		grid-template-columns: 14em 1fr;
		font-size: 0.9em;
	}

	h2 {
		font-size: 1.1em;
	}

	h3 {
		font-size: 1em;
		position: sticky;
		inset-block-start: 0;
		z-index: 1;
	}

	section:has(> h3) {
		position: relative:
	}

	main {
		padding: 0.5em;

		.example .items {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(20em, 1fr));
			gap: .5em;

			.item {
				display: grid;
				align-content: start;
				gap: .5em;

				.framework-title {
					display: grid;
					grid-template-columns: 1.25em auto;
					gap: 0.25em;
					align-items: center;
				}
			}
		}

		.example [role="group"] {
			font-size: 0.65em;
			inline-size: fit-content;
			max-inline-size: 100%;
			overflow-x: auto;
			margin: 0;

			button {
				padding: 0.5em;
			}
		}

		.example pre {
			font-size: 0.75em;
		}
	}

	aside {
		padding: 0.5em;

		background-color: color-mix(in srgb, transparent 95%, currentColor);

		position: sticky;
		inset-block-start: 0;
		block-size: 100dvh;
		overflow-y: auto;
		z-index: 1;

		.item {
			white-space: nowrap;
			text-overflow: ellipsis;
			overflow: hidden;
		}

		.frameworks {
			position: sticky;
			inset-block-start: 0em;

			ul {
				max-block-size: 50dvh;
				overflow-y: auto;
			}
		}

		.frameworks .item {
			display: grid;
			grid-template-columns: 1em auto;
			gap: 0.5em;
			align-items: center;
		}

		.frameworks summary .item {
			display: inline-grid;
		}
	}

	@container body (inline-size < 30em) {
		#app {
			grid-template-columns: 1fr;
		}

		aside {
			block-size: auto;
			overflow: visible;
			background-color: transparent;

			.groups {
				display: none;
			}
		}

		h3 {
			position: static;
		}
	}
`)

    document.adoptedStyleSheets.push(piceStyle, highlightStyle, appStyle)
    document.body.append(App().element)
})
