import { service } from "@ember/service";
import Component from "@glimmer/component";

export default class UserProfileComponent extends Component {
	@service
	userService;

	get user() {
		return this.userService.user;
	}
}
