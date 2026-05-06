import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // 👈 ESSA LINHA RESOLVE
  template: '<router-outlet></router-outlet>'
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