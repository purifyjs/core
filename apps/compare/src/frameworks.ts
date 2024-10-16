const contentImports = import.meta.glob("./content/*/**/*", {
    query: "?raw",
    import: "default"
})
const iconImports = import.meta.glob("./icons/**/*", {
    query: "?url",
    import: "default"
})

export type Framework = {
    label: string
    iconSrc: string
    groups: Record<string, Framework.Group>
}
export namespace Framework {
    export type Group = {
        label: string
        examples: Record<string, Example>
    }
    export type Example = {
        label: string
        files: CodeFile[]
    }
    export type CodeFile = {
        name: string
        content: string
    }
}

export async function getFrameworks() {
    const frameworks: Record<string, Framework> = {}

    function toLabel(key: string): string {
        return key
            .split("-")
            .slice(1)
            .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
            .map((word) => (word.toLowerCase() === "webapp" ? "WebApp" : word))
            .join(" ")
    }

    const prefix = "./content/"
    for (const path in contentImports) {
        const importer = contentImports[path]
        const cleanPath = path.slice(prefix.length)
        const [group, example, framework, file] = cleanPath.split("/")

        const iconPath = `./icons/${
            framework.startsWith("ember") ? "ember" : framework.replace(/[0-9]/g, "")
        }.svg`
        const iconImport = iconImports[iconPath]
        if (!iconImport) {
            throw new Error(`Framework icon not found: ${framework}`)
        }
        const iconSrc = String(await iconImport())

        const content = await importer().then(String)

        // Should be synchronous, because we check if record is empty

        frameworks[framework] ??= {
            label: `${framework[0].toUpperCase()}${framework.slice(1)}`,
            iconSrc,
            groups: {}
        }
        frameworks[framework].groups[group] ??= {
            label: toLabel(group),
            examples: {}
        }
        frameworks[framework].groups[group].examples[example] ??= {
            label: toLabel(example),
            files: []
        }
        frameworks[framework].groups[group].examples[example].files.push({
            name: file,
            content
        })
    }
    return frameworks
}
