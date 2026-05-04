import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { describeError } from '../../core/http-helpers';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  private auth = inject(AuthService);
  private usuario = inject(UsuarioService);
  private router = inject(Router);

  nome = ''; email = ''; cidade = ''; senha = '';
  carregando = signal(true);
  salvando = signal(false);
  apagando = signal(false);
  erro = signal<string | null>(null);
  ok = signal<string | null>(null);

  ngOnInit(): void {
    const cache = this.auth.getUsuarioLocal();
    if (cache) {
      this.nome = cache.nome || '';
      this.email = cache.email || '';
      this.cidade = cache.cidade || '';
      this.carregando.set(false);
    }
    this.usuario.buscarMe().subscribe({
      next: (u) => {
        this.nome = u.nome || '';
        this.email = u.email || '';
        this.cidade = u.cidade || '';
        this.auth.setUsuarioLocal({ id: u.id, nome: u.nome, email: u.email, cidade: u.cidade });
        this.carregando.set(false);
      },
      error: (err) => { this.carregando.set(false); this.erro.set(describeError(err)); }
    });
  }

  salvar(): void {
    if (this.salvando()) return;
    this.salvando.set(true); this.erro.set(null); this.ok.set(null);

    // Optimistic: já atualiza o cache local
    this.auth.setUsuarioLocal({ nome: this.nome, email: this.email, cidade: this.cidade });

    this.usuario.atualizar({ nome: this.nome, email: this.email, cidade: this.cidade, senha: this.senha })
      .subscribe({
        next: () => { this.salvando.set(false); this.ok.set('Perfil atualizado!'); this.senha = ''; },
        error: (err) => { this.salvando.set(false); this.erro.set(describeError(err, 'Não foi possível salvar.')); }
      });
  }

  sair(): void { this.auth.logout(); this.router.navigate(['/login']); }

  excluir(): void {
    if (!confirm('Excluir conta permanentemente? Essa ação não pode ser desfeita.')) return;
    this.apagando.set(true);
    this.usuario.deletar().subscribe({
      next: () => { this.auth.logout(); this.router.navigate(['/login']); },
      error: (err) => { this.apagando.set(false); this.erro.set(describeError(err, 'Não foi possível excluir.')); }
    });
  }
}
