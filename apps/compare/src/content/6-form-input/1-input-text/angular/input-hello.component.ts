import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";

@Component({
	selector: "app-input-hello",
	standalone: true,
	imports: [CommonModule, FormsModule],
	template: `<p>{{ text }}</p>
		<input [(ngModel)]="text" />`,
})
export class InputHelloComponent {
	text = "";
}
