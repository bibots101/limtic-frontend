import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

export const customXsrfInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (!mutationMethods.includes(req.method)) {
    return next(req);
  }

  const xsrfToken = getCookie('XSRF-TOKEN');

  if (!xsrfToken) {
    // Pas encore de cookie — on laisse passer sans CSRF
    return next(req);
  }

  // Clone avec X-XSRF-TOKEN ET withCredentials forcé
  const securedReq = req.clone({
    headers: req.headers.set('X-XSRF-TOKEN', xsrfToken),
    withCredentials: true  // ← force l'envoi des cookies même cross-origin
  });

  return next(securedReq);
};

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  // Regex améliorée — gère les espaces avant le cookie
  const match = document.cookie.match(
    new RegExp('(^|;\\s*)' + name + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[2]) : null;
}
