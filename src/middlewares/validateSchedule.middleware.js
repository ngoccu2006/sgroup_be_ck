const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function fail(res, message) {
  return res.status(400).json({ message });
}

function isValidDate(s) {
  return DATE_REGEX.test(s) && !isNaN(new Date(s).getTime())
    && new Date(s).toISOString().slice(0, 10) === s;
}
function isValidTime(s) {
  if (!TIME_REGEX.test(s)) return false;
  const [h, m, sec = "0"] = s.split(":").map(Number);
  return h <= 23 && m <= 59 && sec <= 59;
}


// POST: bắt buộc đủ 4 field
function validateCreateSchedule(req, res, next) {
  const { title, lesson_id, session_date, start_time, end_time } = req.body ?? {};
  if ((!title && !lesson_id) || !session_date || !start_time || !end_time) {
    return fail(res, "Cần title (hoặc lesson_id), session_date, start_time và end_time!");
  }
  return checkFormat(req.body, res, next);
}

// PATCH: field nào có gửi thì mới kiểm tra
function validateUpdateSchedule(req, res, next) {
  return checkFormat(req.body ?? {}, res, next);
}

function checkFormat(body, res, next) {
  const { session_date, start_time, end_time } = body;

  if (body.title !== undefined && !String(body.title).trim()) {
  return fail(res, "title không được để trống!");
  }
  if (session_date !== undefined && !isValidDate(session_date)) {
    return fail(res, "session_date phải có dạng YYYY-MM-DD!");
  }
  if (start_time !== undefined && !isValidTime(start_time)) {
    return fail(res, "start_time phải có dạng HH:MM hoặc HH:MM:SS!");
  }
  if (end_time !== undefined && !isValidTime(end_time)) {
    return fail(res, "end_time phải có dạng HH:MM hoặc HH:MM:SS!");
  }
  next();
}

export default { validateCreateSchedule, validateUpdateSchedule };
