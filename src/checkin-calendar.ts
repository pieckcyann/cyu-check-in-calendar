import { TagCache } from "./../node_modules/obsidian/obsidian.d";
import { ItemView, WorkspaceLeaf, TFile, Notice, TextFileView } from "obsidian";
import MyPlugin from "./main";
import { NewTaskModal } from "./model/new-task-modal";

export const VIEW_TYPE_CHECK_IN_CALENDAR = "checkin-calendar-view";

// export class CheckInCalendar-View extends ItemView {
interface TaskData {
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

	// 实现
	getViewType(): string {
		return VIEW_TYPE_CHECK_IN_CALENDAR; // 返回你定义的视图类型常量
	}

	// 实现
	getViewData(): string {
		return this.file ? this.file.path : ""; // 使用空字符串代替 null
	}

	// 实现
	setViewData(data: string, clear: boolean): void {
		this.taskData = JSON.parse(data) as TaskData[];

		const container = this.containerEl.children[1];

		// 根据任务数据恢复任务和打卡状态
		this.taskData.forEach((task) => {
			// 检查任务是否已添加，如果已添加则跳过
			if (container.querySelector(`[data-id='${task.id}']`)) return;

			const calendar = this.createCalendar(task);
			container.appendChild(calendar);

			// 恢复任务的打卡状态
			const calendarDiv = calendar.querySelector(
				".CheckInCalendar-Records"
			);
			if (!calendarDiv) return; // 如果没有找到 calendarDiv

			task.completedDates.forEach((date) => {
				const dayEl = calendarDiv.querySelector(
					`[aria-label='${date}']`
				);
				if (dayEl) {
					dayEl.classList.add("CheckInCalendar-Record_completed");
				}
			});
		});
	}

	// 实现
	clear(): void {
		this.containerEl.empty();
		this.file = null;
	}

	async saveTaskData(taskData: TaskData[]): Promise<void> {
		const file = this.file as TFile;
		const filePath = file.path;
		const jsonData = JSON.stringify(taskData, null, 2); // 格式化为 JSON 字符串

		try {
			await this.app.vault.modify(file, jsonData); // 保存数据到文件
			// new Notice("任务数据已保存!");
		} catch (error) {
			// new Notice("保存文件失败!");
			console.error("保存文件失败:", error);
		}
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass("CheckInCalendar-Container");

		const addButton = container.createEl("button", {
			text: "添加任务",
			cls: "CheckInCalendar-AddButton",
		});

		addButton.onclick = () => {
			new NewTaskModal(this.app, (taskName: string) => {
				// 创建一个新的 TaskData 对象
				const taskData: TaskData = {
					taskName, // 任务名称
					completedDates: [], // 默认没有完成的日期
					id: this.generateTaskId(), // 生成一个唯一的 ID
				};

				// 创建日历并传递 TaskData 对象
				const calendar = this.createCalendar(taskData);
				container.appendChild(calendar);
			}).open();
		};
	}

	// 添加生成唯一 ID 的方法
	generateTaskId(): string {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
			/[xy]/g,
			function (c) {
				const r = (Math.random() * 16) | 0,
					v = c === "x" ? r : (r & 0x3) | 0x8;
				return v.toString(16);
			}
		);
	}

	createCalendar(task: TaskData): HTMLElement {
		const taskWrapper = document.createElement("div");
		taskWrapper.className = "CheckInCalendar-Item";
		taskWrapper.setAttribute("data-id", task.id); // 为每个任务添加唯一标识符

		const taskDiv = taskWrapper.createDiv("CheckInCalendar-Task");
		const titleDiv = taskDiv.createDiv("CheckInCalendar-TaskTitle");
		const checkbox = titleDiv.createEl("input", { type: "checkbox" });
		checkbox.checked = false;
		titleDiv.createEl("span", { text: task.taskName });

		const overviewEl = taskDiv.createDiv(
			"CheckInCalendar-TaskOverview",
			(el) => {
				el.textContent = "Checked 0 times";
			}
		);

		const calendarDiv = taskWrapper.createDiv("CheckInCalendar-Records");

		["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].forEach((day) =>
			calendarDiv.createDiv("CheckInCalendar-Record-Weekday", (el) => {
				el.textContent = day;
			})
		);

		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const startWeekday = (firstDay.getDay() + 6) % 7;

		for (let i = 0; i < startWeekday; i++) {
			calendarDiv.createDiv("CheckInCalendar-Record_empty");
		}

		for (let d = 1; d <= lastDay.getDate(); d++) {
			const dateStr = `${year}-${String(month + 1).padStart(
				2,
				"0"
			)}-${String(d).padStart(2, "0")}`;
			const dayEl = calendarDiv.createDiv(
				"CheckInCalendar-Record",
				(el) => {
					el.textContent = String(d);
				}
			);
			dayEl.setAttr("aria-label", dateStr);

			dayEl.onclick = async () => {
				dayEl.classList.toggle("CheckInCalendar-Record_completed");

				// 查找对应 taskName 的任务数据
				let task = this.taskData.find(
					(t) => t.id === taskWrapper.getAttribute("data-id")
				);

				// 如果没有找到该任务，则创建一个新的任务对象
				if (!task) {
					const taskId = taskWrapper.getAttribute("data-id");
					if (!taskId) {
						console.error(
							"taskWrapper 缺少 data-id 属性，无法创建任务"
						);
						return taskWrapper;
					}

					task = {
						taskName: taskId,
						completedDates: [],
						id: taskId,
					};
					this.taskData.push(task); // 将新的任务添加到任务数据中
				}

				// 更新任务的完成日期
				if (
					dayEl.classList.contains(
						"CheckInCalendar-Record_completed"
					) &&
					!task.completedDates.includes(dateStr)
				) {
					task.completedDates.push(dateStr);
				} else if (
					!dayEl.classList.contains(
						"CheckInCalendar-Record_completed"
					) &&
					task.completedDates.includes(dateStr)
				) {
					task.completedDates = task.completedDates.filter(
						(date) => date !== dateStr
					);
				}

				// 保存更新后的任务数据
				await this.saveTaskData(this.taskData);

				// 实时更新计数
				const checkedCount = calendarDiv.querySelectorAll(
					".CheckInCalendar-Record_completed"
				).length;
				overviewEl.textContent = `Checked ${checkedCount} times`;
			};
		}

		return taskWrapper;
	}

	async onClose() {}
}
