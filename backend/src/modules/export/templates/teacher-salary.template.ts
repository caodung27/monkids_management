export function renderTeacherSalaryHTML(teacher: any, month: number, year: number) {
  function vnd(val: number) {
    return (Math.round(val ?? 0)).toLocaleString('vi-VN').replace(/\s/g, '') + 'đ';
  }
  return `
    <html>
    <head>
      <style>
        body { 
          font-family: Arial; 
          background: #fff;
          font-size: 12px;
        }
        #receipt-root {
          width: 800px;
          margin: 20px auto;
          padding: 20px;
        }
        table { 
          border-collapse: collapse; 
          width: 100%;
          margin: 10px 0;
        }
        th, td { 
          border: 1px solid #000; 
          padding: 5px 8px;
          font-size: 12px;
        }
        th { 
          background: #f5f5f5;
          text-align: center;
        }
        .bold { font-weight: bold; }
        .center { text-align: center; }
        .right { text-align: right; }
        .header { 
          text-align: center;
          margin-bottom: 15px;
        }
        .school-name {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .title {
          font-size: 16px;
          font-weight: bold;
          margin: 10px 0;
        }
        .info-table td {
          border: 1px solid #000;
          padding: 5px 8px;
        }
        .info-table td:first-child {
          width: 100px;
        }
        .total-row {
          font-weight: bold;
        }
        .note {
          font-size: 11px;
          margin-top: 10px;
        }
        .signature {
          text-align: right;
          margin-top: 15px;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div id="receipt-root">
        <div class="header">
          <div class="school-name">MẦM NON MONKIDS</div>
          <div class="title">PHIẾU LƯƠNG GIÁO VIÊN</div>
          <div>Tháng ${month} Năm ${year}</div>
        </div>

        <table class="info-table" style="border: none;">
          <tr>
            <td>Họ tên:</td>
            <td>${teacher.name ?? ''}</td>
          </tr>
          <tr>
            <td>Chức vụ:</td>
            <td>${teacher.role ?? ''}</td>
          </tr>
          <tr>
            <td>SĐT:</td>
            <td>${teacher.phone || ''}</td>
          </tr>
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

        <div class="note">
          GV có 25 ngày công vào tháng ${month < 10 ? '0' + month : month}/${year}.<br>
          Nếu dạy nhiều hơn 25 ngày công sẽ được tính 150.000 / 1 ngày dạy thêm.
        </div>

        <div class="signature">
          Vĩnh Yên, ngày ... tháng ... năm ...
        </div>
      </div>
    </body>
    </html>
  `;
} 