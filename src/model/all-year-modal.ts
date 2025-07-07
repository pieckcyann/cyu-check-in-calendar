import { Modal, App } from "obsidian";
import { CheckInCalendarView, TaskData } from "src/checkin-calendar";

export class AllYearModal extends Modal {
	task: TaskData;
	createCalendar: (task: TaskData) => HTMLElement;

	constructor(
		app: App,
		task: TaskData,
		createCalendar: (task: TaskData) => HTMLElement
	) {
		super(app);
		this.task = task;
		this.createCalendar = createCalendar;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: `任务：${this.task.taskName}` });

		const calendarWrapper = contentEl.createDiv(
			"CheckInCalendar-YearWrapper"
		);

		const now = new Date();
		const currentYear = now.getFullYear();

		for (let month = 0; month < 12; month++) {
			// 临时构造一个新 task，用于渲染对应月份
			const filteredDates = this.task.completedDates.filter((dateStr) => {
				const date = new Date(dateStr);
				return (
					date.getFullYear() === currentYear &&
					date.getMonth() === month
				);
			});

			const monthTask: TaskData = {
				...this.task,
				completedDates: filteredDates,
			};

			const monthCalendar = this.createCalendar(monthTask);
			monthCalendar.prepend(
				createEl("h3", {
					text: `${currentYear}-${String(month + 1).padStart(
						2,
						"0"
					)}`,
				})
			);
			calendarWrapper.appendChild(monthCalendar);
		}
	}

	onClose() {
		this.contentEl.empty();
	}
}
