const fileRegex = /\.(ts)$/

export function masterTsPreprocessor() {
	return {
		name: "transform-file",

		transform(src, id) {
			if (!fileRegex.test(id)) return
			return {
				code: convertHtmlTemplatestoCachedHtmlTemplates(src),
				map: null, // provide source map if available
			}
		},
	}
}

/**
 * Add import to file if it doesn't exist
 * if the import exists, add the statement to the existing import
 * @param {string} src - source code
 * @param {string} from - import from
 * @param {string} importStatement - import statement
 * @returns {string} - source code with the import added
 * @example addImport(src, "master-ts/library/template/cache", "createCachedHtml")
 */
function addImport(src, from, importStatement) {
	const importRegex = new RegExp(`import {${importStatement}} from "${from}"`)
	const importExists = importRegex.test(src)
	if (importExists) {
		src = src.replace(importRegex, `import {$1, ${importStatement}} from "${from}"`)
	} else {
		src = `import {${importStatement}} from "${from}"\n${src}`
	}
	return src
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
	Finds all the html templates in the source code and converts them to cached html templates
	html template is html`<div>hello</div>` replace it with html1`<div>hello</div>` 1 is the index number, every match has their own index number
	and define the cache at the top of the file with const html1 = createCachedHtml()
	@param {string} src - source code
	@returns {string} - source code with all the html templates converted to cached html templates
 */
function convertHtmlTemplatestoCachedHtmlTemplates(src) {
	// find all the html templates in the source code
	const htmlTemplates = src.match(/html`[^`]*`/g)
	if (htmlTemplates) {
		// add import to file if it doesn't exist
		src = addImport(src, "master-ts/library/template/cache", "createCachedHtml")
		// for each template
		for (let i = 0; i < htmlTemplates.length; i++) {
			// replace html` with html1`
			src = src.replace(htmlTemplates[i], htmlTemplates[i].replace("html`", `html${i}\``))

			// define the cache at the top of the file
			src = addToTop(src, `const html${i} = createCachedHtml()`)
		}
	}

	return src
}
