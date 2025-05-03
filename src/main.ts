import { Plugin, TFile, WorkspaceLeaf } from "obsidian";
import {
	CheckInCalendarView,
	VIEW_TYPE_CHECK_IN_CALENDAR,
} from "./checkin-calendar";

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

		this.registerExtensions(["cyu"], VIEW_TYPE_CHECK_IN_CALENDAR);

		// this.registerEvent(
		// 	this.app.workspace.on("file-open", async (file) => {
		// 		if (file instanceof TFile && file.extension === "cyu") {
		// 			await this.openCustomView(file);
		// 		}
		// 	})
		// );
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
