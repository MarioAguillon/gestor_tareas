import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AvatarService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/avatares`;

  getAvatares(): Observable<string[]> {
    return this.http.get<string[]>(this.apiUrl).pipe(
      catchError(() => {
        // Fallback local avatars if API fails
        return of([
          'avatar1.jpg', 'avatar2.jpg', 'avatar3.jpg', 'avatar4.jpg',
          'avatar5.jpg', 'avatar6.jpg', 'avatar7.jpg', 'avatar8.jpg'
        ]);
      })
    );
  }
}
