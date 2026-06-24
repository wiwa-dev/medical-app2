import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import {LoginService} from "../../../core/services/login.service";
import {models} from "../../../../../wailsjs/go/models";
import User = models.User;
import {Logout} from "../../../../../wailsjs/go/main/App";

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="hidden md:flex flex-col fixed left-0 top-0 h-full w-[260px] bg-inverse-surface z-20 no-print">
      <div class="flex flex-col h-full py-6 px-4 gap-2">

        <!-- Logo -->
        <div class="mb-8 px-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div>
              <h1 class="font-headline-md text-[17px] font-bold text-primary-fixed leading-none">CARE~X</h1>
              <p class="text-[11px] text-surface-variant mt-0.5">SIF Medical Software</p>
            </div>
          </div>
        </div>

        <!-- Nav -->
        <a routerLink="/saisie" routerLinkActive="bg-primary-container text-on-primary-container"
           [routerLinkActiveOptions]="{exact: true}"
           class="flex items-center gap-3 px-4 py-3 text-surface-variant hover:bg-secondary-fixed-dim/10 rounded-lg cursor-pointer active:scale-95 transition-all">
          <span class="material-symbols-outlined" style="font-size: 20px;">edit_note</span>
          <span class="font-body-md text-body-md">Saisie du jour</span>
        </a>

        <a routerLink="/rapport-mensuel" routerLinkActive="bg-primary-container text-on-primary-container"
           class="flex items-center gap-3 px-4 py-3 text-surface-variant hover:bg-secondary-fixed-dim/10 rounded-lg cursor-pointer active:scale-95 transition-all">
          <span class="material-symbols-outlined" style="font-size: 20px;">bar_chart</span>
          <span class="font-body-md text-body-md">Rapport mensuel</span>
        </a>

       

        <a routerLink="/gestion-fournisseurs" routerLinkActive="bg-primary-container text-on-primary-container"
           class="flex items-center gap-3 px-4 py-3 text-surface-variant hover:bg-secondary-fixed-dim/10 rounded-lg cursor-pointer active:scale-95 transition-all">
          <span class="material-symbols-outlined" style="font-size: 20px;">inventory_2</span>
          <span class="font-body-md text-body-md">Gestion fournisseurs</span>
        </a>
        
        <a routerLink="/bilan-annuel" routerLinkActive="bg-primary-container text-on-primary-container"
           class="flex items-center gap-3 px-4 py-3 text-surface-variant hover:bg-secondary-fixed-dim/10 rounded-lg cursor-pointer active:scale-95 transition-all">
          <span class="material-symbols-outlined" style="font-size: 20px;">assessment</span>
          <span class="font-body-md text-body-md">Bilan annuel</span>
        </a>
        <!-- Settings (admin only) -->
        <div class="mt-auto">
          @if (currentUser?.Isadmin) {
            <a routerLink="/settings" routerLinkActive="bg-primary-container text-on-primary-container"
               class="flex items-center gap-3 px-4 py-3 text-surface-variant hover:bg-secondary-fixed-dim/10 rounded-lg cursor-pointer active:scale-95 transition-all">
              <span class="material-symbols-outlined" style="font-size: 20px;">settings</span>
              <span class="font-body-md text-body-md">Paramètres</span>
            </a>
          }

          <!-- User card -->
          <div class="mt-3 px-4 py-3 border-t border-surface-variant/20">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-bold flex-shrink-0">
                {{ initials }}
              </div>
              <p class="text-xs text-surface-variant truncate">{{ currentUser?.Email }}</p>
            </div>
            <button (click)="logout()"
                    class="w-full py-2 bg-surface-variant/10 text-surface-variant rounded-lg text-xs font-semibold hover:bg-surface-variant/20 transition-colors border border-surface-variant/20">
              Déconnexion
            </button>
          </div>
        </div>

      </div>
    </nav>
  `,
})
export class SidebarComponent {
  private loginService = inject(LoginService)
  currentUser: User | null = null

  get initials(): string {
    if (!this.currentUser?.Email) return '?';
    return this.currentUser.Email.substring(0, 2).toUpperCase();
  }

  ngOnInit() {
    this.loginService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.loginService.logout();
  }
}
