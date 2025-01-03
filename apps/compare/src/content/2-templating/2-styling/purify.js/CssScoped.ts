import { tags } from "@purifyjs/core";
import { css, useScope } from "./util-css";

const { div, h1, button } = tags;

export function CssStyle() {
	return div()
		.effect(useScope(CssStyleCss))
		.children(
			h1({ class: "title" }).textContent("I am red"),
			button({
				style: "font-size: 10rem",
			}).textContent("I am a button"),
		);
}

const CssStyleCss = css`
	.title {
		color: red;
	}
`;
