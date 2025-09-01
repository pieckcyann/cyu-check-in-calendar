import { Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import {
	CheckInCalendarView,
	TaskData,
	VIEW_TYPE_CHECK_IN_CALENDAR,
} from "./checkin-calendar";
import { createCalendar } from "./model/creatCalendar";

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_CHECK_IN_CALENDAR,
			(leaf: WorkspaceLeaf) => new CheckInCalendarView(leaf, this)
		);

		this.registerExtensions(["ccc"], VIEW_TYPE_CHECK_IN_CALENDAR);

		// this.registerEvent(
		// 	this.app.workspace.on("file-open", async (file) => {
		// 		if (file instanceof TFile && file.extension === "cyu") {
		// 			await this.openCustomView(file);
		// 		}
		// 	})
		// );

		// this.app.workspace.onLayoutReady(() => {
		this.registerMarkdownPostProcessor((el: HTMLElement) => {
			el.querySelectorAll(`[src*=".cyu#^"]`).forEach(async (fileDiv) => {
				// if (!el.classList.contains(".file-embed")) return;
				// fileDiv.remove();
				const newDiv = document.createElement("div");
				newDiv.classList.add("CheckInCalendar-FileEmbed");
				fileDiv.parentNode?.replaceChild(newDiv, fileDiv);

				await this.createCheckInEmdbed("Learning", "f6x7yx", newDiv);
			});
		});
		// });

		// 在插件的 onload() 中注册监听
		// this.registerEvent(
		// 	this.app.vault.on("modify", (file) => {
		// 		if (file instanceof TFile && file.extension === "cyu") {
		// 			new Notice(`修改了 .cyu 文件：${file.path}`);
		// 			// 你的处理逻辑
		// 		}
		// 	})
		// );
	}

	async createCheckInEmdbed(
		basename: string,
		taskId: string,
		container: HTMLElement
	) {
		const cyuFile = this.app.vault
			.getFiles()
			.find(
				(file) =>
					file.extension === "cyu" && file.name === `${basename}.cyu`
			);

		if (!cyuFile) {
			new Notice(`${basename}.cyu not found.`);
			console.warn(`${basename}.cyu not found.`);
			return;
		}

		const content = await this.app.vault.read(cyuFile);

		if (!content) return;

		const tasks = JSON.parse(content) as TaskData[];
		const task = tasks.find((task) => task.id === taskId);

		if (!task) return;

		const calendar = createCalendar(this.app, cyuFile, task, tasks);

		container.appendChild(calendar);

		return task;
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
