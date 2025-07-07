import { App, Notice, TFile } from "obsidian";
import { TaskData } from "src/checkin-calendar";

export function createCalendar(
	app: App,
	file: TFile | null,
	task: TaskData,
	tasks: TaskData[]
): HTMLElement {
	const taskWrapper = document.createElement("div");
	taskWrapper.className = "CheckInCalendar-Item";
	taskWrapper.setAttribute("data-id", task.id); // 为每个任务添加唯一标识符

	const taskDiv = taskWrapper.createDiv("CheckInCalendar-Task");
	const titleDiv = taskDiv.createDiv("CheckInCalendar-TaskTitle");
	const checkbox = titleDiv.createEl("input", { type: "checkbox" });
	const titleSpan = titleDiv.createEl("span", { text: task.taskName });

	/* TODO 12个月的模态框
        titleSpan.onclick = () => {
            new AllYearModal(
                this.app,
                task,
                this.createCalendar.bind(this)
            ).open();
        };
        */

	const calendarDiv = taskWrapper.createDiv("CheckInCalendar-Records");

	const today = window.moment().format("YYYY-MM-DD");
	if (task.completedDates.includes(today)) {
		checkbox.checked = true;

		// 标记今日为已打卡（样式）
		const todayEl = calendarDiv.querySelector(`[aria-label='${today}']`);
		if (todayEl) {
			todayEl.classList.add("CheckInCalendar-Record_completed");
		}
	}

	// 点击打卡：为今天添加记录
	checkbox.addEventListener("change", async () => {
		const today = window.moment().format("YYYY-MM-DD");

		// 查找今天的日历元素
		const todayEl = calendarDiv.querySelector(
			`[aria-label='${today}']`
		) as HTMLElement;

		todayEl.click();

		if (checkbox.checked) {
			checkbox.checked = false;
			new Notice("今日打卡已取消", 1000);
		} else {
			checkbox.checked = true;
			new Notice("今日打卡成功！", 1000);
		}
	});

	const checkedCount = task.completedDates.length;

	// 过滤出本月的打卡记录
	const currentMonth = new Date().getMonth(); // 当前月份
	const currentYear = new Date().getFullYear(); // 当前年份

	const monthlyCheckedCount = task.completedDates.filter((dateStr) => {
		const date = new Date(dateStr);
		return (
			date.getMonth() === currentMonth &&
			date.getFullYear() === currentYear
		);
	}).length;

	const overviewEl = taskDiv.createDiv(
		"CheckInCalendar-TaskOverview",
		(el) => {
			el.innerHTML = `Checked <span style="color:#c9553e">${checkedCount}</span>, This month: <span style="color:#c9553e">${monthlyCheckedCount}</span>`;
		}
	);

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
		const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
			d
		).padStart(2, "0")}`;
		const dayEl = calendarDiv.createDiv("CheckInCalendar-Record", (el) => {
			el.textContent = String(d);
		});
		dayEl.setAttr("aria-label", dateStr);

		dayEl.onclick = async () => {
			dayEl.classList.toggle("CheckInCalendar-Record_completed");

			// 查找今天的日历元素
			const todayEl = calendarDiv.querySelector(
				`[aria-label='${window.moment().format("YYYY-MM-DD")}']`
			);

			if (dayEl == todayEl) checkbox.checked = !checkbox.checked;

			// 查找对应 taskName 的任务数据
			let task = tasks.find(
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
				tasks.push(task); // 将新的任务添加到任务数据中
			}

			// 更新任务的完成日期
			if (
				dayEl.classList.contains("CheckInCalendar-Record_completed") &&
				!task.completedDates.includes(dateStr)
			) {
				task.completedDates.push(dateStr);
			} else if (
				!dayEl.classList.contains("CheckInCalendar-Record_completed") &&
				task.completedDates.includes(dateStr)
			) {
				task.completedDates = task.completedDates.filter(
					(date) => date !== dateStr
				);
			}

			if (file) {
				// 保存更新后的任务数据
				await saveTaskData(app, file, tasks);
			}

			// // 实时更新计数
			const newMonthlyCheckedCount = calendarDiv.querySelectorAll(
				".CheckInCalendar-Record_completed"
			).length;

			const otherMonthly = checkedCount - monthlyCheckedCount;

			overviewEl.innerHTML = `Checked <span style="color:#c9553e">${
				otherMonthly + newMonthlyCheckedCount
			}</span>, This month: <span style="color:#c9553e">${newMonthlyCheckedCount}</span>`;
		};
	}

	// 恢复任务的打卡状态
	task.completedDates.forEach((date) => {
		const dayEl = calendarDiv.querySelector(`[aria-label='${date}']`);
		if (dayEl) {
			dayEl.classList.add("CheckInCalendar-Record_completed");
		}
	});

	return taskWrapper;
}

export async function saveTaskData(
	app: App,
	file: TFile | null,
	taskData: TaskData[]
): Promise<void> {
	if (!file) return;

	// 排序
	for (const task of taskData) {
		task.completedDates.sort(); // 日期格式是字符串，直接 sort 即可升序
	}

	// const filePath = file.path;
	const jsonData = JSON.stringify(taskData, null, 2); // 格式化为 JSON 字符串

	try {
		await app.vault.modify(file, jsonData); // 保存数据到文件
		new Notice("🍘文件已保存！");
	} catch (error) {
		new Notice("保存文件失败！点击控制台查看错误信息");
		console.error("保存文件失败:", error);
	}
}
