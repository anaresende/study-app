import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { WhiteboardComponent } from './whiteboard/whiteboard.component';
import { SubjectListComponent } from './subject-list/subject-list.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'whiteboard', component: WhiteboardComponent },
  { path: 'subject-list', component: SubjectListComponent },
];
