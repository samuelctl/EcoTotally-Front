import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

// 🔥 CAMINHO CORRETO
import { BottomNavComponent } from './shared/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent],
  template: `
    <router-outlet></router-outlet>

    <!-- 👇 SELETOR CORRETO -->
    <app-bottom-nav></app-bottom-nav>
  `
})
export class AppComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  async ngOnInit() {
    const token = await this.auth.getToken();

    if (token) {
      this.router.navigate(['/menu']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}