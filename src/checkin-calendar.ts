import { TagCache } from "./../node_modules/obsidian/obsidian.d";
import { ItemView, WorkspaceLeaf, TFile, Notice, TextFileView } from "obsidian";
import MyPlugin from "./main";
import { NewTaskModal } from "./model/new-task-modal";
import { AllYearModal } from "./model/all-year-modal";
import { nanoid } from "nanoid";
import { createCalendar, saveTaskData } from "./model/creatCalendar";
export const VIEW_TYPE_CHECK_IN_CALENDAR = "checkin-calendar-view";

export interface TaskData {
	taskName: string;
	completedDates: string[]; // 存储已完成打卡的日期
	id: string; // 每个任务的唯一标识符
}

export class CheckInCalendarView extends TextFileView {
	plugin: MyPlugin;
	taskData: TaskData[];

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getIcon(): string {
		return "calendar";
	}

	getDisplayText() {
		return this.file?.basename || "Kanban";
	}

	// 实现
	getViewType(): string {
		return VIEW_TYPE_CHECK_IN_CALENDAR; // 返回你定义的视图类型常量
	}

	// 实现
	getViewData(): string {
		// return this.file ? this.file.path : ""; // 使用空字符串代替 null
		return "";
	}

	// 实现
	setViewData(data: string, clear: boolean): void {
		this.taskData = JSON.parse(data) as TaskData[];

		const container = this.containerEl.children[1];
		const calendarContainer = container.querySelector(
			".CheckInCalendar-Container"
		);
		if (!calendarContainer) return;

		// 根据任务数据恢复任务和打卡状态
		this.taskData.forEach((task) => {
			// 检查任务是否已添加，如果已添加则跳过
			if (container.querySelector(`[data-id='${task.id}']`)) return;

			const file = this.app.workspace.getActiveFile();
			const calendar = createCalendar(
				this.app,
				file,
				task,
				this.taskData
			);
			calendarContainer.appendChild(calendar);
		});
	}

	// 实现
	clear(): void {
		this.containerEl.empty();
		this.file = null;
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();

		// 添加顶部 bar
		const topBar = container.createDiv("CheckInCalendar-TopBar");

		const addButton = topBar.createEl("button", {
			text: "添加打卡事件",
			cls: ["CheckInCalendar-AddButton", "mod-cta"],
		});

		addButton.onclick = () => {
			new NewTaskModal(this.app, (taskName: string) => {
				const taskData: TaskData = {
					taskName,
					completedDates: [],
					id: this.generateTaskId(),
				};
				const file = this.app.workspace.getActiveFile();

				const calendar = createCalendar(
					this.app,
					file,
					taskData,
					this.taskData
				);

				calendarContainer.appendChild(calendar);
				this.taskData.push(taskData);
				saveTaskData(this.app, file, this.taskData);
			}).open();
		};

		/* TODO 删除按钮
		const deleteButton = topBar.createEl("button", {
			text: "删除打卡事件",
			cls: ["CheckInCalendar-DeleteButton", "mod-warning"],
		});

		deleteButton.onclick = () => {
		};
		*/

		// 创建 grid 容器
		const calendarContainer = container.createDiv(
			"CheckInCalendar-Container"
		);
	}

	generateTaskId(): string {
		return nanoid(6); // 例如返回 'aB3xYz'
	}

	// 添加生成唯一 ID 的方法
	// generateTaskId(): string {
	// 	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
	// 		/[xy]/g,
	// 		function (c) {
	// 			const r = (Math.random() * 16) | 0,
	// 				v = c === "x" ? r : (r & 0x3) | 0x8;
	// 			return v.toString(16);
	// 		}
	// 	);
	// }

	async onClose() {}
}
