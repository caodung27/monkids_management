export function renderStudentReceiptHTML(student: any, month: number, year: number) {
  function vnd(val: number) {
    return (Math.round(val ?? 0)).toLocaleString('vi-VN').replace(/\s/g, '') + 'đ';
  }
  const discount = student.discount_percentage ? student.discount_percentage * 100 : 0;
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
        .receipt-title { font-size:32px; font-weight:bold; text-align:center; margin-bottom: 8px; }
        .receipt-month { text-align:center; font-size:22px; margin-bottom: 16px; }
        .info-table td { border: 1px solid #000; font-size:20px; }
        .info-table { margin-bottom: 16px; }
        .total-row { font-weight: bold; }
        .qr-code-container {
          width: 100%;
          min-height: 600px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 24px 0 12px 0;
          flex-shrink: 0;
        }
        #qr-img {
          width: 400px;
          height: 400px;
          display: inline-block;
          object-fit: contain;
          border: 2px solid #e9ecef;
          background: #fff;
          box-shadow: 0 4px 16px #ddd;
          border-radius: 12px;
          padding: 8px;
        }
      </style>
    </head>
    <body>
      <div id="receipt-root">
        <div class="header-row">
          <div class="header-left">MẦM NON MONKIDS</div>
          <div class="header-right">SỐ: ${student.student_id ?? ''}</div>
        </div>
        <div class="receipt-title">BIÊN LAI THU TIỀN</div>
        <div class="receipt-month">Tháng ${month} Năm ${year}</div>
        <br/>
        <table class="info-table">
          <tr><td>Họ tên:</td><td>${student.name ?? ''}</td></tr>
          <tr><td>Ngày sinh:</td><td>${student.birthdate ? (new Date(student.birthdate)).toLocaleDateString('vi-VN') : ''}</td></tr>
          <tr><td>Lớp:</td><td>${student.classroom ?? ''}</td></tr>
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
        <br/>
        <div style="text-align:right;">Vĩnh Yên, ngày ... tháng ... năm ...</div>
        <div style="text-align:center; margin: 40px 0 12px 0;">
          <img id="qr-img" src="/public/qr.png" alt="QR Code thanh toán" />
        </div>
        <div style="text-align:center;">Phụ huynh thanh toán từ ngày 05 đến 10 hàng tháng</div>
        <div style="text-align:center;">Phụ huynh thanh toán ghi rõ họ tên và lớp của con</div>
      </div>
    </body>
    </html>
  `;
} 