import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { API_BASE_URL } from '../../core/api.config';
import { describeError } from '../../core/http-helpers';

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './redefinir-senha.component.html',
  styleUrls: ['./redefinir-senha.component.scss']
})
export class RedefinirSenhaComponent {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  // Token vem da query string: /redefinir-senha?token=xxx
  token     = this.route.snapshot.queryParamMap.get('token') || '';
  novaSenha = '';
  confirmar = '';

  mostrarNova      = signal(false);
  mostrarConfirmar = signal(false);
  loading          = signal(false);
  sucesso          = signal(false);
  erro             = signal<string | null>(null);

  // ── Força da senha ────────────────────────────────────────────────
  forca = computed<0 | 1 | 2 | 3>(() => {
    const s = this.novaSenha;
    if (!s || s.length < 6) return 0;
    let score = 0;
    if (s.length >= 8)                      score++;
    if (/[A-Z]/.test(s) || /\d/.test(s))   score++;
    if (/[^A-Za-z0-9]/.test(s))            score++;
    return Math.min(score, 3) as 0 | 1 | 2 | 3;
  });

  forcaLabel = computed(() => ['', 'Fraca', 'Média', 'Forte'][this.forca()]);

  get tokenAusente(): boolean { return !this.token; }

  get senhasCurtas(): boolean {
    return !!this.novaSenha && this.novaSenha.length < 6;
  }

  get senhasNaoBatem(): boolean {
    return !!this.confirmar && this.novaSenha !== this.confirmar;
  }

  get podeSalvar(): boolean {
    return (
      !!this.token &&
      this.novaSenha.length >= 6 &&
      this.novaSenha === this.confirmar &&
      !this.loading()
    );
  }

  enviar(): void {
    if (!this.podeSalvar) return;
    this.loading.set(true);
    this.erro.set(null);

    this.http
      .post(`${API_BASE_URL}/login/redefinir-senha`, {
        token: this.token,
        nova_senha: this.novaSenha
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.sucesso.set(true);
          setTimeout(() => this.router.navigate(['/login']), 2500);
        },
        error: (err) => {
          this.loading.set(false);
          this.erro.set(describeError(err, 'Não foi possível redefinir a senha.'));
        }
      });
  }
}
