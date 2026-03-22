import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateDevotional,
  DevotionalDetail,
  DevotionalSummary,
  UpdateDevotional,
} from '../models';
import { PaginatedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class DevotionalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/devotionals';

  getAll(
    page = 1,
    pageSize = 10
  ): Observable<PaginatedResult<DevotionalSummary>> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<PaginatedResult<DevotionalSummary>>(this.baseUrl, {
      params,
    });
  }

  getById(id: number): Observable<DevotionalDetail> {
    return this.http.get<DevotionalDetail>(`${this.baseUrl}/${id}`);
  }

  getToday(): Observable<DevotionalDetail> {
    return this.http.get<DevotionalDetail>(`${this.baseUrl}/today`);
  }

  create(dto: CreateDevotional): Observable<DevotionalDetail> {
    return this.http.post<DevotionalDetail>(this.baseUrl, dto);
  }

  update(id: number, dto: UpdateDevotional): Observable<DevotionalDetail> {
    return this.http.put<DevotionalDetail>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
