import scheduleService from "../services/schedule.service.js";
import { parsePaginationParams } from "../utils/pagination.js";

async function createSchedule(req, res, next) {
  try {
    const schedule = await scheduleService.createSchedule(req.params.classId, req.body, req.user);
    res.status(201).json({ message: "Tạo lịch học thành công!", data: schedule });
  } catch (error) {
    next(error);
  }
}

async function getSchedulesByClass(req, res, next) {
  try {
    const paginationParams = parsePaginationParams(req.query, {
      allowedSortFields: ["session_date", "start_time", "created_at"],
      defaultSortBy: "session_date",
      defaultSortOrder: "ASC",
    });
    const { schedules, pagination } = await scheduleService.getSchedulesByClass(
      req.params.classId, req.user, paginationParams
    );
    res.status(200).json({ data: schedules, pagination });
  } catch (error) {
    next(error);
  }
}

async function updateSchedule(req, res, next) {
  try {
    const schedule = await scheduleService.updateSchedule(req.params.id, req.body, req.user);
    res.status(200).json({ message: "Cập nhật lịch học thành công!", data: schedule });
  } catch (error) {
    next(error);
  }
}

async function deleteSchedule(req, res, next) {
  try {
    await scheduleService.deleteSchedule(req.params.id, req.user);
    res.status(200).json({ message: "Xoá lịch học thành công!" });
  } catch (error) {
    next(error);
  }
}

const scheduleController = {
  createSchedule,
  getSchedulesByClass,
  updateSchedule,
  deleteSchedule,
};

export default scheduleController;
