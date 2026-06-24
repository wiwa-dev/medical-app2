import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-100 px-6 py-3 z-50 flex items-center justify-around no-print">
      <a routerLink="/saisie" routerLinkActive="text-blue-700" class="flex flex-col items-center gap-1 text-slate-500">
        <span class="material-symbols-outlined text-[20px]">edit_note</span>
        <span class="text-[10px] font-medium">Saisie</span>
      </a>
      <a routerLink="/rapport-mensuel" routerLinkActive="text-blue-700" class="flex flex-col items-center gap-1 text-slate-500">
        <span class="material-symbols-outlined text-[20px]">bar_chart</span>
        <span class="text-[10px] font-medium">Mensuel</span>
      </a>
      <a routerLink="/bilan-annuel" routerLinkActive="text-blue-700" class="flex flex-col items-center gap-1 text-slate-500">
        <span class="material-symbols-outlined text-[20px]">assessment</span>
        <span class="text-[10px] font-medium">Annuel</span>
      </a>
      <a routerLink="/gestion-fournisseurs" routerLinkActive="text-blue-700" class="flex flex-col items-center gap-1 text-slate-500">
        <span class="material-symbols-outlined text-[20px]">inventory_2</span>
        <span class="text-[10px] font-medium">Fournisseurs</span>
      </a>
      <a routerLink="/settings" routerLinkActive="text-blue-700" class="flex flex-col items-center gap-1 text-slate-500">
        <span class="material-symbols-outlined text-[20px]">settings</span>
        <span class="text-[10px] font-medium">Paramètres</span>
      </a>
    </nav>
  `,
})
export class MobileNavComponent {}
