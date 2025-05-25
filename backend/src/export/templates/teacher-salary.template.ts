export function renderTeacherSalaryHTML(teacher: any) {
  function vnd(val: number) {
    return (Math.round(val ?? 0)).toLocaleString('vi-VN').replace(/\s/g, '') + 'đ';
  }
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return `
    <html>
    <head>
      <style>
        body { font-family: Arial; background: #fff; }
        #receipt-root {
          width: 1240px;
          min-height: 1754px;
          background: #fff;
          margin: 40px auto;
          box-shadow: 0 4px 32px #bbb;
          padding: 48px 40px;
          box-sizing: border-box;
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #000; padding: 10px; font-size: 20px; }
        th { background: #eee; }
        .bold { font-weight: bold; }
        .center { text-align: center; }
        .right { text-align: right; }
        .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .header-left { font-size:28px; font-weight:bold; }
        .header-right { font-size:22px; font-weight:bold; text-transform:uppercase; }
        .salary-title { font-size:32px; font-weight:bold; text-align:center; margin-bottom: 8px; }
        .salary-month { text-align:center; font-size:22px; margin-bottom: 16px; }
        .info-table td { border: 1px solid #000; font-size:20px; }
        .info-table { margin-bottom: 16px; }
        .total-row { font-weight: bold; }
      </style>
    </head>
    <body>
      <div id="receipt-root">
        <div class="header-row">
          <div class="header-left">MẦM NON MONKIDS</div>
          <div class="header-right">SỐ: ${teacher.teacher_no ?? ''}</div>
        </div>
        <div class="salary-title">PHIẾU LƯƠNG GIÁO VIÊN</div>
        <div class="salary-month">Tháng ${month} Năm ${year}</div>
        <br/>
        <table class="info-table">
          <tr><td>Họ tên:</td><td>${teacher.name ?? ''}</td></tr>
          <tr><td>Chức vụ:</td><td>${teacher.role ?? ''}</td></tr>
          <tr><td>SDT:</td><td>${teacher.phone || ''}</td></tr>
        </table>
        <table>
          <tr>
            <th>Nội dung</th>
            <th>Chi tiết</th>
            <th>Thành tiền</th>
          </tr>
          <tr>
            <td rowspan="3">Mức lương cơ bản</td>
            <td>Lương cơ bản</td>
            <td class="right">${vnd(teacher.base_salary)}</td>
          </tr>
          <tr>
            <td>Số ngày dạy</td>
            <td class="right">${teacher.teaching_days ?? 0}</td>
          </tr>
          <tr>
            <td>Số ngày nghỉ</td>
            <td class="right">${teacher.absence_days ?? 0}</td>
          </tr>
          <tr>
            <td colspan="2">Lương nhận được</td>
            <td class="right">${vnd(teacher.received_salary)}</td>
          </tr>
          <tr>
            <td rowspan="2">Mức lương dạy thêm</td>
            <td>Số ngày dạy thêm</td>
            <td class="right">${teacher.extra_teaching_days ?? 0}</td>
          </tr>
          <tr>
            <td>Lương dạy thêm</td>
            <td class="right">${vnd(teacher.extra_salary)}</td>
          </tr>
          <tr>
            <td rowspan="3">Phụ cấp</td>
            <td>Hỗ trợ bảo hiểm</td>
            <td class="right">${vnd(teacher.insurance_support)}</td>
          </tr>
          <tr>
            <td>Hỗ trợ trách nhiệm</td>
            <td class="right">${vnd(teacher.responsibility_support)}</td>
          </tr>
          <tr>
            <td>Hỗ trợ xăng xe</td>
            <td class="right">${vnd(teacher.breakfast_support)}</td>
          </tr>
          <tr>
            <td rowspan="2">Dạy KNS</td>
            <td>Số buổi dạy</td>
            <td class="right">${teacher.skill_sessions ?? 0}</td>
          </tr>
          <tr>
            <td>Tiền dạy</td>
            <td class="right">${vnd(teacher.skill_salary)}</td>
          </tr>
          <tr>
            <td rowspan="2">Dạy TA</td>
            <td>Số buổi dạy</td>
            <td class="right">${teacher.english_sessions ?? 0}</td>
          </tr>
          <tr>
            <td>Tiền dạy</td>
            <td class="right">${vnd(teacher.english_salary)}</td>
          </tr>
          <tr>
            <td>Thưởng HS đi mới</td>
            <td></td>
            <td class="right">${vnd(teacher.new_students_list)}</td>
          </tr>
          <tr>
            <td>Đã ứng</td>
            <td></td>
            <td class="right">${vnd(teacher.paid_amount)}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2">Tổng lương</td>
            <td class="right">${vnd(teacher.total_salary)}</td>
          </tr>
        </table>
        <br/>
        <div style="font-size:15px;">GV có 25 ngày công vào tháng ${month < 10 ? '0' + month : month}/${year}.</div>
        <div style="font-size:15px;">Nếu dạy nhiều hơn 25 ngày công sẽ được tính 150.000 / 1 ngày dạy thêm.</div>
        <div style="text-align:right; font-size:15px;">Vĩnh Yên, ngày ... tháng ... năm ...</div>
      </div>
    </body>
    </html>
  `;
} 