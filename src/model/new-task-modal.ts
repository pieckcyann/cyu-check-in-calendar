import { Modal, App, Setting } from "obsidian";

export class NewTaskModal extends Modal {
	onSubmit: (taskName: string) => void;

	constructor(app: App, onSubmit: (taskName: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "添加任务" });

		let taskName = "";
		new Setting(contentEl)
			.setName("任务名称")
			.addText((text) => text.onChange((value) => (taskName = value)));

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("完成")
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(taskName);
				})
		);
	}

	onClose() {
		this.contentEl.empty();
	}
}
