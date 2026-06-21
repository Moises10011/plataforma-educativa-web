import { Component } from '@angular/core';
import { Hero } from './hero/hero';
import { MisionVision } from './mision-vision/mision-vision';

@Component({
  selector: 'app-home',
  imports: [Hero, MisionVision],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}