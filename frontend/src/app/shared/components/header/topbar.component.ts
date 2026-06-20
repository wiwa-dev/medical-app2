import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [DatePipe],
  template: `
    <header class="hidden md:flex justify-between items-center h-16 px-xl ml-sidebar-width w-[calc(100%-260px)] fixed top-0 bg-surface border-b border-outline-variant z-40">
      <div class="font-h2 text-h2 font-bold text-primary">FinCare Management</div>
      <div class="flex items-center gap-md">
        <div class="relative hidden lg:block">
          <span class="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input class="pl-9 pr-sm py-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none w-52"
                 placeholder="Rechercher..." type="text"/>
        </div>
        <div class="flex items-center gap-sm">
          <button class="p-sm text-on-surface-variant hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-[20px]">dark_mode</span>
          </button>
          <button class="p-sm text-on-surface-variant hover:text-primary transition-colors relative">
            <span class="material-symbols-outlined text-[20px]">notifications</span>
            <span class="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
          </button>
          <button class="p-sm text-on-surface-variant hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-[20px]">help</span>
          </button>
        </div>
        <div class="hidden sm:flex flex-col items-end">
          <span class="text-xs font-medium text-on-surface-variant">
            {{ now | date:'EEEE d MMMM yyyy' : '' : 'fr-FR' }}
          </span>
          <span class="text-sm font-bold text-blue-600">
            {{ now | date:'HH:mm' }}
          </span>
        </div>
      </div>
    </header>
    
  `,
})
export class TopbarComponent implements OnInit, OnDestroy {
  @Input() title = '';
  now = new Date();
  private intervalId: any;

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.now = new Date();
    }, 1000); // chaque seconde
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }
}