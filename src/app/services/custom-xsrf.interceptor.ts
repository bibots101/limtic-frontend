import { Injectable, inject } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpXsrfTokenExtractor
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable()
export class CustomXsrfInterceptor implements HttpInterceptor {
  private readonly tokenExtractor = inject(HttpXsrfTokenExtractor);
  private readonly backendBaseUrl = environment.baseUrl;

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return next.handle(req);
    }

    const token = this.tokenExtractor.getToken();
    if (!token || req.headers.has('X-XSRF-TOKEN')) {
      return next.handle(req);
    }

    const isLocalApiRequest = req.url.startsWith(this.backendBaseUrl) || req.url.startsWith('/api');
    if (!isLocalApiRequest) {
      return next.handle(req);
    }

    const headers = req.headers.set('X-XSRF-TOKEN', token);
    return next.handle(req.clone({ headers }));
  }
}
