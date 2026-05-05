import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../core/auth.service';
import { describeError } from '../../core/http-helpers';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cadastro.component.html',
  styleUrls: ['./cadastro.component.scss']
})
export class CadastroComponent {
  private usuario = inject(UsuarioService);
  private auth = inject(AuthService);
  private router = inject(Router);

  nome = ''; email = ''; cidade = ''; senha = '';
  loading = signal(false);
  erro = signal<string | null>(null);
  ok = signal<string | null>(null);

  cadastrar(): void {
    if (this.loading()) return;
    if (!this.nome || !this.email || !this.senha) { this.erro.set('Preencha os campos obrigatórios.'); return; }
    this.erro.set(null); this.ok.set(null); this.loading.set(true);

    this.usuario.cadastrar({
      nome: this.nome.trim(), email: this.email.trim(),
      senha: this.senha, cidade: this.cidade.trim()
    }).subscribe({
      next: () => {
        // Auto-login
        this.auth.login({ email: this.email.trim(), senha: this.senha }).subscribe({
          next: () => this.router.navigate(['/menu']),
          error: () => { this.loading.set(false); this.ok.set('Conta criada! Faça login.'); setTimeout(() => this.router.navigate(['/login']), 800); }
        });
      },
      error: (err) => { this.loading.set(false); this.erro.set(describeError(err, 'Não foi possível cadastrar.')); }
    });
  }
}
