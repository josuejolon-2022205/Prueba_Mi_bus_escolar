import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { LoginService } from '../services/login';

/**
 * Interceptor global de autenticación ("middleware" del frontend).
 *
 * 1. GUARDA LOS TOKENS: el almacenamiento real vive en LoginService
 *    (localStorage: `auth_token` y `auth_user`) y es la única fuente
 *    de verdad. Este interceptor lo reutiliza, así que todo el
 *    proyecto comparte la misma sesión.
 *
 * 2. ENVÍA EL TOKEN EN CADA PETICIÓN: toda peticion HTTP que haga la
 *    app (login, register, usuarios, viajes, rutas, paradas, etc.)
 *    sale con el header:
 *        Authorization: Bearer <token>
 *    siempre que exista un token guardado.
 *
 * 3. SINCERÍA DE SESIÓN: si el backend responde 401 (token ausente,
 *    inválido o expirado), se limpia la sesión guardada y se redirige
 *    a /login para que el usuario pueda volver a autenticarse.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  const token = loginService.getToken();

  const request = token
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      })
    : req;

  return next(request).pipe(
    tap({
      error: (err) => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          loginService.logout();
          // Solo redirigimos en el navegador (SSR no tiene window).
          if (typeof window !== 'undefined' && router.url !== '/login') {
            router.navigate(['/login']);
          }
        }
      },
    })
  );
};