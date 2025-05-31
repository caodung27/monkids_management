import * as fs from 'fs';
import * as path from 'path';

export function renderStudentReceiptHTML(student: any, month: number, year: number) {
  function vnd(val: number) {
    return (Math.round(val ?? 0)).toLocaleString('vi-VN').replace(/\s/g, '') + 'đ';
  }

  // Read and convert QR code to base64
  const qrPath = path.join(process.cwd(), 'public', 'qr.png');
  const qrBase64 = fs.readFileSync(qrPath, { encoding: 'base64' });
  const qrDataUrl = `data:image/png;base64,${qrBase64}`;

  const discount = student.discount_percentage ? student.discount_percentage * 100 : 0;
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
        .qr-code-container {
          width: 100%;
          text-align: center;
          margin: 20px 0;
        }
        #qr-img {
          width: 200px;
          height: 200px;
          display: inline-block;
          object-fit: contain;
        }
        .note {
          font-size: 11px;
          margin-top: 10px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div id="receipt-root">
        <div class="header">
          <div class="school-name">MẦM NON MONKIDS</div>
          <div class="title">BIÊN LAI THU TIỀN</div>
          <div>Tháng ${month} Năm ${year}</div>
        </div>

        <table class="info-table">
          <tr>
            <td>Họ tên:</td>
            <td>${student.name ?? ''}</td>
          </tr>
          <tr>
            <td>Ngày sinh:</td>
            <td>${student.birthdate ? (new Date(student.birthdate)).toLocaleDateString('vi-VN') : ''}</td>
          </tr>
          <tr>
            <td>Lớp:</td>
            <td>${student.classroom ?? ''}</td>
          </tr>
        </table>

        <table>
          <tr>
            <th>Nội dung</th>
            <th>Chi tiết</th>
            <th>Thành tiền</th>
          </tr>
          <tr>
            <td>Học phí ban đầu</td>
            <td>${vnd(student.base_fee)} - Giảm: ${discount}%</td>
            <td class="right">${vnd(student.final_fee)}</td>
          </tr>
          <tr>
            <td>Tiền ăn (30,000/1 ngày)</td>
            <td>PM: ${student.pm ?? 0} - PT: ${student.pt ?? 0}</td>
            <td class="right">${vnd(student.meal_fee)}</td>
          </tr>
          <tr>
            <td>Điện nước</td>
            <td></td>
            <td class="right">${vnd(student.utilities_fee)}</td>
          </tr>
          <tr>
            <td rowspan="2">Học tự chọn</td>
            <td>KNS</td>
            <td class="right">${vnd(student.skill_fee)}</td>
          </tr>
          <tr>
            <td>TA</td>
            <td class="right">${vnd(student.eng_fee)}</td>
          </tr>
          <tr>
            <td rowspan="2">Phí đầu năm</td>
            <td>Quỹ HS</td>
            <td class="right">${vnd(student.student_fund)}</td>
          </tr>
          <tr>
            <td>CSVC</td>
            <td class="right">${vnd(student.facility_fee)}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2">Tổng thu</td>
            <td class="right">${vnd(student.total_fee)}</td>
          </tr>
          <tr>
            <td colspan="2">Đã đóng</td>
            <td class="right">${vnd(student.paid_amount)}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2">Còn lại</td>
            <td class="right">${vnd(student.remaining_amount)}</td>
          </tr>
        </table>

        <div style="text-align:right; margin-top: 15px; font-style: italic;">
          Vĩnh Yên, ngày ... tháng ... năm ...
        </div>

        <div class="qr-code-container">
          <img id="qr-img" src="${qrDataUrl}" alt="QR Code thanh toán" />
        </div>

        <div class="note">
          Phụ huynh thanh toán từ ngày 05 đến 10 hàng tháng<br>
          Phụ huynh thanh toán ghi rõ họ tên và lớp của con
        </div>
      </div>
    </body>
    </html>
  `;
} 