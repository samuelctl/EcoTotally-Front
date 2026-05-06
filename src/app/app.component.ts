import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>'
})
export class AppComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  async ngOnInit() {
    const token = await this.auth.getToken();

    if (token) {
      this.router.navigate(['/menu']); // ou home
    } else {
      this.router.navigate(['/login']);
    }
  }
}