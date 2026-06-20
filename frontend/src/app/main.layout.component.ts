import {Component} from "@angular/core";
import {RouterOutlet} from "@angular/router";
import {SidebarComponent} from "./shared/components/sidebar/sidebar.component";
import {MobileNavComponent} from "./shared/components/mobile-nav/mobile-nav.component";
import {ToastComponent} from "./shared/components/toast/toast.component";

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [RouterOutlet, SidebarComponent, MobileNavComponent, ToastComponent],
    template: `
    <div class="bg-background min-h-screen flex">
      <app-sidebar />
      <main class="flex-1 ml-0 md:ml-[260px] flex flex-col min-h-screen pb-24">
        <router-outlet />
      </main>
      <app-mobile-nav />
      <app-toast />
    </div>
  `,
})
export class MainLayoutComponent {}
