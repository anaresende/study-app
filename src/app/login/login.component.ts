import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import axios from 'axios';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginData = {
    email: '',
    password: '',
  };

  constructor(private router: Router) {}

  handleLoginSubmit() {
    const credentials = {
      email: this.loginData.email,
      password: this.loginData.password,
    };

    axios
      .post('localhost:8050/login', credentials)
      .then((response) => {
        this.router.navigate(['/subject-list']);
        console.log('Login successful!', response.data);
      })
      .catch((error) => {
        // Handle error response here
        console.error('Login failed!', error);
      });

    this.router.navigate(['/whiteboard']);
  }

  handleRegisterClick() {
    this.router.navigate(['/register']);
  }
}
