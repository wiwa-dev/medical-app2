import { Routes } from '@angular/router';
import {MainLayoutComponent} from "./main.layout.component";
import {SettingsComponent} from "./pages/settings/settings.component";
import {LoginComponent} from "./pages/login/login.component";
import {SaisieJourComponent} from "./pages/saisie-jour/saisie-jour.component";
import {RapportMensuelComponent} from "./pages/rapport-mensuel/rapport-mensuel.component";
import {BilanAnnuelComponent} from "./pages/bilan-annuel/bilan-annuel.component";

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'saisie', pathMatch: 'full' },
      { path: 'saisie', component: SaisieJourComponent },
      { path: 'rapport-mensuel', component: RapportMensuelComponent },
      { path: 'bilan-annuel', component: BilanAnnuelComponent },
      { path: 'settings', component: SettingsComponent },
    ]
  },

  { path: '**', redirectTo: 'login' },
];
