import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { API_BASE_URL } from '../../core/api.config';
import { describeError } from '../../core/http-helpers';

@Component({
  selector: 'app-esqueci-senha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="eco-page eco-fade-in" style="padding-bottom:40px;">
      <h1 class="eco-h1">Esqueci a senha</h1>
      <p class="eco-subtitle">Informe seu email para receber instruções.</p>

      <form class="eco-card" (ngSubmit)="enviar()">
        <label class="eco-label" for="email">Email</label>
        <input id="email" name="email" class="eco-input" type="email" [(ngModel)]="email" required />

        @if (erro()) { <div class="eco-error">{{ erro() }}</div> }
        @if (ok())   { <div class="eco-success">{{ ok() }}</div> }

        <button class="eco-btn" type="submit" style="margin-top:18px;" [disabled]="loading()">
          @if (loading()) { <span class="eco-spinner"></span> } @else { Enviar }
        </button>

        <div style="text-align:center;margin-top:14px;font-size:13px;">
          <a routerLink="/login" style="color:var(--clr-accent);font-weight:600;text-decoration:none;">Voltar para login</a>
        </div>
      </form>
    </main>
  `
})
export class EsqueciSenhaComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  email = '';
  loading = signal(false);
  erro = signal<string | null>(null);
  ok = signal<string | null>(null);

  enviar(): void {
    if (this.loading() || !this.email) return;
    this.loading.set(true); this.erro.set(null); this.ok.set(null);
    this.http.post(`${API_BASE_URL}/login/esqueci-senha`, { email: this.email.trim() })
      .subscribe({
        next: () => { this.loading.set(false); this.ok.set('Se este email existir, enviaremos as instruções.'); },
        error: (err) => { this.loading.set(false); this.erro.set(describeError(err, 'Não foi possível enviar.')); }
      });
  }
}
