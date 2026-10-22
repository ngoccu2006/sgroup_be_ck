import analyticsService from "../services/analytics.service.js";

async function getAssignmentsSummary(req, res, next) {
  try {
    const { classId } = req.params;
    const summary = await analyticsService.getAssignmentsSummary(classId);
    res.status(200).json({ data: summary });
  } catch (error) {
    next(error);
  }
}

async function getMembersGpa(req, res, next) {
  try {
    const { classId } = req.params;
    const gpaData = await analyticsService.getMembersGpa(classId);
    res.status(200).json({ data: gpaData });
  } catch (error) {
    next(error);
  }
}

async function exportClassGradesExcel(req, res, next) {
  try {
    const { classId } = req.params;
    const workbook = await analyticsService.exportClassGradesExcel(classId);

    // Set header để browser hiểu đây là file Excel tải về (.xlsx)
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Bang_Diem_Lop_${classId}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
}

const analyticsController = {
  getAssignmentsSummary,
  getMembersGpa,
  exportClassGradesExcel,
};

export default analyticsController;