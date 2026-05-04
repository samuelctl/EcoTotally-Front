import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  //  Públicas
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'cadastro', loadComponent: () => import('./pages/cadastro/cadastro.component').then(m => m.CadastroComponent) },
  { path: 'esqueci-senha', loadComponent: () => import('./pages/esqueci-senha/esqueci-senha.component').then(m => m.EsqueciSenhaComponent) },
  { path: 'redefinir-senha', loadComponent: () => import('./pages/redefinir-senha/redefinir-senha.component').then(m => m.RedefinirSenhaComponent) },

  //  Política de Privacidade (DEVE SER PÚBLICA)
  { 
    path: 'privacidade', 
    loadComponent: () => import('./pages/privacidade/privacidade.component').then(m => m.PrivacidadeComponent) 
  },

  //  Privadas
  { path: 'menu', canActivate: [authGuard], loadComponent: () => import('./pages/menu/menu.component').then(m => m.MenuComponent) },
  { path: 'perfil', canActivate: [authGuard], loadComponent: () => import('./pages/perfil/perfil.component').then(m => m.PerfilComponent) },
  { path: 'consumo', canActivate: [authGuard], loadComponent: () => import('./pages/consumo/consumo.component').then(m => m.ConsumoComponent) },
  { path: 'simulacao', canActivate: [authGuard], loadComponent: () => import('./pages/simulacao/simulacao.component').then(m => m.SimulacaoComponent) },
  { path: 'graficos', canActivate: [authGuard], loadComponent: () => import('./pages/graficos/graficos.component').then(m => m.GraficosComponent) },
  { path: 'insights', canActivate: [authGuard], loadComponent: () => import('./pages/insights/insights.component').then(m => m.InsightsComponent) },
  { path: 'mapa', canActivate: [authGuard], loadComponent: () => import('./pages/mapa/mapa.component').then(m => m.MapaComponent) },
  { path: 'metas', canActivate: [authGuard], loadComponent: () => import('./pages/metas/metas.component').then(m => m.MetasComponent) },
  { path: 'configuracoes', canActivate: [authGuard], loadComponent: () => import('./pages/configuracoes/configuracoes.component').then(m => m.ConfiguracoesComponent) },
  {
  path: 'privacidade',
  loadComponent: () => import('./pages/privacidade/privacidade.component')
    .then(m => m.PrivacidadeComponent)
  },
  {
  path: 'termos',
  loadComponent: () => import('./pages/termos/termos.component')
    .then(m => m.TermosComponent)
  },


  { path: '**', redirectTo: 'menu' }
];