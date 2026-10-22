import ExcelJS from "exceljs";
import analyticsRepository from "../repositories/analytics.repository.js";

async function getAssignmentsSummary(classId) {
  return await analyticsRepository.getAssignmentsSummaryByClass(classId);
}

async function getMembersGpa(classId) {
  return await analyticsRepository.getMembersGpaByClass(classId);
}

// Service tạo và stream file Excel về response
async function exportClassGradesExcel(classId) {
  const membersGpa = await analyticsRepository.getMembersGpaByClass(classId);
  const assignmentsSummary = await analyticsRepository.getAssignmentsSummaryByClass(classId);
  const gradeMatrix = await analyticsRepository.getClassGradeMatrix(classId);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Bảng Điểm Lớp Học");

  // Định nghĩa các cột cho file Excel
  const columns = [
    { header: "STT", key: "stt", width: 8 },
    { header: "Họ và Tên", key: "full_name", width: 25 },
    { header: "Email", key: "email", width: 30 },
  ];

  // Thêm động các cột Assignment vào Excel
  assignmentsSummary.forEach((asg) => {
    columns.push({ header: `${asg.assignment_title} (Max: ${asg.maximum_score})`, key: asg.assignment_id, width: 22 });
  });

  // Cột GPA tổng kết
  columns.push({ header: "Điểm TB (GPA)", key: "gpa", width: 15 });

  worksheet.columns = columns;

  // Điền dữ liệu cho từng Member
  membersGpa.forEach((member, index) => {
    const rowData = {
      stt: index + 1,
      full_name: member.full_name,
      email: member.email,
      gpa: member.gpa !== null ? parseFloat(member.gpa) : "Chưa có điểm",
    };

    // Ánh xạ điểm số của bài tập tương ứng
    gradeMatrix
      .filter((item) => item.member_id === member.member_id)
      .forEach((item) => {
        rowData[item.assignment_id] = item.score !== null ? parseFloat(item.score) : "Chưa nộp/Chưa chấm";
      });

    worksheet.addRow(rowData);
  });

  // Style Header cho file Excel đẹp mắt
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1F4E78" },
  };

  return workbook;
}

const analyticsService = {
  getAssignmentsSummary,
  getMembersGpa,
  exportClassGradesExcel,
};

export default analyticsService;