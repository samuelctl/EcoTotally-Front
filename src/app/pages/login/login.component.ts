import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { describeError } from '../../core/http-helpers';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private usuario = inject(UsuarioService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  senha = '';
  mostrarSenha = signal(false);
  loading = signal(false);
  erro = signal<string | null>(null);
  sessaoExpirou = signal(this.route.snapshot.queryParamMap.get('expirado') === '1');

  async ngOnInit(): Promise<void> {
    if (!this.sessaoExpirou() && await this.auth.isLoggedInAsync()) {
      this.router.navigate(['/menu'], { replaceUrl: true });
    }
  }

  entrar(): void {
    if (this.loading()) return;
    if (!this.email || !this.senha) {
      this.erro.set('Preencha email e senha.');
      return;
    }
    this.erro.set(null);
    this.loading.set(true);
    this.auth.login({ email: this.email.trim(), senha: this.senha }).subscribe({
      next: () => {
        this.router.navigate(['/menu'], { replaceUrl: true });
        this.usuario.buscarMe().subscribe({
          next: (u) => this.auth.setUsuarioLocal({
            id: u.id, nome: u.nome, email: u.email, cidade: u.cidade
          }),
          error: () => { /* silencioso */ }
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.erro.set(describeError(err, 'Email ou senha inválidos.'));
      }
    });
  }
}
