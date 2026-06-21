import { Component, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { Header } from './shared/components/header/header';
import { Footer } from './shared/components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  mostrarLayout = signal(true);

  private rutasSinLayout = ['/login', '/recuperar-contrasena', '/restablecer-contrasena'];

  constructor(private router: Router) {
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
    ).subscribe((evento) => {
      const url = (evento as NavigationEnd).urlAfterRedirects.split('?')[0];
      this.mostrarLayout.set(!this.rutasSinLayout.includes(url));
    });
  }
}