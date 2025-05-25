import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // Kiểm tra nếu data có format phân trang
        if (data && typeof data === 'object' && 'data' in data && 'totalElements' in data) {
          return {
            ...data,
            data: Array.isArray(data.data) ? data.data.map(item => this.transformItem(item)) : data.data
          };
        }
        // Nếu data là một mảng
        if (Array.isArray(data)) {
          return data.map(item => this.transformItem(item));
        }
        // Nếu data là một object
        return this.transformItem(data);
      }),
    );
  }

  private transformItem(item: any): any {
    if (!item || typeof item !== 'object') {
      return item;
    }

    // Chuyển đổi các trường số
    const numericFields = [
      'base_fee', 'discount_percentage', 'final_fee', 'utilities_fee',
      'pt', 'pm', 'meal_fee', 'eng_fee', 'skill_fee', 'total_fee',
      'paid_amount', 'remaining_amount', 'student_fund', 'facility_fee',
      'base_salary', 'received_salary', 'extra_salary', 'insurance_support',
      'responsibility_support', 'breakfast_support', 'skill_salary',
      'english_salary', 'total_salary'
    ];

    numericFields.forEach(field => {
      if (item[field] !== undefined && item[field] !== null) {
        item[field] = Number(item[field]);
      }
    });

    return item;
  }
} 