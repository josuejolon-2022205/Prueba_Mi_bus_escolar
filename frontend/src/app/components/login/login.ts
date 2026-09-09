import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BackendErrorResponse, LoginService, UsuarioLoginDTO } from '../../services/login';
import { RegisterService, UsuarioRegisterDTO } from '../../services/register';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  private loginService = inject(LoginService);
  private registerService = inject(RegisterService);

  isLoginMode = signal(true);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  fieldErrors = signal<Array<{ campo: string; mensaje: string }>>([]);

  currentUser = signal<any>(null);
  currentToken = signal<string | null>(null);

  loginForm: UsuarioLoginDTO = {
    correo: '',
    password: ''
  };

  registerForm: UsuarioRegisterDTO = {
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    telefono: '',
    foto_usuario: ''
  };

  ngOnInit(): void {
    const user = this.loginService.getUser();
    const token = this.loginService.getToken();
    if (user && token) {
      this.currentUser.set(user);
      this.currentToken.set(token);
    }
  }

  toggleMode(mode: boolean): void {
    this.isLoginMode.set(mode);
    this.clearMessages();
  }

  clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.fieldErrors.set([]);
  }

  onLogin(): void {
    this.clearMessages();
    this.isLoading.set(true);

    this.loginService.login(this.loginForm).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.token && res.usuario) {
          this.loginService.saveToken(res.token);
          this.loginService.saveUser(res.usuario);
          this.currentUser.set(res.usuario);
          this.currentToken.set(res.token);
          this.successMessage.set('¡Inicio de sesión exitoso!');
        } else {
          this.successMessage.set(res.message || 'Login exitoso');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.handleError(err);
      }
    });
  }

  onRegister(): void {
    this.clearMessages();
    this.isLoading.set(true);

    const payload: UsuarioRegisterDTO = {
      ...this.registerForm,
      foto_usuario: this.registerForm.foto_usuario?.trim() || null
    };

    this.registerService.register(payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.token && res.usuario) {
          this.loginService.saveToken(res.token);
          this.loginService.saveUser(res.usuario);
          this.currentUser.set(res.usuario);
          this.currentToken.set(res.token);
          this.successMessage.set('¡Registro exitoso!');
        } else {
          this.successMessage.set(res.message || 'Registro exitoso');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.handleError(err);
      }
    });
  }

  onLogout(): void {
    this.loginService.logout();
    this.currentUser.set(null);
    this.currentToken.set(null);
    this.clearMessages();
    this.successMessage.set('Sesión cerrada correctamente');
  }

  /**
   * Consume el contrato de errores del backend (BackendErrorResponse):
   * todo error llega como { success, message, errors?, error? } con su
   * statusCode (400 validacion, 401/403 auth, 404, 500...).
   */
  private handleError(err: HttpErrorResponse): void {
    // status 0 = la peticion nunca llego al servidor (backend caido, sin red)
    if (err.status === 0) {
      this.errorMessage.set('No se pudo conectar con el servidor backend en http://localhost:3000. Asegúrate de iniciar la API backend (cd backend && pnpm run dev).');
      return;
    }

    const body = err.error as BackendErrorResponse | undefined;
    if (body && typeof body.message === 'string') {
      // 400 de validacion: un error por campo, se muestra bajo cada input
      if (Array.isArray(body.errors)) {
        this.fieldErrors.set(body.errors);
      }
      this.errorMessage.set(body.message || body.error || 'Ocurrió un error al procesar la solicitud');
    } else {
      // Respuesta inesperada (no sigue el contrato del backend)
      this.errorMessage.set(err.message || 'Ocurrió un error al procesar la solicitud');
    }
  }

  showLoginPassword = signal(false);
  showRegisterPassword = signal(false);

  toggleLoginPassword(): void {
    this.showLoginPassword.update(v => !v);
  }

  toggleRegisterPassword(): void {
    this.showRegisterPassword.update(v => !v);
  }
  /** Lo usa el template: *ngIf="fieldError('correo')".
   *  El backend devuelve los errores como {campo, mensaje} usando los
   *  mismos nombres que los campos del formulario, así que solo hay
   *  que buscar la coincidencia exacta del nombre del campo. */
  fieldError(campo: string): string | null {
    return this.fieldErrors().find(e => e.campo === campo)?.mensaje ?? null;
  }


}
