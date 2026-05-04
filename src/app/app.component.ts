import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './shared/bottom-nav/bottom-nav.component';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent],
  template: `
    <router-outlet />
    <app-bottom-nav />
  `
})
export class AppComponent {
  // Inicializa o tema ao carregar a aplicação
  private theme = inject(ThemeService);
}