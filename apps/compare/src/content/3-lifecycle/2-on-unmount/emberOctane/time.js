import { registerDestructor } from "@ember/destroyable";
import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";

export default class Time extends Component {
	@tracked
	time = new Date().toLocaleTimeString();

	constructor(owner, args) {
		super(owner, args);

		let timer = setInterval(() => {
			this.time = new Date().toLocaleTimeString();
		}, 1000);

		registerDestructor(this, () => clearInterval(timer));
	}
}
