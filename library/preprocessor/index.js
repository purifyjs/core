const fileRegex = /\.(ts)$/

export function masterTsPreprocessor() {
	return {
		name: "transform-file",

		transform(src, id) {
			if (!fileRegex.test(id)) return
			return {
				code: preprocess(src),
				map: null, // provide source map if available
			}
		},
	}
}

/** 
	Finds all the html templates in the source code and converts them to cached html templates
	html template is html`<div>hello</div>` replace it with __html0`<div>hello</div>` 0 is the index number, every match has their own index number
	and define the cache at the top of the file with const __html0 = createCachedHtml()
	check if file imports `html` from `master-ts/library/template check if `html` is changed using as 
	@param {string} src - source code
	@returns {string} - source code with all the html templates converted to cached html templates
 */
function preprocess(src) {
	const htmlTemplateName = findImportStatement(src, "master-ts/library/template", "html")
	if (!htmlTemplateName) return src

	const htmlTemplateRegex = new RegExp(`${htmlTemplateName}\`[^]*?\``, "g")
	if (!htmlTemplateRegex.test(src)) return src

	// add the import to the top of the file
	const addedImport = addImport(src, "master-ts/library/template/cache", "createCachedHtml")
	src = addedImport.src
	const createCachedHtml = addedImport.statement

	let cachers = 0

	src = src.replace(htmlTemplateRegex, (htmlTemplate, index) => {
		const htmlTemplateContent = htmlTemplate.slice(htmlTemplateName.length + 1, -1)
		return `__html${cachers++}\`${minifyHtml(htmlTemplateContent)}\``
	})

	// add the cachers to the top of the file
	for (let i = 0; i < cachers; i++) {
		src = addToTop(src, `const __html${i} = ${createCachedHtml}()`)
	}

	src = findCssTemplatesAndOptimize(src)

	return src
}

/**
 * @param {string} src - source code
 * @returns {string} - source code with all the css templates converted to optimized css
 */
function findCssTemplatesAndOptimize(src) {
	const cssTemplateName = findImportStatement(src, "master-ts/library/template/css", "css")
	if (!cssTemplateName) return src

	const cssTemplateRegex = new RegExp(`${cssTemplateName}\`[^]*?\``, "g")
	if (!cssTemplateRegex.test(src)) return src

	src = src.replace(cssTemplateRegex, (cssTemplate, index) => {
		const cssTemplateContent = cssTemplate.slice(cssTemplateName.length + 1, -1)
		return `${cssTemplateName}\`${minifyCss(cssTemplateContent)}\``
	})

	return src
}

/**
 * Add import to file if it doesn't exist
 * if the import exists, and statement doesn't exist, add the statement to the import
 *
 * So for example addImport(src, "master-ts/library/template/cache", "createCachedHtml") will add
 * import { createCachedHtml } from "master-ts/library/template/cache"
 * But if:
 * `import { createCachedHtml } from "master-ts/library/template/cache"` already exists, will keep the src the same and return `createCachedHtml`
 * `import { createCachedHtml, foo } from "master-ts/library/template/cache"` already exists, will keep the src the same and return `createCachedHtml`
 * `import { createCachedHtml as bar, foo } from "master-ts/library/template/cache"` already exists, will keep the src the same and return `bar`
 *
 * Returns { src: string, statement: string }
 * @param {string} src - source code
 * @param {string} from - import from
 * @param {string} importStatement - import statement
 * @returns {{ src: string, statement: string }} - source code with the import added and the import statement
 * @example addImport(src, "master-ts/library/template/cache", "createCachedHtml")
 */
function addImport(src, from, importStatement) {
	// find the import
	const importRegex = new RegExp(`import\\s*\\{\\s*([^}]+)\\s*\\}\\s*from\\s*["']${from}["']`, "g")
	const importMatch = src.match(importRegex)
	if (importMatch) {
		// find the statement
		const statementRegex = new RegExp(`\\s*${importStatement}\\s*(as\\s*\\w+)?\\s*`, "g")
		const statementMatch = importMatch[0].match(statementRegex)
		if (statementMatch) {
			// return the statement name
			const statementName = statementMatch[0]
				.replace(/(as\s*)?(\w+)/, "$2")
				.split(" as ")
				.map((s) => s.trim())
			return { src, statement: statementName[statementName.length - 1] }
		} else {
			// add the statement to the import
			const importIndex = src.indexOf(importMatch[0])
			const importEndIndex = importIndex + importMatch[0].length
			src = `${src.slice(0, importEndIndex - 1)}, ${importStatement}${src.slice(importEndIndex - 1)}`
			return { src, statement: importStatement }
		}
	} else {
		// add the import to the top of the file
		src = `import { ${importStatement} } from "${from}"\n${src}`
		return { src, statement: importStatement }
	}
}

/**
 * Add a code to the top of the file after the imports
 * @param {string} src - source code
 * @param {string} code - code to add
 * @returns {string} - source code with the code added
 * @example addToTop(src, "const html1 = createCachedHtml()")
 */
function addToTop(src, code) {
	// find the first line that doesn't start with import
	const firstLine = src.match(/^(?!import).*$/m)[0]
	// find the index of the first line that doesn't start with import
	const firstLineIndex = src.indexOf(firstLine)
	// add the code to the top of the file
	src = `${src.slice(0, firstLineIndex)}${code}\n${src.slice(firstLineIndex)}`
	return src
}

/**
 * Check if the file includes the import and import includes the statement and return the statement
 * If the import doesn't exist, return null

 * @param {string} src - source code
 * @param {string} from - import from
 * @param {string} importStatement - import statement
 * @returns {string} - import statement name
 * @example findImportName(src, "master-ts/library/template", "html")
 */
function findImportStatement(src, from, importStatement) {
	// find the import
	const importRegex = new RegExp(`import\\s*\\{\\s*([^}]+)\\s*\\}\\s*from\\s*["']${from}["']`, "g")
	const importMatch = src.match(importRegex)
	if (!importMatch) return null

	// find the statement
	const statementRegex = new RegExp(`\\s*${importStatement}\\s*(as\\s*\\w+)?\\s*`, "g")
	const statementMatch = importMatch[0].match(statementRegex)
	if (!statementMatch) return null

	// return the statement name
	const statementName = statementMatch[0]
		.replace(/(as\s*)?(\w+)/, "$2")
		.split(" as ")
		.map((s) => s.trim())
	return statementName[statementName.length - 1]
}

/**
 * Minify the HTML
 * @param {string} html - html code
 * @returns {string} - minified html code
 */
function minifyHtml(html) {
	html = html.trim()

	let result = ""

	let currentQuote = []

	function isQuote(char) {
		return char === "'" || char === '"' || char === "`"
	}

	function isWhitespace(char) {
		return /\s/.test(char)
	}

	for (let i = 0; i < html.length; i++) {
		const char = html[i]
		const prevChar = html[i - 1]

		if (isQuote(char) && prevChar !== "\\") {
			if (char === currentQuote[currentQuote.length - 1]) {
				currentQuote.pop()
			} else {
				currentQuote.push(char)
			}

			result += char
			continue
		}

		if (isWhitespace(char) && isWhitespace(prevChar) && currentQuote.length === 0) continue

		result += char
	}

	return result
}

/**
 * Minify the CSS
 * @param {string} css - css code
 * @returns {string} - minified css code
 */
function minifyCss(css) {
	// remove all whitespace that is not inside a string
	css = css.replace(/([^"'])(\s+)/g, "$1 ")

	return css
}
