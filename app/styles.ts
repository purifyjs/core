import { css } from "../lib/extra/css"

export const commonStyle = css`
	*,
	*::before,
	*::after {
		box-sizing: border-box;
	}
`

document.adoptedStyleSheets.push(
	css`
		:root {
			font-family: "Open Sans Light", Helvetica;
			line-height: 1.5;
			letter-spacing: 0.05ch;
			color-scheme: dark;

			scroll-behavior: smooth;
			text-rendering: optimizeLegibility;
			font-smooth: always;
		}

		:root {
			--primary: #eb3f33;
			--secondary: #a1e694;
			--body: #1c1b22;
			background-color: var(--body);
		}
	`
)
