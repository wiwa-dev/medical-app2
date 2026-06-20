import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { Toast } from '../../../core/models/toast.model';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [ NgClass],
  template: `
    <div class="fixed top-6 right-5 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl shadow-lg border-l-4 text-sm font-medium text-gray-700 toast-enter"
          [ngClass]="borderClass(toast)">
          <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
               [ngClass]="iconBgClass(toast)">
            <span class="material-symbols-outlined text-[14px]">{{ iconName(toast) }}</span>
          </div>
          <span class="flex-1">{{ toast.message }}</span>
          <button (click)="toastService.dismiss(toast.id)" class="text-slate-400 hover:text-slate-600 transition-colors">
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  toastService = inject(ToastService);

  borderClass(t: Toast): string {
    const map = { success: 'border-green-500', error: 'border-red-500', warning: 'border-amber-500', info: 'border-blue-500' };
    return map[t.type];
  }

  iconBgClass(t: Toast): string {
    const map = { success: 'bg-green-100 text-green-700', error: 'bg-red-100 text-red-700', warning: 'bg-amber-100 text-amber-700', info: 'bg-blue-100 text-blue-700' };
    return map[t.type];
  }

  iconName(t: Toast): string {
    const map = { success: 'check_circle', error: 'cancel', warning: 'warning', info: 'info' };
    return map[t.type];
  }
}
